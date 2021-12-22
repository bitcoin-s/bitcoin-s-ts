import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription, timer } from "rxjs";
import { tap } from "rxjs/operators";
import { BlockHeaderResponse, DLCContract, DLCState } from "~type/wallet-server-types";
import { WalletStateService } from "./wallet-state-service";


// Route to handle websocket traffic at the proxy server
const WEBSOCKET_ROUTE = 'ws'

enum WebsocketMessageType {
  txprocessed = 'txprocessed',
  blockprocessed = 'blockprocessed',
  dlcstatechange = 'dlcstatechange',
  reservedutxos = 'reservedutxos', // Wallet[]
  newaddress = 'newaddress', // address string
  // ...
}

export interface WebsocketMessage {
  type: WebsocketMessageType
  payload: any
}

const STARTUP_POLLING_DELAY = 1000 // ms
const POLLING_TIME = 15000 // ms

@Injectable({ providedIn: 'root' })
export class WebsocketService {

  private _ws: WebSocket|null = null

  private pollingTimer$: Subscription;

  constructor(private walletStateService: WalletStateService, private router: Router) {
    this.startPollingTimer()
  }

  private getWebsocketUrl(): string {
    // defaultt websocketURL = `ws://localhost:19999/events`
    // set ws protocol when using http and wss when using https
    const protocol = window.location.protocol.replace('http', 'ws');
    // get location host
    const host = window.location.host;
    const websocketURL = `${protocol}//${host}/${WEBSOCKET_ROUTE}`
    console.warn('websocketURL:', websocketURL)
    return websocketURL
  }

  startPollingTimer() {
    // Use different STARTUP_POLLING_DELAY to allow initial state to load via other channels before listening to Websocket updates
    this.pollingTimer$ = timer(STARTUP_POLLING_DELAY, POLLING_TIME).pipe(
    ).subscribe(_ => {
      // console.debug('Websocket polling timer', this._ws)
      if (this._ws === null || this._ws.readyState === WebSocket.CLOSED) {
        console.warn('found null Websocket, reconnecting')
        this.startWebsocket()
      }
    })
  }

  startWebsocket() {
    const ws = new WebSocket(this.getWebsocketUrl())
    const self = this

    // Listen for messages
    ws.addEventListener('open', function (event) {
      console.debug('Websocket opened')
      // May want to data poll here in case we were closed over a blockprocessed event
      // This would double-poll on startup between walletStateService and here, but that's probably ok
      // this.walletStateService.updateState()
    })
    ws.addEventListener('close', function (event) {
      console.warn('Websocket closed')
      // Signal reconnect polling
      self._ws = null
    })
    ws.addEventListener('error', function (event) {
      console.error('Websocket error')
    })
    ws.addEventListener('message', function (event) {
      // console.debug('Websocket message:', event.data)
      try {
        const message = <WebsocketMessage>JSON.parse(event.data)
        self.handleMessage(message)
      } catch (e) {
        console.error('error translating websocket message', e)
      }
    })

    this._ws = ws
  }

  stopWebsocket() {
    if (this._ws) {
      this._ws.close()
      this._ws = null
    }
  }

  handleMessage(message: WebsocketMessage) {
    console.debug('handleMessage() type:', message.type)
    switch (message.type) {
      case WebsocketMessageType.newaddress:
      case WebsocketMessageType.txprocessed:
        // Nothing to do
        break;
      case WebsocketMessageType.blockprocessed:
        this.walletStateService.refreshWalletState()
        const block = <BlockHeaderResponse>message.payload
        if (this.walletStateService.info) {
          this.walletStateService.info.blockHeight = block.height
        }
        break;
      case WebsocketMessageType.dlcstatechange:
        console.warn('message:', message)
        const dlc = <DLCContract>message.payload
        this.walletStateService.replaceDLC(dlc)

        // If someone just accepted a DLC Offer
        if (dlc.state === DLCState.accepted && dlc.isInitiator === false) {
          this.router.navigate(['/contracts'], { queryParams: { dlcId: dlc.dlcId } })
        }
        // TESTING case
        // if (dlc.state === DLCState.claimed && dlc.isInitiator === true) {
        //   this.router.navigate(['/contracts'], { queryParams: { dlcId: dlc.dlcId } })
        // }
        break;
      case WebsocketMessageType.reservedutxos:
        this.walletStateService.refreshBalances()
        break;
      default:
        console.error('handleMessage() unknown message.type', message)
    }
  }

}

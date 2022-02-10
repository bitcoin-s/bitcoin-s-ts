import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Subscription, timer } from 'rxjs'

import { environment } from '../environments/environment'

import { BlockHeaderResponse, DLCContract, DLCState } from '~type/wallet-server-types'

import { AuthService } from './auth.service'
import { WalletStateService } from './wallet-state-service'


enum WebsocketMessageType {
  txprocessed = 'txprocessed',
  txbroadcast = 'txbroadcast',
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

  get state() {
    if (this._ws) {
      switch (this._ws.readyState) {
        case 0: return 'connecting'
        case 1: return 'open'
        case 2: return 'closing'
        case 3: return 'closed'
      }
    }
    return ''
  }

  private _ws: WebSocket|null = null

  private pollingTimer$: Subscription;

  constructor(private walletStateService: WalletStateService, private router: Router, private authService: AuthService) {}

  private getWebsocketUrl(): string {
    // defaultt websocketURL = `ws://localhost:19999/events`
    // set ws protocol when using http and wss when using https
    const protocol = window.location.protocol.replace('http', 'ws');
    // get location host
    const host = window.location.host;
    let websocketURL: string = `${protocol}//${host}${environment.wsApi}`
    const user = environment.user
    const password = this.authService.password
    if (password) {
      websocketURL = `${protocol}//${user}:${password}@${host}${environment.wsApi}` // this works, but would rather set via proxy server
    }
    return websocketURL
  }

  startPolling() {
    // console.debug('WebsocketService.startPolling()')
    // Use different STARTUP_POLLING_DELAY to allow initial state to load via other channels before listening to Websocket updates
    this.pollingTimer$ = timer(STARTUP_POLLING_DELAY, POLLING_TIME).subscribe(_ => {
      // console.debug('Websocket polling timer', this._ws)
      if (this._ws === null || this._ws.readyState === WebSocket.CLOSED) {
        this.startWebsocket()
      }
    })
  }

  stopPolling() {
    // console.debug('WebsocketService.stopPolling()')
    if (this.pollingTimer$) this.pollingTimer$.unsubscribe()
    this.stopWebsocket()
  }

  private startWebsocket() {
    this.stopWebsocket()
    const url = this.getWebsocketUrl()
    console.debug('startWebsocket()', url)
    const ws = new WebSocket(url)
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
      // self._ws = null
      self.stopWebsocket() // this seems like overkill, since the socket just closed, but hunting for whether it's possible there are multiple sockets open at once
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

  private stopWebsocket() {
    // console.debug('stopWebsocket()')
    if (this._ws) {
      this._ws.close()
      this._ws = null
    }
  }

  private handleMessage(message: WebsocketMessage) {
    console.debug('handleMessage() type:', message.type)
    switch (message.type) {
      case WebsocketMessageType.newaddress:
      case WebsocketMessageType.txbroadcast:
      case WebsocketMessageType.txprocessed:
        // Nothing to do
        break;
      case WebsocketMessageType.blockprocessed:
        this.walletStateService.refreshWalletState().subscribe()
        const block = <BlockHeaderResponse>message.payload
        if (this.walletStateService.info) {
          this.walletStateService.info.blockHeight = block.height
        }
        break;
      case WebsocketMessageType.dlcstatechange:
        const dlc = <DLCContract>message.payload
        const obs = this.walletStateService.replaceDLC(dlc)
        // Wait for ContractInfo to load before navigating
        obs.subscribe(_ => {
          // If someone just accepted a DLC Offer
          // Using both accept states because accepted usually comes in too quickly to have transitioned
          if ([DLCState.accepting, DLCState.accepted].includes(dlc.state) && dlc.isInitiator === false) {
            this.router.navigate(['/contracts'], { queryParams: { dlcId: dlc.dlcId } })
          }
        })
        break;
      case WebsocketMessageType.reservedutxos:
        this.walletStateService.refreshBalances().subscribe()
        break;
      default:
        console.error('handleMessage() unknown message.type', message)
    }
  }

}

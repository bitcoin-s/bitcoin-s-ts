import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { Subscription, timer } from 'rxjs'

import { environment } from '../environments/environment'

import { AuthService } from '~service/auth.service'
import { DLCService } from '~service/dlc-service'
import { OfferService } from '~service/offer-service'
import { WalletServiceState, WalletStateService } from '~service/wallet-state-service'

import { BlockHeaderResponse, DLCContract, DLCState, IncomingOffer } from '~type/wallet-server-types'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'
import { AddressService } from './address.service'


enum WebsocketMessageType {
  txprocessed = 'txprocessed',
  txbroadcast = 'txbroadcast',
  blockprocessed = 'blockprocessed',
  dlcstatechange = 'dlcstatechange',
  reservedutxos = 'reservedutxos', // Wallet[]
  newaddress = 'newaddress', // address string
  dlcofferadd = 'dlcofferadd',
  dlcofferremove = 'dlcofferremove',
  torstarted = 'torstarted', // Backend successfully started Tor
  syncflagchanged = 'syncflagchanged', // 'syncing', Blockchain synced when payload === false
  rescancomplete = 'rescancomplete', // Wallet rescan complete
  feeratechange = 'feeratechange', // New fee rate estimate, payload in sats/vbyte
}

export interface WebsocketMessage {
  type: WebsocketMessageType
  payload: any
}

const STARTUP_POLLING_DELAY = 0 // ms
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

  constructor(private walletStateService: WalletStateService, private dlcService: DLCService,
    private offerService: OfferService, private addressService: AddressService,
    private router: Router, private authService: AuthService,
    private dialog: MatDialog) {}

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
    console.debug('startWebsocket()') //, url)
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
    const d = new Date().toISOString()
    if (message.type === WebsocketMessageType.blockprocessed) {
      // just too many to log, overwhelms browser
    } else {
      console.debug('handleMessage()', d, 'message:', message.type, message.payload)
    }
    
    switch (message.type) {
      case WebsocketMessageType.txbroadcast:
      case WebsocketMessageType.txprocessed:
        // Nothing to do
        break;
      case WebsocketMessageType.blockprocessed:
        const block = <BlockHeaderResponse>message.payload
        this.walletStateService.blockHeight = block.height
        if (this.walletStateService.isServerReady()) {
          // Not sure if we need to refresh everything here...
          this.walletStateService.refreshWalletState().subscribe()
        }
        break;
      case WebsocketMessageType.dlcstatechange:
        if (this.walletStateService.isServerReady()) {
          const dlc = <DLCContract>message.payload
          const contractInfo = this.dlcService.contractInfos.value[dlc.dlcId]
          console.debug(' dlc:', dlc)
          const obs = this.dlcService.replaceDLC(dlc)
          let goToContract = false
          // Wait for ContractInfo to load before navigating
          obs.subscribe(_ => {
            // If someone just accepted a DLC Offer or signed a DLC Accept, move to Contract Detail view
            // Using both states because accepted/signed usually comes in too quickly to have transitioned
            // TODO : May only want to do this when user is in specific views, but doing it for any UI state right now
            if ([DLCState.accepting, DLCState.accepted].includes(dlc.state) && !dlc.isInitiator) {
              // Remove IncomingOffer if it exists
              this.offerService.removeIncomingOfferByTemporaryContractId(dlc.temporaryContractId)
              goToContract = true
            } else if ([DLCState.signing, DLCState.signed].includes(dlc.state) && dlc.isInitiator) {
              // goToContract = true
            } else if ([DLCState.broadcast].includes(dlc.state)) {
              const dialog = this.dialog.open(ConfirmationDialogComponent, {
                data: {
                  title: 'dialog.broadcastSuccess.title',
                  content: 'dialog.broadcastSuccess.content',
                  params: { txId: dlc.fundingTxId, eventId: contractInfo.oracleInfo.announcement.event.eventId },
                  linksContent: "dialog.broadcastSuccess.linksContent",
                  links: [this.walletStateService.mempoolTransactionURL(<string>dlc.fundingTxId, this.walletStateService.getNetwork())],
                  action: 'action.close',
                  showCancelButton: false,
                }
              })
            }
            if (goToContract) {
              this.router.navigate(['/contracts'], { queryParams: { dlcId: dlc.dlcId } })
            }
          })
        }
        break;
      case WebsocketMessageType.reservedutxos:
        if (this.walletStateService.isServerReady()) {
          this.walletStateService.refreshBalances().subscribe()
        }
        break;
      case WebsocketMessageType.newaddress:
        if (this.walletStateService.isServerReady()) {
          this.addressService.refreshUnfundedAddresses().subscribe()
        } else { // Show new address when we haven't loaded state yet (waiting on backend sync)
          const newAddress = <string>message.payload
          if (!this.addressService.unfundedAddresses) {
            this.addressService.unfundedAddresses = []
          }
          this.addressService.unfundedAddresses.push(newAddress)
        }
        break;
      case WebsocketMessageType.dlcofferadd:
        const offer = <IncomingOffer>message.payload
        this.offerService.incomingOfferReceived(offer)
        break;
      case WebsocketMessageType.dlcofferremove:
        const hash = <string>message.payload
        this.offerService.incomingOfferRemoved(hash)
        break;
      case WebsocketMessageType.torstarted:
        // console.warn('torstarted')
        this.walletStateService.torStarted = true
        this.walletStateService.checkForServerReady()
        break;
      case WebsocketMessageType.syncflagchanged:
        const syncing = <boolean>message.payload
        // console.warn('syncflagchanged', syncing)
        this.walletStateService.syncing = syncing
        // sync flag sets and unsets with blockprocessed event. We only want to checkServerReady()
        // (and pay the cost of loading wallets and state) if it's not syncing and it was not ready previously
        // TODO : this may not be playing nice with rescan, doing work in the middle
        if (!syncing && ![WalletServiceState.server_ready,WalletServiceState.wallet_rescan].includes(this.walletStateService.state)) {
          this.walletStateService.checkForServerReady()
        }
        break;
      case WebsocketMessageType.rescancomplete:
        const walletName = <string>message.payload
        // Reload wallet info, will call refreshWalletState() during process
        this.walletStateService.initializeWallet().subscribe()
        break;
      case WebsocketMessageType.feeratechange:
        const feeRate = <number>message.payload
        this.walletStateService.feeEstimate = feeRate
        break;
      default:
        console.error('handleMessage() unknown message.type', message)
    }
  }

}

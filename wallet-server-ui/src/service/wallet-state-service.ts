import { EventEmitter, Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject, forkJoin, of, Subscription, timer } from 'rxjs'
import { catchError, concatMap, tap } from 'rxjs/operators'


import { AddressService } from '~service/address.service'
import { AuthService } from '~service/auth.service'
import { ContactService } from './contact-service'
import { DLCService } from '~service/dlc-service'
import { MessageService } from '~service/message.service'
import { OfferService } from '~service/offer-service'

import { BuildConfig } from '~type/proxy-server-types'
import { Balances, BlockchainMessageType, DLCMessageType, DLCWalletAccounting, GetInfoResponse, ServerResponse, WalletMessageType } from '~type/wallet-server-types'

import { BitcoinNetwork, } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'


export /* const */ enum WalletServiceState {
  offline = 'offline',
  online = 'online',
  polling = 'polling',
}

const OFFLINE_POLLING_TIME = 5000 // ms
const ONLINE_POLLING_TIME = 30000 // ms
const TOR_POLLING_TIME = 5000 // ms

const FEE_RATE_NOT_SET = -1
const DEFAULT_FEE_RATE = 1 // sats/vbyte

const TOR_ERROR_COUNT_THRESHOLD = 2

@Injectable({ providedIn: 'root' })
export class WalletStateService {

  private _state: WalletServiceState = WalletServiceState.offline
  set state(s: WalletServiceState) { this._state = s }
  get state() { return this._state }

  serverVersion: string
  buildConfig: BuildConfig

  info: GetInfoResponse
  getNetwork() {
    if (this.info) return <BitcoinNetwork>this.info.network
    else return ''
  }
  torStarting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  balances: Balances
  dlcWalletAccounting: DLCWalletAccounting
  feeEstimate: number
  torDLCHostAddress: string

  mempoolUrl: string = 'https://mempool.space' // default
  mempoolTransactionURL(txIdHex: string, network: string) {
    switch (network) {
      case BitcoinNetwork.main:
        return `${this.mempoolUrl}/tx/${txIdHex}`
      case BitcoinNetwork.test:
        return `${this.mempoolUrl}/testnet/tx/${txIdHex}`
      case BitcoinNetwork.signet:
        return `https://mempool.space/signet/tx/${txIdHex}`
      default:
        console.error('mempoolTransactionURL() unknown BitcoinNetwork', network)
        return ''
    }
  }

  // Initial State Loaded signal
  stateLoaded: EventEmitter<void> = new EventEmitter()

  private initialized = false

  private pollingTimer$: Subscription;
  private torPollingTimer$: Subscription;

  constructor(private dialog: MatDialog, private messageService: MessageService, private authService: AuthService,
    private dlcService: DLCService, private offerService: OfferService, private addressService: AddressService,
    private contactService: ContactService) {
      this.dlcService.initialized.subscribe(v => {
        if (v) this.checkInitialized()
      })
      this.offerService.initialized.subscribe(v => {
        if (v) this.checkInitialized()
      })
    }

  private stopPollingTimer() {
    // console.debug('WalletStateService.stopPollingTimer()')
    if (this.pollingTimer$) this.pollingTimer$.unsubscribe()
  }
  private startPollingTimer(delay: number, time: number) {
    this.stopPollingTimer()
    this.pollingTimer$ = timer(delay, time).pipe(
      tap(_ => { this.state = WalletServiceState.polling }),
      concatMap(() => this.messageService.serverHeartbeat().pipe(
        catchError(e => of({success: false})),
      )),
    ).subscribe(r => {
      // console.debug('polling', r)
      if (r.success === true) {
        this.setOnline()
      } else {
        this.setOffline()
      }
    })
  }
  // Public interface to polling
  public startPolling() {
    // console.debug('WalletStateService.startPolling()')
    this.startPollingTimer(0, OFFLINE_POLLING_TIME)
  }
  public stopPolling() {
    // console.debug('WalletStateService.stopPolling()')
    this.state = WalletServiceState.offline
    this.initialized = false
    this.dlcService.uninitialize()
    this.offerService.uninitialize()
    this.addressService.uninitialize()
    this.contactService.uninitialize()
    // Could wipe all state here...
    this.stopPollingTimer()
  }

  /** Auxillary Tor state polling to track whether the backend has a tor circuit up and running */
  private torErrorCount = 0
  private stopTorPolling() {
    if (this.torPollingTimer$) this.torPollingTimer$.unsubscribe()
    this.torStarting.next(false)
    this.torErrorCount = 0
  }
  private startTorPolling() {
    console.debug('startTorPolling()')
    this.stopTorPolling()
    this.torStarting.next(true)
    this.torPollingTimer$ = timer(TOR_POLLING_TIME, TOR_POLLING_TIME).pipe(
      tap(_ => { console.debug('torPolling...') }),
      concatMap(() => this.refreshWalletInfo().pipe(
        catchError(e => {
          this.torErrorCount++ // server can be offline
          return of(null)
        }),
      )),
    ).subscribe((r: ServerResponse<GetInfoResponse>) => {
      if (this.torErrorCount > TOR_ERROR_COUNT_THRESHOLD) {
        this.stopTorPolling()
        return
      }
      if (r && r.result) {
        if (r.result.torStarted) {
          console.debug(' torStarted', r)
          this.stopTorPolling()
        } else {
          console.debug(' torStarting', r)
          this.torStarting.next(true)
        }
      }
    })
  }

  private setOnline() {
    // console.debug('WalletStateService.setOnline()')
    this.state = WalletServiceState.online
    if (!this.initialized) { // coming online
      this.initializeState()
    }
  }

  private setOffline() {
    // console.debug('WalletStateService.setOffline()')
    this.state = WalletServiceState.offline
    if (this.initialized) { // going offline
      this.initialized = false
      this.stopTorPolling()
      this.startPollingTimer(ONLINE_POLLING_TIME, OFFLINE_POLLING_TIME)
    }
  }

  private checkInitialized() {
    if (this.initialized && this.dlcService.initialized.value && this.offerService.initialized.value) {
      console.debug('WalletStateService.checkInitialized() stateLoaded going', this.state)
      this.stateLoaded.next() // initial state loaded event
    }
  }

  private initializeState() {
    console.debug('initializeState()')

    return forkJoin([
      this.getServerVersion(),
      // this.getBuildConfig(), // now done in about
      this.getMempoolUrl(),
      this.getFeeEstimate(),
      this.getDLCHostAddress(),
      this.refreshWalletState(),
      this.dlcService.loadDLCs(),
      this.offerService.loadIncomingOffers(),
      this.contactService.loadContacts()
    ]).subscribe(_ => {
      console.debug(' initializedState() initialized')
      this.initialized = true
      this.checkInitialized()
      this.startPollingTimer(ONLINE_POLLING_TIME, ONLINE_POLLING_TIME)
    })
  }

  private getServerVersion() {
    return this.messageService.getServerVersion().pipe(tap(r => {
      if (r.result) {
        this.serverVersion = r.result.version;
      }
    }))
  }

  private getBuildConfig() {
    return this.messageService.buildConfig().pipe(tap(r => {
      if (r) {
        r.dateString = new Date(r.committedOn * 1000).toLocaleDateString()
        this.buildConfig = r
      }
    }))
  }

  getAboutInfo() {
    return forkJoin([
      // this.getServerVersion(), // this is an auth protected route
      this.getBuildConfig(),
    ])
  }

  private getMempoolUrl() {
    return this.messageService.mempoolUrl().pipe(tap(r => {
      if (r && r.url) {
        // HACK HACK HACK - This converts api URL to base URL. Should get passed good URL
        const index = r.url.lastIndexOf('/api')
        if (index !== -1) {
          this.mempoolUrl = r.url.substring(0, index)
        }
      }
    }))
  }

  private getFeeEstimate() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.estimatefee)).pipe(tap(r => {
      if (r.result && r.result !== FEE_RATE_NOT_SET) {
        this.feeEstimate = r.result
      } else {
        this.feeEstimate = DEFAULT_FEE_RATE
      }
    }))
  }

  private getDLCHostAddress() {
    return this.messageService.sendMessage(getMessageBody(DLCMessageType.getdlchostaddress)).pipe(tap(r => {
      if (r.result) {
        this.torDLCHostAddress = r.result
        console.warn('torDLCHostAddress:', this.torDLCHostAddress)
      }
    }))
  }

  refreshWalletState() {
    return forkJoin([
      this.refreshWalletInfo(), 
      this.refreshBalances(),
      this.refreshDLCWalletAccounting(),
      this.addressService.initializeState(),
    ])
  }

  private refreshWalletInfo() {
    return this.messageService.sendMessage(getMessageBody(BlockchainMessageType.getinfo), false).pipe(tap(r => {
      if (r.result) {
        this.info = r.result
        // Check torStarting and poll on it
        if (!this.info.torStarted) {
          this.startTorPolling()
        }
      }
    }))
  }

  refreshBalances() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getbalances, [true])).pipe(tap(r => {
      if (r.result) {
        this.balances = r.result
      }
    }))
  }

  private refreshDLCWalletAccounting() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getdlcwalletaccounting)).pipe(tap(r => {
      if (r.result) {
        this.dlcWalletAccounting = r.result
      }
    }))
  }

}

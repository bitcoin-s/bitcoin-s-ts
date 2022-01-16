import { EventEmitter, Injectable } from '@angular/core'
import { BehaviorSubject, forkJoin, Observable, of, Subject, Subscription, timer } from 'rxjs'
import { catchError, concatMap, filter, first, map, retry, tap } from 'rxjs/operators'
import { BuildConfig } from '~type/proxy-server-types'

import { Balances, BlockchainMessageType, ContractInfo, CoreMessageType, DLCContract, DLCMessageType, DLCWalletAccounting, FundedAddress, GetInfoResponse, ServerResponse, ServerVersion, WalletMessageType } from '~type/wallet-server-types'
import { BitcoinNetwork } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'
import { AuthService } from './auth.service'

import { MessageService } from './message.service'


export /* const */ enum WalletServiceState {
  offline = 'offline',
  online = 'online',
  polling = 'polling',
}

const OFFLINE_POLLING_TIME = 5000 // ms
const ONLINE_POLLING_TIME = 30000 // ms

const FEE_RATE_NOT_SET = -1
const DEFAULT_FEE_RATE = 1 // sats/vbyte

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
  balances: Balances
  fundedAddresses: FundedAddress[]
  dlcWalletAccounting: DLCWalletAccounting
  feeEstimate: number
  torDLCHostAddress: string

  dlcs: BehaviorSubject<DLCContract[]> = new BehaviorSubject<DLCContract[]>([])
  contractInfos: BehaviorSubject<{ [dlcId: string]: ContractInfo }> = new BehaviorSubject<{ [dlcId: string]: ContractInfo }>({})

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
  private dlcsInitialized = false

  private pollingTimer$: Subscription;

  constructor(private messageService: MessageService, private authService: AuthService) {}

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
    this.dlcsInitialized = false
    // Could wipe all state here...
    this.stopPollingTimer()
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
      this.startPollingTimer(ONLINE_POLLING_TIME, OFFLINE_POLLING_TIME)
    }
  }

  private checkInitialized() {
    if (this.initialized && this.dlcsInitialized) {
      console.debug('WalletStateService.checkInitialized() stateLoaded going true', this.state)
      this.stateLoaded.next() // initial state loaded event
    }
  }

  private initializeState() {
    console.debug('initializeState()')

    return forkJoin([
      this.getServerVersion(),
      this.getBuildConfig(),
      this.getMempoolUrl(),
      this.getFeeEstimate(),
      this.getDLCHostAddress(),
      this.refreshWalletState(),
      this.loadDLCs(),
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
    return this.messageService.buildConfig().pipe(tap(result => {
      if (result) {
        result.dateString = new Date(result.committedOn * 1000).toLocaleDateString()
        this.buildConfig = result
      }
    }))
  }

  private getMempoolUrl() {
    return this.messageService.mempoolUrl().pipe(tap(result => {
      if (result && result.url) {
        // HACK HACK HACK - This converts api URL to base URL. Should get passed good URL
        const index = result.url.lastIndexOf('/api')
        if (index !== -1) {
          this.mempoolUrl = result.url.substring(0, index)
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
    return forkJoin([this.refreshWalletInfo(), 
      this.refreshBalances(),
      this.refreshDLCWalletAccounting()])
  }

  private refreshWalletInfo() {
    return this.messageService.sendMessage(getMessageBody(BlockchainMessageType.getinfo)).pipe(tap(r => {
      if (r.result) {
        this.info = r.result
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

  /** DLCs */

  private loadDLCs() {
    console.debug('loadDLCs()')
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getdlcs)).pipe(tap(r => {
      if (r.result) {
        const dlcs = <DLCContract[]>r.result
        this.dlcs.next(dlcs)
        this.loadContractInfos(dlcs)
      }
    }))
  }

  refreshDLC(dlcId: string) {
    console.debug('refreshDLCState()', dlcId)
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getdlc, [dlcId])).pipe(tap(r => {
      console.debug('getdlc', r)
      if (r.result) {
        const dlc = <DLCContract>r.result
        this.replaceDLC(dlc).subscribe()
        return dlc
      }
      return null
    }))
  }

  // Caller must subscribe to returned Observable to get new Contract Info loaded
  replaceDLC(dlc: DLCContract) {
    // Inject in dlcs
    const i = this.dlcs.value.findIndex(d => d.dlcId === dlc.dlcId)
    if (i !== -1) {
      const removed = this.dlcs.value.splice(i, 1, dlc)
      // console.debug('removed:', removed)
      this.dlcs.next(this.dlcs.value)
      return of(null)
    } else {
      console.warn('replaceDLC() did not find dlcId', dlc.dlcId, 'in existing dlcs')
      // Loading Contract Info before updating dlcs so data will be present for anything binding both
      this.dlcs.value.push(dlc)
      this.dlcs.next(this.dlcs.value)
      const obs = this.loadContractInfo(dlc)
      return obs
    }
  }

  removeDLC(dlcId: string) {
    const i = this.dlcs.value.findIndex(d => d.dlcId === dlcId)
    if (i !== -1) {
      const removed = this.dlcs.value.splice(i, 1)
      this.dlcs.next(this.dlcs.value)
    }
  }

  /** ContractInfo */

  private loadContractInfos(dlcs: DLCContract[]) {
    const ci = this.contractInfos.value
    if (dlcs.length === 0) {
      // No additional data to load
      this.dlcsInitialized = true
      this.checkInitialized()
    }
    return forkJoin(dlcs.map(dlc => 
      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [dlc.contractInfo]))))
      .subscribe((results: ServerResponse<ContractInfo>[]) => {
        console.debug(' loadContractInfos()', results)
        for (let i = 0; i < results.length; i++) {
          ci[dlcs[i].dlcId] = <ContractInfo>results[i].result
        }
        this.contractInfos.next(this.contractInfos.value)
        this.dlcsInitialized = true
        this.checkInitialized()
      })
  }

  private loadContractInfo(dlc: DLCContract) {
    const ci = this.contractInfos.value
    if (!ci[dlc.dlcId]) { // Don't bother reloading ContractInfo we already have
      const obs = this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [dlc.contractInfo]))
      .pipe(tap(r => {
        console.warn(' loadContractInfo()', r)
        if (r.result) {
          ci[dlc.dlcId] = r.result
          this.contractInfos.next(this.contractInfos.value)
        }
      }))
      return obs
    } else {
      console.warn('loadContractInfo() already have Contract Info for', dlc.dlcId)
      return of(null)
    }
  }

}

import { EventEmitter, Injectable } from "@angular/core"
import { BehaviorSubject, forkJoin, Observable, of, Subject, Subscription, timer } from "rxjs"
import { catchError, concatMap, filter, first, map, retry, tap } from "rxjs/operators"
import { BuildConfig } from "~type/proxy-server-types"

import { Balances, BlockchainMessageType, ContractInfo, CoreMessageType, DLCContract, DLCMessageType, DLCWalletAccounting, FundedAddress, GetInfoResponse, ServerResponse, ServerVersion, WalletMessageType } from "~type/wallet-server-types"
import { BitcoinNetwork } from "~util/utils"
import { getMessageBody } from "~util/wallet-server-util"

import { MessageService } from "./message.service"


export /* const */ enum WalletServiceState {
  offline = 'offline',
  online = 'online',
  polling = 'polling',
}

const OFFLINE_POLLING_TIME = 5000 // ms
const ONLINE_POLLING_TIME = 30000 // ms

const MATCH_LEADING_DIGITS = /^([0-9]+) /

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

  // Initial State Loaded signal
  stateLoaded: EventEmitter<void> = new EventEmitter()

  private initialized = false
  private dlcsInitialized = false

  private pollingTimer$: Subscription;
  private stopPollingTimer() { if (this.pollingTimer$) this.pollingTimer$.unsubscribe() }
  private startPollingTimer(delay: number, time: number) {
    this.stopPollingTimer()
    this.pollingTimer$ = timer(delay, time).pipe(
      tap(_ => { this.state = WalletServiceState.polling }),
      concatMap(() => this.messageService.walletHeartbeat().pipe(
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

  constructor(private messageService: MessageService) {
    this.startPollingTimer(0, OFFLINE_POLLING_TIME)
  }
  
  private setOnline() {
    this.state = WalletServiceState.online
    if (!this.initialized) { // coming online
      this.initializeState()
      this.refreshDLCStates() // First time
      this.startPollingTimer(ONLINE_POLLING_TIME, ONLINE_POLLING_TIME)
    }
  }

  private setOffline() {
    this.state = WalletServiceState.offline
    if (this.initialized) { // going offline
      this.initialized = false
      this.startPollingTimer(ONLINE_POLLING_TIME, OFFLINE_POLLING_TIME)
    }
  }

  checkInitialized() {
    if (this.initialized && this.dlcsInitialized) {
      this.stateLoaded.next() // initial state loaded event
    }
  }

  private initializeState() {
    return forkJoin(this.getServerVersion(),
      this.getBuildConfig(),
      this.getFeeEstimate(),
      this.getDLCHostAddress(),
      // refreshWalletState()
      this.refreshWalletInfo(), 
      this.refreshBalances(),
      this.refreshDLCWalletAccounting()).subscribe(_ => {
        this.initialized = true
        this.checkInitialized()
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

  private getFeeEstimate() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.estimatefee)).pipe(tap(r => {
      if (r.result) { // like '1234 sats/vbyte'
        // Rip string to number
        const matches = MATCH_LEADING_DIGITS.exec(r.result)
        if (matches && matches[0]) {
          this.feeEstimate = parseInt(matches[0])
        } else {
          console.error('failed to process fee estimate string')
        }
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
      .subscribe(r => {
        // Nothing to do
      })
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

  refreshDLC(dlcId: string) {
    console.debug('refreshDLCState()', dlcId)
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getdlc, [dlcId])).pipe(tap(r => {
      console.debug('getdlc', r)

      if (r.result) {
        const dlc = <DLCContract>r.result
        this.replaceDLC(dlc)
        return dlc
      }
      return null
    }))
  }

  replaceDLC(dlc: DLCContract) {
    // Inject in dlcs
    const i = this.dlcs.value.findIndex(d => d.dlcId === dlc.dlcId)
    if (i !== -1) {
      const removed = this.dlcs.value.splice(i, 1, dlc)
      // console.debug('removed:', removed)
      this.dlcs.next(this.dlcs.value)
    } else {
      console.warn('updateDLC() did not find dlcId', dlc.dlcId, 'in existing dlcs')
      this.dlcs.value.push(dlc)
      this.dlcs.next(this.dlcs.value)
      this.loadContractInfo(dlc)
    }
  }

  removeDLC(dlcId: string) {
    const i = this.dlcs.value.findIndex(d => d.dlcId === dlcId)
    if (i !== -1) {
      const removed = this.dlcs.value.splice(i, 1)
      this.dlcs.next(this.dlcs.value)
    }
  }

  refreshDLCStates() {
    console.debug('refreshDLCStates()')
    this.messageService.sendMessage(getMessageBody(WalletMessageType.getdlcs)).subscribe(r => {
      if (r.result) {
        const dlcs = <DLCContract[]>r.result
        this.dlcs.next(dlcs)
        this.loadContractInfos(dlcs)
      }
    })
  }

  private mapContracts(dlcs: DLCContract[]) {
    return dlcs.map(dlc => 
      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [dlc.contractInfo])))
  }

  loadContractInfos(dlcs: DLCContract[]) {
    const ci = this.contractInfos.value
    return forkJoin(this.mapContracts(dlcs))
    .subscribe((results: ServerResponse<ContractInfo>[]) => {
      for (let i = 0; i < results.length; i++) {
        ci[dlcs[i].dlcId] = <ContractInfo>results[i].result
      }
      this.contractInfos.next(this.contractInfos.value)
      this.dlcsInitialized = true
      this.checkInitialized()
    })
  }

  loadContractInfo(dlc: DLCContract) {
    const ci = this.contractInfos.value
    if (!ci[dlc.dlcId]) { // Don't bother reloading ContractInfo we already have
      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [dlc.contractInfo]))
      .subscribe((r: ServerResponse<ContractInfo>) => {
        if (r.result) {
          ci[dlc.dlcId] = r.result
          this.contractInfos.next(this.contractInfos.value)
        }
      })
    }
  }

}

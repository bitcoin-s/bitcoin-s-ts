import { Injectable } from "@angular/core"
import { BehaviorSubject, Observable, of, Subscription, timer } from "rxjs"
import { catchError, concatMap, filter, first, retry, tap } from "rxjs/operators"
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

const POLLING_TIME = 15000 // ms

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

  private pollingTimer$: Subscription;
  private initialized = false

  constructor(private messageService: MessageService) {
    this.pollingTimer$ = timer(0, POLLING_TIME).pipe(
      tap(_ => { this.state = WalletServiceState.polling }),
      concatMap(() => this.messageService.walletHeartbeat().pipe(
        catchError(e => of({success: false})),
      )),
    ).pipe(tap(r => {
      if (r.success === true) {
        this.state = WalletServiceState.online

        if (!this.initialized) { // coming online
          this.initializeState()
          // Initial data load before websocket polling kicks in
          // this.updateState()
        }
        // Polling on blocks received now
        this.updateState()
      } else {
        this.state = WalletServiceState.offline

        if (this.initialized) { // going offline
          this.uninitializeState()
        }
      }
    }), filter(r => r.success === true)).subscribe(r => {
      // Nothing to do
    })
  }

  private uninitializeState() {
    this.initialized = false  
    // Could clear pieces of state here...
  }

  private initializeState() {
    this.messageService.getServerVersion().subscribe(r => {
      if (r.result) {
        this.serverVersion = r.result.version;
      }
    })
    this.messageService.buildConfig().subscribe(result => {
      if (result) {
        result.dateString = new Date(result.committedOn * 1000).toLocaleDateString()
        this.buildConfig = result
      }
    })
    this.messageService.sendMessage(getMessageBody(WalletMessageType.estimatefee)).subscribe(r => {
      if (r.result) { // like '1234 sats/vbyte'
        // Rip string to number
        const matches = MATCH_LEADING_DIGITS.exec(r.result)
        if (matches && matches[0]) {
          this.feeEstimate = parseInt(matches[0])
        } else {
          console.error('failed to process fee estimate string')
        }
      }
    })
    this.messageService.sendMessage(getMessageBody(DLCMessageType.getdlchostaddress)).subscribe(r => {
      if (r.result) {
        this.torDLCHostAddress = r.result
        console.warn('torDLCHostAddress:', this.torDLCHostAddress)
      }
    })
    this.initialized = true
  }

  updateState() {
    this.refreshWalletState()
    this.refreshDLCStates()
  }

  refreshWalletState() {
    this.messageService.sendMessage(getMessageBody(BlockchainMessageType.getinfo)).subscribe(r => {
      if (r.result) {
        this.info = r.result
      }
    })
    this.refreshBalances()
    this.messageService.sendMessage(getMessageBody(WalletMessageType.getdlcwalletaccounting)).subscribe(r => {
      if (r.result) {
        this.dlcWalletAccounting = r.result
      }
    })
  }

  refreshBalances() {
    console.debug('refreshBalances()')

    this.messageService.sendMessage(getMessageBody(WalletMessageType.getbalances, [true])).subscribe(r => {
      if (r.result) {
        this.balances = r.result
      }
    })
  }

  refreshDLCState(dlc: DLCContract) {
    console.debug('refreshDLCState()', dlc)
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getdlc, [dlc.dlcId])).pipe(tap(r => {
      console.debug('getdlc', r)

      if (r.result) {
        const dlc = <DLCContract>r.result
        // Inject in dlcs
        const i = this.dlcs.value.findIndex(d => d.dlcId === dlc.dlcId)
        // console.debug('i:', i)
        if (i !== -1) {
          const removed = this.dlcs.value.splice(i, 1, dlc)
          // console.debug('removed:', removed)
          this.dlcs.next(this.dlcs.value)
        } else {
          console.warn('refreshDLCState()', 'did not find dlcId', dlc.dlcId, 'in existing dlcs')
          // The DLC didn't exist yet, this shouldn't happen...
          this.dlcs.value.push(dlc)
          this.dlcs.next(this.dlcs.value)
          this.loadContractInfo(dlc)
        }
        return dlc
      }
      return null
    }))
  }

  refreshDLCStates() {
    console.debug('refreshDLCStates()')
    this.messageService.sendMessage(getMessageBody(WalletMessageType.getdlcs)).subscribe(r => {
      if (r.result) {
        this.dlcs.next(r.result)
        // Decode all ContractInfos
        for (const dlc of <DLCContract[]>r.result) {
          this.loadContractInfo(dlc)
        }
      }
    })
  }

  loadContractInfo(dlc: DLCContract) {
    const ci = this.contractInfos.value
    if (!ci[dlc.dlcId]) { // Don't bother reloading ContractInfo we already have
      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [dlc.contractInfo]))
      .subscribe((r: ServerResponse<ContractInfo>) => {
        if (r.result) {
          ci[dlc.dlcId] = r.result
        }
      })
    }
  }

}

import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject, forkJoin, of } from 'rxjs'
import { tap } from 'rxjs/operators'

import { MessageService } from '~service/message.service'

import { ContractInfo, CoreMessageType, DLCContract, ServerResponse, WalletMessageType } from '~type/wallet-server-types'

import { getMessageBody } from '~util/wallet-server-util'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'


@Injectable({ providedIn: 'root' })
export class DLCService {

  initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  dlcs: BehaviorSubject<DLCContract[]> = new BehaviorSubject<DLCContract[]>([])
  contractInfos: BehaviorSubject<{ [dlcId: string]: ContractInfo }> = 
    new BehaviorSubject<{ [dlcId: string]: ContractInfo }>({})

  constructor(private messageService: MessageService, private dialog: MatDialog) {}

  uninitialize() {
    this.initialized.next(false)
    this.dlcs.next([])
    this.contractInfos.next({})
  }

  /** DLCs */

  loadDLCs() {
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
      console.warn('replaceDLC() did not find dlcId', dlc.dlcId, 'in existing dlcs', dlc)
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
    console.debug('loadContractInfos()', dlcs.length)
    const ci = this.contractInfos.value
    if (dlcs.length === 0) {
      // No additional data to load
      this.initialized.next(true)
    }
    return forkJoin(dlcs.map(dlc => 
      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [dlc.contractInfo]))))
      .subscribe((results: ServerResponse<ContractInfo>[]) => {
        // console.debug(' loadContractInfos()', results)
        for (let i = 0; i < results.length; i++) {
          ci[dlcs[i].dlcId] = <ContractInfo>results[i].result
        }
        this.contractInfos.next(this.contractInfos.value)
        this.initialized.next(true)
      })
  }

  private loadContractInfo(dlc: DLCContract) {
    const ci = this.contractInfos.value
    if (!ci[dlc.dlcId]) { // Don't bother reloading ContractInfo we already have
      const obs = this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [dlc.contractInfo]))
      .pipe(tap(r => {
        console.debug(' loadContractInfo()', r)
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

  /** Contacts */

  addContact(dlc: DLCContract, address: string) {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.dlccontactadd, [dlc.dlcId, address])).pipe(tap(r => {
      console.debug('dlccontactadd', r)
      if (r) {
        if (r.error) {
          const dialog = this.dialog.open(ErrorDialogComponent, {
            data: {
              title: 'dialog.error',
              content: r.error,
            }
          })
        } else if (r.result) { // "ok"
          dlc.peer = address
        }
      }
    }))
  }

  removeContact(dlc: DLCContract) {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.dlccontactremove, [dlc.dlcId])).pipe(tap(r => {
      console.debug('dlccontactadd', r)
      if (r) {
        if (r.error) {
          const dialog = this.dialog.open(ErrorDialogComponent, {
            data: {
              title: 'dialog.error',
              content: r.error,
            }
          })
        } else if (r.result) { // "ok"
          dlc.peer = null
        }
      }
    }))
  }

}

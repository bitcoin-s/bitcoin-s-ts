import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject, forkJoin } from 'rxjs'
import { switchMap, tap } from 'rxjs/operators'

import { MessageService } from '~service/message.service'

import { FundedAddress, WalletMessageType } from '~type/wallet-server-types'

import { getMessageBody } from '~util/wallet-server-util'


@Injectable({ providedIn: 'root' })
export class AddressService {

  initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  fundedAddresses: FundedAddress[]
  unfundedAddresses: string[]

  addressLabelMap: {[address: string]: string[]}

  constructor(private dialog: MatDialog, private messageService: MessageService) {}

  uninitialize() {
    this.initialized.next(false)
    // Could clear state
  }

  initializeState() {
    return forkJoin([
      this.refreshFundedAddresses(),
      this.refreshUnfundedAddresses(),
      this.refreshAddressLabels(),
    ]).pipe(tap(r => {
      this.initialized.next(true)
    }, err => {
      console.error('error in AddressService.initializeState()')
    }))
  }

  refreshFundedAddresses() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getfundedaddresses)).pipe(tap(r => {
      if (r.result) {
        this.fundedAddresses = r.result
      }
    }))
  }

  refreshUnfundedAddresses() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getunusedaddresses)).pipe(tap(r => {
      if (r.result) {
        this.unfundedAddresses = r.result
      }
    }))
  }

  refreshAddressLabels() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getaddresslabels)).pipe(tap(r => {
      // console.debug(' getaddresslabels', r)
      if (r.result) {
        const addressLabels: [{ address: string, labels: string[] }] = r.result
        this.addressLabelMap = {}
        if (addressLabels && addressLabels.length > 0) {
          for (const a of addressLabels) {
            this.addressLabelMap[a.address] = a.labels
          }
        }
        // console.debug(' addressLabelMap', this.addressLabelMap)
      }
    }))
  }

  updateAddressLabel(address: string, label: string) {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.dropaddresslabels, [address])).pipe(tap(r => {
      // console.debug(' dropaddresslabels', r)
    }), switchMap(r => {
      return this.messageService.sendMessage(getMessageBody(WalletMessageType.labeladdress, [address, label])).pipe(tap(r => {
        // console.debug(' labeladdress', r)
        if (r.result) {
          this.addressLabelMap[address] = [label]
        }
      }))
    }))
  }

}

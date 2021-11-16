import { Component, Input, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'

import { Offer, EnumContractDescriptor, NumericContractDescriptor, WalletMessageType, DLCMessageType } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'
import { copyToClipboard, formatDateTime } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-accept-offer',
  templateUrl: './accept-offer.component.html',
  styleUrls: ['./accept-offer.component.scss']
})
export class AcceptOfferComponent implements OnInit {

  public Object = Object

  private _offer: OfferWithHex
  @Input() set offer (offer: OfferWithHex) {
    this._offer = offer
    this.reset()
  }
  get offer() { return this._offer }

  get contractInfo() {
    return this.offer.offer.contractInfo
  }
  get contractDescriptor() {
    return this.offer.offer.contractInfo.contractDescriptor
  }

  get enumContractDescriptor() {
    return <EnumContractDescriptor>this.offer.offer.contractInfo.contractDescriptor
  }

  get numericContractDescriptor() {
    return <NumericContractDescriptor>this.offer.offer.contractInfo.contractDescriptor
  }

  refundDate: string

  peerAddress: string

  newOfferResult: string

  private reset() {
    this.refundDate = formatDateTime(this.offer.offer.refundLocktime)
    this.peerAddress = ''
    this.newOfferResult = ''
  }

  constructor(private messageService: MessageService, private walletStateService: WalletStateService, private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  isEnum() {
    const cd = <EnumContractDescriptor>this.contractDescriptor
    return cd.outcomes !== undefined
  }

  isNumeric() {
    const cd = <NumericContractDescriptor>this.contractDescriptor
    return cd.numDigits !== undefined
  }

  onExecute() {
    console.debug('onExecute()')

    let pa
    if (this.peerAddress) {
      // validate using Tor
      // validate IPV6 address
      pa = this.peerAddress
    }

    if (pa) {
      this.messageService.sendMessage(getMessageBody(DLCMessageType.acceptdlc,
        [this.offer.hex, pa])).subscribe(r => {
          console.warn('acceptdlcoffer', r)
          if (r.result) {
            this.newOfferResult = r.result
            this.walletStateService.refreshDLCStates()
          }
        })
    } else {
      console.error('not using Tor for acceptdlc is untested')

      const dialog = this.dialog.open(ErrorDialogComponent, {
        data: {
          title: 'dialog.mempoolError.title',
          content: 'Accepting DLCs without using Tor is not currently enabled',
        }
      })

      return

      this.messageService.sendMessage(getMessageBody(WalletMessageType.acceptdlcoffer,
        [this.offer.hex])).subscribe(r => {
          console.warn('acceptdlcoffer', r)
          if (r.result) {
            this.newOfferResult = r.result
            this.walletStateService.refreshDLCStates()
          }
        })
    }
  }

  onCopyResult() {
    console.debug('onCopyResult()')

    copyToClipboard(this.newOfferResult)
  }

}

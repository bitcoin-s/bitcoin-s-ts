import { Component, Input, OnInit } from '@angular/core'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'

import { Offer, EnumContractDescriptor, NumericContractDescriptor, WalletMessageType, DLCMessageType } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'
import { copyToClipboard } from '~util/utils'
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

  // isEnum = false
  // isNumeric = false

  peerAddress = ''

  refundDate: string

  newOfferResult: string = ''

  private reset() {
    // this.isEnum = (<EnumContractDescriptor>this.offer.contractInfo.contractDescriptor).outcomes !== undefined
    // this.isNumeric = (<NumericContractDescriptor>this.offer.contractInfo.contractDescriptor).numDigits !== undefined
    this.refundDate = new Date(this.offer.offer.refundLocktime * 1000).toLocaleDateString()
  }

  constructor(private messageService: MessageService, private walletStateService: WalletStateService) { }

  ngOnInit(): void {
  }

  isEnum() {
    const cd = this.contractDescriptor
    // if (cd instanceof EnumContractDescriptor) return true
    // return <EnumContractDescriptor>cd !== undefined
    return (<EnumContractDescriptor>cd).outcomes !== undefined
  }

  isNumeric() {
    const cd = this.contractDescriptor
    // return this.offer.contractInfo.contractDescriptor instanceof NumericContractDescriptor
    return (<NumericContractDescriptor>cd).numDigits !== undefined
  }

  onExecute() {
    console.debug('onExecute()')


    let pa
    if (this.peerAddress) {
      // validate using Tor
      // validate IPV6 address
      pa = this.peerAddress
    }

    if (this.isEnum()) {
      if (pa) {
        // DLCOfferTLV, torAddress
        this.messageService.sendMessage(getMessageBody(DLCMessageType.acceptdlc,
          [this.offer.hex, pa])).subscribe(r => {
            console.warn('acceptdlcoffer', r)
            if (r.result) {
              this.newOfferResult = r.result
              this.walletStateService.refreshDLCStates()
            }
          })
      } else {
        this.messageService.sendMessage(getMessageBody(WalletMessageType.acceptdlcoffer,
          [this.offer.hex])).subscribe(r => {
            console.warn('acceptdlcoffer', r)
            if (r.result) {
              this.newOfferResult = r.result
              this.walletStateService.refreshDLCStates()
            }
          })
      }
    } else if (this.isNumeric()) {

    }
  }

  onCopyResult() {
    console.debug('onCopyResult()')

    copyToClipboard(this.newOfferResult)
  }

}

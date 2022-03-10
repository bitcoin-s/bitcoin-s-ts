import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core'

import { AddressService } from '~service/address.service'
import { MessageService } from '~service/message.service'

import { WalletMessageType } from '~type/wallet-server-types'

import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-address-label',
  templateUrl: './address-label.component.html',
  styleUrls: ['./address-label.component.scss'],
})
export class AddressLabelComponent implements OnInit {

  @Input() address: string

  @ViewChild('labelInput') labelInput: ElementRef

  label: string = ''

  hasSavedLabelValue = false
  hasInputChange = false

  executing = false

  constructor(private messageService: MessageService, private addressService: AddressService) {}

  ngOnInit(): void {
    this.addressService.initialized.subscribe(v => {
      if (v) {
        const label = this.addressService.addressLabelMap[this.address]
        if (this.address && label && label.length > 0) {
          this.label = label.join(', ')
          this.hasSavedLabelValue = true
        }
      }
    })
  }

  onInputChange() {
    this.hasInputChange = true
  }

  addLabel() {
    const label = this.labelInput.nativeElement.value
    console.debug('addLabel()', this.address, label)

    this.executing = true
    this.addressService.updateAddressLabel(this.address, label).subscribe(r => {
      this.hasSavedLabelValue = true
      this.hasInputChange = false
      this.executing = false
    })
  }

  clearLabel() {
    console.debug('clearLabel()', this.address)

    this.executing = true
    this.messageService.sendMessage(getMessageBody(WalletMessageType.dropaddresslabels, [this.address])).subscribe(r => {
      this.hasSavedLabelValue = false
      this.hasInputChange = false
      this.label = ''
      this.labelInput.nativeElement.value = ''
      this.executing = false
    })
  }

}

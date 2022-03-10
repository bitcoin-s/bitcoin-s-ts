import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'

import { AddressService } from '~service/address.service'
import { MessageService } from '~service/message.service'

import { WalletMessageType } from '~type/wallet-server-types'

import { getMessageBody } from '~util/wallet-server-util'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'


@Component({
  selector: 'app-address-label',
  templateUrl: './address-label.component.html',
  styleUrls: ['./address-label.component.scss'],
})
export class AddressLabelComponent implements OnInit {

  @Input() address: string

  @ViewChild('labelInput') labelInput: ElementRef

  label: string = ''

  showAddLabel = false
  hasSavedLabelValue = false
  hasInputChange = false

  executing = false

  constructor(private messageService: MessageService, private addressService: AddressService,
    private dialog: MatDialog) {}

  ngOnInit(): void {
    this.addressService.initialized.subscribe(v => {
      if (v) {
        const label = this.addressService.addressLabelMap[this.address]
        if (this.address && label && label.length > 0) {
          this.label = label.join(', ')
          this.hasSavedLabelValue = true
          this.showAddLabel = true
        }
      }
    })
  }

  onShowAddLabel() {
    console.debug('showAddLabel()')

    this.showAddLabel = true

    setTimeout(() => {
      if (this.labelInput) {
        this.labelInput.nativeElement.focus()
      }
    }, 0)
  }

  onInputChange() {
    this.hasInputChange = true
  }

  onBlur() {
    if (!this.labelInput.nativeElement.value && !this.hasSavedLabelValue) {
      this.showAddLabel = false
    }
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

    const dialog = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'dialog.clearLabel.title',
        content: 'dialog.clearLabel.content',
        params:  { address: this.address },
        action: 'action.yes',
        showCancelButton: true,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.executing = true
        this.messageService.sendMessage(getMessageBody(WalletMessageType.dropaddresslabels, [this.address])).subscribe(r => {
          this.hasSavedLabelValue = false
          this.hasInputChange = false
          this.showAddLabel = false
          this.label = ''
          this.labelInput.nativeElement.value = ''
          this.executing = false
        })
      }
    })
  }

}

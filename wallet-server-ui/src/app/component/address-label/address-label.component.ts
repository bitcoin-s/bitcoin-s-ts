import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'

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

  form: FormGroup
  get labelValue() { return this.form?.get('label')?.value }

  updateLabel(label: string) {
    this.form.patchValue({
      label: label
    })
  }

  hasSavedLabelValue = false
  hasInputChange = false

  executing = false

  constructor(private formBuilder: FormBuilder, private cdr: ChangeDetectorRef,
    private messageService: MessageService, private addressService: AddressService) {
      
    }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      label: ['']
    })
    this.addressService.initialized.subscribe(v => {
      if (v) {
        const label = this.addressService.addressLabelMap[this.address]
        if (this.address && label && label.length > 0) {
          this.updateLabel(label.join(', '))
          this.hasSavedLabelValue = true
        }
      }
    })
  }

  onInputChange() {
    this.hasInputChange = true
  }

  addLabel() {
    const label = this.form.value.label
    console.debug('addLabel()', this.address, label)

    this.executing = true
    this.addressService.updateAddressLabel(this.address, label).subscribe(r => {
      this.updateLabel(label)
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
      this.updateLabel('')
      this.executing = false
    })
  }

}

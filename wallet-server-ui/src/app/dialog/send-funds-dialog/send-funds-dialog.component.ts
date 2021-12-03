import { Component, Inject, OnInit } from '@angular/core'

import { WalletStateService } from '~service/wallet-state-service'
import { validateBitcoinAddress } from '~util/utils'


@Component({
  selector: 'app-send-funds-dialog',
  templateUrl: './send-funds-dialog.component.html',
  styleUrls: ['./send-funds-dialog.component.scss']
})
export class SendFundsDialogComponent implements OnInit {

  address = ''
  validAddress = false
  amount: number
  sendMax = false
  feeRate: number

  action = 'action.ok'
  actionColor = 'primary'

  constructor(private walletStateService: WalletStateService) { }

  ngOnInit() {
    this.feeRate = this.walletStateService.feeEstimate
  }

  inputsValid() {
    let validInputs = true

    if (!this.address) {
      validInputs = false
    }
    if (!this.amount || this.amount <= 0) {
      validInputs = false
    }
    if (!this.feeRate || this.feeRate <= 0) {
      validInputs = false
    }

    // Validate address is a valid bitcoin address
    if (!validateBitcoinAddress(this.walletStateService.info.network, this.address)) {
      validInputs = false
      this.validAddress = false
    } else {
      this.validAddress = true
    }

    return validInputs
  }

  onAddressPaste(event: ClipboardEvent) {
    console.debug('onAddressPaste()', event)

    // Validating clipboard data since blur() event hasn't happened on <input> yet
    const clipboardData = event.clipboardData
    if (clipboardData) {
      const trimmedPastedText = clipboardData.getData('text').trim()
      this.validAddress = validateBitcoinAddress(this.walletStateService.info.network, trimmedPastedText)
      // this.address = trimmedPastedText
    }
  }

  onMax() {
    console.debug('onMax()', this.sendMax)
    this.sendMax = !this.sendMax
    if (this.sendMax) this.amount = <number><unknown>null
  }

}

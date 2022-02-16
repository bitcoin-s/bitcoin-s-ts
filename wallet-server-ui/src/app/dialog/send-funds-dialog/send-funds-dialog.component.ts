import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'

import { WalletStateService } from '~service/wallet-state-service'
import { networkToValidationNetwork } from '~util/utils'
import { bitcoinAddressValidator, conditionalValidator, nonNegativeNumberValidator } from '~util/validators'


@Component({
  selector: 'app-send-funds-dialog',
  templateUrl: './send-funds-dialog.component.html',
  styleUrls: ['./send-funds-dialog.component.scss']
})
export class SendFundsDialogComponent implements OnInit {

  form: FormGroup
  get f() { return this.form.controls }

  get address() { return this.form.get('address') }

  sendMax = false

  action = 'action.send'
  actionColor = 'primary'

  constructor(private walletStateService: WalletStateService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      address: [null, Validators.compose([
        bitcoinAddressValidator(networkToValidationNetwork(this.walletStateService.getNetwork() || undefined)),
        // regexValidator(getValidationRegexForNetwork(this.walletStateService.getNetwork())), // old RegEx validator
        Validators.required])],
      amount: [null, conditionalValidator(() => !this.sendMax, 
        Validators.compose([nonNegativeNumberValidator(), Validators.required]))],
      feeRate: [this.walletStateService.feeEstimate, Validators.compose([nonNegativeNumberValidator(), Validators.required])],
    })
  }

  onMax() {
    console.debug('onMax()', this.sendMax)
    this.sendMax = !this.sendMax
    if (this.sendMax) {
      this.form.patchValue({
        amount: null
      })
      this.f['amount'].disable()
    } else {
      this.f['amount'].enable()
    }
  }

  getFormState() {
    const v = this.form.value
    return { 
      address: v.address,
      amount: v.amount,
      feeRate: v.feeRate,
      sendMax: this.sendMax,
    }
  }

}

import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'

import { WalletStateService } from '~service/wallet-state-service'
import { getValidationRegexForNetwork } from '~util/utils'
import { conditionalValidator, nonNegativeNumberValidator, regexValidator } from '~util/validators'


@Component({
  selector: 'app-send-funds-dialog',
  templateUrl: './send-funds-dialog.component.html',
  styleUrls: ['./send-funds-dialog.component.scss']
})
export class SendFundsDialogComponent implements OnInit {

  form: FormGroup
  get f() { return this.form.controls }

  sendMax = false

  action = 'action.ok'
  actionColor = 'primary'

  constructor(private walletStateService: WalletStateService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      address: [null, Validators.compose([
        regexValidator(getValidationRegexForNetwork(this.walletStateService.info.network)), 
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

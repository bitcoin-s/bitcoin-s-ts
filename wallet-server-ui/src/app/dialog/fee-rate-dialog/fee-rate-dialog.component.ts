import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'

import { WalletStateService } from '~service/wallet-state-service'
import { networkToValidationNetwork } from '~util/utils'
import { bitcoinAddressValidator, conditionalValidator, nonNegativeNumberValidator } from '~util/validators'


export interface FeeRateDialogContent {
  txId: string,
  minimumFeeRate: number,
}

@Component({
  selector: 'app-fee-rate-dialog',
  templateUrl: './fee-rate-dialog.component.html',
  styleUrls: ['./fee-rate-dialog.component.scss']
})
export class FeeRateDialogComponent implements OnInit {

  @ViewChild('feeRate') feeRate: ElementRef

  form: FormGroup
  get f() { return this.form.controls }

  action = 'action.send'
  actionColor = 'primary'

  minimumFeeRate: number

  constructor(@Inject(MAT_DIALOG_DATA) public data: FeeRateDialogContent,
    private walletStateService: WalletStateService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.minimumFeeRate = this.data.minimumFeeRate
    this.form = this.formBuilder.group({
      txId: [this.data.txId],
      feeRate: [this.walletStateService.feeEstimate, Validators.compose([nonNegativeNumberValidator(), Validators.required])],
    })
  }

  getFormState() {
    const v = this.form.value
    return {
      txId: v.txId,
      feeRate: v.feeRate,
    }
  }

}

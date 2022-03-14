import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'


export interface DLCPayoutDialogContent {
  eventId: string
  outcome: string
  amount: number
  payoutAddress: string
  txId: string
  timestamp: string
  bettor: string
  message: string
}

@Component({
  selector: 'app-dlc-payload-dialog',
  templateUrl: './dlc-payload-dialog.component.html',
  styleUrls: ['./dlc-payload-dialog.component.scss']
})
export class DLCPayoutDialogComponent implements OnInit {

  form: FormGroup
  get f() { return this.form.controls }
  sendMax = false

  action = 'action.send'
  actionColor = 'primary'

  qrScanNoCamera = false
  qrScanEnabled = false

  constructor(@Inject(MAT_DIALOG_DATA) public data: DLCPayoutDialogContent, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      eventId: [this.data.eventId],
      outcome: [this.data.outcome],
      amount: [this.data.amount],
      payoutAddress: [this.data.payoutAddress],
      txId: [this.data.txId],
      timestamp: [this.data.timestamp],
      bettor: [this.data.bettor],
      message: [this.data.message],
    })
  }

  getFormState() {
    const v = this.form.value
    return { 
      eventId: v.eventId,
      outcome: v.outcome,
      amount: v.amount,
      payoutAddress: v.payoutAddress,
      txId: v.txId,
      timestamp: v.timestamp,
      bettor: v.bettor,
      message: v.message,
    }
  }

}

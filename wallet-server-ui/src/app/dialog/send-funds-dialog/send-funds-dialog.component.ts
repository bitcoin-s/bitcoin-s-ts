import { Component, OnInit } from '@angular/core'
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms'
import { Result } from '@zxing/library'

import { WalletStateService } from '~service/wallet-state-service'
import { networkToValidationNetwork, trimOnPaste } from '~util/utils'
import { bitcoinAddressValidator, conditionalValidator, nonNegativeNumberValidator } from '~util/validators'


@Component({
  selector: 'app-send-funds-dialog',
  templateUrl: './send-funds-dialog.component.html',
  styleUrls: ['./send-funds-dialog.component.scss']
})
export class SendFundsDialogComponent implements OnInit {

  public trimOnPaste = trimOnPaste

  form: UntypedFormGroup
  get f() { return this.form.controls }
  get address() { return this.form.get('address') }
  set addressValue(address: string) { this.form.patchValue({ address }) }

  sendMax = false

  action = 'action.send'
  actionColor = 'primary'

  qrScanNoCamera = false
  qrScanEnabled = false

  constructor(private walletStateService: WalletStateService, private formBuilder: UntypedFormBuilder) { }

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

  /** QR Code Scanning */

  scanQRCode() {
    console.debug('scanQRCode()')

    this.qrScanEnabled = !this.qrScanEnabled
  }

  camerasFoundHandler(devices: MediaDeviceInfo[]) {
    console.debug('camerasFoundHandler()', devices)

    if (!devices || devices.length === 0) {
      this.qrScanNoCamera = true
      this.qrScanEnabled = false
    }
  }

  camerasNotFoundHandler(event: any) {
    console.debug('camerasNotFoundHandler()', event)

    this.qrScanNoCamera = true
    this.qrScanEnabled = false
  }

  scanErrorHandler(event: Error) {
    console.debug('scanErrorHandler()', event)
  }

  scanCompleteHandler(result: Result) {
    console.debug('scanCompleteHandler()', result)
    if (result !== undefined) {
      this.qrScanEnabled = false
      const text = result.getText()
      this.form.patchValue({
        address: text,
      })
      this.address?.markAsDirty() // Trigger validation
    }
  }

}

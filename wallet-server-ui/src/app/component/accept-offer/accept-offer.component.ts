import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatRadioChange } from '@angular/material/radio'
import { ChartData, ChartOptions } from 'chart.js'
import * as FileSaver from 'file-saver'
import { TranslateService } from '@ngx-translate/core'
import { BaseChartDirective } from 'ng2-charts'
import { catchError } from 'rxjs/operators'
import { of } from 'rxjs'
import { Result } from '@zxing/library'

import { ChartService } from '~service/chart.service'
import { DarkModeService } from '~service/dark-mode.service'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'

import { EnumContractDescriptor, NumericContractDescriptor, WalletMessageType, DLCMessageType, NumericEventDescriptor } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'

import { copyToClipboard, formatDateTime, formatISODateTime, formatNumber, networkToValidationNetwork, TOR_V3_ADDRESS, trimOnPaste, validateTorAddress } from '~util/utils'
import { allowEmptybitcoinAddressValidator, regexValidator } from '~util/validators'
import { getMessageBody } from '~util/wallet-server-util'

import { AlertType } from '~component/alert/alert.component'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'


enum AcceptOfferType {
  TOR = 'tor',
  FILES = 'files'
}

@Component({
  selector: 'app-accept-offer',
  templateUrl: './accept-offer.component.html',
  styleUrls: ['./accept-offer.component.scss']
})
export class AcceptOfferComponent implements OnInit {

  public Object = Object
  public AcceptOfferType = AcceptOfferType
  public AlertType = AlertType
  public copyToClipboard = copyToClipboard
  public formatNumber = formatNumber
  public trimOnPaste = trimOnPaste

  @ViewChild(BaseChartDirective) chart: BaseChartDirective

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

  isEnum() {
    const cd = <EnumContractDescriptor>this.contractDescriptor
    return cd.outcomes !== undefined
  }

  isNumeric() {
    const cd = <NumericContractDescriptor>this.contractDescriptor
    return cd.numDigits !== undefined
  }

  get enumContractDescriptor() {
    return <EnumContractDescriptor>this.offer.offer.contractInfo.contractDescriptor
  }

  get numericContractDescriptor() {
    return <NumericContractDescriptor>this.offer.offer.contractInfo.contractDescriptor
  }

  get announcement() {
    return this.offer.offer.contractInfo.oracleInfo.announcement
  }

  get event() {
    return this.offer.offer.contractInfo.oracleInfo.announcement.event
  }


  // Optional
  private _message: string|null = null
  get message(): string|null { return this._message }
  @Input() set message(message: string|null) { this._message = message }

  // Optional
  private _peerAddress: string|null = null
  @Input() set peerAddress(peerAddress: string|null) { this._peerAddress = peerAddress }

  @Output() close: EventEmitter<void> = new EventEmitter()

  form: FormGroup
  get f() { return this.form.controls }
  get externalPayoutAddress() { return this.form.get('externalPayoutAddress') }
  set externalPayoutAddressValue(externalPayoutAddress: string) { this.form.patchValue({ externalPayoutAddress }) }
  set peerAddressValue(peerAddress: string) { this.form.patchValue({ peerAddress }) }
  set filenameValue(filename: string) { this.form.patchValue({ filename }) }

  maturityDate: string
  refundDate: string
  units: string

  chartData: ChartData<'scatter'>
  chartOptions: ChartOptions

  buildChart() {
    if (this.isNumeric()) {
      this.chartData = this.chartService.getChartData()
      
      this.chartOptions = this.chartService.getChartOptions(this.units)
      this.updateChartData()
    }
  }

  updateChartData() {
    if (this.isNumeric()) {
      const data = []
      for (const p of this.numericContractDescriptor.payoutFunction.points) {
        // Inverting payout values
        data.push({ x: p.outcome, y: this.contractInfo.totalCollateral - p.payout })
      }
      this.chartData.datasets[0].data = data
      if (this.chart) {
        this.chart.chart?.update()
      }
    }
  }

  acceptOfferTypes = [AcceptOfferType.TOR, AcceptOfferType.FILES]
  acceptOfferType = AcceptOfferType.TOR
  updateAcceptOfferType(event: MatRadioChange) {
    // console.debug('updateAcceptOfferType()', event)
    this.acceptOfferType = event.value
    this.wipeInvalidFormStates()
  }

  advancedVisible = false // Angular hack
  qrScanNoCamera = false
  qrScanEnabled = false

  executing = false
  offerAccepted = false
  result: string

  private defaultFilename: string

  private reset() {
    this.maturityDate = formatISODateTime(this.event.maturity)
    this.refundDate = formatDateTime(this.offer.offer.refundLocktime)
    if (this.isNumeric()) {
      this.units = (<NumericEventDescriptor>this.contractInfo.oracleInfo.announcement.event.descriptor).unit
    } else {
      this.units = ''
    }
    this.acceptOfferType = AcceptOfferType.TOR
    this.result = ''
    this.executing = false
    this.offerAccepted = false

    if (this.form) {
      this.form.patchValue({
        peerAddress: null,
        filename: this.defaultFilename,
        externalPayoutAddress: '',
      })
      this.form.markAsUntouched()
    }

    this.buildChart()
  }

  wipeInvalidFormStates() {
    console.debug('wipeInvalidFormStates()', this.acceptOfferType)

    if (this.acceptOfferType === AcceptOfferType.TOR) {
      this.f['filename'].setErrors(null)

      this.f['peerAddress'].updateValueAndValidity()
    } else if (this.acceptOfferType === AcceptOfferType.FILES) {
      this.f['peerAddress'].setErrors(null)

      this.f['filename'].updateValueAndValidity()
    }
  }

  constructor(private formBuilder: FormBuilder, private dialog: MatDialog,
    private messageService: MessageService, private walletStateService: WalletStateService,
    private translate: TranslateService, private chartService: ChartService, private darkModeService: DarkModeService) { }

  ngOnInit(): void {
    this.defaultFilename = this.translate.instant('acceptOffer.defaultFilename')
    this.form = this.formBuilder.group({
      // acceptOfferType: [this.acceptOfferType], // don't know how to conditionally validate with this here yet
      peerAddress: [this._peerAddress, regexValidator(TOR_V3_ADDRESS)],
      filename: [this.defaultFilename, Validators.required],
      externalPayoutAddress: ['',
        allowEmptybitcoinAddressValidator(networkToValidationNetwork(this.walletStateService.getNetwork() || undefined))],
    })
    this.darkModeService.darkModeChanged.subscribe(() => this.buildChart()) // this doesn't always seem to be necessary, but here to protect us

    // Hack to avoid showing expanded panel on first render. Issue with Angular
    setTimeout(() => {
      this.advancedVisible = true
    }, 0)
  }

  onClose() {
    this.close.next()
  }

  onExecute() {
    console.debug('onExecute()')

    const v = this.form.value
    let peerAddress
    if (v.peerAddress) {
      peerAddress = v.peerAddress.trim()
      const validAddress = validateTorAddress(peerAddress)
      if (!validAddress) {
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.error',
            content: this.translate.instant('acceptOffer.peerAddressInvalid'),
          }
        })
        return
      }
    }

    const payoutAddress = v.externalPayoutAddress ? v.externalPayoutAddress.trim() : null
    const changeAddress = null

    // TODO : Catch error on either of these and unset executing
    this.executing = true
    if (peerAddress) {
      console.debug('acceptdlc over Tor')

      this.messageService.sendMessage(getMessageBody(DLCMessageType.acceptdlc,
        [this.offer.hex, peerAddress, payoutAddress, changeAddress])).pipe(catchError(error => {
          // Popup error will come from messageService
          // Unlock the view so the user can edit and try again
          return of({ result: undefined }) // undefined is special case
        })).subscribe(r => {
          console.warn('acceptdlc', r)
          if (r.result) { 
            this.result = 'acceptOffer.tor.success'
            // this.walletStateService.refreshDLCStates() // using websocket now
            this.offerAccepted = true
          }
          this.executing = false
        })
    } else {
      console.debug('acceptdlcoffer to hex')

      // Needed to increase the proxy layer timeout. Moved to 45 seconds, may need more
      // The return from this call is too large and crashes the browser if assigned into this.result

      const filename = v.filename

      this.messageService.sendMessage(getMessageBody(WalletMessageType.acceptdlcoffer,
        [this.offer.hex, payoutAddress, changeAddress])).subscribe(r => {
          console.warn('acceptdlcoffer', r)
          if (r.result) { // result is very large
            this.result = 'acceptOffer.files.success'

            // Save to file
            const blob = new Blob([r.result], {type: "text/plain;charset=utf-8"});
            FileSaver.saveAs(blob, filename)

            // this.walletStateService.refreshDLCStates() // using websocket now
            this.executing = false
            this.offerAccepted = true
          }
        })
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
        externalPayoutAddress: text,
      })
      this.externalPayoutAddress?.markAsDirty() // Trigger validation
    }
  }

}

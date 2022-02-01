import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatRadioChange } from '@angular/material/radio'
import { ChartData, ChartOptions } from 'chart.js'
import { TranslateService } from '@ngx-translate/core'
import { BaseChartDirective } from 'ng2-charts'
import * as FileSaver from 'file-saver'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { EnumContractDescriptor, NumericContractDescriptor, WalletMessageType, DLCMessageType, NumericEventDescriptor } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'
import { copyToClipboard, formatDateTime, formatISODate, formatISODateTime, formatNumber, TOR_V3_ADDRESS, validateTorAddress } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'
import { AlertType } from '../alert/alert.component'


enum AcceptOfferType {
  TOR = 'tor',
  FILES = 'files'
}

/** Validators */

function addressValidator(regex: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // console.debug('addressValidator()', control)
    const allowed = regex.test(control.value)
    // console.debug('addressValidator() allowed:', allowed)
    return allowed ? null : { regexInvalid: { value: control.value }}
  }
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

  @Output() close: EventEmitter<void> = new EventEmitter()

  form: FormGroup
  get f() { return this.form.controls }

  maturityDate: string
  refundDate: string

  chartData: ChartData<'scatter'> = {
    datasets: [{
      data: [],
      label: this.translate.instant('newOffer.payout'),
      // Purple
      backgroundColor: 'rgb(125,79,194)',
      borderColor: 'rgb(125,79,194)',
      // Suredbits blue offset
      pointHoverBackgroundColor: 'rgb(131,147,156)',
      pointHoverBorderColor: 'rgb(131,147,156)',
      pointHoverRadius: 8,
      fill: false,
      tension: 0,
      showLine: true,
    }]
  }
  chartOptions: ChartOptions = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          // text will fill programmatically
        }
      },
      y: {
        title: {
          display: true,
          text: this.translate.instant('unit.satoshis'),
        }
      }
    }
  }
  updateChartData() {
    const data = []
    for (const p of this.numericContractDescriptor.payoutFunction.points) {
      // Inverting payout values
      data.push({ x: p.outcome, y: this.contractInfo.totalCollateral - p.payout })
    }
    this.chartData.datasets[0].data = data
    const unit = (<NumericEventDescriptor>this.contractInfo.oracleInfo.announcement.event.descriptor).unit
    if (unit) {
      (<any>this.chartOptions.scales).x.title.text = unit
    }
  }

  acceptOfferTypes = [AcceptOfferType.TOR, AcceptOfferType.FILES]
  acceptOfferType = AcceptOfferType.TOR
  updateAcceptOfferType(event: MatRadioChange) {
    // console.debug('updateAcceptOfferType()', event)
    this.acceptOfferType = event.value
    this.wipeInvalidFormStates()
  }

  executing = false
  offerAccepted = false
  result: string

  private defaultFilename: string

  private reset() {
    this.maturityDate = formatISODateTime(this.event.maturity)
    this.refundDate = formatDateTime(this.offer.offer.refundLocktime)
    this.acceptOfferType = AcceptOfferType.TOR
    this.result = ''
    this.executing = false
    this.offerAccepted = false

    if (this.form) {
      this.form.patchValue({
        peerAddress: null,
        filename: this.defaultFilename
      })
      this.form.markAsUntouched()
    }

    if (this.numericContractDescriptor) {
      this.updateChartData()
    }
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

  constructor(private messageService: MessageService, private walletStateService: WalletStateService,
    private translate: TranslateService,
    private formBuilder: FormBuilder, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.defaultFilename = this.translate.instant('acceptOffer.defaultFilename')
    this.form = this.formBuilder.group({
      // acceptOfferType: [this.acceptOfferType], // don't know how to conditionally validate with this here yet
      peerAddress: [null, addressValidator(TOR_V3_ADDRESS)],
        // [conditionalValidator(torV3AddressValidator(TOR_V3_ADDRESS), Validators.required)]],
      filename: [this.defaultFilename, Validators.required],
  })
}

  onClose() {
    this.close.next()
  }

  isEnum() {
    const cd = <EnumContractDescriptor>this.contractDescriptor
    return cd.outcomes !== undefined
  }

  isNumeric() {
    const cd = <NumericContractDescriptor>this.contractDescriptor
    return cd.numDigits !== undefined
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

    // TODO : Catch error on either of these and unset executing
    this.executing = true
    if (peerAddress) {
      console.debug('acceptdlc over Tor')
      this.messageService.sendMessage(getMessageBody(DLCMessageType.acceptdlc,
        [this.offer.hex, peerAddress])).subscribe(r => {
          console.warn('acceptdlcoffer', r)
          // if (r.result) { // Empty response right now
            this.result = 'acceptOffer.tor.success'
            // this.walletStateService.refreshDLCStates() // using websocket now
            this.executing = false
            this.offerAccepted = true
          // }
        })
    } else {
      console.debug('acceptdlcoffer to hex')

      // Needed to increase the proxy layer timeout. Moved to 45 seconds, may need more
      // The return from this call is too large and crashes the browser if assigned into this.result

      const filename = v.filename

      this.messageService.sendMessage(getMessageBody(WalletMessageType.acceptdlcoffer,
        [this.offer.hex])).subscribe(r => {
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

}

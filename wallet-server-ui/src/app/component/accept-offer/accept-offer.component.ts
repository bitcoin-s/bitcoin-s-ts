import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatRadioChange } from '@angular/material/radio'
import { TranslateService } from '@ngx-translate/core'
import * as FileSaver from 'file-saver'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { EnumContractDescriptor, NumericContractDescriptor, WalletMessageType, DLCMessageType } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'
import { copyToClipboard, formatDateTime, formatISODate, formatNumber, TOR_V3_ADDRESS, validateTorAddress } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'


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
  public copyToClipboard = copyToClipboard
  public formatNumber = formatNumber

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
    this.maturityDate = formatISODate(this.event.maturity)
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
            // TODO : This should probably be an Alert instead
            this.result = this.translate.instant('acceptOffer.tor.success')
            this.walletStateService.refreshDLCStates()
            this.executing = false
            this.offerAccepted = true
          // }
        })
    } else {
      console.debug('acceptdlcoffer to hex')

      // const dialog = this.dialog.open(ErrorDialogComponent, {
      //   data: {
      //     title: 'dialog.error',
      //     content: 'Accepting DLCs without using Tor is not currently enabled',
      //   }
      // })
      // return

      // Needed to increase the proxy layer timeout. Moved to 45 seconds, may need more
      // The return from this call is too large and crashes the browser if assigned into this.result

      const filename = this.defaultFilename

      this.messageService.sendMessage(getMessageBody(WalletMessageType.acceptdlcoffer,
        [this.offer.hex])).subscribe(r => {
          console.warn('acceptdlcoffer', r)
          if (r.result) { // result is very large
            // TODO : This should probably be an Alert instead
            this.result = this.translate.instant('acceptOffer.files.success')

            // Save to file
            const blob = new Blob([r.result], {type: "text/plain;charset=utf-8"});
            FileSaver.saveAs(blob, filename)

            // Crashing sometime after this, not sure why...
            this.walletStateService.refreshDLCStates()
            this.executing = false
            this.offerAccepted = true
          }
        })
    }
  }

}

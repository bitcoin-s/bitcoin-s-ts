import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ChartData, ChartDataset, ChartOptions } from 'chart.js'
import * as FileSaver from 'file-saver'
import { TranslateService } from '@ngx-translate/core'
import { BaseChartDirective } from 'ng2-charts'
import { of } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { ChartService } from '~service/chart.service'
import { DarkModeService } from '~service/dark-mode.service'
import { DLCService } from '~service/dlc-service'
import { MessageService } from '~service/message.service'
import { OfferService } from '~service/offer-service'
import { WalletStateService } from '~service/wallet-state-service'

import { Attestment, ContractInfo, CoreMessageType, DLCContract, DLCState, EnumContractDescriptor, NumericContractDescriptor, NumericEventDescriptor, WalletMessageType } from '~type/wallet-server-types'
import { AcceptWithHex, SignWithHex } from '~type/wallet-ui-types'

import { copyToClipboard, formatDateTime, formatNumber, formatPercent, isCancelable, isExecutable, isFundingTxRebroadcastable, isRefundable, outcomeDigitsToNumber, outcomeDigitsToRange, TOR_V3_ADDRESS, trimOnPaste, validateHexString } from '~util/utils'
import { regexValidator } from '~util/validators'
import { getMessageBody } from '~util/wallet-server-util'

import { AlertType } from '~component/alert/alert.component'
import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'
import { FeeRateDialogComponent } from '~app/dialog/fee-rate-dialog/fee-rate-dialog.component'


@Component({
  selector: 'app-contract-detail',
  templateUrl: './contract-detail.component.html',
  styleUrls: ['./contract-detail.component.scss']
})
export class ContractDetailComponent implements OnInit {

  public Object = Object
  public AlertType = AlertType
  public DLCState = DLCState
  public copyToClipboard = copyToClipboard
  public formatNumber = formatNumber
  public formatPercent = formatPercent
  public isCancelable = isCancelable
  public isRefundable = isRefundable
  public isExecutable = isExecutable
  public isFundingTxRebroadcastable = isFundingTxRebroadcastable
  public trimOnPaste = trimOnPaste

  @ViewChild(BaseChartDirective) chart: BaseChartDirective

  _dlc!: DLCContract
  get dlc(): DLCContract { return this._dlc }
  @Input() set dlc(e: DLCContract) { 
    this._dlc = e
    this.reset()
  }

  _contractInfo!: ContractInfo
  get contractInfo(): ContractInfo { return this._contractInfo }
  @Input() set contractInfo(e: ContractInfo) {
    this._contractInfo = e
    this.setUnits()
  }

  isEnum() {
    const cd = <EnumContractDescriptor>this.contractInfo.contractDescriptor
    return cd.outcomes !== undefined
  }

  isNumeric() {
    const cd = <NumericContractDescriptor>this.contractInfo.contractDescriptor
    return cd.numDigits !== undefined
  }

  getEnumContractDescriptor() {
    return <EnumContractDescriptor>this.contractInfo.contractDescriptor
  }

  getNumericContractDescriptor() {
    return <NumericContractDescriptor>this.contractInfo.contractDescriptor
  }

  getContractDescriptor() {
    if (this.isEnum())
      return <EnumContractDescriptor>this.contractInfo.contractDescriptor
    else // if (this.isNumeric())
      return <NumericContractDescriptor>this.contractInfo.contractDescriptor
  }

  private setUnits() {
    if (this.isNumeric()) {
      this.units = (<NumericEventDescriptor>this.contractInfo.oracleInfo.announcement.event.descriptor).unit
    } else {
      this.units = ''
    }
  }

  private setOutcome() {
    let outcome = ''
    if (this.contractInfo && this.dlc.outcomes) {
      if (this.isEnum()) {
        outcome = <string>this.dlc.outcomes
      } else { // this.isNumeric()
        if (this.dlc.outcomes.length > 0 && Array.isArray(this.dlc.outcomes[0])) {
          const outcomes = <number[]>[...this.dlc.outcomes[0]] // make a copy
          const numDigits = this.getNumericContractDescriptor().numDigits
          // console.debug('outcomes:', outcomes, 'numDigits:', numDigits)
          // Exact outcome case
          if (outcomes.length === numDigits) {
            const numericOutcome = outcomeDigitsToNumber(outcomes)
            outcome = formatNumber(numericOutcome).toString()
            this.outcomePoint = { x: numericOutcome, y: this.dlc.myPayout }
          } else { // Range case
            const range = outcomeDigitsToRange(outcomes, numDigits)
            if (range) {
              outcome = formatNumber(range.low) + ' - ' + formatNumber(range.high)
              // Place point at midpoint of range and label with full range
              const x = (range.high - range.low) / 2 + range.low
              this.outcomePoint = { x: x, y: this.dlc.myPayout, range: outcome }
            }
          }
        }
      }
    }
    console.debug('setOutcome()', outcome)
    this.outcome = outcome
  }

  // Optional
  _accept: AcceptWithHex|null = null
  get accept(): AcceptWithHex|null { return this._accept }
  @Input() set accept(a: AcceptWithHex|null) { this._accept = a }

  // Optional
  _sign: SignWithHex|null = null
  get sign(): SignWithHex|null { return this._sign }
  @Input() set sign(s: SignWithHex|null) { this._sign = s }

  @Output() close: EventEmitter<void> = new EventEmitter()

  contractMaturity: string
  contractTimeout: string
  units: string
  oracleAttestations: string // OracleAttestmentTLV

  offerHex: string

  outcome: string
  outcomePoint: any

  chartData: ChartData<'scatter'>
  chartOptions: ChartOptions
  chartDataOutcome: ChartDataset

  buildChart() {
    if (this.isNumeric()) {
      this.chartData = this.chartService.getChartData()
      const unit = (<NumericEventDescriptor>this.contractInfo.oracleInfo.announcement.event.descriptor).unit
      this.chartOptions = this.chartService.getChartOptions(unit)
      this.updateChartData()
    }
  }

  updateChartData() {
    const data = []
    for (const p of this.getNumericContractDescriptor().payoutFunction.points) {
      if (this.dlc.isInitiator) {
        data.push({ x: p.outcome, y: p.payout })
      } else {
        data.push({ x: p.outcome, y: this.dlc.totalCollateral - p.payout })
      }
    }
    this.chartData.datasets[0].data = data
    if (this.outcomePoint) {
      this.chartDataOutcome = this.chartService.getOutcomeChartDataset()
      this.chartDataOutcome.data = [this.outcomePoint]
      this.chartData.datasets.push(this.chartDataOutcome)
    }
    if (this.chart) {
      this.chart.chart?.update()
    }
  }

  private reset() {
    if (this.dlc) {
      this.contractMaturity = formatDateTime(this.dlc.contractMaturity)
      this.contractTimeout = formatDateTime(this.dlc.contractTimeout)
      this.oracleAttestations = this.dlc.oracleSigs?.toString() || ''
    } else {
      this.contractMaturity = ''
      this.contractTimeout = ''
      this.oracleAttestations = ''
      this.offerHex = ''
    }
    this.outcome = ''
    if (this.offerForm) {
      this.offerForm.patchValue({
        message: '',
        peerAddress: '',
      })
    }
  }

  // For Completing DLC Contracts

  form: FormGroup
  get f() { return this.form.controls }

  offerForm: FormGroup
  get tf() { return this.offerForm.controls }
  get messageValue() { return this.offerForm.get('message')?.value }
  set messageValue(message: string) { this.offerForm.patchValue({ message }) }
  set peerAddressValue(peerAddress: string) { this.offerForm.patchValue({ peerAddress }) }

  private defaultFilename: string

  executing = false
  rebroadcasting = false
  attesting = false
  offerSent = false
  acceptSigned = false
  signBroadcast = false

  constructor(private translate: TranslateService, private snackBar: MatSnackBar,
    private messsageService: MessageService, private walletStateService: WalletStateService,
    private dlcService: DLCService, private offerService: OfferService,
    private dialog: MatDialog, private formBuilder: FormBuilder, private messageService: MessageService,
    private chartService: ChartService, private darkModeService: DarkModeService) { }

  ngOnInit(): void {
    this.defaultFilename = this.translate.instant('contractDetail.defaultSignFilename')
    this.form = this.formBuilder.group({
      filename: [this.defaultFilename, Validators.required],
    })
    this.offerForm = this.formBuilder.group({
      message: [''],
      peerAddress: ['', [Validators.required, regexValidator(TOR_V3_ADDRESS)]],
    })
    this.setOutcome()
    this.buildChart()
    this.darkModeService.darkModeChanged.subscribe(() => this.buildChart()) // this doesn't always seem to be necessary, but here to protect us
  }

  onClose() {
    this.close.next()
  }

  showTransactionIds() {
    return !([DLCState.offered,DLCState.accepting,DLCState.accepted].includes(this.dlc.state))
  }

  onCancelContract() {
    console.debug('onCancelContract()', this.dlc.dlcId)

    // TODO : Cancel confirmation dialog?
    const dlcId = this.dlc.dlcId

    this.executing = true
    this.messsageService.sendMessage(getMessageBody(WalletMessageType.canceldlc, [dlcId])).subscribe(r => {
      if (r.result) { // "Success"
        // TODO : Confirmation dialog?
        const config: any = { verticalPosition: 'top', duration: 3000 }
        this.snackBar.open(this.translate.instant('contractDetail.cancelContractSuccess'),
          this.translate.instant('action.dismiss'), config)
        this.dlcService.removeDLC(dlcId) // DLCState change does not come through Websocket yet
        this.close.next()
      }
      this.executing = false
    })
  }

  onOracleAttestations() {
    console.debug('onOracleAttestations()', this.oracleAttestations)
    const attestations = this.oracleAttestations

    // Validate oracleSignature as hex
    const isValidHex = validateHexString(attestations)
    if (!isValidHex) {
      console.error('oracleAttestations is not valid hex')
      const dialog = this.dialog.open(ErrorDialogComponent, {
        data: {
          title: 'dialog.oracleAttestationsInvalid.title',
          content: 'dialog.oracleAttestationsInvalid.content',
        }
      })
      return
    }

    console.debug('oracleAttestations:', attestations)

    this.executing = true
    this.attesting = true
    this.messsageService.sendMessage(getMessageBody(CoreMessageType.decodeattestments, [attestations])).subscribe(r => {
      console.debug('decodeattestments', r)

      if (r.result) {
        const attestment: Attestment = r.result
        console.debug('attestment:', attestment)

        const sigs = [attestations] // attestment.signatures
        const contractId = this.dlc.contractId
        const noBroadcast = false // Could allow changing

        // console.warn('attestations:', attestations, 'attestment.signatures:', attestment.signatures)

        this.messsageService.sendMessage(getMessageBody(WalletMessageType.executedlc, 
          [contractId, sigs, noBroadcast])).subscribe(r => {
          console.debug('executedlc', r)
  
          if (r.result) { // closingTxId
            const txId = r.result
            const eventId = this.contractInfo.oracleInfo.announcement.event.eventId
            // this.refreshDLCState() // No longer necessary with Websockets
            const dialog = this.dialog.open(ConfirmationDialogComponent, {
              data: {
                title: 'dialog.oracleAttestationSuccess.title',
                content: 'dialog.oracleAttestationSuccess.content',
                params: { txId, eventId },
                linksContent: 'dialog.oracleAttestationSuccess.linksContent',
                links: [this.walletStateService.mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
                action: 'action.close',
                showCancelButton: false,
              }
            })
            // We receive a state transition to Claimed async on the websocket, can now show outcome
            this.setOutcome()
            this.buildChart()
          }
          this.executing = false
          this.attesting = false
        })
      }
    })
  }

  // Refresh the state of the visible DLC in the wallet and refresh object bound in this view
  private refreshDLCState() {
    this.dlcService.refreshDLC(this.dlc.dlcId).subscribe(r => {
      console.debug('dlc:', r)
      if (r.result) {
        this.dlc = <DLCContract>r.result
      }
    })
  }

  // onReloadContract() {
  //   console.debug('onReloadContract()')
  //   this.refreshDLCState()
  // }

  onRefund() {
    console.debug('onRefund()')

    const contractId = this.dlc.contractId
    const noBroadcast = false

    this.executing = true
    this.messsageService.sendMessage(getMessageBody(WalletMessageType.executedlcrefund, [contractId, noBroadcast]))
    .pipe(catchError(error => of({ result: null }))).subscribe(r => {
      if (r.result) {
        const txId = r.result
        this.refreshDLCState() // DLCState change does not come through Websocket yet
        const dialog = this.dialog.open(ConfirmationDialogComponent, {
          data: {
            title: 'dialog.cancelContractSuccess.title',
            content: 'dialog.cancelContractSuccess.content',
            params: { contractId, txId },
            linksContent: 'dialog.cancelContractSuccess.linksContent',
            links: [this.walletStateService.mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
            action: 'action.close',
            showCancelButton: false,
          }
        })
      }
      this.executing = false
    })
  }

  onRebroadcastFundingTransaction() {
    console.debug('onRebroadcastFundingTransaction()')

    const contractId = this.dlc.contractId
    const txId = <string>this.dlc.fundingTxId
    const eventId = this.contractInfo.oracleInfo.announcement.event.eventId

    this.executing = true
    this.rebroadcasting = true
    this.messsageService.sendMessage(getMessageBody(WalletMessageType.broadcastdlcfundingtx, [contractId])).subscribe(r => {
      if (r.result) {
        const dialog = this.dialog.open(ConfirmationDialogComponent, {
          data: {
            title: 'dialog.rebroadcastSuccess.title',
            content: 'dialog.rebroadcastSuccess.content',
            params: { txId, eventId },
            linksContent: "dialog.rebroadcastSuccess.linksContent",
            links: [this.walletStateService.mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
            action: 'action.close',
            showCancelButton: false,
          }
        })
      }
      this.executing = false
      this.rebroadcasting = false
    })
  }

  onBumpFundingFee() {
    console.debug('onBumpFee()')

    const txId = this.dlc.fundingTxId

    const dialog = this.dialog.open(FeeRateDialogComponent, {
      data: {
        txId,
        minimumFeeRate: this.dlc.feeRate,
      }
    }).afterClosed().subscribe(result => {
      console.debug('FeeRateDialogComponent', result)
      if (result) {
        const feeRate = result.feeRate // sats / vbyte

        this.executing = true
        this.messsageService.sendMessage(getMessageBody(WalletMessageType.bumpfeecpfp,
          [txId, feeRate])).pipe(catchError(error => of({ result: null }))).subscribe(r => {
            console.debug('bumpfeecpfp', r)
            if (r.result) {
              this.refreshDLCState()
            }
            this.executing = false
          })
      }
    })
  }

  onRebroadcastClosingTransaction() {
    console.debug('onRebroadcastClosingTransaction()')

    const txId = this.dlc.closingTxId
    const eventId = this.contractInfo.oracleInfo.announcement.event.eventId

    if (txId) {
      this.executing = true
      this.rebroadcasting = true
      this.messsageService.sendMessage(getMessageBody(WalletMessageType.gettransaction, [txId])).subscribe(r => {
        if (r.result) {
          const rawTransactionHex = r.result

          this.messsageService.sendMessage(getMessageBody(WalletMessageType.sendrawtransaction, [rawTransactionHex])).subscribe(r => {
            if (r.result) {
              const dialog = this.dialog.open(ConfirmationDialogComponent, {
                data: {
                  title: 'dialog.rebroadcastSuccess.title',
                  content: 'dialog.rebroadcastSuccess.content',
                  params: { txId, eventId },
                  linksContent: "dialog.rebroadcastSuccess.linksContent",
                  links: [this.walletStateService.mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
                  action: 'action.close',
                  showCancelButton: false,
                }
              })
            }
            this.executing = false
            this.rebroadcasting = false
          })
        }
      })
    }
  }

  onViewOnOracleExplorer() {
    console.debug('onViewOnOracleExplorer()')

    // DLCTableViewScala:161
    // val dlc = selectionModel.value.getSelectedItem
    // val primaryOracle =
    //   dlc.oracleInfo.singleOracleInfos.head.announcement
    // val url =
    //   GUIUtil.getAnnouncementUrl(GlobalData.network, primaryOracle)
    // GUIUtil.openUrl(url)
    
    //   def getAnnouncementUrl(
    //     network: BitcoinNetwork,
    //     primaryOracle: OracleAnnouncementTLV): String = {
    //   val baseUrl =
    //     ExplorerEnv.fromBitcoinNetwork(network).siteUrl
    //   s"${baseUrl}announcement/${primaryOracle.sha256.hex}"
    // }

    // dlc.oracleInfo.singleOracleInfos[0] does not exist, sha256.hex does not exist on what is there
  }

  getOutcomeValue(outcomeValue: number) {
    if (this.dlc.isInitiator) {
      return outcomeValue
    } else {
      return this.dlc.totalCollateral - outcomeValue
    }
  }

  // Offer

  getOfferHex() {
    console.debug('getOfferHex()')

    this.executing = true
    this.messageService.sendMessage(getMessageBody(WalletMessageType.getdlcoffer, [this.dlc.temporaryContractId])).subscribe(r => {
      console.debug(' getdlcoffer', r)
      if (r.result) {
        this.offerHex = r.result
      }
      this.executing = false
    })
  }

  // Send Offer

  onMessagePaste(event: ClipboardEvent) {
    // Only trimOnPaste() if there is no value in the field already
    if (!this.messageValue) this.messageValue = trimOnPaste(event)
  }

  onSendOffer() {
    console.debug('onSendOffer()')

    const v = this.offerForm.value

    this.executing = true
    this.offerService.sendIncomingOffer(this.dlc.temporaryContractId, v.peerAddress, v.message)
    .pipe(catchError(error => of({ result: null }))).subscribe(r => {
      console.warn(' sendIncomingOffer', r)
      if (r.result) {
        this.offerSent = true
      }
      this.executing = false
    })
  }

  // Sign Accepted

  onSign() {
    console.debug('onSign()')

    if (this.accept) {
      const v = this.form.value
      const acceptedDLC = this.accept.hex
      const filename = v.filename

      this.executing = true
      this.messageService.sendMessage(getMessageBody(WalletMessageType.signdlc, [acceptedDLC])).subscribe(r => {
        console.debug('signdlc', r)

        if (r.result) {
          // Save to file
          const blob = new Blob([r.result], {type: "text/plain;charset=utf-8"});
          FileSaver.saveAs(blob, filename)

          this.executing = false
          this.acceptSigned = true

          this.refreshDLCState()
        }
      })
    }
  }

  // Countersign Signed and broadcast

  onBroadcast() {
    console.debug('onBroadcast()')

    if (this.sign) {
      const signedDLC = this.sign.hex

      this.executing = true
      this.messageService.sendMessage(getMessageBody(WalletMessageType.adddlcsigsandbroadcast, [signedDLC])).subscribe(r => {
        console.debug('adddlcsigsandbroadcast', r)

        if (r.result) {
          // Now done on websocket dlcstatechange
          // const txId = r.result
          // const dialog = this.dialog.open(ConfirmationDialogComponent, {
          //   data: {
          //     title: 'dialog.broadcastSuccess.title',
          //     content: 'dialog.broadcastSuccess.content',
          //     params: { txId },
          //     linksContent: "dialog.broadcastSuccess.linksContent",
          //     links: [this.walletStateService.mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
          //     action: 'action.close',
          //     showCancelButton: false,
          //   }
          // })

          this.signBroadcast = true

          this.refreshDLCState()
        }
        this.executing = false
      })
    }
  }
}

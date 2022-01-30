import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import * as FileSaver from 'file-saver'
import { TranslateService } from '@ngx-translate/core'
import { BaseChartDirective } from 'ng2-charts'
import { of } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { AlertType } from '~component/alert/alert.component'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { Attestment, ContractDescriptor, ContractInfo, CoreMessageType, DLCContract, DLCMessageType, DLCState, EnumContractDescriptor, NumericContractDescriptor, WalletMessageType } from '~type/wallet-server-types'
import { AcceptWithHex, SignWithHex } from '~type/wallet-ui-types'
import { copyToClipboard, formatDateTime, formatISODate, formatNumber, formatPercent, isCancelable, isExecutable, isFundingTxRebroadcastable, isRefundable, outcomeDigitsToNumber, validateHexString } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'
import { ChartData, ChartOptions } from 'chart.js'


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
    this.setOutcome(e)
    this.updateChartData()
  }

  private setOutcome(contractInfo: ContractInfo) {
    let outcome = ''
    if (contractInfo && this.dlc.outcomes) {
      if ((<EnumContractDescriptor>contractInfo.contractDescriptor).outcomes !== undefined) { // this.isEnum()
        outcome = <string>this.dlc.outcomes
      } else { // this.isNumeric()
        if (this.dlc.outcomes.length > 0 && this.dlc.outcomes[0]) {
          const digits = <number[]>this.dlc.outcomes[0]
          const numericOutcome = outcomeDigitsToNumber(digits)
          outcome = numericOutcome.toString()
          this.outcomePoint = { x: numericOutcome, y: this.dlc.myPayout }
        }
      }
    }
    console.debug('getOutcome()', outcome)
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

  @Output() close: EventEmitter<void> = new EventEmitter()

  oracleAttestations: string // OracleAttestmentTLV
  contractMaturity: string
  contractTimeout: string
  outcome: string
  outcomePoint: any

  chartData: ChartData<'scatter'> = {
    datasets: [{
      data: [],
      label: 'Payout',
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
    }, ]
  }
  chartOptions: ChartOptions = {
    responsive: true
  }
  chartDataOutcome: any = {
    data: [],
    label: 'Outcome',
    // Suredbits Orange
    backgroundColor: 'rgb(236,73,58)',
    borderColor: 'rgb(236,73,58)',
    // Suredbits Orange offset
    pointHoverBackgroundColor: 'rgb(244,154,140)',
    pointHoverBorderColor: 'rgb(244,154,140)',
    fill: false,
    tension: 0,
    showLine: false,
    pointRadius: 5,
    pointHoverRadius: 8,
  }
  updateChartData() {
    if (this.isNumeric()) {
      const data = []
      for (const p of this.getNumericContractDescriptor().payoutFunction.points) {
        if (this.dlc.isInitiator) {
          data.push({ x: p.outcome, y: p.payout })
        } else {
          data.push({ x: p.outcome, y: this.dlc.totalCollateral - p.payout })
        }
      }
      this.chartData.datasets[0].data = data
      // TODO : Label the outcome differently
      if (this.outcomePoint) {
        this.chartDataOutcome.data = [this.outcomePoint]
        this.chartData.datasets[1] = this.chartDataOutcome
      }
      if (this.chart) {
        this.chart.chart?.update()
      }
    }
  }

  private reset() {
    if (this.dlc) {
      this.contractMaturity = formatDateTime(this.dlc.contractMaturity)
      this.contractTimeout = formatDateTime(this.dlc.contractTimeout)
      this.oracleAttestations = this.dlc.oracleSigs?.toString() || ''
    } else {
      this.oracleAttestations = ''
      this.contractTimeout = ''
    }
    this.outcome = ''
  }

  // For Completing DLC Contracts

  form: FormGroup
  get f() { return this.form.controls }

  private defaultFilename: string

  executing = false
  acceptSigned = false
  signBroadcast = false

  constructor(private translate: TranslateService, private snackBar: MatSnackBar,
    private messsageService: MessageService, private walletStateService: WalletStateService, 
    private dialog: MatDialog, private formBuilder: FormBuilder, private messageService: MessageService) { }

  ngOnInit(): void {
    this.defaultFilename = this.translate.instant('contractDetail.defaultSignFilename')
    this.form = this.formBuilder.group({
      filename: [this.defaultFilename, Validators.required],
    })
  }

  onClose() {
    this.close.next()
  }

  isEnum() {
    const cd = <EnumContractDescriptor><unknown>this.contractInfo.contractDescriptor
    return cd.outcomes !== undefined
  }

  isNumeric() {
    const cd = <NumericContractDescriptor><unknown>this.contractInfo.contractDescriptor
    return cd.numDigits !== undefined
  }

  showTransactionIds() {
    return !([DLCState.offered,DLCState.accepted].includes(this.dlc.state))
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
        this.walletStateService.removeDLC(dlcId) // DLCState change does not come through Websocket yet
        this.close.next()
      }
      this.executing = false
    })
  }

  onAttestationsPaste(event: ClipboardEvent) {
    console.debug('onAttestationsPaste()', event)
    const clipboardData = event.clipboardData
    if (clipboardData) {
      const trimmedPastedText = clipboardData.getData('text').trim()
      this.oracleAttestations = trimmedPastedText
    }
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
            // this.refreshDLCState() // No longer necessary with Websockets
            const dialog = this.dialog.open(ConfirmationDialogComponent, {
              data: {
                title: 'dialog.oracleAttestationSuccess.title',
                content: 'dialog.oracleAttestationSuccess.content',
                params: { txId },
                linksContent: 'dialog.oracleAttestationSuccess.linksContent',
                links: [this.walletStateService.mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
                action: 'action.close',
                showCancelButton: false,
              }
            })
          }
          this.executing = false
        })
      }
    })
  }

  // Refresh the state of the visible DLC in the wallet and refresh object bound in this view
  private refreshDLCState() {
    this.walletStateService.refreshDLC(this.dlc.dlcId).subscribe(r => {
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

    this.executing = true
    this.messsageService.sendMessage(getMessageBody(WalletMessageType.broadcastdlcfundingtx, [contractId])).subscribe(r => {
      if (r.result) {
        const dialog = this.dialog.open(ConfirmationDialogComponent, {
          data: {
            title: 'dialog.rebroadcastSuccess.title',
            content: 'dialog.rebroadcastSuccess.content',
            params: { txId },
            linksContent: "dialog.rebroadcastSuccess.linksContent",
            links: [this.walletStateService.mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
            action: 'action.close',
            showCancelButton: false,
          }
        })
      }
      this.executing = false
    })
  }

  onRebroadcastClosingTransaction() {
    console.debug('onRebroadcastClosingTransaction()')

    const txId = this.dlc.closingTxId

    if (txId) {
      this.executing = true
      this.messsageService.sendMessage(getMessageBody(WalletMessageType.gettransaction, [txId])).subscribe(r => {
        if (r.result) {
          const rawTransactionHex = r.result

          this.messsageService.sendMessage(getMessageBody(WalletMessageType.sendrawtransaction, [rawTransactionHex])).subscribe(r => {
            if (r.result) {
              const dialog = this.dialog.open(ConfirmationDialogComponent, {
                data: {
                  title: 'dialog.rebroadcastSuccess.title',
                  content: 'dialog.rebroadcastSuccess.content',
                  params: { txId },
                  linksContent: "dialog.rebroadcastSuccess.linksContent",
                  links: [this.walletStateService.mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
                  action: 'action.close',
                  showCancelButton: false,
                }
              })
            }
            this.executing = false
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
          const txId = r.result
          const dialog = this.dialog.open(ConfirmationDialogComponent, {
            data: {
              title: 'dialog.broadcastSuccess.title',
              content: 'dialog.broadcastSuccess.content',
              params: { txId },
              linksContent: "dialog.broadcastSuccess.linksContent",
              links: [this.walletStateService.mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
              action: 'action.close',
              showCancelButton: false,
            }
          })

          this.signBroadcast = true

          this.refreshDLCState()
        }
        this.executing = false
      })
    }
  }
}

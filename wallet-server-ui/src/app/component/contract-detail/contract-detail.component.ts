import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { TranslateService } from '@ngx-translate/core'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { AlertType } from '~component/alert/alert.component'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { Attestment, ContractInfo, CoreMessageType, DLCContract, DLCMessageType, DLCState, EnumContractDescriptor, NumericContractDescriptor, WalletMessageType } from '~type/wallet-server-types'
import { copyToClipboard, formatDateTime, formatISODate, formatPercent, isCancelable, isExecutable, isFundingTxRebroadcastable, isRefundable, validateHexString } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-contract-detail',
  templateUrl: './contract-detail.component.html',
  styleUrls: ['./contract-detail.component.scss']
})
export class ContractDetailComponent implements OnInit {

  public Object = Object

  public AlertType = AlertType
  public DLCState = DLCState

  public formatPercent = formatPercent
  public isCancelable = isCancelable
  public isRefundable = isRefundable
  public isExecutable = isExecutable
  public isFundingTxRebroadcastable = isFundingTxRebroadcastable

  _dlc!: DLCContract
  get dlc(): DLCContract { return this._dlc }
  @Input() set dlc(e: DLCContract) { this._dlc = e; this.reset() }

  _contractInfo!: ContractInfo
  get contractInfo(): ContractInfo { return this._contractInfo }
  @Input() set contractInfo(e: ContractInfo) { this._contractInfo = e }

  getEnumContractDescriptor() {
    return <EnumContractDescriptor>this.contractInfo.contractDescriptor
  }

  getContractDescriptor() {
    if (this.isEnum())
      return <EnumContractDescriptor>this.contractInfo.contractDescriptor
    else // if (this.isNumeric())
      return <NumericContractDescriptor>this.contractInfo.contractDescriptor
  }

  @Output() close: EventEmitter<void> = new EventEmitter()

  // showDeleteSuccess = false

  oracleSignature: string = ''
  contractTimeout: string = ''

  private reset() {
    if (this.dlc) {
      this.contractTimeout = formatDateTime(this.dlc.contractTimeout)
      this.oracleSignature = this.dlc.oracleSigs?.toString() || ''
    } else {
      this.oracleSignature = ''
      this.contractTimeout = ''
    }
  }

  constructor(private translate: TranslateService, private snackBar: MatSnackBar,
    private messsageService: MessageService, private walletStateService: WalletStateService, private dialog: MatDialog) { }

  ngOnInit(): void {
    
  }

  isEnum() {
    const cd = <EnumContractDescriptor><unknown>this.contractInfo.contractDescriptor
    return cd.outcomes !== undefined
  }

  isNumeric() {
    const cd = <NumericContractDescriptor><unknown>this.contractInfo.contractDescriptor
    return cd.numDigits !== undefined
  }

  onCopyContractId() {
    console.debug('onCopyContractId()', this.dlc.contractId)
    if (this.dlc.contractId)
      copyToClipboard(this.dlc.contractId)
  }

  onCancelContract() {
    console.debug('onCancelContract()', this.dlc.dlcId)
    this.messsageService.sendMessage(getMessageBody(WalletMessageType.canceldlc, [this.dlc.dlcId])).subscribe(r => {
      // console.debug(' onCancelContract()', r)
      if (r.result) { // "Success"
        // this.showDeleteSuccess = true
        const config: any = { verticalPosition: 'top', duration: 3000 }
        this.snackBar.open(this.translate.instant('contractDetail.cancelContractSuccess'),
          this.translate.instant('action.dismiss'), config)


        // Force update DLC list
        this.walletStateService.refreshDLCStates()
        this.close.next()
      }
    })
  }

  onOracleSignatures() {
    console.debug('onOracleSignatures', this.oracleSignature)
    if (this.oracleSignature) {
      // Keep extra whitespace out of the system
      const os = this.oracleSignature.trim()
      // Validate oracleSignature as hex
      const isValidHex = validateHexString(os)

      if (!isValidHex) {
        console.error('oracleSignature is not valid hex')
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.error',
            content: 'The oracleSignatures entered are not valid hex',
          }
        })
        return
      }

      console.debug('oracleSignature:', os)

      // ExecuteDLCDialog.scala:22
      // OracleAttestmentTLV.fromHex(str.trim)
      this.messsageService.sendMessage(getMessageBody(CoreMessageType.decodeattestments, [os])).subscribe(r => {
        console.debug('decodeattestments', r)

        if (r.result) {
          const attestment: Attestment = r.result
          console.debug('attestment:', attestment)

          const sigs = [os] // attestment.signatures
          const contractId = this.dlc.contractId
          const noBroadcast = false // Could allow changing

          console.warn('os:', os, 'attestment.signatures:', attestment.signatures)

          this.messsageService.sendMessage(getMessageBody(WalletMessageType.executedlc, 
            [contractId, sigs, noBroadcast])).subscribe(r => {
            console.debug('executedlc', r)
    
            if (r.result) { // closingTxId?
              // This contract will change state and having closingTxId now, needs reloaded
    
              // Force update DLC list
              // this.walletStateService.refreshDLCStates()
    
              // Update just this item?
              this.refreshDLCState()
            }
          })
        }
      })
    } // eo if (this.oracleSignature)
  }

  // Refresh the state of the visible DLC in the wallet and refresh object bound in this view
  private refreshDLCState() {
    this.walletStateService.refreshDLCState(this.dlc).subscribe(r => {
      console.debug('dlc:', r)
      if (r.result) {
        this.dlc = <DLCContract>r.result
      }
    })
  }

  onReloadContract() {
    console.debug('onReloadContract()')

    this.refreshDLCState()
  }

  onRefund() {
    console.debug('onRefund()')

    const contractId = this.dlc.contractId
    const noBroadcast = false;

    this.messsageService.sendMessage(getMessageBody(WalletMessageType.executedlcrefund, [contractId, noBroadcast])).subscribe(r => {
      console.debug('executedlcrefund', r)

      if (r.result) {
        this.refreshDLCState()
      }
    })
  }

  onRebroadcastFundingTransaction() {
    console.debug('onRebroadcastFundingTransaction()')

    const contractId = this.dlc.contractId

    // Request failed: Cannot broadcast the dlc when it is in the state=Confirmed contractId=Some(ByteVector(32 bytes, 0x0b528a26f38475faa95ce3738612213cf70fe35a2be0d3d67df9e8234a40f72c))

    this.messsageService.sendMessage(getMessageBody(WalletMessageType.broadcastdlcfundingtx, [contractId])).subscribe(r => {
      console.debug('broadcastdlcfundingtx', r)

      if (r.result) { // funding tx id
        // Show success
        const config: any = { verticalPosition: 'top', duration: 3000 }
        this.snackBar.open(this.translate.instant('contractDetail.fundingRebroadcastSuccess'),
          this.translate.instant('action.dismiss'), config)

        // Let polling take care of changing future state?
      }
    })
  }

  onRebroadcastClosingTransaction() {
    console.debug('onRebroadcastClosingTransaction()')

    const txId = this.dlc.closingTxId

    if (txId) {
      this.messsageService.sendMessage(getMessageBody(WalletMessageType.gettransaction, [txId])).subscribe(r => {
        // console.debug('gettransaction', r)

        if (r.result) {
          const rawTransactionHex = r.result

          this.messsageService.sendMessage(getMessageBody(WalletMessageType.sendrawtransaction, [rawTransactionHex])).subscribe(r => {
            // console.debug('sendrawtransaction', r)

            if (r.result) { // closing tx id
              // Show success
              const config: any = { verticalPosition: 'top', duration: 3000 }
              this.snackBar.open(this.translate.instant('contractDetail.closingRebroadcastSuccess'),
                this.translate.instant('action.dismiss'), config)
            }
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

}

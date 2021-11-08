import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { TranslateService } from '@ngx-translate/core'

import { AlertType } from '~component/alert/alert.component'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { ContractInfo, CoreMessageType, DLCContract, WalletMessageType } from '~type/wallet-server-types'
import { getMessageBody } from '~util/wallet-server-util'

@Component({
  selector: 'app-contract-detail',
  templateUrl: './contract-detail.component.html',
  styleUrls: ['./contract-detail.component.scss']
})
export class ContractDetailComponent implements OnInit {

  public AlertType = AlertType

  _dlc!: DLCContract
  get dlc(): DLCContract { return this._dlc }
  @Input() set dlc(e: DLCContract) { this.reset(); this._dlc = e }

  _contractInfo!: ContractInfo
  get contractInfo(): ContractInfo { return this._contractInfo }
  @Input() set contractInfo(e: ContractInfo) { this._contractInfo = e }

  @Output() close: EventEmitter<void> = new EventEmitter()

  showDeleteSuccess = false

  private reset() {

  }

  constructor(private translate: TranslateService, private snackBar: MatSnackBar,
    private messsageService: MessageService, private walletStateService: WalletStateService) { }

  ngOnInit(): void {
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
    console.debug('onOracleSignatures')


  }

  onRebroadcastFundingTransaction() {
    console.debug('onRebroadcastFundingTransaction()')
  }

  onRebroadcastClosingTransaction() {
    console.debug('onRebroadcastClosingTransaction()')
  }

}

import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core'
import * as FileSaver from 'file-saver'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { WalletMessageType } from '~type/wallet-server-types'
import { getMessageBody } from '~util/wallet-server-util'

import { AlertType } from '../alert/alert.component'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'


@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements OnInit {

  public AlertType = AlertType

  @Output() close: EventEmitter<void> = new EventEmitter()

  fullRescan = false

  executing = false
  backupExecuting = false

  constructor(private messageService: MessageService, private walletStateService: WalletStateService,
    private translate: TranslateService, private dialog: MatDialog) { }

  ngOnInit(): void {
    
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

  unreserveAllUTXOs() {
    console.debug('unreserveAllUTXOs()')

    this.executing = true
    this.messageService.sendMessage(getMessageBody(WalletMessageType.lockunspent, [true, []])).subscribe(r => {
      console.debug('r:', r)

      if (r.result) {
        // TODO : Dialog / message

        this.walletStateService.refreshWalletState().subscribe()
      }
      this.executing = false
    }, err => { this.executing = false })
  }

  rescan() {
    console.debug('rescan() fullRescan:', this.fullRescan)

    // Could expose these to the user, but would need to validate
    // [0,0,0,true,true] results in infinite loop in backend
    const batchSize = null // 0
    const startBlock = null // 0
    const endBlock = null // this.walletStateService.info.blockHeight
    const force = true
    const ignoreCreationTime = this.fullRescan // false // forces full rescan regardless of wallet creation time

    this.executing = true
    this.messageService.sendMessage(getMessageBody(WalletMessageType.rescan, [batchSize, startBlock, endBlock, force, ignoreCreationTime])).subscribe(r => {
      console.debug('r:', r)

      if (r.result) { // "Rescan started."
        // TODO : Started dialog / message

        // this.walletStateService.refreshBalances()
      }
      this.executing = false
    }, err => { this.executing = false })
  }

  private showDownloadError() {
    const dialog = this.dialog.open(ErrorDialogComponent, {
      data: {
        title: 'dialog.backupError.title',
        content: 'dialog.backupError.content'
      }
    })
  }

  downloadBackup() {
    console.debug('downloadBackup()')

    // Currently not user editable
    const filename = 'bitcoin-s-backup.zip'

    this.executing = true
    this.backupExecuting = true
    this.messageService.downloadBackup().subscribe(blob => {
      if (!blob || (blob && blob.size === 0)) {
        console.error('downloadBackup blob was null or empty', blob)
        this.showDownloadError()
      } else {
        FileSaver.saveAs(blob, filename)
      }
      this.executing = false
      this.backupExecuting = false
    }, err => {
      this.executing = false
      this.backupExecuting = false
    })
  }

  downloadBitcoinsLog() {
    console.debug('downloadBitcoinsLog()')

    const filename = 'bitcoin-s.log'

    this.executing = true
    this.messageService.downloadBitcoinsLog(this.walletStateService.getNetwork()).subscribe(blob => {
      if (!blob || (blob && blob.size === 0)) {
        console.error('downloadBitcoinsLog blob was null or empty', blob)
        this.showDownloadError()
      } else {
        FileSaver.saveAs(blob, filename)
      }
      this.executing = false
    })
  }

  downloadProxyLog() {
    console.debug('downloadProxyLog()')

    const filename = 'wallet-server-ui-proxy.log'

    this.executing = true
    this.messageService.downloadProxyLog().subscribe(blob => {
      if (!blob || (blob && blob.size === 0)) {
        console.error('downloadProxyLog blob was null or empty', blob)
        this.showDownloadError()
      } else {
        FileSaver.saveAs(blob, filename)
      }
      this.executing = false
    })
  }

}

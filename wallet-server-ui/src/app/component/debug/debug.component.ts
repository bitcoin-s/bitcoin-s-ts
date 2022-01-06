import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core'
import * as FileSaver from 'file-saver'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { WalletMessageType } from '~type/wallet-server-types'
import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()
  @Output() rootClassName: EventEmitter<boolean> = new EventEmitter()

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

        this.walletStateService.refreshWalletState()
      }
      this.executing = false
    }, err => { this.executing = false })
  }

  rescan() {
    console.debug('rescan()')

    // Could expose these to the user, but would need to validate
    // [0,0,0,true,true] results in infinite loop in backend
    const batchSize = null // 0
    const startBlock = null // 0
    const endBlock = null // this.walletStateService.info.blockHeight
    const force = true
    const ignoreCreationTime = false // forces full rescan regardless of wallet creation time

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

}

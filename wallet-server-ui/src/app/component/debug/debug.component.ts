import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core'
import * as FileSaver from 'file-saver'

import { LocalStorageService, NO_SPLASH_KEY } from '~service/localstorage.service'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'

import { CoreMessageType, WalletMessageType } from '~type/wallet-server-types'

import { getMessageBody } from '~util/wallet-server-util'
import { validateHexString } from '~util/utils'

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

  @ViewChild('txId') txId: ElementRef

  fullRescan = false

  transactionNotFound = false
  rawTransaction: string
  decodedTransaction: string

  noSplash = false

  executing = false
  backupExecuting = false

  constructor(private messageService: MessageService, public walletStateService: WalletStateService,
    private localStorageService: LocalStorageService,
    private translate: TranslateService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.noSplash = this.localStorageService.get(NO_SPLASH_KEY) !== null
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

    this.walletStateService.rescanWallet(ignoreCreationTime).subscribe(r => {
      if (r.error) {
        console.error('error in rescanWallet()')
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.serverError',
            content: 'error.error',
            params: { error: r.error },
          }
        })
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

  getTransaction(sha256hash: string) {
    console.debug('getTransaction()', sha256hash)

    sha256hash = sha256hash.trim()
    const valid = validateHexString(sha256hash)
    // Could check for 32 byte length
    if (!valid) {
      const dialog = this.dialog.open(ErrorDialogComponent, {
        data: {
          title: 'dialog.error',
          content: 'buildAcceptOffer.invalidHex',
        }
      })
    }

    this.transactionNotFound = false
    this.rawTransaction = ''
    this.decodedTransaction = ''
    this.executing = true
    this.messageService.sendMessage(getMessageBody(WalletMessageType.gettransaction, [sha256hash])).subscribe(r => {
      console.debug(' gettransaction:', r)

      if (r.result) {
        this.rawTransaction = r.result
        
        this.messageService.sendMessage(getMessageBody(CoreMessageType.decoderawtransaction, [this.rawTransaction])).subscribe(r => {
          console.debug(' decoderawtransaction:', r)
          if (r.result) {
            this.decodedTransaction = JSON.stringify(r.result, null, 2)
          }
        }, err => { this.executing = false })
      } else {
        this.transactionNotFound = true
      }
      this.executing = false
    }, err => { this.executing = false })
  }

  onNoSplash() {
    console.debug('onNoSplash()', this.noSplash)
    if (this.noSplash) {
      this.localStorageService.set(NO_SPLASH_KEY, '1')
    } else {
      this.localStorageService.clear(NO_SPLASH_KEY)
    }
  }

}

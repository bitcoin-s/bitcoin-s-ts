import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatRadioChange } from '@angular/material/radio'
import { TranslateService } from '@ngx-translate/core'

import { MessageService } from '~service/message.service'
import { WalletService } from '~service/wallet.service'
import { WalletStateService } from '~service/wallet-state-service'

import { trimOnPaste } from '~util/utils'

import { AlertType } from '../alert/alert.component'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'
import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'


enum ExportType {
  seed_words_24 = 'seed_words_24'
}
enum ImportType {
  words = 'words',
  xprv = 'xprv',
}

const SPACE_SEPARATED_24_REGEX = /^\s*(\w+\s+){23}\w+\s*$/
// See https://en.bitcoin.it/wiki/List_of_address_prefixes
const XPRV_REGEX = /^xprv[0-9A-Za-z]*$/

@Component({
  selector: 'app-import-export',
  templateUrl: './import-export.component.html',
  styleUrls: ['./import-export.component.scss']
})
export class ImportExportComponent implements OnInit {

  public AlertType = AlertType
  public ExportType = ExportType
  public ImportType = ImportType

  @Output() close: EventEmitter<void> = new EventEmitter()

  exportUsePassphrase: boolean
  exportPassphrase: string = ''
  hideExportPassphrase = true
  exportWalletName: string = ''
  importType: ImportType = ImportType.words
  importTypes = [ImportType.words, ImportType.xprv]
  importText: string
  importUsePassphrase: boolean
  importPassphrase: string = ''
  hideImportPassphrase = true
  importWalletName: string
  importValid = false
  
  executing = false

  constructor(private messageService: MessageService, private walletStateService: WalletStateService,
    public walletService: WalletService,
    private translate: TranslateService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.exportWalletName = this.walletService.walletName
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

  updateImportType(event: MatRadioChange) {
    console.debug('updateImportType()', event)
    this.importType = event.value
    this.validateImportText()
  }

  onImportTextPaste(event: ClipboardEvent) {
    // console.debug('onImportTextPaste()', event)
    this.importText = trimOnPaste(event)
    this.validateImportText()
  }

  validateImportText() {
    this.importValid = false
    const trimmed = this.importText ? this.importText.trim() : ''
    if (this.importType === ImportType.words) {
      // Validate 24 words for now
      this.importValid = SPACE_SEPARATED_24_REGEX.test(trimmed)
    } else if (this.importType === ImportType.xprv) {
      this.importValid = XPRV_REGEX.test(trimmed)
    }
    console.debug('validateImportText()', this.importValid) // , trimmed)
  }

  exportWallet() {
    console.debug('exportWallet()')

    const walletName = this.exportWalletName || undefined // empty string is sent as undefined
    const passphrase = this.exportUsePassphrase ? this.exportPassphrase : undefined

    console.debug('walletName:', walletName, 'passphrase:', passphrase)

    this.executing = true
    this.walletService.exportWallet(walletName, passphrase).subscribe(r => {
      // console.debug(' exportseed:', r)
      if (r.result) {
        // TODO : Show seed words. Confirmation dialog, allow user to click to reveal words
        const dialog = this.dialog.open(ConfirmationDialogComponent, {
          data: {
            title: 'dialog.seedExport.title',
            content: 'dialog.seedExport.content',
            params: { walletName: walletName || '' },
            list: r.result,
            action: 'action.close',
          }
        })
      } else {
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.serverError',
            content: 'error.error',
            params: { error: r.error }
          }
        })
      }
      this.executing = false
    }, err => { this.executing = false })
  }

  onWalletChange(walletName: string) {
    console.debug('onWalletChange()', walletName)

    // TODO - May not be necessary
  }

  importWallet() {
    const walletName = this.importWalletName || undefined // empty string is sent as undefined
    const seed = this.importText
    const passphrase = this.importUsePassphrase ? this.importPassphrase : undefined

    console.debug('importWallet() walletName:',  walletName) //, seed, passphrase)

    this.executing = true
    let obs
    if (this.importType === ImportType.words) {
      obs = this.walletService.importSeedWordWallet(walletName, seed, passphrase)
    } else { // if (this.importType === ImportType.xprv) {
      obs = this.walletService.importXprvWallet(walletName, seed, passphrase)
    }

    obs.subscribe(r => {
      if (r.result) {
        this.walletService.initializeState().subscribe()
        // TODO : Show dialog, update local state for all balances and DLCs
      } else {
        // TODO : Handle error
      }
      this.executing = false
    }, err => { this.executing = false })
  }

}

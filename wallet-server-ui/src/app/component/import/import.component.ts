import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatRadioChange } from '@angular/material/radio'

import { WalletStateService } from '~service/wallet-state-service'

import { trimOnPaste } from '~util/utils'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'


enum ImportType {
  words = 'words',
  xprv = 'xprv',
}

const SPACE_SEPARATED_24_REGEX = /^\s*(\w+\s+){23}\w+\s*$/
// See https://en.bitcoin.it/wiki/List_of_address_prefixes
const XPRV_REGEX = /^xprv[0-9A-Za-z]*$/

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss']
})
export class ImportComponent implements OnInit {

  public ImportType = ImportType

  importType: ImportType = ImportType.words
  importTypes = [ImportType.words, ImportType.xprv]
  importText: string

  advancedVisible = false
  importUsePassphrase = false
  importPassphrase: string = ''
  hideImportPassphrase = true
  importWalletName: string
  importValid = false

  executing = false

  constructor(public walletStateService: WalletStateService, private dialog: MatDialog) {}

  ngOnInit(): void {
    // Hack to avoid showing expanded panel on first render. Issue with Angular
    setTimeout(() => {
      this.advancedVisible = true
    }, 0)
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

  importWallet() {
    const walletName = this.importWalletName || undefined // empty string is sent as undefined
    const seed = this.importText
    const passphrase = this.importUsePassphrase ? this.importPassphrase : undefined

    console.debug('importWallet() walletName:',  walletName) //, seed, passphrase)

    this.executing = true
    let obs
    if (this.importType === ImportType.words) {
      obs = this.walletStateService.importSeedWordWallet(walletName, seed, passphrase)
    } else { // if (this.importType === ImportType.xprv) {
      obs = this.walletStateService.importXprvWallet(walletName, seed, passphrase)
    }

    obs.subscribe(r => {
      // Reload wallets so new import is visible
      this.walletStateService.initializeWallet().subscribe()
      if (r.result) { // TODO : Currently r.result is null for success. Asked for walletName to be returned
        
      } else {
        console.error('error in importWallet()')
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

}

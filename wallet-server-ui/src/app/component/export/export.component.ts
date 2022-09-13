import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'

import { WalletStateService } from '~service/wallet-state-service'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'


enum ExportType {
  seed_words_24 = 'seed_words_24'
}

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss']
})
export class ExportComponent implements OnInit {

  public ExportType = ExportType

  exportUsePassphrase: boolean
  exportPassphrase: string = ''
  hideExportPassphrase = true
  exportWalletName: string = ''

  advancedVisible = false

  executing = false

  constructor(public walletStateService: WalletStateService, private dialog: MatDialog) {}

  ngOnInit(): void {
    // Hack to avoid showing expanded panel on first render. Issue with Angular
    setTimeout(() => {
      this.advancedVisible = true
    }, 0)
  }

  exportWallet() {
    console.debug('exportWallet()')

    const walletName = this.exportWalletName || undefined // empty string is sent as undefined
    const passphrase = this.exportUsePassphrase ? this.exportPassphrase : undefined

    console.debug('walletName:', walletName, 'passphrase:', passphrase)

    this.executing = true
    this.walletStateService.exportWallet(walletName, passphrase).subscribe(r => {
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
            params: { error: r.error },
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

}

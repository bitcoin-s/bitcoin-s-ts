import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'

import { AddressService } from '~service/address.service'
import { BackendService } from '~service/backend.service'
import { WalletStateService } from '~service/wallet-state-service'

import { formatNumber, formatPercent } from '~util/utils'

import { NewAddressDialogComponent } from '~app/dialog/new-address-dialog/new-address-dialog.component'


const DEFAULT_WALLET_NAME = undefined

@Component({
  selector: 'app-wallet-balance',
  templateUrl: './wallet-balance.component.html',
  styleUrls: ['./wallet-balance.component.scss']
})
export class WalletBalanceComponent implements OnInit {

  public formatNumber = formatNumber
  public formatPercent = formatPercent

  walletName: string | undefined
  advancedVisible = false // Angular hack
  walletUsePassphrase = false
  walletPassphrase: string = ''
  hideWalletPassphrase = true

  executing = false

  constructor(private dialog: MatDialog,
    public walletStateService: WalletStateService, public backendService: BackendService,
    public addressService: AddressService) {}

  ngOnInit(): void {
    this.walletStateService.wallet.subscribe(wallet => {
      console.warn('wallet changed', wallet)
      if (wallet) {
        this.walletName = wallet?.walletName
      } else {
        this.walletName = DEFAULT_WALLET_NAME
      }
    })

    // Hack to avoid showing expanded panel on first render. Issue with Angular
    setTimeout(() => {
      this.advancedVisible = true
    }, 0)
  }

  onQRCodeClick(address: string) {
    console.debug('onQRCodeClick()', address)

    const dialog = this.dialog.open(NewAddressDialogComponent, {
      data: {
        title: 'dialog.newAddress.title',
        content: 'dialog.newAddress.content',
        params: { address },
        action: 'action.close',
      }
    })
  }

  onWalletChange(walletName: string) {
    console.debug('onWalletChange()', walletName)

    const passphrase = this.walletUsePassphrase ? this.walletPassphrase : undefined

    this.executing = true
    this.walletStateService.loadWallet(walletName, passphrase).subscribe(r => {
      console.debug(' loadwallet', r)
      this.executing = false
    }, err => {
      console.error('error calling loadWallet(), reloading walletinfo')
      // Repoll for the current wallet to force a walletName update
      this.walletStateService.getWalletInfo().subscribe()
      this.executing = false
    })
  }

}

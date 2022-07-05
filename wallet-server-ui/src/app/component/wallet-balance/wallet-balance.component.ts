import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'

import { AddressService } from '~service/address.service'
import { BackendService } from '~service/backend.service'
import { WalletStateService } from '~service/wallet-state-service'

import { formatNumber, formatPercent } from '~util/utils'

import { NewAddressDialogComponent } from '~app/dialog/new-address-dialog/new-address-dialog.component'
import { WalletService } from '~service/wallet.service'


@Component({
  selector: 'app-wallet-balance',
  templateUrl: './wallet-balance.component.html',
  styleUrls: ['./wallet-balance.component.scss']
})
export class WalletBalanceComponent implements OnInit {

  public formatNumber = formatNumber
  public formatPercent = formatPercent

  private executing = false

  constructor(private dialog: MatDialog,
    public walletStateService: WalletStateService, public backendService: BackendService,
    public addressService: AddressService, public walletService: WalletService) {}

  ngOnInit(): void {
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
    console.debug('onWalletName()', walletName)

    this.executing = true
    this.walletService.loadWallet(walletName).subscribe(r => {
      console.debug(' loadwallet', r)
      if (r.result) {
        
      } else {

      }
      this.executing = false
    }, err => { this.executing = false })
  }

}

import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'

import { NewAddressDialogComponent } from '~app/dialog/new-address-dialog/new-address-dialog.component'
import { MessageService } from '~service/message.service'

import { WalletStateService } from '~service/wallet-state-service'
import { WalletMessageType } from '~type/wallet-server-types'
import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-wallet-balance',
  templateUrl: './wallet-balance.component.html',
  styleUrls: ['./wallet-balance.component.scss']
})
export class WalletBalanceComponent implements OnInit {

  constructor(private dialog: MatDialog, public walletStateService: WalletStateService, private messageService: MessageService) { }

  ngOnInit(): void {
  }

  getNewAddress() {
    console.debug('getNewAddress()')

    const label = '' // required. probably should not be?

    this.messageService.sendMessage(getMessageBody(WalletMessageType.getnewaddress, [label])).subscribe(r => {
      console.debug(' address:', r)
      if (r.result) {
        const dialog = this.dialog.open(NewAddressDialogComponent, {
          data: {
            title: 'dialog.newAddress.title',
            content: 'dialog.newAddress.content',
            params: { address: r.result },
            action: 'action.ok',
            actionColor: 'primary',
          }
        })
      }
    })

    
  }

  sendFunds() {
    console.debug('sendFunds()')
  }

}

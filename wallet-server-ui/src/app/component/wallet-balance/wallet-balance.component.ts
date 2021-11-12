import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'

import { NewAddressDialogComponent } from '~app/dialog/new-address-dialog/new-address-dialog.component'
import { SendFundsDialogComponent } from '~app/dialog/send-funds-dialog/send-funds-dialog.component'
import { MessageService } from '~service/message.service'

import { WalletStateService } from '~service/wallet-state-service'
import { WalletMessageType } from '~type/wallet-server-types'
import { formatPercent } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-wallet-balance',
  templateUrl: './wallet-balance.component.html',
  styleUrls: ['./wallet-balance.component.scss']
})
export class WalletBalanceComponent implements OnInit {

  public formatPercent = formatPercent

  constructor(private dialog: MatDialog, public walletStateService: WalletStateService, private messageService: MessageService) { }

  ngOnInit(): void {
  }

  getNewAddress() {
    console.debug('getNewAddress()')

    // Using labels seems to mess up the backend at this point, but they are required on the JSON RPC interface
    // No one gets to flex this codepath until the backend is fixed
    // return
    // const label = '' // required. probably should not be?

    this.messageService.sendMessage(getMessageBody(WalletMessageType.getnewaddress)).subscribe(r => {
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

    const dialog = this.dialog.open(SendFundsDialogComponent).afterClosed().subscribe(
      (sendObj: { address: string, amount: number, feeRate: number }) => {
        console.debug(' sendFunds()', sendObj)

        if (sendObj) { // else the user was canceling
          // TODO : sendObj.amount on the server side is in bitcoins
          sendObj.amount = sendObj.amount * 1e-8
          const noBroadcast = false

          // Sending to self have seen
          // "Request failed: [SQLITE_CONSTRAINT_PRIMARYKEY]  A PRIMARY KEY constraint failed (UNIQUE constraint failed: wallet_address_tags.address, wallet_address_tags.tag_type)"

          this.messageService.sendMessage(getMessageBody(WalletMessageType.sendtoaddress,
            [sendObj.address, sendObj.amount, sendObj.feeRate, noBroadcast])).subscribe(r => {
              if (r.result) {
                const dialog = this.dialog.open(ConfirmationDialogComponent, {
                  data: {
                    title: 'dialog.sendFundsSuccess.title',
                    content: 'dialog.sendFundsSuccess.content',
                    action: 'action.ok',
                    // actionColor: 'primary',
                  }
                })
              }
            })
        }
      })
  }

}

import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { WalletMessageType } from '~type/wallet-server-types'
import { formatNumber, formatPercent, mempoolTransactionURL } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'
import { NewAddressDialogComponent } from '~app/dialog/new-address-dialog/new-address-dialog.component'
import { SendFundsDialogComponent } from '~app/dialog/send-funds-dialog/send-funds-dialog.component'
import { TranslateService } from '@ngx-translate/core'


@Component({
  selector: 'app-wallet-balance',
  templateUrl: './wallet-balance.component.html',
  styleUrls: ['./wallet-balance.component.scss']
})
export class WalletBalanceComponent implements OnInit {

  public formatNumber = formatNumber
  public formatPercent = formatPercent

  constructor(private dialog: MatDialog, public walletStateService: WalletStateService, 
    private messageService: MessageService, private translate: TranslateService) { }

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
      (sendObj: { address: string, amount: number, feeRate: number, sendMax: boolean }) => {
        console.debug(' sendFunds()', sendObj)

        if (sendObj) { // else the user was canceling
          if (sendObj.sendMax) {
            this.messageService.sendMessage(getMessageBody(WalletMessageType.sweepwallet,
              [sendObj.address, sendObj.feeRate])).subscribe(r => {
                console.debug('sweepwallet', r)
                if (r.result) {
                  const txId = r.result

                  const dialog = this.dialog.open(ConfirmationDialogComponent, {
                    data: {
                      title: 'dialog.sendFundsSuccess.title',
                      content: 'dialog.sendFundsSuccess.content',
                      params: { amount: this.translate.instant('unit.allAvailable'), address: sendObj.address, txId },
                      linksContent: 'dialog.sendFundsSuccess.linksContent',
                      links: [mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
                      action: 'action.ok',
                      showCancelButton: false,
                    }
                  })
                }
              })
          } else {
            const sats = sendObj.amount
            // amount on the server side is expected in bitcoin units
            const bitcoin = sats * 1e-8
            const noBroadcast = false

            this.messageService.sendMessage(getMessageBody(WalletMessageType.sendtoaddress,
              [sendObj.address, bitcoin, sendObj.feeRate, noBroadcast])).subscribe(r => {
                if (r.result) {
                  const txId = r.result

                  const dialog = this.dialog.open(ConfirmationDialogComponent, {
                    data: {
                      title: 'dialog.sendFundsSuccess.title',
                      content: 'dialog.sendFundsSuccess.content',
                      params: { amount: formatNumber(sats), address: sendObj.address, txId },
                      linksContent: 'dialog.sendFundsSuccess.linksContent',
                      links: [mempoolTransactionURL(txId, this.walletStateService.getNetwork())],
                      action: 'action.ok',
                      showCancelButton: false,
                    }
                  })
                }
              })
          }
        }
      })
  }

}

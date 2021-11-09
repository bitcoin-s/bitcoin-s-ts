import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WalletStateService } from '~service/wallet-state-service';
import { copyToClipboard, validateBitcoinAddress } from '~util/utils';


@Component({
  selector: 'app-send-funds-dialog',
  templateUrl: './send-funds-dialog.component.html',
  styleUrls: ['./send-funds-dialog.component.scss']
})
export class SendFundsDialogComponent implements OnInit {

  address = ''
  amount: number
  feeRate: number

  action = 'action.ok'
  actionColor = 'primary'

  constructor(private walletStateService: WalletStateService) { }

  ngOnInit() {
    // Can't do this yet - don't have raw feeEstimate value
    // this.feeRate = this.walletStateService.feeEstimate
  }

  inputsValid() {
    let validInputs = true

    if (!this.address) {
      validInputs = false
    }
    if (!this.amount || this.amount <= 0) {
      validInputs = false
    }
    if (!this.feeRate || this.feeRate <= 0) {
      validInputs = false
    }

    // Validate address is a valid bitcoin address
    if (!validateBitcoinAddress(this.walletStateService.info.network, this.address)) {
      validInputs = false
    }

    return validInputs
  }

}

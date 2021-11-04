import { Component, OnInit } from '@angular/core'

import { WalletStateService } from '~service/wallet-state-service';


@Component({
  selector: 'app-wallet-balance',
  templateUrl: './wallet-balance.component.html',
  styleUrls: ['./wallet-balance.component.scss']
})
export class WalletBalanceComponent implements OnInit {

  constructor(public walletStateService: WalletStateService) { }

  ngOnInit(): void {
  }

  getNewAddress() {
    console.debug('getNewAddress()')
  }

  sendFunds() {
    console.debug('sendFunds()')
  }

}

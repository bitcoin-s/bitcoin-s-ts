import { Component, OnInit } from '@angular/core'

import { BackendService } from '~service/backend.service'
import { WalletStateService } from '~service/wallet-state-service'
import { formatNumber, formatPercent } from '~util/utils'


@Component({
  selector: 'app-wallet-balance',
  templateUrl: './wallet-balance.component.html',
  styleUrls: ['./wallet-balance.component.scss']
})
export class WalletBalanceComponent implements OnInit {

  public formatNumber = formatNumber
  public formatPercent = formatPercent

  constructor(public walletStateService: WalletStateService, public backendService: BackendService) { }

  ngOnInit(): void {
  }

}

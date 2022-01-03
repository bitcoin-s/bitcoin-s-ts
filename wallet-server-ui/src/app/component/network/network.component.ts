import { Component, OnInit } from '@angular/core'

import { WalletStateService } from '~service/wallet-state-service'
import { WebsocketService } from '~service/websocket.service'
import { copyToClipboard, formatNumber } from '~util/utils'


@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent implements OnInit {

  public copyToClipboard = copyToClipboard
  public formatNumber = formatNumber

  constructor(public walletStateService: WalletStateService, public websocketService: WebsocketService) { }

  ngOnInit(): void {
  }

}

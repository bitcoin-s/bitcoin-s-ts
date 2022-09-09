import { Component, OnInit } from '@angular/core'

import { WalletStateService } from '~service/wallet-state-service'
import { copyToClipboard } from '~util/utils'


@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

  public copyToClipboard = copyToClipboard

  constructor(public walletStateService: WalletStateService) { }

  ngOnInit(): void {
    // User can come to this page ahead of logging in, so this data may not have loaded yet
    if (!this.walletStateService.buildConfig) {
      this.walletStateService.getAboutInfo().subscribe()
    }
  }

}

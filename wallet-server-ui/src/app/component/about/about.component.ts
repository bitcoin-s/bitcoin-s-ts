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
    // this.walletStateService.getAboutInfo().subscribe()
  }

}

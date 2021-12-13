import { Component, EventEmitter, OnInit, Output } from '@angular/core'

import { BackendService } from '~service/backend.service'
import { WalletServiceState, WalletStateService } from '~service/wallet-state-service'


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public WalletServiceState = WalletServiceState

  @Output() showConfiguration: EventEmitter<void> = new EventEmitter()
  @Output() showAdvanced: EventEmitter<void> = new EventEmitter()

  constructor(public walletStateService: WalletStateService, public backendService: BackendService) { }

  ngOnInit(): void {
  }

  onConfiguration() {
    console.debug('onConfiguration()')
    this.showConfiguration.emit()
  }

  onAdvanced() {
    console.debug('onAdvanced()')
    this.showAdvanced.emit()
  }

}

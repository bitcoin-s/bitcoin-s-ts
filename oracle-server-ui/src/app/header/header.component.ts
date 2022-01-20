import { Component, EventEmitter, OnInit, Output } from '@angular/core'

import { AuthService } from '~service/auth.service'


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Output() showSignMessage: EventEmitter<void> = new EventEmitter()
  @Output() showConfiguration: EventEmitter<void> = new EventEmitter()
  @Output() showAdvanced: EventEmitter<void> = new EventEmitter()

  constructor(public authService: AuthService) { }

  ngOnInit(): void {
  }

  onSignMessage() {
    console.debug('onSignMessage()')
    this.showSignMessage.emit()
  }

  onConfiguration() {
    console.debug('onConfiguration()')
    this.showConfiguration.emit()
  }

  onAdvanced() {
    console.debug('onAdvanced()')
    this.showAdvanced.emit()
  }

  onLogout() {
    console.debug('onLogout()')
    this.authService.logout().subscribe(result => {
      // Nothing to do here
    })
  }

}

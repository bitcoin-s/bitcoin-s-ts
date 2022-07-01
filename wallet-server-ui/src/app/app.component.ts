import { OverlayContainer } from '@angular/cdk/overlay'
import { Component, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { MatDrawer } from '@angular/material/sidenav'
import { Title } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subscription } from 'rxjs'

import { AuthService } from '~service/auth.service'
import { DarkModeService } from '~service/dark-mode.service'
import { DLCFileService } from '~service/dlc-file.service'
import { DLCService } from '~service/dlc-service'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { WebsocketService } from '~service/websocket.service'


const DARK_MODE_CLASS_NAME = 'darkMode'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  // Root styling class to support darkMode
  @HostBinding('class') className = ''

  @ViewChild('rightDrawer') rightDrawer: MatDrawer

  configurationVisible = false
  advancedVisible = false
  importExportVisible = false

  stateLoaded = false

  loggedIn$: Subscription
  loggedOut$: Subscription
  subscriptions: Subscription[]
  
  constructor(private titleService: Title, private translate: TranslateService, public messageService: MessageService, 
    private overlay: OverlayContainer, private router: Router,
    public walletStateService: WalletStateService, private dlcService: DLCService, private dlcFileService: DLCFileService,
    private websocketService: WebsocketService, public authService: AuthService,
    private darkModeService: DarkModeService) {
    
    this.loggedIn$ = this.authService.loggedIn.subscribe(r => {
      console.debug('loggedIn')
      this.onLogin()
    })
    this.loggedOut$ = this.authService.loggedOut.subscribe(r => {
      console.debug('loggedOut')
      this.onLogout()
    })
    this.authService.initialize()
  }
  
  private onLogin() {
    this.createSubscriptions()
    this.walletStateService.startPolling()
  }

  private onLogout() {
    this.destroySubscriptions()
    this.walletStateService.stopPolling()
    this.websocketService.stopPolling()
    this.stateLoaded = false
    this.rightDrawer.close()
    this.router.navigate(['/login'])
  }

  ngOnInit(): void {
    console.debug('AppComponent.ngOnInit() url:', this.router.url, 'isLoggedOut:', this.authService.isLoggedOut)
    this.titleService.setTitle(this.translate.instant('title'))

    this.darkModeService.darkModeChanged.subscribe(set => this.onDarkModeChanged(set))
    this.onDarkModeChanged(this.darkModeService.isDarkMode)
  }

  ngOnDestroy() {
    this.loggedIn$.unsubscribe()
    this.loggedOut$.unsubscribe()
    this.destroySubscriptions()
  }

  private createSubscriptions() {
    if (this.subscriptions) this.destroySubscriptions()
    this.subscriptions = []
    let sub = this.walletStateService.stateLoaded.subscribe(_ => {
      this.stateLoaded = true
      console.debug('stateLoaded:', this.router.url)

      this.websocketService.startPolling()

      // Check current route and set route based on wallet and dlc state after initialization
      if (this.router.url === '/login') {
        if (this.dlcService.dlcs.value.length > 0) {
          this.router.navigate(['/contracts'])
        } else { // if (this.walletStateService.balances.total > 0) {
          this.router.navigate(['/wallet'])
        }
      }
    })
    this.subscriptions.push(sub)

    // Route DLC file events
    sub = this.dlcFileService.offer$.subscribe(offer => {
      console.debug('app on offer', offer)
      this.router.navigate(['/offers'])
    })
    this.subscriptions.push(sub)
    sub = this.dlcFileService.accept$.subscribe(accept => {
      console.debug('app on accept', accept)
      this.router.navigate(['/contracts'])
    })
    this.subscriptions.push(sub)
    sub = this.dlcFileService.sign$.subscribe(sign => {
      console.debug('app on sign', sign)
      this.router.navigate(['/contracts'])
    })
    this.subscriptions.push(sub)
  }

  private destroySubscriptions() {
    if (this.subscriptions) {
      for (const s of this.subscriptions) s.unsubscribe()
      this.subscriptions.length = 0
    }
  }

  private onDarkModeChanged(darkMode: boolean) {
    // Empty string for not set
    this.className = darkMode ? DARK_MODE_CLASS_NAME : ''
    if (this.className) {
      this.overlay.getContainerElement().classList.add(DARK_MODE_CLASS_NAME)
    } else {
      this.overlay.getContainerElement().classList.remove(DARK_MODE_CLASS_NAME)
    }
  }

  showConfiguration() {
    console.debug('showConfiguration()')

    this.configurationVisible = true
    this.advancedVisible = false
    this.importExportVisible = false
    this.rightDrawer.open()
  }

  onConfigurationClose() {
    console.debug('onConfigurationClose()')

    this.configurationVisible = false
    this.rightDrawer.close()
  }

  showAdvanced() {
    console.debug('showAdvanced()')

    this.configurationVisible = false
    this.advancedVisible = true
    this.importExportVisible = false
    this.rightDrawer.open()
  }

  onAdvancedClose() {
    console.debug('onAdvancedClose()')

    this.advancedVisible = false
    this.rightDrawer.close()
  }

  showImportExport() {
    console.debug('showImportExport()')

    this.configurationVisible = false
    this.advancedVisible = false
    this.importExportVisible = true
    this.rightDrawer.open()
  }

  onImportExportClose() {
    console.debug('onImportExportClose()')

    this.importExportVisible = false
    this.rightDrawer.close()
  }

  // Clicking off of drawer doesn't call close() so this cleans up state
  hideConfigDebug() {
    this.configurationVisible = false
    this.advancedVisible = false
    this.importExportVisible = false
  }

  rightDrawerOpened(opened: boolean) {
    console.debug('rightDrawerOpened()', opened)
    // Clean up state on close
    if (!opened) {
      this.configurationVisible = false
      this.advancedVisible = false
    }
  }
  
}

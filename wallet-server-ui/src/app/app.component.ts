import { OverlayContainer } from '@angular/cdk/overlay'
import { Component, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { MatDrawer } from '@angular/material/sidenav'
import { Title } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subscription } from 'rxjs'
import { AuthService } from '~service/auth.service'

import { DLCFileService } from '~service/dlc-file.service'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { WebsocketService } from '~service/websocket.service'


const CSS_DARK_MODE = 'CSS_DARK_MODE'
const SET = 'SET'

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

  stateLoaded = false

  loggedIn$: Subscription
  loggedOut$: Subscription
  subscriptions: Subscription[]
  
  constructor(private titleService: Title, private translate: TranslateService, public messageService: MessageService, 
    private overlay: OverlayContainer, private router: Router,
    public walletStateService: WalletStateService, private dlcFileService: DLCFileService,
    private websocketService: WebsocketService, public authService: AuthService) {
    
    // console.debug('AppComponent()')
    this.loggedIn$ = this.authService.loggedIn.subscribe(r => {
      console.debug('loggedIn')
      this.createSubscriptions()
      this.walletStateService.startPolling()
      this.websocketService.startPolling()
    })
    this.loggedOut$ = this.authService.loggedOut.subscribe(r => {
      console.debug('loggedOut')
      this.destroySubscriptions()
      this.walletStateService.stopPolling()
      this.websocketService.stopPolling()
      this.stateLoaded = false
      this.rightDrawer.close()
    })
    this.authService.initialize()
  }

  ngOnInit(): void {
    // console.debug('AppComponent.ngOnInit()')
    this.titleService.setTitle(this.translate.instant('title'))

    const enableDarkMode = localStorage.getItem(CSS_DARK_MODE) !== null
    this.onRootClassName(enableDarkMode)

    // If root route is loaded and we're not logged in yet, go to /login
    if (this.router.url === '/') {
      if (this.authService.isLoggedOut) {
        this.router.navigate(['/login'])
      }
    }
  }

  ngOnDestroy() {
    this.loggedIn$.unsubscribe()
    this.loggedOut$.unsubscribe()
    this.destroySubscriptions()
  }

  private createSubscriptions() {
    if (this.subscriptions) this.destroySubscriptions()
    this.subscriptions = []
    // Check current route and set route based on wallet and dlc state after initialization
    let sub = this.walletStateService.stateLoaded.subscribe(_ => {
      this.stateLoaded = true
      console.debug('stateLoaded:', this.router.url)
      if (this.router.url === '/') {
        if (this.authService.isLoggedOut) {
          this.router.navigate(['/login'])
        } else if (this.walletStateService.dlcs.value.length > 0) {
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

  showConfiguration() {
    console.debug('showConfiguration()')

    this.configurationVisible = true
    this.advancedVisible = false
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
    this.rightDrawer.open()
  }

  onAdvancedClose() {
    console.debug('onAdvancedClose()')

    this.advancedVisible = false
    this.rightDrawer.close()
  }

  // Clicking off of drawer doesn't call close() so this cleans up state
  hideConfigDebug() {
    this.configurationVisible = false
    this.advancedVisible = false
  }

  // Empty string for none
  onRootClassName(darkMode: boolean) {
    const darkClassName = 'darkMode'
    this.className = darkMode ? darkClassName : ''
    if (this.className) {
      this.overlay.getContainerElement().classList.add(darkClassName)
      localStorage.setItem(CSS_DARK_MODE, SET)
    } else {
      this.overlay.getContainerElement().classList.remove(darkClassName)
      localStorage.removeItem(CSS_DARK_MODE)
    }
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

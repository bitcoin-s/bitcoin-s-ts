import { OverlayContainer } from '@angular/cdk/overlay'
import { Component, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Title } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subscription } from 'rxjs'

import { AuthService } from '~service/auth.service'
import { MessageService } from '~service/message.service'
import { OracleStateService } from '~service/oracle-state.service'


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

  // Right side
  showConfiguration = false
  showAdvanced = false
  showSignMessage = false

  stateLoaded = false

  loggedIn$: Subscription
  loggedOut$: Subscription
  subscriptions: Subscription[]

  constructor(private titleService: Title, private translate: TranslateService, public router: Router,
    public messageService: MessageService, private snackBar: MatSnackBar, public authService: AuthService,
    private oracleStateService: OracleStateService, private overlay: OverlayContainer) {
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
    this.oracleStateService.initializeState()
  }

  private createSubscriptions() {
    if (this.subscriptions) this.destroySubscriptions()
    this.subscriptions = []
    let sub = this.oracleStateService.stateLoaded.subscribe(_ => {
      this.stateLoaded = true
      console.debug('stateLoaded:', this.router.url)

      // Turn on polling here

      if (this.router.url === '/login') {
        this.router.navigate(['/oracle'])
      }
    })
    this.subscriptions.push(sub)
  }

  private onLogout() {
    this.stateLoaded = false
    this.rightDrawer.close()
    this.router.navigate(['/login'])
  }

  ngOnInit() {
    this.titleService.setTitle(this.translate.instant('title'))

    const enableDarkMode = localStorage.getItem(CSS_DARK_MODE) !== null
    this.onRootClassName(enableDarkMode)

    // TODO : Move
    this.messageService.oracleHeartbeat().subscribe(result => {
      if (result) {
        const oracleRunning = result.success
        const key = oracleRunning ? 'oracleEvent.serverFound' : 'oracleEvent.serverNotFound'
        const config: any = { verticalPosition: 'top' }
        if (oracleRunning) config.duration = 3000
        this.snackBar.open(this.translate.instant(key), this.translate.instant('action.dismiss'), config)
      }
    })
  }

  ngOnDestroy(): void {
    this.loggedIn$.unsubscribe()
    this.loggedOut$.unsubscribe()
    this.destroySubscriptions()
  }

  private destroySubscriptions() {
    if (this.subscriptions) {
      for (const s of this.subscriptions) s.unsubscribe()
      this.subscriptions.length = 0
    }
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

  private hideRightDrawerItems() {
    this.showConfiguration = false
    this.showAdvanced = false
    this.showSignMessage = false
  }

  onShowSignMessage() {
    console.debug('onShowSignMessage()')
    if (this.showSignMessage) {
      this.closeRightDrawer()
      return;
    }
    this.hideRightDrawerItems()
    this.showSignMessage = true
    this.rightDrawer.open()
  }

  onShowConfiguration() {
    console.debug('onShowConfiguration()', this.showConfiguration)
    if (this.showConfiguration) {
      this.closeRightDrawer()
      return;
    }
    this.hideRightDrawerItems()
    this.showConfiguration = true
    this.rightDrawer.open()
  }

  onShowAdvanced() {
    console.debug('onShowAdvanced()', this.showAdvanced)
    if (this.showAdvanced) {
      this.closeRightDrawer()
      return;
    }
    this.hideRightDrawerItems()
    this.showAdvanced = true
    this.rightDrawer.open()
  }

  closeRightDrawer() {
    console.debug('closeRightDrawer()')
    this.rightDrawer.close()
    this.hideRightDrawerItems()
  }

}

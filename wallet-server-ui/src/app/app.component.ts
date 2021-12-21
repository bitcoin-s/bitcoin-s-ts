import { OverlayContainer } from '@angular/cdk/overlay'
import { Component, HostBinding, OnInit, ViewChild } from '@angular/core'
import { MatDrawer } from '@angular/material/sidenav'
import { Title } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'

import { DLCFileService } from '~service/dlc-file.service'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'


const CSS_DARK_MODE = 'CSS_DARK_MODE'
const SET = 'SET'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'wallet-server-ui'

  @ViewChild('rightDrawer') rightDrawer: MatDrawer

  // Root styling class to support darkMode
  @HostBinding('class') className = ''

  configurationVisible = false
  advancedVisible = false
  
  constructor(private titleService: Title, private translate: TranslateService, public messageService: MessageService, 
    private overlay: OverlayContainer, private router: Router,
    public walletStateService: WalletStateService, private dlcFileService: DLCFileService) {
    
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.translate.instant('title'))

    const enableDarkMode = localStorage.getItem(CSS_DARK_MODE) !== null
    this.onRootClassName(enableDarkMode)

    // Route DLC file events
    this.dlcFileService.offer$.subscribe(offer => {
      console.debug('app on offer', offer)
      this.router.navigate(['/offers'])
    })
    this.dlcFileService.accept$.subscribe(accept => {
      console.debug('app on accept', accept)
      this.router.navigate(['/contracts'])
    })
    this.dlcFileService.sign$.subscribe(sign => {
      console.debug('app on sign', sign)
      this.router.navigate(['/contracts'])
    })
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
    console.debug('onConfigurationClose()')

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

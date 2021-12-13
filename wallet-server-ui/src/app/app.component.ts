import { OverlayContainer } from '@angular/cdk/overlay'
import { Component, HostBinding, OnInit, ViewChild } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Title } from '@angular/platform-browser'
import { TranslateService } from '@ngx-translate/core'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { BuildConfig } from '~type/proxy-server-types'
import { Announcement, ContractInfo, DLCContract, DLCMessageType, Offer, WalletMessageType } from '~type/wallet-server-types'
import { AcceptWithHex, AnnouncementWithHex, ContractInfoWithHex, OfferWithHex, SignWithHex } from '~type/wallet-ui-types'
import { copyToClipboard } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'
import { AcceptOfferComponent } from './component/accept-offer/accept-offer.component'
import { ContractsComponent, DLCContractInfo } from './component/contracts/contracts.component'
import { NewOfferComponent } from './component/new-offer/new-offer.component'
import { ErrorDialogComponent } from './dialog/error/error.component'


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
  
  constructor(private titleService: Title, private translate: TranslateService, public messageService: MessageService, private snackBar: MatSnackBar, private overlay: OverlayContainer,
    public walletStateService: WalletStateService, private dialog: MatDialog) {
    
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.translate.instant('title'))

    const enableDarkMode = localStorage.getItem(CSS_DARK_MODE) !== null
    this.onRootClassName(enableDarkMode)
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

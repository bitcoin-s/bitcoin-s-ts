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

  @ViewChild('buildOffer') buildOffer: NewOfferComponent
  @ViewChild('acceptOffer') acceptOffer: AcceptOfferComponent
  @ViewChild('contracts') contracts: ContractsComponent

  // Root styling class to support darkMode
  @HostBinding('class') className = ''

  // Build
  selectedAnnouncement: AnnouncementWithHex|null
  selectedContractInfo: ContractInfoWithHex|null
  // Accept
  selectedOffer: OfferWithHex|null

  selectedDLC: DLCContract|null
  selectedDLCContractInfo: ContractInfo|null
  selectedAccept: AcceptWithHex|null
  selectedSign: SignWithHex|null

  configurationVisible = false
  debugVisible = false
  offerVisible = false
  contractDetailsVisible = false
  
  constructor(private titleService: Title, private translate: TranslateService, public messageService: MessageService, private snackBar: MatSnackBar, private overlay: OverlayContainer,
    public walletStateService: WalletStateService, private dialog: MatDialog) {
    
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.translate.instant('title'))
    this.messageService.walletHeartbeat().subscribe(result => {
      if (result) {
        const oracleRunning = result.success
        const key = oracleRunning ? 'serverEvent.serverFound' : 'serverEvent.serverNotFound'
        const config: any = { verticalPosition: 'top' }
        if (oracleRunning) config.duration = 3000
        this.snackBar.open(this.translate.instant(key), this.translate.instant('action.dismiss'), config)
      }
    })

    const enableDarkMode = localStorage.getItem(CSS_DARK_MODE) !== null
    this.onRootClassName(enableDarkMode)
  }

  showConfiguration() {
    console.debug('showConfiguration()')

    this.configurationVisible = true
    this.debugVisible = false
    this.offerVisible = false
    this.contractDetailsVisible = false

    this.rightDrawer.open()
  }

  onConfigurationClose() {
    console.debug('onConfigurationClose()')

    this.configurationVisible = false

    this.rightDrawer.close()
  }

  showDebug() {
    console.debug('showDebug()')

    this.configurationVisible = false
    this.debugVisible = true
    this.offerVisible = false
    this.contractDetailsVisible = false

    this.rightDrawer.open()
  }

  onDebugClose() {
    console.debug('onDebugClose()')

    this.debugVisible = false

    this.rightDrawer.close()
  }

  // Clicking off of drawer doesn't call close() so this cleans up state
  hideConfigDebug() {
    this.configurationVisible = false
    this.debugVisible = false
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

  onAnnouncement(announcement: AnnouncementWithHex) {
    console.debug('onAnnouncement()', announcement)

    this.hideConfigDebug()
    this.hideOffers()
    this.selectedAnnouncement = announcement
    this.hideSelectedDLC()
    this.offerVisible = true
    this.rightDrawer.open()
  }

  onContractInfo(contractInfo: ContractInfoWithHex) {
    console.debug('onContractInfo()', contractInfo)

    this.hideConfigDebug()
    this.hideOffers()
    this.selectedContractInfo = contractInfo
    this.hideSelectedDLC()
    this.offerVisible = true
    this.rightDrawer.open()
  }

  onAcceptOffer(offer: OfferWithHex) {
    console.debug('onAcceptOffer()', offer)

    this.hideConfigDebug()
    this.hideOffers()
    this.selectedOffer = offer
    this.hideSelectedDLC()
    this.offerVisible = true
    this.rightDrawer.open()
  }

  onAcceptWithHex(accept: AcceptWithHex) {
    console.debug('onAcceptWithHex()', accept)

    const tempContractId = accept.accept.temporaryContractId
    const dlc = this.walletStateService.dlcs.value.find(dlc => dlc.tempContractId === tempContractId)
    if (dlc) { // && dlc.isInitiator
      this.selectedAccept = accept
      this.contracts.onRowClick(dlc) // calls back with onSelectedDLC()
    } else {
      console.error('could not find DLC in walletStateService to match tempContractId', tempContractId)
      const dialog = this.dialog.open(ErrorDialogComponent, {
        data: {
          title: 'dialog.dlcNotFound.title',
          content: 'dialog.dlcNotFound.content',
        }
      })
    }
  }

  onSignWithHex(sign: SignWithHex) {
    console.debug('onSignWithHex()', sign)

    const contractId = sign.sign.contractId

    const dlc = this.walletStateService.dlcs.value.find(dlc => dlc.contractId === contractId)
    if (dlc) { // && !dlc.isInitiator
      this.selectedSign = sign
      this.contracts.onRowClick(dlc) // calls back with onSelectedDLC()
    } else {
      console.error('could not find DLC in walletStateService to match contractId', contractId)
      const dialog = this.dialog.open(ErrorDialogComponent, {
        data: {
          title: 'dialog.dlcNotFound.title',
          content: 'dialog.dlcNotFound.content',
        }
      })
    }
  }

  onSelectedDLC(dlcContractInfo: DLCContractInfo) {
    console.debug('onSelectedDLC()')

    this.selectedDLC = dlcContractInfo.dlc
    this.selectedDLCContractInfo = dlcContractInfo.contractInfo

    this.hideConfigDebug()
    this.hideOffers()
    this.contractDetailsVisible = true
    this.rightDrawer.open()
  }

  private hideSelectedDLC() {
    this.contractDetailsVisible = false

    this.contracts.clearSelection()
    this.selectedDLC = null
    this.selectedDLCContractInfo = null
    this.selectedAccept = null
    this.selectedSign = null
  }

  private hideOffers() {
    this.offerVisible = false

    this.selectedAnnouncement = null
    this.selectedContractInfo = null
    this.selectedOffer = null
  }

  onCopyTorDLCHostAddress() {
    console.debug('onCopyTorDLCHostAddress()', this.walletStateService.torDLCHostAddress)
    copyToClipboard(this.walletStateService.torDLCHostAddress)
  }

  rightDrawerOpened(opened: boolean) {
    console.debug('rightDrawerOpened()', opened)
    // Clean up state on close
    if (!opened) {
      this.hideOffers()
      this.hideSelectedDLC()
    }
  }
  
}

import { OverlayContainer } from '@angular/cdk/overlay'
import { Component, HostBinding, OnInit, ViewChild } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Title } from '@angular/platform-browser'
import { TranslateService } from '@ngx-translate/core'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { BuildConfig } from '~type/proxy-server-types'
import { Announcement, ContractInfo, DLCContract, DLCMessageType, Offer, WalletMessageType } from '~type/wallet-server-types'
import { AnnouncementWithHex, ContractInfoWithHex, OfferWithHex } from '~type/wallet-ui-types'
import { copyToClipboard } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'
import { AcceptOfferComponent } from './component/accept-offer/accept-offer.component'
import { ContractsComponent, DLCContractInfo } from './component/contracts/contracts.component'
import { NewOfferComponent } from './component/new-offer/new-offer.component'


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

  constructor(private titleService: Title, private translate: TranslateService, public messageService: MessageService, private snackBar: MatSnackBar, private overlay: OverlayContainer,
    public walletStateService: WalletStateService) {
    
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
    this.rightDrawer.toggle()
  }

  onConfigurationClose() {
    console.debug('onConfigurationClose()')
    this.rightDrawer.close()
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

  // createContractInfo() {
  //   console.debug('createContractInfo()')
  //   // Data : https://test.oracle.suredbits.com/announcement/63fa7885e3c6052e97956961698cde2b286dc1621544bbd8fcfbd78b2b1dbdcf

  //   const announcementTLV: string = 'fdd824a8823cf7a3e449260f46d3d9a5bb0ddf1a367e0d3c9ce8858e16cd783392560bd1c9671314d54b6cb258bc6d85ab8fe238a27feb5a27d75323524a54d712a80b70a305b66d790ea4afe15b3fb61cae4d77f050e57b41f10f530c48a23dddbe335afdd822440001c3b0ecdaeaa3bbbd53386dec623b3a884b0ca2e2777cc62f0b6f891d9226114d614ebae0fdd80611000205546f64617908546f6d6f72726f7708546f6d6f72726f77'
  //   const totalCollateral = 100000
  //   const payoutsVal: any = {}
  //   this.messageService.sendMessage(getMessageBody(DLCMessageType.createcontractinfo, [announcementTLV, totalCollateral, payoutsVal])).subscribe(r => {
  //     console.warn(' createContractInfo()', r)
  //   })
  // }

  // https://github.com/AtomicFinance/node-dlc/blob/master/packages/messaging/lib/messages/DlcOffer.ts
  // makeNewOffer() {
  //   console.debug('makeNewOffer()')
  //   const contractInfoTLV = ''
  //   const collateral = 100000
  //   const feeRate = 1
  //   const locktime = new Date().getMilliseconds()
  //   const refundLT = new Date().getMilliseconds() + 100000
  //   this.messageService.sendMessage(getMessageBody(WalletMessageType.createdlcoffer, [contractInfoTLV, collateral, feeRate, locktime, refundLT])).subscribe(r => {
  //     console.warn(' makeNewOffer()', r)
  //   })
  // }

  onAnnouncement(announcement: AnnouncementWithHex) {
    console.debug('onAnnouncement()', announcement)

    this.hideOffers()
    this.selectedAnnouncement = announcement
    this.hideSelectedDLC()
  }

  onContractInfo(contractInfo: ContractInfoWithHex) {
    console.debug('onContractInfo()', contractInfo)

    this.hideOffers()
    this.selectedContractInfo = contractInfo
    this.hideSelectedDLC()
  }

  onAcceptOffer(offer: OfferWithHex) {
    console.debug('onAcceptOffer()', offer)

    this.hideOffers()
    this.selectedOffer = offer
    this.hideSelectedDLC()
  }

  onSelectedDLC(dlcContractInfo: DLCContractInfo) {
    console.debug('onSelectedDLC()')

    this.selectedDLC = dlcContractInfo.dlc
    this.selectedDLCContractInfo = dlcContractInfo.contractInfo

    this.hideOffers()    
  }

  private hideSelectedDLC() {
    this.contracts.clearSelection()
    this.selectedDLC = null
    this.selectedDLCContractInfo = null
  }

  private hideOffers() {
    this.selectedAnnouncement = null
    this.selectedContractInfo = null
    this.selectedOffer = null
    
    // this.buildOffer.announcement = <AnnouncementWithHex><unknown>null
    // this.acceptOffer.offer = <OfferWithHex><unknown>null
  }

  onCopyTorDLCHostAddress() {
    console.debug('onCopyTorDLCHostAddress()', this.walletStateService.torDLCHostAddress)
    copyToClipboard(this.walletStateService.torDLCHostAddress)
  }

  
}

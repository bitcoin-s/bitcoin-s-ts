import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatDrawer } from '@angular/material/sidenav'
import { ActivatedRoute } from '@angular/router'
import { Observable, of, Subscription } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { DLCFileService } from '~service/dlc-file.service'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'

import { CoreMessageType } from '~type/wallet-server-types'
import { AnnouncementWithHex, ContractInfoWithHex, OfferWithHex } from '~type/wallet-ui-types'

import { validateHexString } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'


@Component({
  selector: 'app-build-accept-offer',
  templateUrl: './build-accept-offer.component.html',
  styleUrls: ['./build-accept-offer.component.scss']
})
export class BuildAcceptOfferComponent implements OnInit, OnDestroy, AfterViewInit {

  DEBUG = false
  // DO NOT PUBLISH
  EnumOfferHex = ''
  NumericOfferHex = ''

  @ViewChild('rightDrawer') rightDrawer: MatDrawer

  @Output() announcement: EventEmitter<AnnouncementWithHex> = new EventEmitter<AnnouncementWithHex>()
  @Output() contractInfo: EventEmitter<ContractInfoWithHex> = new EventEmitter<ContractInfoWithHex>()
  @Output() acceptOffer: EventEmitter<OfferWithHex> = new EventEmitter<OfferWithHex>()

  // Testing Data
  // https://test.oracle.suredbits.com/announcement/63fa7885e3c6052e97956961698cde2b286dc1621544bbd8fcfbd78b2b1dbdcf
  enumAnnouncementHex = 'fdd824a8823cf7a3e449260f46d3d9a5bb0ddf1a367e0d3c9ce8858e16cd783392560bd1c9671314d54b6cb258bc6d85ab8fe238a27feb5a27d75323524a54d712a80b70a305b66d790ea4afe15b3fb61cae4d77f050e57b41f10f530c48a23dddbe335afdd822440001c3b0ecdaeaa3bbbd53386dec623b3a884b0ca2e2777cc62f0b6f891d9226114d614ebae0fdd80611000205546f64617908546f6d6f72726f7708546f6d6f72726f77'
  // https://test.oracle.suredbits.com/announcement/b4663b7a3aa43d228f350b74f8bbe30a96c9aaf344f8f7589e713863d419f3a2
  numericAnnouncementHex = 'fdd824fd016beb851d39afa08cc3d3445ee2696c105f3717bb087346acb95a77dacb9aba17f5f944e6ea8db22f926b7dfd17a306ab927f51b7b26b92c9f9cca4e83d28fb7861a305b66d790ea4afe15b3fb61cae4d77f050e57b41f10f530c48a23dddbe335afdd822fd01050007a5a92a821927337b40a30e152052482f894ff8ecfe3f5a1aa4aa3b6720bf7a2d61d7b210ecd7217d4d342c5e78a99360f920876e461fea671950622ec6a23b9d1c04bc48c6332bfe089fac15b600721f3120cc8d721ba387b59385cef7ea788e7e1cf1bc6cb8d45cf594e7af811bed009c1899439c58a82527684d50b9ed150c1127a45a7e2c93edeb9307e1c2daac7cf6658a488b7159e29e551b9dac141f42e9f41989a0e2bd4064ecf8a09d81285504ae2ec425ff2ab98feb975b4e7e64e70e4e4016a857044d634af12f361f264272a526c08fa39d2116d9136ef00024d870dbd880fdd80a0e00020004556e69740000000000070c6e756d657269634576656e74'
  // https://test.oracle.suredbits.com/contract/enum/ff565f1d3abcc83bc3c470c783c37b31ff0fe5552bb6bd5b176d651b4250a7af
  enumContractInfoHex = 'fdd82ef400000000000186a0fda71018020359455300000000000186a0024e4f0000000000000000fda712ccfdd824c81d9f316ca49f7dba3544eb8aa4db9d7d3d2f5590352cd0eb2bf8bac70877d2e35862a9cb8112dab3234665c80bb99002fa87ea027cc7cd4d96cbd082ad23569e5d1bcfab252c6dd9edd7aea4c5eeeef138f7ff7346061ea40143a9f5ae80baa9fdd8226400011ba97f848d290edf97a4bdeedbb9df2b963c2690ed0099c00bceb4c2ceb7ca6760835170fdd80609000203594553024e4f30436f696e62617365204254432f555344203e3d202435312c30303020323032312d30342d32335432333a30303a30305a'
  // https://test.oracle.suredbits.com/contract/numeric/fd77c10613f25566c9aa9da72e4f02d1271a4cd0d9287ac461a21f50464232e6
  numericContractInfoHex = 'fdd82efd034100000000000186a0fda720540012fda72648000501000000000000000000000001fd753000000000000061a8000001fd88b8000000000000c350000001fd9c4000000000000186a0000001fe0003ffff00000000000186a00000fda724020000fda712fd02dbfdd824fd02d527bd1f768121a074176a1986e2cacd46e6cd992a7b3d5ac3827a3f90b5f12d0753ec47c521966aae316c65a4350e22207ae47286d343de866f19f5eeb7de13815d1bcfab252c6dd9edd7aea4c5eeeef138f7ff7346061ea40143a9f5ae80baa9fdd822fd026f001296d22911c0abd9f2736a45ce0fac39ccd7ded8cbd7a88d160c86e66c37d698a5934f30404cf929aa1f3fe40a04c3c952ca8c6b239c01c9b61676fb7590876b015811222090ee7015017617f468ed05d567e511d9d76d5d115dee863e5f43f8654509a3f2643971573e74f5c5bf5b9d482768a50726383c784af741ae4f59b61ab80d24f5b25dc4c826fd4275715b047dc55b23814d2b81539fcbcd536bd858b0cab6b1a6e7050943a0ee3e01ea005abf62abbd28f8c07362c53d6c187d8eb88dd9b4fd15aad3c3b2271c62bfa8eef0504912164a0f16ca931d59e3dc63d3d92eae714f2abe0f9a0d215357845b3137bf8c96fac0726c82735a23a3baa656229fdcca56ca502cb1623a985e1f6be919c7cfe11155ebf802d4544d4dfc7b354f644e3fb99088aef2c0d71916178c9f3695089e85edfe27044a9cf1a7b821a2a239a196682a0a35ad1a2f60f0f888aa51e4a0a44523592996de3f7f93af6c587f6252b850c562e1bfb97e0a8ee1406ae0c129d34b42a2d8a44597a0147c5cc0dc192beb614664e9b1949f1d95b4ae92ec85617e93b1fb6991b994df3b26ca21aacc908ed102de9988c55cf3a3a70c87e4067ae7648efd6763cd6655ce2c98b5b298ca7eb94fefaf53f58fdd3cbd486da3d79e651dfd392dccf2bd60dfbc708ca171587cda472646709ee6d51650eb2a808796ffd709b041c00afe0e028530f7bb888d90dff6ec6902108e1ec5a1bd1ba33515fdfe1bdb49bd3dfa576de14f83e51ac53a2f72fe6556576ee76cbbfc1e5f09c7ad076fd7ca847962c87dce96dd496d6062da80fdd80a11000200074254432d55534400000000001213446572696269742d4254432d33304d41523231'
  // Unpublished
  enumOfferHex = this.EnumOfferHex
  numericOfferHex = this.NumericOfferHex

  // Build
  selectedAnnouncement: AnnouncementWithHex|null
  selectedContractInfo: ContractInfoWithHex|null
  // Accept
  selectedOffer: OfferWithHex|null

  offerVisible = false

  offerSub: Subscription

  constructor(private route: ActivatedRoute, private messageService: MessageService, 
    private walletStateService: WalletStateService, private dlcFileService: DLCFileService,
    private dialog: MatDialog) { }

  ngOnInit(): void {}

  ngOnDestroy() {
    this.offerSub.unsubscribe()
  }

  ngAfterViewInit() {
    this.offerSub = this.dlcFileService.offer$.subscribe(offer => {
      if (offer) {
        console.debug('ba-offer on offer', offer)
        this.onAcceptOffer(offer)
        this.dlcFileService.clearOffer()
      }
    })
  }

  onBuildOfferPaste(event: ClipboardEvent) {
    console.debug('onBuildOfferPaste()', event)
    const clipboardData = event.clipboardData
    if (clipboardData) {
      const trimmedPastedText = clipboardData.getData('text').trim()
      this.onBuildOffer(trimmedPastedText)
    }
  }

  // TODO : May want to pass in input reference and mark invalid/valid
  validateHex(hex: string) {
    let valid = validateHexString(hex)
    if (!valid) {
      const dialog = this.dialog.open(ErrorDialogComponent, {
        data: {
          title: 'dialog.error',
          content: 'buildAcceptOffer.invalidHex',
        }
      })
    }
    return valid
  }

  onBuildOffer(hex: string) {
    console.debug('onBuildOffer()', hex)
    if (hex) {
      if (!this.validateHex(hex)) return

      // Suppressing error handling so any of these calls can fail gracefully
      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeannouncement, [hex]), false).pipe(catchError((error: any) => {
        console.debug('failed to decode announcement')
        // Try another
        this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [hex]), false).pipe(catchError((error: any) => {
          console.debug('failed to decode contract info')
          const dialog = this.dialog.open(ErrorDialogComponent, {
            data: {
              title: 'dialog.error',
              content: 'buildAcceptOffer.invalidAnnouncementContractInfoHex',
            }
          })
          return new Observable<any>()
        })).subscribe(r => {
          console.debug('decodecontractinfo', r)
          if (r.result) {
            this.onContractInfo(<ContractInfoWithHex>{ contractInfo: r.result, hex })
          }
        })
        return new Observable<any>()
      })).subscribe(r => {
        console.debug('decodeannouncement', r)
        if (r.result) {
          this.onAnnouncement(<AnnouncementWithHex>{ announcement: r.result, hex })
        }
      })
    }
  }

  onAcceptOfferPaste(event: ClipboardEvent) {
    console.debug('onAcceptOfferPaste()', event)
    const clipboardData = event.clipboardData
    if (clipboardData) {
      const trimmedPastedText = clipboardData.getData('text').trim()
      this.handleAcceptOffer(trimmedPastedText)
    }
  }

  handleAcceptOffer(hex: string) {
    console.debug('handleAcceptOffer()', hex)
    if (hex) {
      if (!this.validateHex(hex)) return

      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeoffer, [hex]), false)
      .pipe(catchError(error => of({ result: null }))).subscribe(r => {
        console.debug('decodeoffer', r)

        if (r.result) {
          this.onAcceptOffer(<OfferWithHex>{ offer: r.result, hex })
        } else {
          const dialog = this.dialog.open(ErrorDialogComponent, {
            data: {
              title: 'dialog.error',
              content: 'buildAcceptOffer.invalidOfferHex',
            }
          })
        }
      })
    }
  }

  onAnnouncement(announcement: AnnouncementWithHex) {
    console.debug('onAnnouncement()', announcement)
    this.selectedAnnouncement = announcement
    this.announcement.next(announcement)
    this.offerVisible = true
    this.rightDrawer.open()
  }

  onContractInfo(contractInfo: ContractInfoWithHex) {
    console.debug('onContractInfo()', contractInfo)
    this.selectedContractInfo = contractInfo
    this.contractInfo.next(contractInfo)
    this.offerVisible = true
    this.rightDrawer.open()
  }

  onAcceptOffer(offer: OfferWithHex) {
    console.debug('onAcceptOffer()', offer)
    this.selectedOffer = offer
    this.acceptOffer.next(offer)
    this.offerVisible = true
    this.rightDrawer.open()
  }

  rightDrawerOpened(opened: boolean) {
    console.debug('rightDrawerOpened()', opened)
    // Clean up state on close
    if (!opened) {
      this.clearSelection()
    }
  }

  clearSelection() {
    this.rightDrawer.close()
    this.selectedAnnouncement = null
    this.selectedContractInfo = null
    this.selectedOffer = null
  }

}

import { Component, OnInit, ViewChild } from '@angular/core'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Title } from '@angular/platform-browser'
import { TranslateService } from '@ngx-translate/core'

import { MessageService } from '~service/message.service'
import { OracleAnnouncement } from '~type/oracle-server-types'

import { NewAnnouncementComponent } from './new-announcement/new-announcement.component'


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('rightDrawer') rightDrawer: MatDrawer
  @ViewChild('leftDrawer') leftDrawer: MatDrawer

  @ViewChild('newAnnouncement') newAnnouncement: NewAnnouncementComponent

  // Left side
  showNewAnnouncement = false
  // Right side
  showConfiguration = false
  showAnnouncementDetail = false
  showSignMessage = false

  detailAnnouncement: OracleAnnouncement|undefined

  constructor(private titleService: Title, private translate: TranslateService, public messageService: MessageService, private snackBar: MatSnackBar) {

  }

  ngOnInit() {
    this.titleService.setTitle(this.translate.instant('title'))
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

  private hideLeftDrawerItems() {
    this.showNewAnnouncement = false
  }

  private hideRightDrawerItems() {
    this.showConfiguration = false
    this.showAnnouncementDetail = false
    this.showSignMessage = false

    this.detailAnnouncement = undefined
  }

  onShowCreateAnnouncement() {
    console.debug('onShowCreateAnnouncement()')
    if (this.leftDrawer.opened && this.showNewAnnouncement) {
      return
    } else if (this.newAnnouncement) {
      this.newAnnouncement.reset()
    }
    this.hideLeftDrawerItems()
    this.showNewAnnouncement = true
    this.leftDrawer.open()
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

  onShowAnnouncementDetail(announcement: OracleAnnouncement) {
    console.debug('onShowAnnouncementDetail()', announcement, 'detailEvent', this.detailAnnouncement)

    if (!announcement || this.detailAnnouncement === announcement) {
      this.rightDrawer.close()
      this.detailAnnouncement = undefined
    } else {
      this.hideRightDrawerItems()
      this.detailAnnouncement = announcement
      this.showAnnouncementDetail = true
      this.rightDrawer.open()
    }
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

  closeLeftDrawer() {
    console.debug('closeLeftDrawer()')
    this.leftDrawer.close()
    this.hideLeftDrawerItems()
  }

  closeRightDrawer() {
    console.debug('closeRightDrawer()')
    this.rightDrawer.close()
    this.hideRightDrawerItems()
  }

  onBackdropClick(event: any) {
    console.debug('onBackdropClick()')
    this.hideRightDrawerItems()
  }

}

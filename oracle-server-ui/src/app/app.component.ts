import { Component, OnInit, ViewChild } from '@angular/core'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Title } from '@angular/platform-browser'
import { TranslateService } from '@ngx-translate/core'

import { MessageService } from '~service/message.service'
import { OracleEvent } from '~type/oracle-server-types'

import { NewEventComponent } from './new-event/new-event.component'


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('rightDrawer') rightDrawer: MatDrawer
  @ViewChild('leftDrawer') leftDrawer: MatDrawer

  @ViewChild('newEvent') newEvent: NewEventComponent

  // Left side
  showNewEvent = false
  // Right side
  showConfiguration = false
  showEventDetail = false
  showSignMessage = false

  detailEvent: OracleEvent|undefined

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
    this.showNewEvent = false
  }

  private hideRightDrawerItems() {
    this.showConfiguration = false
    this.showEventDetail = false
    this.showSignMessage = false

    this.detailEvent = undefined
  }

  onShowCreateEvent() {
    console.debug('onShowCreateEvent()')
    if (this.leftDrawer.opened && this.showNewEvent) {
      return
    } else if (this.newEvent) {
      this.newEvent.reset()
    }
    this.hideLeftDrawerItems()
    this.showNewEvent = true
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

  onShowEventDetail(event: OracleEvent) {
    console.debug('onShowEventDetail()', event, 'detailEvent', this.detailEvent)

    if (!event || this.detailEvent === event) {
      this.rightDrawer.close()
      this.detailEvent = undefined
    } else {
      this.hideRightDrawerItems()
      this.detailEvent = event
      this.showEventDetail = true
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

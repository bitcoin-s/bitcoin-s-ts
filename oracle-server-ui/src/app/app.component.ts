import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

import { MessageService } from '~service/message.service';
import { OracleEvent } from '~type/oracle-server-types';
import { NewEventComponent } from './new-event/new-event.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('rightDrawer') rightDrawer: MatDrawer
  @ViewChild('leftDrawer') leftDrawer: MatDrawer

  @ViewChild('newEvent') newEvent: NewEventComponent

  showEvent = false
  showEventDetail = false

  showNewEvent = false
  showSignMessage = false

  detailEvent: OracleEvent|undefined

  constructor(private translate: TranslateService, public messageService: MessageService, private snackBar: MatSnackBar) {

  }

  ngOnInit() {
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
    this.showSignMessage = false
  }

  private hideRightDrawerItems() {
    this.showEventDetail = false
    this.showEvent = false
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
    // TODO : Would be nice to reset state and focus Name field each open
  }

  onShowSignMessage() {
    console.debug('onShowSignMessage()')
    this.hideLeftDrawerItems()
    this.showSignMessage = true
    this.leftDrawer.open()
  }

  onShowEventDrawer() {
    console.debug('onShowEventDrawer()')
    this.hideRightDrawerItems()
    this.showEvent = true
    this.rightDrawer.toggle()
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

  closeLeftDrawer() {
    console.debug('closeLeftDrawer()')
    this.leftDrawer.close()
  }

  closeRightDrawer() {
    console.debug('closeRightDrawer()')
    this.rightDrawer.close()
    this.detailEvent = undefined
  }

}

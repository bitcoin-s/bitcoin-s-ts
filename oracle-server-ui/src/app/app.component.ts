import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

import { MessageService } from '~service/message.service';
import { OracleEvent } from '~type/oracle-server-types';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('rightDrawer') rightDrawer: MatDrawer
  @ViewChild('leftDrawer') leftDrawer: MatDrawer

  showEvent = false
  showEventDetail = false

  showNewEvent = false
  showSignMessage = false

  detailEvent: OracleEvent

  constructor(private translate: TranslateService, public messageService: MessageService, private snackBar: MatSnackBar) {

  }

  ngOnInit() {
    this.messageService.oracleHeartbeat().subscribe(result => {
      if (result) {
        const oracleRunning = result.success
        const key = oracleRunning ? 'oracleEvent.serverFound' : 'oracleEvent.serverNotFound'
        this.snackBar.open(this.translate.instant(key), this.translate.instant('action.dismiss'))
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
    console.debug('onShowEventDetail()', event)
    this.hideRightDrawerItems()
    this.detailEvent = event
    this.showEventDetail = true
    this.rightDrawer.open()
  }

  closeLeftDrawer() {
    console.debug('closeLeftDrawer()')
    this.leftDrawer.close()
  }

  closeRightDrawer() {
    console.debug('closeRightDrawer()')
    this.rightDrawer.close()
  }

}

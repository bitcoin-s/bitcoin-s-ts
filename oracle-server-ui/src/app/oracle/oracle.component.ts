import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { forkJoin } from 'rxjs'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'
import { BlockstreamService } from '~service/blockstream-service'
import { MessageService } from '~service/message.service'
import { OracleExplorerService } from '~service/oracle-explorer.service'
import { OracleAnnouncementsResponse } from '~type/oracle-explorer-types'
import { MessageType, OracleEvent } from '~type/oracle-server-types'
import { getMessageBody } from '~util/message-util'
import { KrystalBullImages } from '~util/ui-util'


@Component({
  selector: 'app-oracle',
  templateUrl: './oracle.component.html',
  styleUrls: ['./oracle.component.scss']
})
export class OracleComponent implements OnInit, AfterViewInit {

  @Output() showCreateEvent: EventEmitter<void> = new EventEmitter();
  @Output() showEventDetail: EventEmitter<OracleEvent> = new EventEmitter();
  @Output() showConfiguration: EventEmitter<void> = new EventEmitter();
  @Output() showSignMessage: EventEmitter<void> = new EventEmitter();

  public KrystalBullImages = KrystalBullImages

  hideRawButtons = true

  @ViewChild(MatTable) table: MatTable<OracleEvent>
  @ViewChild(MatSort) sort: MatSort

  bullIndex = 0
  bullSrc = KrystalBullImages[0]

  // Oracle Info
  oracleName = ''
  oracleNameReadOnly = true // don't allow editing until checking for a name
  publicKey = ''
  stakingAddress = ''
  stakedAmount = ''

  // Server state
  eventNames: string[] = []
  events: { [eventName: string]: OracleEvent } = {}
  announcements: { [eventName: string]: OracleAnnouncementsResponse } = {} // should this index on sha256 id instead?
  flatEvents: OracleEvent[] = []

  // Grid config
  dataSource = new MatTableDataSource(this.flatEvents)
  displayedColumns = ['eventName','announcement', 'outcomes', 'maturationTime', 'signedOutcome']

  constructor(public dialog: MatDialog, private messageService: MessageService, public oracleExplorerService: OracleExplorerService, 
    private blockstreamService: BlockstreamService) { }

  ngOnInit() {
    this.oracleExplorerService.oracleName.subscribe(name => {
      this.oracleName = name
    })
    this.oracleExplorerService.serverOracleName.subscribe(serverSet => {
      this.oracleNameReadOnly = serverSet
    })
    this.oracleExplorerService.oracleExplorer.subscribe(oe => {
      this.getLocalEventAnnouncements() // Check for announcements on new Explorer
    })
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    this.onGetPublicKey()
    this.onGetStakingAddress()
    this.getAllEvents()
  }

  /** Oracle Explorer handlers */

  listAnnouncements() {
    this.oracleExplorerService.listAnnouncements().subscribe(result => {
      console.debug('listAnnouncements()', result)
      if (result) {
        // TODO
      }
    })
  }

  private getOracleName(publicKey: string) {
    this.oracleExplorerService.getLocalOracleName(publicKey).subscribe(result => {
      console.debug('getOracleName()', result)
    })
  }

  /** Blockstream handlers */

  getStakingBalance(address: string) {
    this.blockstreamService.getBalance(address).subscribe(result => {
      this.stakedAmount = this.blockstreamService.balanceFromGetBalance(result).toString()
    })
  }

  /** Debug button handlers */

  onOracleHeartbeat() {
    console.debug('onOracleHeartbeateartbeat')
    this.messageService.oracleHeartbeat().subscribe(result => {
      console.debug('oracle heartbeat:', result)
    })
  }

  onGetPublicKey() {
    console.debug('onGetPublicKey')
    this.messageService.sendMessage(getMessageBody(MessageType.getpublickey)).subscribe(result => {
      if (result.result) {
        this.publicKey = result.result
        if (!this.oracleName) {
          this.getOracleName(this.publicKey)
        }
      }
    })
  }

  onGetStakingAddress() {
    console.debug('onGetStakingAddress')
    this.messageService.sendMessage(getMessageBody(MessageType.getstakingaddress)).subscribe(result => {
      if (result.result) {
        this.stakingAddress = result.result
        this.getStakingBalance(this.stakingAddress)
      }
    })
  }

  onListEvents() {
    console.debug('onListEvents')
    const m = getMessageBody(MessageType.listevents)
    this.messageService.sendMessage(m).subscribe(result => {
      if (result.result) {
        this.eventNames = result.result
      }
    })
  }

  private onGetEvent(eventName: string) {
    console.debug('onGetEvent', eventName)
    const m = getMessageBody(MessageType.getevent, [eventName])
    this.messageService.sendMessage(m).subscribe(result => {
      if (result.result) {
        const e = <OracleEvent>result.result
        this.addEventToState(e)
        console.warn('flatEvents:', this.flatEvents)
        this.dataSource.data = this.flatEvents
        this.table.renderRows()

        // Could auto-check for announcement here
      }
    })
  }

  private addEventToState(e: OracleEvent) {
    if (e) {
      this.events[e.eventName] = e
      this.flatEvents.push(e)
    }
  }

  // listevents, then get each event from the oracleServer
  getAllEvents() {
    console.debug('getAllEvents()')
    const m = getMessageBody(MessageType.listevents)
    this.flatEvents.length = 0
    this.messageService.sendMessage(m).subscribe(result => {
      if (result.result) {
        this.eventNames = result.result
        const events = []
        for (const e of this.eventNames) {
          events.push(this.messageService.sendMessage(getMessageBody(MessageType.getevent, [e])))
        }
        forkJoin(events).subscribe((results) => {
          if (results) {
            for (const e of results) {
              this.addEventToState(<OracleEvent>e.result)
            }
          }
          this.dataSource.data = this.flatEvents
          this.table.renderRows()
          this.getLocalEventAnnouncements()
        })
      }
    })
  }

  getLocalEventAnnouncements() {
    console.debug('getLocalEventAnnouncements()', this.flatEvents)
    for (const e of this.flatEvents) {
      this.getAnnouncement(e)
    }
  }

  // Check if the event is published to the oracle explorer
  private getAnnouncement(e: OracleEvent) {
    this.oracleExplorerService.getAnnouncement(e.announcementTLVsha256).subscribe(result => {
      console.debug('getAnnouncement()', e.announcementTLVsha256, result)
      this.announcements[e.eventName] = result // will be null for no result
    })
  }

  /* UI Functions */

  onImageClick() {
    console.debug('onImageClick()')
    let t = this.bullIndex + 1
    if (t === KrystalBullImages.length) t = 0
    this.bullIndex = t
  }

  onOracleNameEnter(event: any) {
    event.target.blur()
    return false
  }

  onOracleName() {
    console.debug('onOracleName()', this.oracleName)
    if (this.oracleName && this.oracleName !== this.oracleExplorerService.oracleName.value) {
      const dialog = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'dialog.confirmOracleName.title',
          content: 'dialog.confirmOracleName.content',
          params: { oracleName: this.oracleName },
          action: 'dialog.confirmOracleName.action',
        }
      }).afterClosed().subscribe(result => {
        console.debug(' set oracleName:', result)
        if (result) {
          // TODO : Test how Oracle Explorer handles uniqueness
          this.oracleExplorerService.setOracleName(this.oracleName)
        } else {
          this.oracleName = this.oracleExplorerService.oracleName.value
        }
      })
    } else {
      this.oracleName = this.oracleExplorerService.oracleName.value
    }
  }

  onShowCreateEvent() {
    console.debug('onShowCreateEvent()')
    this.showCreateEvent.next()
  }

  onShowConfiguration() {
    console.debug('onShowConfiguration()')
    this.showConfiguration.next()
  }

  onShowSignMessage() {
    console.debug('onShowSignMessage()')
    this.showSignMessage.next()
  }

  onShowDebug() {
    console.debug('onShowDebug()')
    this.hideRawButtons = !this.hideRawButtons
  }

  formatOutcomes(outcomes: [any]): string {
    if (outcomes && outcomes.length > 0) {
      const head = outcomes[0]
      if (Array.isArray(head) && head.length === 2) {
        // numeric outcomes
        const signed = head[0] === '+' && head[1] === '-'
        const exp = signed ? outcomes.length - 1 : outcomes.length
        const outcome = (2 ** exp) - 1
        return signed ? '-' + outcome + '..' + outcome : '0..' + outcome
      } else {
        // enum and all other outcomes
        return '' + outcomes
      }
    } else {
      return ''
    }
  }

  onRowClick(event: OracleEvent) {
    console.debug('onRowClick()', event)
    this.showEventDetail.next(event)
    if (!this.announcements[event.eventName]) {
      this.getAnnouncement(event)
    }
  }

  onAnnouncementClick(event: OracleEvent) {
    console.debug('onAnnouncementClick()', event)
    if (!this.announcements[event.eventName]) {
      this.oracleExplorerService.createAnnouncement(event).subscribe(result => {
        console.warn('announcement:', result)
      })
    }
  }

}

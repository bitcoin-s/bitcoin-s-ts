import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';

import { MessageService } from '~service/message.service';
import { MessageType, OracleEvent } from '~type/oracle-server-types';
import { getMessageBody } from '~util/message-util';
import { KrystalBullImages } from '~util/ui-util';


@Component({
  selector: 'app-oracle',
  templateUrl: './oracle.component.html',
  styleUrls: ['./oracle.component.scss']
})
export class OracleComponent implements OnInit, AfterViewInit {

  @Output() showCreateEvent: EventEmitter<void> = new EventEmitter();
  @Output() showEventDetail: EventEmitter<OracleEvent> = new EventEmitter();
  @Output() showSignMessage: EventEmitter<void> = new EventEmitter();

  public KrystalBullImages = KrystalBullImages

  hideRawButtons = true

  @ViewChild(MatTable) table: MatTable<OracleEvent>
  @ViewChild(MatSort) sort: MatSort

  bullIndex = 0
  bullSrc = KrystalBullImages[0]

  // Oracle Info
  oracleName = ''
  publicKey = ''
  stakingAddress = ''
  stakedAmount = ''

  // Server state
  eventNames: string[] = []
  events: { [eventName: string]: OracleEvent } = {}
  flatEvents: OracleEvent[] = []

  // Grid config
  dataSource = new MatTableDataSource(this.flatEvents)
  displayedColumns = ['eventName', 'maturationTime', 'outcomes', 'attestations']

  constructor(private messageService: MessageService) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    this.onGetPublicKey()
    this.onGetStakingAddress()
    this.getAllEvents()
  }

  /* Debug button handlers */

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
      }
    })
  }

  onGetStakingAddress() {
    console.debug('onGetStakingAddress')
    this.messageService.sendMessage(getMessageBody(MessageType.getstakingaddress)).subscribe(result => {
      if (result.result) {
        this.stakingAddress = result.result
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

  onGetEvent(eventName: string) {
    console.debug('onGetEvent', eventName)
    const m = getMessageBody(MessageType.getevent, [eventName])
    this.messageService.sendMessage(m).subscribe(result => {
      if (result.result) {
        const e = <OracleEvent>result.result
        this.events[eventName] = e

        this.flatEvents.push(e)
        this.dataSource.data = this.flatEvents
        this.table.renderRows()
      }
    })
  }

  getAllEvents() {
    const m = getMessageBody(MessageType.listevents)
    this.flatEvents.length = 0
    this.messageService.sendMessage(m).subscribe(result => {
      if (result.result) {
        this.eventNames = result.result
        for (const e of this.eventNames) {
          this.onGetEvent(e)
        }
      }
    })
  }

  /* UI Functions */

  onImageClick() {
    console.debug('onImageClick()')
    let t = this.bullIndex + 1
    if (t === KrystalBullImages.length) t = 0
    this.bullIndex = t
  }

  onShowCreateEvent() {
    console.debug('onShowCreateEvent()')
    this.showCreateEvent.next()
  }

  onShowSignMessage() {
    console.debug('onShowSignMessage()')
    this.showSignMessage.next()
  }

  onShowDebug() {
    console.debug('onShowDebug()')
    this.hideRawButtons = !this.hideRawButtons
  }

  onRowClick(event: OracleEvent) {
    console.debug('onRowClick()', event)
    this.showEventDetail.next(event)
  }

  formatOutcomes(outcomes: [any]): string {
    if (outcomes.length > 0) {
      let head = outcomes[0]
      if (typeof head == "object" && head.length == 2) {
        // numeric outcomes
        let signed = head[0] == "+" && head[1] == "-"
        let exp = signed ? outcomes.length - 1 : outcomes.length
        let outcome = 2 ** exp
        return signed ? "-" + outcome + ".." + outcome : "0.." + outcome
      } else  {
        // enum and all other outcomes
        return "" + outcomes
      }
    } else {
      return ""
    }
  }

}

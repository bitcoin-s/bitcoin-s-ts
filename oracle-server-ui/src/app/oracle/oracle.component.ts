import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';

import { MessageService } from '~service/message.service';
import { MessageType, OracleEvent } from '~type/oracle-server-types';
import { getMessageBody } from '~util/message-util';


@Component({
  selector: 'app-oracle',
  templateUrl: './oracle.component.html',
  styleUrls: ['./oracle.component.scss']
})
export class OracleComponent implements OnInit, AfterViewInit {

  @Output() showCreateEvent: EventEmitter<void> = new EventEmitter();
  @Output() showEventDetail: EventEmitter<OracleEvent> = new EventEmitter();
  @Output() showSignMessage: EventEmitter<void> = new EventEmitter();

  hideRawButtons = true

  form: FormGroup
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  @ViewChild(MatTable) table: MatTable<OracleEvent>
  @ViewChild(MatSort) sort: MatSort

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

  constructor(private messageService: MessageService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      oracleName: [null],
      publicKey: [null],
      stakingAddress: [null],
      stakedAmount: [null],
    })
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    this.onGetPublicKey()
    this.onGetStakingAddress()
    this.getAllEvents()
  }

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

}

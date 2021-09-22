import { HttpErrorResponse } from '@angular/common/http';
import { ThisReceiver } from '@angular/compiler';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MessageService } from '~service/message.service';
import { OracleExplorerService } from '~service/oracle-explorer.service';

import { MessageType, OracleEvent } from '~type/oracle-server-types';
import { getMessageBody } from '~util/message-util';


@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit {

  _event!: OracleEvent
  get event(): OracleEvent { return this._event }
  @Input() set event(e: OracleEvent) { this.reset(); this._event = e }

  @Output() close: EventEmitter<void> = new EventEmitter()

  signEventInput = ''
  signDigitsInput: number|undefined = undefined
  signatures = ''

  private reset() {
    this.signEventInput = ''
    this.signDigitsInput = undefined
    this.signatures = ''
  }

  constructor(private messageService: MessageService, private oracleExplorerService: OracleExplorerService) { }

  ngOnInit(): void { }

  // Proxies for knowing eventType
  isEnum() {
    return typeof this.event.outcomes[0] === 'string'
  }
  isNotEnum() {
    return Array.isArray(this.event.outcomes[0])
  }

  // onSendToOracleExplorer() {
  //   console.debug('onSendToOracleExplorer()')
  //   this.oracleExplorerService.createAnnouncement(this.event).subscribe(result => {
  //     console.debug(' createAnnouncement', result)
  //   }, (error: HttpErrorResponse) => {
  //     console.error(' createAnnouncement error', error)
  //     if (error.status === 500) {
  //       // Already exists
  //     }
  //   })
  //   // Attestations
  //   if (this.event.attestations) {
  //     this.oracleExplorerService.createAttestations(this.event).subscribe(result => {
  //       console.warn(' createAttestations', result)
  //     }, (error: HttpErrorResponse) => {
  //       console.error(' createAttestations error', error)
  //       if (error.status === 500) {
  //         // Already exists
  //       }
  //     })
  //   }
  // }

  onSignEvent() {
    console.debug('onSignEvent', this.event.eventName, this.signEventInput)
    const m = getMessageBody(MessageType.signevent, [this.event.eventName, this.signEventInput])
    this.messageService.sendMessage(m).subscribe(result => {
      console.debug(' onSignEvent', result)
      if (result.result) {
        this.event.signedOutcome = this.signEventInput
      }
    }, error => {
      console.error('error signing event')
      // TODO : Error dialog
    })
  }
  
  onSignDigits() {
    console.debug('onSignDigits', this.event.eventName, this.signDigitsInput)
    const m = getMessageBody(MessageType.signdigits, [this.event.eventName, this.signDigitsInput])
    this.messageService.sendMessage(m).subscribe()
  }

  onGetSignatures() {
    console.debug('onGetSignatures', this.event.eventName)
    const m = getMessageBody(MessageType.getsignatures, [this.event.eventName])
    this.messageService.sendMessage(m).subscribe(result => {
      if (result.result) {
        this.signatures = result.result
      }
    })
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

}

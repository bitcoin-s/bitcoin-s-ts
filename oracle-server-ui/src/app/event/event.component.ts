import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { MessageService } from '~service/message.service';
import { MessageType, OracleEvent } from '~type/oracle-server-types';
import { getMessageBody } from '~util/message-util';


@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss']
})
export class EventComponent {

  @Output() close: EventEmitter<void> = new EventEmitter()

  eventNameInput = 'testEvent'
  signEventInput = ''
  signDigitsInput: number|undefined = undefined

  constructor(private messageService: MessageService) { }

  onGetEvent(eventName: string) {
    console.debug('onGetEvent', eventName)
    const m = getMessageBody(MessageType.getevent, [eventName])
    this.messageService.sendMessage(m).subscribe(result => {
      if (result.result) {
        const e = <OracleEvent>result.result
        // this.events[eventName] = e
        console.warn('e:', e)
      }
    })
  }

  onSignEvent() {
    console.debug('onSignEvent', this.eventNameInput, this.signEventInput)
    const m = getMessageBody(MessageType.signevent, [this.eventNameInput, this.signEventInput])
    this.messageService.sendMessage(m).subscribe()
  }
  
  onSignDigits() {
    console.debug('onSignDigits', this.eventNameInput, this.signDigitsInput)
    const m = getMessageBody(MessageType.signdigits, [this.eventNameInput, this.signDigitsInput])
    this.messageService.sendMessage(m).subscribe()
  }

  onGetSignatures() {
    console.debug('onGetSignatures', this.eventNameInput)
    const m = getMessageBody(MessageType.getsignatures, [this.eventNameInput])
    this.messageService.sendMessage(m).subscribe()
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

}

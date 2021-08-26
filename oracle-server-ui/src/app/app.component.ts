import { Component, ViewChild } from '@angular/core';
import { tap } from 'rxjs/operators';

import { MessageService } from 'src/service/message.service';
import { EventType, getMessageBody, MESSAGE_TYPE, OracleEvent, OracleServerMessage } from 'src/util/message-util';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public EventType = EventType

  host = '127.0.0.1'
  port = '9998' // '9999'

  signMessageInput = ''
  eventNameInput = 'testEvent'
  signEventInput = ''
  signDigitsInput: number|undefined = undefined

  newEventType = EventType.ENUM
  newEventName = ''
  maturationTime = '2030-01-01T00:00:00.000Z'
  maturationTimeSeconds = 1893456000
  // Enum Event
  outcomes = 'One,Two,Three'
  // Numeric Event
  minValue = 0
  maxValue = 127
  unit = 'Unit'
  precision = 0
  // Digit Decomp Event
  numdigits = 3 // to match maxValue
  base = 2
  signed = false

  eventNames: string[] = []
  events: { [eventName: string]: OracleEvent } = {}

  sentType: MESSAGE_TYPE|undefined = undefined
  messageResults = ''

  constructor(private messageService: MessageService) {

  }

  onGetPublicKey() {
    console.debug('onGetPublicKey')
    this.sendMessage(getMessageBody(MESSAGE_TYPE.getpublickey)).subscribe()
  }

  onGetStakingAddress() {
    console.debug('onGetStakingAddress')
    this.sendMessage(getMessageBody(MESSAGE_TYPE.getstakingaddress)).subscribe()
  }

  onListEvents() {
    console.debug('onListEvents')
    const m = getMessageBody(MESSAGE_TYPE.listevents)
    this.sendMessage(m).subscribe(result => {
      if (result.result) {
        this.eventNames = result.result
      }
    })
  }

  onSignMessage() {
    console.debug('onSignMessage', this.signMessageInput)
    const m = getMessageBody(MESSAGE_TYPE.signmessage, [this.signMessageInput])
    this.sendMessage(m).subscribe()
  }

  onGetEvent(eventName: string) {
    console.debug('onGetEvent', eventName)
    const m = getMessageBody(MESSAGE_TYPE.getevent, [eventName])
    this.sendMessage(m).subscribe(result => {
      if (result.result) {
        const e = <OracleEvent>result.result
        this.events[eventName] = e
        // This seems to be server-side only
        // const d = EventDescriptor.deserialize(Buffer.from(e.eventDescriptorTLV))
        // console.debug('decoded EventDescriptor', d)

        // Could make mapping to IEnumEventDescriptorV0JSON, IDigitDecompositionEventDescriptorV0JSON
        // at a mid-tier proxy
      }
    })
  }

  onSignEvent() {
    console.debug('onSignEvent', this.eventNameInput, this.signEventInput)
    const m = getMessageBody(MESSAGE_TYPE.signevent, [this.eventNameInput, this.signEventInput])
    this.sendMessage(m).subscribe()
  }
  
  onSignDigits() {
    console.debug('onSignDigits', this.eventNameInput, this.signDigitsInput)
    const m = getMessageBody(MESSAGE_TYPE.signdigits, [this.eventNameInput, this.signDigitsInput])
    this.sendMessage(m).subscribe()
  }

  onGetSignatures() {
    console.debug('onGetSignatures', this.eventNameInput)
    const m = getMessageBody(MESSAGE_TYPE.getsignatures, [this.eventNameInput])
    this.sendMessage(m).subscribe()
  }

  onCreateEvent() {
    console.debug('onCreateEvent')

    let m: OracleServerMessage
    switch (this.newEventType) {
      case EventType.ENUM:
        const outcomes = this.outcomes.split(',')
        outcomes.forEach(o => o.trim())
        if (outcomes.length === 0 || outcomes.length === 1) {
          throw Error('onCreateEvent must have outcomes')
        }
        m = getMessageBody(MESSAGE_TYPE.createenumevent, [this.newEventName, this.maturationTime, outcomes])
        break;
      case EventType.NUMERIC:
        m = getMessageBody(MESSAGE_TYPE.createnumericevent, [this.newEventName, this.maturationTime, this.minValue, this.maxValue, this.unit, this.precision])
        break;
      case EventType.DIGIT_DECOMP:
        // TODO : Not sure how signed is expressed here, tried with boolean and 0/1 numbers
        // The ordering here seems to match ServerJsonModels.scala:116 or so CreateDigitDecompEvent.fromJsArr()
        // like ["digitdecompEvent", "2030-01-01T00:00:00.000Z", 2, true, 3, "Unit", 0]
        m = getMessageBody(MESSAGE_TYPE.createdigitdecompevent, [this.newEventName, this.maturationTimeSeconds, this.base, this.signed, this.numdigits, this.unit, this.precision])
        break;
      default:
        throw Error('onCreateEvent unknown newEventType: ' + this.newEventType)
    }
    if (m !== undefined) {
      this.sendMessage(m).subscribe()
    }
  }

  private sendMessage(m: OracleServerMessage) {
    let obs = this.messageService.sendMessage(this.host, this.port, m).pipe(tap(result => {
      console.debug('oracle response: ', result)
      this.sentType = m.method
      if (result.result) {
        if (typeof result.result === 'object') {
          this.messageResults = JSON.stringify(result.result, undefined, 2)
        } else {
          this.messageResults = result.result.toString()
        }
      } else if (result.error) {
        this.messageResults = result.error
      } else {
        this.messageResults = 'Result was empty'
      }
    }))

    return obs
  }

}

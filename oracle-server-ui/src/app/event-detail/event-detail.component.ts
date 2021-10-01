import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'

import { AlertType } from '~app/component/alert/alert.component'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { MessageService } from '~service/message.service'

import { MessageType, OracleEvent } from '~type/oracle-server-types'

import { getMessageBody, outcomesToMinMax } from '~util/oracle-server-util'


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

  public AlertType = AlertType

  signEventInput = ''
  signDigitsInput: number|undefined = undefined
  signatures = ''

  showSigningSuccess = false

  private reset() {
    this.signEventInput = ''
    this.signDigitsInput = undefined
    this.signatures = ''
  }

  constructor(private messageService: MessageService, private dialog: MatDialog) { }

  ngOnInit(): void { }

  // Proxies for knowing eventType
  isEnum() {
    return typeof this.event.outcomes[0] === 'string'
  }
  isNotEnum() {
    return Array.isArray(this.event.outcomes[0])
  }

  onSignEvent() {
    console.debug('onSignEvent', this.event.eventName, this.signEventInput)
    // TODO : Could validate this.signEventInput here
    const m = getMessageBody(MessageType.signevent, [this.event.eventName, this.signEventInput])
    this.messageService.sendMessage(m).subscribe(result => {
      console.debug(' onSignEvent', result)
      if (result.result) {
        this.event.signedOutcome = this.signEventInput
        this.showSigningSuccess = true
      }
    })
  }
  
  onSignDigits() {
    const input = this.signDigitsInput
    console.debug('onSignDigits', this.event.eventName, input)
    const m = getMessageBody(MessageType.signdigits, [this.event.eventName, input])
    this.messageService.sendMessage(m).subscribe(result => {
      console.debug(' onSignDigits', result)
      if (result.result) {
        if (input !== undefined) {
          let val = input
          // Find input out of valid range and show dialog
          const mm = outcomesToMinMax(this.event.outcomes);
          if (mm) {
            (<any>mm).input = input
            let key
            if (input < mm.min) {
              key = 'signedBelowMinimum'
              val = mm.min
            } else if (input > mm.max) {
              key = 'signedAboveMaximum'
              val = mm.max
            }
            if (key) {
              const dialog = this.dialog.open(ErrorDialogComponent, {
                data: {
                  title: `dialog.${key}.title`,
                  content: `dialog.${key}.content`,
                  params: mm,
                }
              })
              this.event.signedOutcome = '' + val
            }
          }
        } else {
          this.event.signedOutcome = ''
        }
        this.showSigningSuccess = true
      }
    })
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

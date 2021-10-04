import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'

import { AlertType } from '~app/component/alert/alert.component'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { MessageService } from '~service/message.service'

import { MessageType, OracleAnnouncement } from '~type/oracle-server-types'

import { getMessageBody, outcomesToMinMax } from '~util/oracle-server-util'


@Component({
  selector: 'announcement-detail',
  templateUrl: './announcement-detail.component.html',
  styleUrls: ['./announcement-detail.component.scss']
})
export class AnnouncementDetailComponent implements OnInit {

  _announcement!: OracleAnnouncement
  get announcement(): OracleAnnouncement { return this._announcement }
  @Input() set announcement(e: OracleAnnouncement) { this.reset(); this._announcement = e }

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
    return typeof this.announcement.outcomes[0] === 'string'
  }
  isNotEnum() {
    return Array.isArray(this.announcement.outcomes[0])
  }

  onSignEnum() {
    console.debug('onSignEnum()', this.announcement.eventName, this.signEventInput)
    // TODO : Could validate this.signEventInput here
    const m = getMessageBody(MessageType.signenum, [this.announcement.eventName, this.signEventInput])
    this.messageService.sendMessage(m).subscribe(result => {
      console.debug(' onSignEnum()', result)
      if (result.result) {
        this.announcement.signedOutcome = this.signEventInput
        this.showSigningSuccess = true
      }
    })
  }
  
  onSignDigits() {
    const input = this.signDigitsInput
    console.debug('onSignDigits()', this.announcement.eventName, input)
    const m = getMessageBody(MessageType.signdigits, [this.announcement.eventName, input])
    this.messageService.sendMessage(m).subscribe(result => {
      console.debug(' onSignDigits()', result)
      if (result.result) {
        if (input !== undefined) {
          let val = input
          // Find input out of valid range and show dialog
          const mm = outcomesToMinMax(this.announcement.outcomes);
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
              this.announcement.signedOutcome = '' + val
            }
          }
        } else {
          this.announcement.signedOutcome = ''
        }
        this.showSigningSuccess = true
      }
    })
  }

  onGetSignatures() {
    console.debug('onGetSignatures()', this.announcement.eventName)
    const m = getMessageBody(MessageType.getsignatures, [this.announcement.eventName])
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

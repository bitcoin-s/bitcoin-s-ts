import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'

import { AlertType } from '~app/component/alert/alert.component'
import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { MessageService } from '~service/message.service'
import { OracleExplorerService } from '~service/oracle-explorer.service'
import { OracleStateService } from '~service/oracle-state.service'

import { MessageType, OracleAnnouncement } from '~type/oracle-server-types'

import { formatOutcomes, getMessageBody, outcomesToMinMax } from '~util/oracle-server-util'


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
  public formatOutcomes = formatOutcomes

  signEnumInput = ''
  signDigitsInput: number|undefined = undefined
  signatures = ''

  showSigningSuccess = false
  showAttestationDeleted = false

  showAnnouncementJSON = false

  private reset() {
    this.signEnumInput = ''
    this.signDigitsInput = undefined
    this.signatures = ''
    this.showSigningSuccess = false
    this.showAttestationDeleted = false
  }

  constructor(private messageService: MessageService, private dialog: MatDialog, 
    public oracleState: OracleStateService, public oracleExplorer: OracleExplorerService) { }

  ngOnInit(): void { }

  // Proxies for knowing eventType
  isEnum() {
    return typeof this.announcement.outcomes[0] === 'string'
  }
  isNotEnum() {
    return Array.isArray(this.announcement.outcomes[0])
  }

  onSignEnum() {
    console.debug('onSignEnum()', this.announcement.eventName, this.signEnumInput)
    // TODO : Could validate this.signEventInput here
    const m = getMessageBody(MessageType.signenum, [this.announcement.eventName, this.signEnumInput])
    this.messageService.sendMessage(m).subscribe(result => {
      console.debug(' onSignEnum()', result)
      if (result.result) {
        this.oracleState.reloadAnnouncement(this.announcement).subscribe(result => {
          if (result) {
            this.announcement = result
            this.showAttestationDeleted = false
            this.showSigningSuccess = true
          }
        })
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
            }
          }
        } 
        this.oracleState.reloadAnnouncement(this.announcement).subscribe(result => {
          if (result) {
            this.announcement = result
            this.showAttestationDeleted = false
            this.showSigningSuccess = true
          }
        })
      }
    })
  }

  onDeleteAttestation() {
    console.debug('onDeleteAttestation()', this.announcement.eventName)
    const dialog = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'dialog.deleteAttestation.title',
        content: 'dialog.deleteAttestation.content',
        action: 'action.yes',
        actionColor: 'warn',
        showCancelButton: true,
      }
    }).afterClosed().subscribe(result => {
      console.debug(' onDeleteAttestation():', result)
      if (result) {
        const m = getMessageBody(MessageType.deleteattestation, [this.announcement.eventName])
        this.messageService.sendMessage(m).subscribe(result => {
          if (result.result) {
            this.announcement.signedOutcome = null
            this.signEnumInput = ''
            this.signDigitsInput = undefined
            this.showSigningSuccess = false
            this.showAttestationDeleted = true
          }
        })
      }
    })
  }

  onDeleteClick() {
    console.debug('onDeleteClick()')
    const dialog = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'dialog.deleteAnnouncement.title',
        content: 'dialog.deleteAnnouncement.content',
        action: 'action.yes',
        actionColor: 'warn',
        showCancelButton: true,
      }
    }).afterClosed().subscribe(result => {
      console.debug(' onDeleteClick():', result)
      if (result) {
        const m = getMessageBody(MessageType.deleteannouncement, [this.announcement.eventName])
        this.messageService.sendMessage(m).subscribe(result => {
          if (result.result) {
            this.oracleState.getAllAnnouncements().subscribe()
            this.onClose()
          }
        })
      }
    })
  }

  onBroadcastClick() {
    console.debug('onBroadcastClick()')
    this.oracleExplorer.createAnnouncement(this.announcement).subscribe(result => {
      if (result) {
        this.oracleState.getOEAnnouncement(this.announcement).subscribe() // Update oracleState
      }
    })
  }

  onViewOnOEClick() {
    console.debug('onViewAnnouncementClick()')
    this.oracleExplorer.openAnnouncementTab(this.announcement)
  }

  onAttestClick() {
    console.debug('onAttestClick()')
    this.oracleExplorer.createAttestations(this.announcement).subscribe(result => {
      if (result) {
        this.oracleState.getOEAnnouncement(this.announcement).subscribe() // Update oracleState
      }
    })
  }

  onShowAnnouncementJSON() {
    console.debug('onShowAnnouncementJSON()')
    this.showAnnouncementJSON = true
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

}

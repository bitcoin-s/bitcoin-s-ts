import { Injectable, OnInit } from '@angular/core'
import { BehaviorSubject, forkJoin } from 'rxjs'
import { tap } from 'rxjs/operators'

import { MessageService } from './message.service'
import { OracleExplorerService } from './oracle-explorer.service'
import { MessageType, OracleEvent } from '~type/oracle-server-types'
import { OracleAnnouncementsResponse } from '~type/oracle-explorer-types'
import { getMessageBody, } from '~util/message-util'


type OracleEventMap = { [eventName: string]: OracleEvent }
type OracleAnnouncementMap = { [eventName: string]: OracleAnnouncementsResponse }

@Injectable({ providedIn: 'root' })
export class OracleStateService {

  // Server state
  eventNames: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([])
  events: BehaviorSubject<OracleEventMap> = new BehaviorSubject({})
  flatEvents: BehaviorSubject<OracleEvent[]> = new BehaviorSubject<OracleEvent[]>([])

  // Oracle Explorer state
  announcements: BehaviorSubject<OracleAnnouncementMap> = new BehaviorSubject({}) // should this index on sha256 id instead?

  eventsReceived: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  private updateFlatEvents() {
    this.flatEvents.next([...this.flatEvents.value])
  }

  private updateAnnouncements() {
    this.announcements.next(Object.assign({}, this.announcements.value))
  }

  constructor(private messageService: MessageService, private oracleExplorerService: OracleExplorerService) {
    this.oracleExplorerService.oracleExplorer.subscribe(oe => {
      this.getLocalEventAnnouncements().subscribe() // Check for announcements on new Explorer selection
    })
  }

  getAllEvents() {
    console.debug('getAllEvents()')
    this.eventsReceived.next(false)
    this.flatEvents.next([])
    const m = getMessageBody(MessageType.listevents)
    const obs = this.messageService.sendMessage(m)
    return obs.pipe(tap(result => {
      if (result.result) {
        const eventNames = <string[]>result.result
        this.eventNames.next(eventNames)
        const events = []
        for (const e of eventNames) {
          events.push(this.messageService.sendMessage(getMessageBody(MessageType.getevent, [e])))
        }
        forkJoin(events).subscribe((results) => {
          if (results) {
            for (const e of results) {
              this.addEventToState(<OracleEvent>e.result)
            }
            this.updateFlatEvents()
            this.eventsReceived.next(true)
          }
          this.getLocalEventAnnouncements().subscribe()
        })
      }
    }))
  }

  private getLocalEventAnnouncements() {
    console.debug('getLocalEventAnnouncements()', this.flatEvents)

    this.announcements.next({})
    // Have seen these 403 against the Production Oracle Server over Tor
    const obs = forkJoin(this.flatEvents.value.map(e => this.getAnnouncement(e)))
    return obs
  }

  private addEventToState(e: OracleEvent) {
    if (e) {
      this.events.value[e.eventName] = e
      this.flatEvents.value.push(e)
    }
  }

  // Check if the event is published to the oracle explorer
  getAnnouncement(e: OracleEvent) {
    const obs = this.oracleExplorerService.getAnnouncement(e.announcementTLVsha256)
    const pipe = obs.pipe(tap(result => {
      console.debug('getAnnouncement()', e.announcementTLVsha256, result)
      this.announcements.value[e.eventName] = result // will be null for no result
      this.updateAnnouncements()
    }))
    return pipe
  }

}
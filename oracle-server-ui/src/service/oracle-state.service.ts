import { Injectable, OnInit } from '@angular/core'
import { BehaviorSubject, forkJoin, of } from 'rxjs'
import { tap } from 'rxjs/operators'

import { MessageType, OracleEvent } from '~type/oracle-server-types'
import { OracleAnnouncementsResponse } from '~type/oracle-explorer-types'

import { getMessageBody } from '~util/oracle-server-util'

import { BlockstreamService } from './blockstream-service'
import { MessageService } from './message.service'
import { OracleExplorerService } from './oracle-explorer.service'


type OracleEventMap = { [eventName: string]: OracleEvent }
type OracleAnnouncementMap = { [eventName: string]: OracleAnnouncementsResponse }

@Injectable({ providedIn: 'root' })
export class OracleStateService {

  // oracleName = '' // lives on OracleExpolorer service for now
  publicKey = ''
  stakingAddress = ''
  stakedAmount = ''

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

  constructor(private messageService: MessageService, private oracleExplorerService: OracleExplorerService, 
    private blockstreamService: BlockstreamService) {
    this.oracleExplorerService.oracleExplorer.subscribe(oe => {
      this.getLocalEventAnnouncements().subscribe() // Check for announcements on new Explorer selection
    })

    this.getPublicKeyAndOracleName()
    this.getStakingAddressAndBalance()
  }

  getPublicKeyAndOracleName() {
    console.debug('getPublicKeyAndOracleName()')
    this.messageService.sendMessage(getMessageBody(MessageType.getpublickey)).subscribe(result => {
      if (result.result) {
        this.publicKey = result.result
        if (!this.oracleExplorerService.oracleName.value) {
          this.getOracleName()
        }
      }
    })
  }

  getOracleName() {
    this.oracleExplorerService.getLocalOracleName(this.publicKey).subscribe(result => {
      console.debug(' getOracleName()', result)
    })
  }

  getStakingAddressAndBalance() {
    console.debug('getStakingAddressAndBalance()')
    this.messageService.sendMessage(getMessageBody(MessageType.getstakingaddress)).subscribe(result => {
      if (result.result) {
        this.stakingAddress = result.result
        this.getStakingBalance()
      }
    })
  }

  getStakingBalance() {
    console.debug('getStakingBalance()')
    if (this.stakingAddress) {
      this.blockstreamService.getBalance(this.stakingAddress).subscribe(result => {
        this.stakedAmount = this.blockstreamService.balanceFromGetBalance(result).toString()
      })
    }
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
    const obs = forkJoin(this.flatEvents.value.map(e => this.announcements.value[e.eventName] ? 
      of(this.announcements.value[e.eventName]) : this.getAnnouncement(e)))
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
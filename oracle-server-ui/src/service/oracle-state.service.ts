import { Injectable, OnInit } from '@angular/core'
import { BehaviorSubject, forkJoin, of } from 'rxjs'
import { tap } from 'rxjs/operators'

import { MessageType, OracleAnnouncement } from '~type/oracle-server-types'
import { OracleAnnouncementsResponse } from '~type/oracle-explorer-types'

import { getMessageBody } from '~util/oracle-server-util'

import { BlockstreamService } from './blockstream-service'
import { MessageService } from './message.service'
import { OracleExplorerService } from './oracle-explorer.service'


type OracleServerAnnouncementMap = { [eventName: string]: OracleAnnouncement }
type OracleExplorerAnnouncementMap = { [eventName: string]: OracleAnnouncementsResponse }

@Injectable({ providedIn: 'root' })
export class OracleStateService {

  // oracleName = '' // lives on OracleExpolorer service for now
  publicKey = ''
  stakingAddress = ''
  stakedAmount = ''

  // Server state
  announcementNames: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([])
  announcements: BehaviorSubject<OracleServerAnnouncementMap> = new BehaviorSubject({})
  flatAnnouncements: BehaviorSubject<OracleAnnouncement[]> = new BehaviorSubject<OracleAnnouncement[]>([])

  // Oracle Explorer state
  oeAnnouncements: BehaviorSubject<OracleExplorerAnnouncementMap> = new BehaviorSubject({}) // should this index on sha256 id instead?

  announcementsReceived: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  private updateFlatAnnouncements() {
    this.flatAnnouncements.next([...this.flatAnnouncements.value])
  }

  private updateAnnouncements() {
    this.oeAnnouncements.next(Object.assign({}, this.oeAnnouncements.value))
  }

  constructor(private messageService: MessageService, private oracleExplorerService: OracleExplorerService, 
    private blockstreamService: BlockstreamService) {
    this.oracleExplorerService.oracleExplorer.subscribe(oe => {
      this.getAnnouncementsFromOracleExplorer().subscribe() // Check for announcements on new Explorer selection
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

  getAllAnnouncements() {
    console.debug('getAllAnnouncements()')
    this.announcementsReceived.next(false)
    this.flatAnnouncements.next([])
    const m = getMessageBody(MessageType.listannouncements)
    const obs = this.messageService.sendMessage(m)
    return obs.pipe(tap(result => {
      if (result.result) {
        const announcementNames = <string[]>result.result
        this.announcementNames.next(announcementNames)
        const announcements = []
        for (const e of announcementNames) {
          announcements.push(this.messageService.sendMessage(getMessageBody(MessageType.getannouncement, [e])))
        }
        if (announcements.length > 0) {
          forkJoin(announcements).subscribe((results) => {
            if (results) {
              for (const e of results) {
                this.addEventToState(<OracleAnnouncement>e.result)
              }
              this.updateFlatAnnouncements()
              this.announcementsReceived.next(true)
            }
            this.getAnnouncementsFromOracleExplorer().subscribe()
          })
        } else {
          this.announcementsReceived.next(true)
        }
      }
    }))
  }

  private getAnnouncementsFromOracleExplorer() {
    console.debug('getAnnouncementsFromOracleExplorer()', this.flatAnnouncements)
    this.oeAnnouncements.next({})
    // Have seen these 403 against the Production Oracle Server over Tor
    const obs = forkJoin(this.flatAnnouncements.value.map(e => this.oeAnnouncements.value[e.eventName] ? 
      of(this.oeAnnouncements.value[e.eventName]) : this.getAnnouncement(e)))
    return obs
  }

  private addEventToState(a: OracleAnnouncement) {
    if (a) {
      this.announcements.value[a.eventName] = a
      this.flatAnnouncements.value.push(a)
    }
  }

  // Check if the event is published to the oracle explorer
  getAnnouncement(a: OracleAnnouncement) {
    const obs = this.oracleExplorerService.getAnnouncement(a.announcementTLVsha256)
    const pipe = obs.pipe(tap(result => {
      console.debug('getAnnouncement()', a.announcementTLVsha256, result)
      this.oeAnnouncements.value[a.eventName] = result // will be null for no result
      this.updateAnnouncements()
    }))
    return pipe
  }

}
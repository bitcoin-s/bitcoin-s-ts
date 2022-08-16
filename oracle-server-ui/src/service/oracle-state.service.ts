import { EventEmitter, Injectable, OnInit } from '@angular/core'
import { BehaviorSubject, forkJoin, of } from 'rxjs'
import { switchMap, tap } from 'rxjs/operators'

import { BuildConfig } from '~type/proxy-server-types'
import { MessageType, OracleAnnouncement } from '~type/oracle-server-types'
import { OracleAnnouncementsResponse } from '~type/oracle-explorer-types'

import { getMessageBody } from '~util/oracle-server-util'

import { BlockstreamService } from './blockstream-service'
import { MempoolService } from './mempool-service'
import { MessageService } from './message.service'
import { OracleExplorerService } from './oracle-explorer.service'


type OracleServerAnnouncementMap = { [eventName: string]: OracleAnnouncement }
type OracleExplorerAnnouncementMap = { [eventName: string]: OracleAnnouncementsResponse }

@Injectable({ providedIn: 'root' })
export class OracleStateService {

  serverVersion = ''
  buildConfig: BuildConfig

  // oracleName = '' // lives on OracleExpolorer service for now
  publicKey = ''
  stakingAddress = ''
  stakedAmount = ''

  // Server state
  announcementNames: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([])
  announcements: BehaviorSubject<OracleServerAnnouncementMap> = new BehaviorSubject({})
  flatAnnouncements: BehaviorSubject<OracleAnnouncement[]> = new BehaviorSubject<OracleAnnouncement[]>([])

  private addEventToState(a: OracleAnnouncement|null) {
    if (a) {
      this.announcements.value[a.eventName] = a
      this.flatAnnouncements.value.push(a)
    }
  }

  // Oracle Explorer state
  oeAnnouncements: BehaviorSubject<OracleExplorerAnnouncementMap> = new BehaviorSubject({}) // should this index on sha256 id instead?

  // Initial State Loaded signal
  stateLoaded: EventEmitter<void> = new EventEmitter()

  private updateFlatAnnouncements() {
    this.flatAnnouncements.next([...this.flatAnnouncements.value])
  }

  private updateAnnouncements() {
    this.oeAnnouncements.next(Object.assign({}, this.oeAnnouncements.value))
  }

  constructor(private messageService: MessageService, private oracleExplorerService: OracleExplorerService, 
    private blockstreamService: BlockstreamService, private mempoolService: MempoolService) {
    
  }

  initializeState() {
    console.debug('initializeState()')

    return forkJoin([
      this.getServerVersion(),
      // this.getBuildConfig(),
      this.getPublicKeyAndOracleName(),
      this.getStakingAddressAndBalance(),
      // this.getAllAnnouncements(), // pulling in oracle component
    ]).subscribe(_ => {
      console.debug(' initializedState() initialized')
      this.stateLoaded.next()
    })
  }

  private getServerVersion() {
    return this.messageService.getServerVersion().pipe(tap(r => {
      if (r.result) {
        this.serverVersion = r.result.version;
      }
    }))
  }

  private getBuildConfig() {
    return this.messageService.buildConfig().pipe(tap(r => {
      if (r) {
        r.dateString = new Date(r.committedOn * 1000).toLocaleDateString()
        this.buildConfig = r
      }
    }))
  }

  getAboutInfo() {
    return forkJoin([
      // this.getServerVersion(),
      this.getBuildConfig(),
    ])
  }

  private getPublicKeyAndOracleName() {
    console.debug('getPublicKeyAndOracleName()')
    return this.messageService.sendMessage(getMessageBody(MessageType.getpublickey)).pipe(tap(r => {
      if (r.result) {
        this.publicKey = r.result
      }
    }), switchMap(_ => {
      if (!this.oracleExplorerService.oracleName.value)
        return this.oracleExplorerService.getLocalOracleName(this.publicKey)
      else return of(null)
    }))
  }

  private getStakingAddressAndBalance() {
    console.debug('getStakingAddressAndBalance()')
    return this.messageService.sendMessage(getMessageBody(MessageType.getstakingaddress)).pipe(tap(r => {
      if (r.result) {
        this.stakingAddress = r.result
      }
    }), switchMap(_ => this.getStakingBalance()))
  }

  getStakingBalance() {
    console.debug('getStakingBalance()')
    if (this.stakingAddress) {
      return this.mempoolService.getBalance(this.stakingAddress).pipe(tap(r => {
        this.stakedAmount = this.blockstreamService.balanceFromGetBalance(r).toString()
      }))
    }
    return of(null)
  }

  exportStakingAddress() {
    console.debug('exportStakingAddress()')
    return this.messageService.sendMessage(getMessageBody(MessageType.exportstakingaddresswif)).pipe(tap(r => {
      // Nothing to store here
    }))
  }

  getAllAnnouncements() {
    console.debug('getAllAnnouncements()')
    this.flatAnnouncements.next([])
    const obs = this.messageService.sendMessage(getMessageBody(MessageType.listannouncements))
      .pipe(tap(r => {
        if (r.result) {
          this.announcementNames.next(<string[]>r.result)
        }
      }), switchMap(_ => this.getAllAnnouncementDetails()),
      tap(r => {
        if (r) {
          for (const e of r) {
            this.addEventToState(<OracleAnnouncement>e.result)
          }
          this.updateFlatAnnouncements()
        }
      }), switchMap(_ => this.getAnnouncementsFromOracleExplorer()))
    return obs
  }

  private getAllAnnouncementDetails() {
    console.debug('getAllAnnouncementDetails()')
    if (this.announcementNames.value.length > 0) {
      const obs = forkJoin(this.announcementNames.value.map(a => this.messageService.sendMessage(getMessageBody(MessageType.getannouncement, [a]))))
      obs.pipe(tap(r => {
        if (r) {
          for (const e of r) {
            this.addEventToState(<OracleAnnouncement>e.result)
          }
          this.updateFlatAnnouncements()
        }
      }))
      return obs
    }
    return of(null)
  }

  // Reloads an Announcement after signing to update field values
  reloadAnnouncement(a: OracleAnnouncement) {
    console.debug('reloadAnnouncement()', a)
    // Remove previous event state
    const i = this.flatAnnouncements.value.findIndex(i => i.eventName === a.eventName)
    if (i !== -1) {
      this.flatAnnouncements.value.splice(i, 1)
    }
    let announcement: OracleAnnouncement|null = null
    const obs = this.messageService.sendMessage(getMessageBody(MessageType.getannouncement, [a.eventName]))
      .pipe(tap(r => {
        if (r.result) {
          announcement = r.result
          this.addEventToState(announcement)
          this.updateFlatAnnouncements()
        }
      }), switchMap(_ => {
        if (announcement) return this.getOEAnnouncement(announcement)
        else return of(null)
      }), switchMap(_ => of(announcement)))
    return obs
  }

  private getAnnouncementsFromOracleExplorer() {
    console.debug('getAnnouncementsFromOracleExplorer()', this.flatAnnouncements.value)
    this.oeAnnouncements.next({})
    if (this.flatAnnouncements.value.length > 0) {
      // Have seen these 403 against the Production Oracle Server over Tor
      const obs = forkJoin(this.flatAnnouncements.value.map(e => this.oeAnnouncements.value[e.eventName] ? 
        of(this.oeAnnouncements.value[e.eventName]) : this.getOEAnnouncement(e)))
      return obs
    }
    return of(null)
  }

  // Check if the event is published to the oracle explorer
  getOEAnnouncement(a: OracleAnnouncement) {
    console.debug('getOEAnnouncement()', a)
    const obs = this.oracleExplorerService.getAnnouncement(a.announcementTLVsha256)
      .pipe(tap(r => {
        console.debug('getOEAnnouncement()', a.announcementTLVsha256, r)
        if (r) {
          this.oeAnnouncements.value[a.eventName] = r.result // will be null for no result
          this.updateAnnouncements()
        }
      }))
    return obs
  }

}
import { EventEmitter, Injectable, OnInit } from '@angular/core'
import { BehaviorSubject, forkJoin, of } from 'rxjs'
import { tap } from 'rxjs/operators'

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

  // Oracle Explorer state
  oeAnnouncements: BehaviorSubject<OracleExplorerAnnouncementMap> = new BehaviorSubject({}) // should this index on sha256 id instead?

  // TODO : Remove
  announcementsReceived: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  // Initial State Loaded signal
  stateLoaded: EventEmitter<void> = new EventEmitter()

  private initialized = false

  private updateFlatAnnouncements() {
    this.flatAnnouncements.next([...this.flatAnnouncements.value])
  }

  private updateAnnouncements() {
    this.oeAnnouncements.next(Object.assign({}, this.oeAnnouncements.value))
  }

  constructor(private messageService: MessageService, private oracleExplorerService: OracleExplorerService, 
    private blockstreamService: BlockstreamService, private mempoolService: MempoolService) {
    
  }

  initialize() {
    this.oracleExplorerService.oracleExplorer.subscribe(oe => {
      this.getAnnouncementsFromOracleExplorer().subscribe() // Check for announcements on new Explorer selection
    })

    this.getPublicKeyAndOracleName()
    this.getStakingAddressAndBalance()

    // TODO : Wait for things
    this.stateLoaded.next()

    this.getServerVersion().subscribe()
    this.getBuildConfig().subscribe()
  }

  initializeState() {
    console.debug('initializeState()')

    return forkJoin([
      this.getServerVersion(),
      this.getBuildConfig(),
      this.getPublicKeyAndOracleName(),
      this.getStakingAddressAndBalance(),
    ]).subscribe(_ => {
      console.debug(' initializedState() initialized')
      this.initialized = true
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
    return this.messageService.buildConfig().pipe(tap(result => {
      if (result) {
        result.dateString = new Date(result.committedOn * 1000).toLocaleDateString()
        this.buildConfig = result
      }
    }))
  }

  private getPublicKeyAndOracleName() {
    console.debug('getPublicKeyAndOracleName()')
    return this.messageService.sendMessage(getMessageBody(MessageType.getpublickey)).pipe(tap(result => {
      if (result.result) {
        this.publicKey = result.result
        if (!this.oracleExplorerService.oracleName.value) {
          this.getOracleNameFromOracleExplorer()
        }
      }
    }))
  }

  getOracleNameFromOracleExplorer() {
    this.oracleExplorerService.getLocalOracleName(this.publicKey).subscribe(result => {
      console.debug(' getOracleNameFromOracleExplorer()', result)
    })
  }

  private getStakingAddressAndBalance() {
    console.debug('getStakingAddressAndBalance()')
    return this.messageService.sendMessage(getMessageBody(MessageType.getstakingaddress)).pipe(tap(result => {
      if (result.result) {
        this.stakingAddress = result.result
        this.getStakingBalance().subscribe()
      }
    }))
  }

  getStakingBalance() {
    console.debug('getStakingBalance()')
    if (this.stakingAddress) {
      return this.mempoolService.getBalance(this.stakingAddress).pipe(tap(result => {
        this.stakedAmount = this.blockstreamService.balanceFromGetBalance(result).toString()
      }))
    }
    return of(null)
  }

  getAllAnnouncements() {
    console.debug('getAllAnnouncements()')
    this.announcementsReceived.next(false)
    this.flatAnnouncements.next([])
    const obs = this.messageService.sendMessage(getMessageBody(MessageType.listannouncements))
      .pipe(tap(result => {
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
    return obs
  }

  // Reloads an Announcement after signing to update field values
  reloadAnnouncement(a: OracleAnnouncement) {
    console.debug('reloadAnnouncement()', a)
    // Remove previous event state
    const i = this.flatAnnouncements.value.findIndex(i => i.eventName === a.eventName)
    if (i !== -1) {
      this.flatAnnouncements.value.splice(i, 1)
    }
    const obs = this.messageService.sendMessage(getMessageBody(MessageType.getannouncement, [a.eventName]))
      .pipe(tap(result => {
        console.debug(' reloadAnnouncement()', result)
        if (result.result) {
          this.addEventToState(result.result)
          this.updateFlatAnnouncements()
          this.getOEAnnouncement(result.result).subscribe()
        }
      }))
    return obs
  }

  private getAnnouncementsFromOracleExplorer() {
    console.debug('getAnnouncementsFromOracleExplorer()', this.flatAnnouncements.value)
    this.oeAnnouncements.next({})
    // Have seen these 403 against the Production Oracle Server over Tor
    const obs = forkJoin(this.flatAnnouncements.value.map(e => this.oeAnnouncements.value[e.eventName] ? 
      of(this.oeAnnouncements.value[e.eventName]) : this.getOEAnnouncement(e)))
    return obs
  }

  private addEventToState(a: OracleAnnouncement) {
    if (a) {
      this.announcements.value[a.eventName] = a
      this.flatAnnouncements.value.push(a)
    }
  }

  // Check if the event is published to the oracle explorer
  getOEAnnouncement(a: OracleAnnouncement) {
    console.debug('getOEAnnouncement()', a)
    const obs = this.oracleExplorerService.getAnnouncement(a.announcementTLVsha256)
      .pipe(tap(result => {
        console.debug('getOEAnnouncement()', a.announcementTLVsha256, result)
        if (result) {
          this.oeAnnouncements.value[a.eventName] = result.result // will be null for no result
          this.updateAnnouncements()
        }
      }))
    return obs
  }

}
import { EventEmitter, Injectable } from '@angular/core'
import { BehaviorSubject, forkJoin, of } from 'rxjs'
import { switchMap, tap } from 'rxjs/operators'

import * as OracleTS from 'oracle-server-ts/index'
import { OracleStateModel } from 'oracle-server-ts/index'

import { environment } from '~environments'

import { BuildConfig } from '~type/proxy-server-types'
import { MessageType, OracleAnnouncement } from '~type/oracle-server-types'
import { OracleAnnouncementsResponse } from '~type/oracle-explorer-types'

import { getMessageBody } from '~util/oracle-server-util'

import { AuthService } from './auth.service'
import { BlockstreamService } from './blockstream-service'
import { MempoolService } from './mempool-service'
import { MessageService } from './message.service'
import { OracleExplorerService } from './oracle-explorer.service'


type OracleExplorerAnnouncementMap = { [eventName: string]: OracleAnnouncementsResponse }

@Injectable({ providedIn: 'root' })
export class OracleStateService {

  /** OracleTS data pass through */
  // get commonState() { return OracleTS.CommonState }
  get OracleTS() { return OracleTS } // Common library exposure point
  private _oracleState: OracleStateModel
  get oracleState() { return this._oracleState }
  private _announcements: OracleAnnouncement[]
  get announcements() { return this._announcements }

  /** Pass through OracleTS functions */
  getAllAnnouncements() { return OracleTS.GetAllAnnouncementsAndDetails() }
  reloadAnnouncement(announcement: OracleAnnouncement) {
    let announce: OracleAnnouncement|null = null
    return OracleTS.ReloadAnnouncement(announcement).pipe(switchMap(a => {
      announce = a
      if (a) return this.getOEAnnouncement(a)
      else return of(null)
    }), switchMap(_ => of(announce)))
  }

  /** Proxy server build data */
  buildConfig: BuildConfig

  stakedAmount = ''

  // Oracle Explorer state
  oeAnnouncements: BehaviorSubject<OracleExplorerAnnouncementMap> = new BehaviorSubject({}) // should this index on sha256 id instead?

  // Initial State Loaded signal
  stateLoaded: EventEmitter<void> = new EventEmitter()

  private updateAnnouncements() {
    this.oeAnnouncements.next(Object.assign({}, this.oeAnnouncements.value))
  }

  constructor(private authService: AuthService, private messageService: MessageService, private oracleExplorerService: OracleExplorerService, 
    private blockstreamService: BlockstreamService, private mempoolService: MempoolService) {
    
      OracleTS.OracleState.subscribe(os => {
        this._oracleState = os
      })
      OracleTS.Announcements.subscribe(as => {
        this._announcements = as
      })
  }

  /** Configure OracleTS, wait for backend server, and load state */
  initialize() {
    console.debug('initialize()')
    // Communicate with OracleTS via proxy server
    OracleTS.ConfigureServerURL(environment.oracleServerApi)
    const token = this.authService.getToken()
    if (token) {
      OracleTS.ConfigureAuthorizationHeader('Bearer ' + token)
    }
    return OracleTS.WaitForServer().subscribe(r => {
      OracleTS.InitializeOracleState().subscribe(r => {
        this.initializeState()
      })
    })
  }

  uninitialize() {
    console.debug('uninitialize()')
    OracleTS.ClearOracleState()
    OracleTS.ClearAnnouncementState()
  }

  /** Load anything locally that needs to follow OracleTS loading */
  initializeState() {
    console.debug('initializeState()')
    return forkJoin([
      this.getOracleName(),
      this.getStakingBalance(),
      this.getAnnouncementsFromOracleExplorer(),
    ]).subscribe(_ => {
      console.debug(' initializedState() initialized')
      this.stateLoaded.next()
    })
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

  private getOracleName() {
    console.debug('getOracleName()')
    if (this.oracleState.publicKey && !this.oracleExplorerService.oracleName.value)
      return this.oracleExplorerService.getLocalOracleName(this.oracleState.publicKey)
    else return of(null)
  }

  getStakingBalance() {
    console.debug('getStakingBalance()', this.oracleState.stakingAddress)
    if (this.oracleState.stakingAddress) {
      return this.mempoolService.getBalance(this.oracleState.stakingAddress).pipe(tap(r => {
        this.stakedAmount = this.blockstreamService.balanceFromGetBalance(r).toString()
        console.debug('stakedAmount:', this.stakedAmount)
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

  private getAnnouncementsFromOracleExplorer() {
    console.debug('getAnnouncementsFromOracleExplorer()', this.announcements)
    this.oeAnnouncements.next({})
    if (this.announcements.length > 0) {
      // Have seen these 403 against the Production Oracle Server over Tor
      const obs = forkJoin(this.announcements.map(e => this.oeAnnouncements.value[e.eventName] ? 
        of(this.oeAnnouncements.value[e.eventName]) : this.getOEAnnouncement(e)))
      return obs
    }
    return of(null)
  }

  // Check if the event is published to the oracle explorer
  getOEAnnouncement(a: OracleAnnouncement) {
    // console.debug('getOEAnnouncement()', a.announcementTLVsha256)
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

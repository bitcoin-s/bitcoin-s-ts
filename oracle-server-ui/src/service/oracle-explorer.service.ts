import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject, Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

import { environment } from '~environments'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { OracleAnnouncementsResponse, OracleNameResponse } from '~type/oracle-explorer-types'
import { OracleAnnouncement } from '~type/oracle-server-types'
import { getProxyErrorHandler } from '~type/proxy-server-types'

import { TorService } from './tor.service'


// Host replacement header for proxy
const HOST_OVERRIDE_HEADER = 'host-override'

// LocalStorage Keys
const ORACLE_NAME_KEY = 'ORACLE_NAME' // Holds values like 'My Oracle'
const ORACLE_EXPLORER_VALUE_KEY = 'ORACLE_EXPLORER_VALUE' // Holds values like 'test'

export interface OracleExplorer { value: string; name: string; host: string }
export const ORACLE_EXPLORERS: OracleExplorer[] = [
  { value: 'test', name: 'Suredbits Test Oracle Explorer', host: 'test.oracle.suredbits.com' },
  { value: 'prod', name: 'Suredbits Production Oracle Explorer', host: 'oracle.suredbits.com' },
]
const DEFAULT_ORACLE_EXPLORER_VALUE = 'test'

@Injectable({ providedIn: 'root' })
export class OracleExplorerService {

  private get url() {
    return (this.torService.useTor ? environment.torApi : '') + environment.oracleExplorerApi
  }

  readonly oracleName: BehaviorSubject<string> = new BehaviorSubject('')
  readonly serverOracleName: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  oracleExplorer: BehaviorSubject<OracleExplorer>
  setOracleExplorer(oe: OracleExplorer) {
    this.oracleExplorer.next(oe)
    localStorage.setItem(ORACLE_EXPLORER_VALUE_KEY, oe.value)
  }
  
  constructor(private http: HttpClient, private torService: TorService, private dialog: MatDialog) {
    const oracleValue = localStorage.getItem(ORACLE_EXPLORER_VALUE_KEY) || DEFAULT_ORACLE_EXPLORER_VALUE
    const oracle = ORACLE_EXPLORERS.find(o => o.value === oracleValue)
    this.oracleExplorer = new BehaviorSubject(oracle ? oracle : ORACLE_EXPLORERS[0])
  }

  private getHeaders() {
    const headers = new HttpHeaders()
      .set(HOST_OVERRIDE_HEADER, this.oracleExplorer.value.host)
    return { headers }
  }

  private errorHandler = getProxyErrorHandler('oracleExplorer', (message: string) => {
    const dialog = this.dialog.open(ErrorDialogComponent, {
      data: {
        title: 'dialog.oracleExplorerError.title',
        content: message,
      }
    })
  }).bind(this)

  /**
   * @see https://gist.github.com/Christewart/a9e55d9ba582ac9a5ceffa96db9d7e1f#list-all-events
   * @returns OracleAnnouncementsResponse[]
   */
  listAnnouncements() {
    return this.http.get<OracleAnnouncementsResponse[]>(this.url + '/announcements', 
      this.getHeaders()).pipe(catchError(this.errorHandler))
  }

  /**
   * @see https://gist.github.com/Christewart/a9e55d9ba582ac9a5ceffa96db9d7e1f#get-event
   * @returns OracleAnnouncementsResponse
   */
  getAnnouncement(announcementHash: string) {
    return this.http.get<OracleAnnouncementsResponse>(this.url + `/announcements/${announcementHash}`,
      this.getHeaders()).pipe(catchError(this.errorHandler))
  }

  /**
   * @see https://gist.github.com/Christewart/a9e55d9ba582ac9a5ceffa96db9d7e1f#create-an-event
   * @returns announcementTLVsha256
   */
  createAnnouncement(a: OracleAnnouncement) {
    // Java does get then send to see if oracle has it already
    if (!this.oracleName.value) {
      throw(Error('Oracle Name must be set to create announcements'))
    }
    
    // This sets application/x-www-form-urlencoded when sent
    const body = new HttpParams()
      .set('oracleAnnouncementV0', a.announcementTLV)
      .set('description', a.eventName)
      .set('oracleName', this.oracleName.value)
    // TODO : Could allow user to enter URI
    
    return this.http.post<string>(this.url + '/announcements', body, this.getHeaders())
      .pipe(catchError(this.errorHandler))
  }

  /**
   * @param announcementHash 
   * @param attestations 
   * @see https://gist.github.com/Christewart/a9e55d9ba582ac9a5ceffa96db9d7e1f#create-an-events-attestation
   * @returns OracleAnnouncementsResponse
   */
  createAttestations(a: OracleAnnouncement) {
    if (!this.oracleName.value) {
      throw(Error('Oracle Name must be set to create attestations'))
    }

    const body = new HttpParams()
      .set('attestations', a.attestations)
    return this.http.post<OracleNameResponse>(this.url + `/announcements/${a.announcementTLVsha256}/attestations`, body, this.getHeaders())
      .pipe(catchError(this.errorHandler))
  }

  getOracleName(pubkey: string) {
    return this.http.get<OracleNameResponse>(this.url + `/oracle/${pubkey}`)
      .pipe(catchError(this.errorHandler))
  }

  getLocalOracleName(pubkey: string) {
    return this.getOracleName(pubkey).pipe(tap(result => {
      const lsOracleName = localStorage.getItem(ORACLE_NAME_KEY);
      if (result) {
        this.oracleName.next(result.oracleName)
        this.serverOracleName.next(true)
        if (result.oracleName && lsOracleName && lsOracleName !== result.oracleName) {
          console.error('local oracleName and oracle explorer oracleName do not match!')
          // Force server oracleName
          localStorage.setItem(ORACLE_NAME_KEY, result.oracleName)
        }
      } else if (lsOracleName) {
        // Use localStorage oracleName if it's set, but hasn't been used on the Oracle Explorer yet
        this.oracleName.next(lsOracleName)
        this.serverOracleName.next(false)
      } else {
        console.warn('no oracleName found')
        this.oracleName.next('')
        this.serverOracleName.next(false)
      }
    }))
  }

  setOracleName(name: string, force = false) {
    if (this.serverOracleName.value && !force) {
      console.error('cannot change oracleName once set on Oracle Explorer')
      return
    }
    if (name) {
      localStorage.setItem(ORACLE_NAME_KEY, name)
      this.oracleName.next(name)
    }
  }

}

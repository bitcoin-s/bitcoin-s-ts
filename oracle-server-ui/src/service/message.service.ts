import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core'
import { Observable, of } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

import { environment } from 'src/environments/environment'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { OracleServerMessage } from '~type/oracle-server-message'
import { MessageType, OracleResponse, ServerVersion } from '~type/oracle-server-types'
import { BuildConfig, SuccessType } from '~type/proxy-server-types'

import { getMessageBody } from '~util/oracle-server-util'


/** Service that communicates with underlying oracleServer instance through oracle-server-ui-proxy */
@Injectable({ providedIn: 'root' })
export class MessageService {

  // Last server message state for binding, could keep stack
  lastMessageType: MessageType|undefined = undefined
  lastMessageResults: string|undefined = undefined

  constructor(private http: HttpClient, private translate: TranslateService, private dialog: MatDialog) { }

  /** Serializes a OracleServerMessage for sending to oracleServer */
  sendMessage(m: OracleServerMessage, errorHandling = true) {
    let obs = this.sendServerMessage(m, errorHandling).pipe(tap(result => {
      this.lastMessageType = m.method
      if (result.result) {
        if (typeof result.result === 'object') {
          this.lastMessageResults = JSON.stringify(result.result, undefined, 2)
        } else {
          this.lastMessageResults = result.result.toString()
        }
      } else if (result.error) {
        this.lastMessageResults = result.error
      } else {
        this.lastMessageResults = this.translate.instant('resultWasEmpty')
      }
    }))

    return obs
  }

  private sendServerMessage(message: OracleServerMessage, errorHandling: boolean) {
    const url = environment.oracleServerApi
    const options = {}
    // Set at server now
    // if (this.authService.password) {
    //   let headers = new Headers()
    //   headers.set('Authorization', this.authService.serverAuthHeader)
    // }
    let obs = this.http.post<OracleResponse<any>>(url, message, options)

    if (errorHandling) {
      return obs.pipe(catchError((error: any, caught: Observable<unknown>) => {
        console.error('sendMessage error', error)
        let message = error?.error?.error
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.sendMessageError.title',
            content: message,
          }
        })
        throw(Error('sendMessage error' + error))
        return new Observable<any>() // required for type checking...
      }))
    } else {
      return obs
    }
  }

  // Proxy server calls

  heartbeat() {
    return this.http.get<SuccessType>(environment.proxyApi + '/heartbeat')
  }

  oracleHeartbeat() {
    return this.http.get<SuccessType>(environment.proxyApi + '/serverHeartbeat')
  }

  buildConfig() {
    return this.http.get<BuildConfig>(environment.proxyApi + '/buildConfig')
  }

  downloadBackup() {
    console.debug('downloadBackup()')

    return this.http.post(environment.proxyApi + '/downloadBackup', {}, { responseType: 'blob' })
  }

  // Downloads oracleServer logs
  downloadOracleServerLog() {
    console.debug('downloadOracleServerLog()')

    return this.http.post(environment.proxyApi + '/downloadOracleServerLog', {}, { responseType: 'blob' })
  }

  // Downloads proxy server logs
  downloadProxyLog() {
    console.debug('downloadProxyLog()')

    return this.http.post(environment.proxyApi + '/downloadProxyLog', {}, { responseType: 'blob' })
  }

  // Common bitcoin-s calls

  getServerVersion() {
    const m = getMessageBody(MessageType.getversion)
    // Ignoring errors so we can poll without giving the user errors
    return <Observable<OracleResponse<ServerVersion>>>this.sendMessage(m, false)
  }
}

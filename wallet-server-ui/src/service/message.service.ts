import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

import { environment } from 'src/environments/environment'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { AuthService } from './auth.service'

import { WalletServerMessage } from '~type/wallet-server-message'
import { MessageType, ServerResponse, ServerVersion } from '~type/wallet-server-types'
import { BuildConfig, SuccessType, UrlResponse } from '~type/proxy-server-types'

import { getMessageBody } from '~util/wallet-server-util'


/** Service that communicates with underlying oracleServer instance through oracle-server-ui-proxy */
@Injectable({ providedIn: 'root' })
export class MessageService {

  // Last server message state for binding, could keep stack
  lastMessageType: string|undefined = undefined
  lastMessageResults: string|undefined = undefined

  constructor(private http: HttpClient, private translate: TranslateService, 
    private dialog: MatDialog, private router: Router, private authService: AuthService) { }

  /** Serializes a OracleServerMessage for sending to oracleServer */
  sendMessage(m: WalletServerMessage, errorHandling = true) {
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

  private sendServerMessage(message: WalletServerMessage, errorHandling: boolean) {
    const url = environment.walletServerApi
    const options = {}
    // Set at server now
    // if (this.authService.password) {
    //   let headers = new Headers()
    //   headers.set('Authorization', this.authService.serverAuthHeader)
    // }
    let obs = this.http.post<ServerResponse<any>>(url, message, options)

    if (errorHandling) {
      return obs.pipe(catchError((error: any, caught: Observable<unknown>) => {
        console.error('sendMessage error', error)
        // Gracefully handle no longer authenticated
        if (error && error.status === 403) {
          this.authService.doLogout()
        }
        let message = error?.error?.error || error?.error
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.sendMessageError.title',
            content: message,
          }
        })
        throw(Error('sendMessage error ' + message))
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

  serverHeartbeat() {
    return this.http.get<SuccessType>(environment.proxyApi + '/serverHeartbeat')
  }

  buildConfig() {
    return this.http.get<BuildConfig>(environment.proxyApi + '/buildConfig')
  }

  mempoolUrl() {
    return this.http.get<UrlResponse>(environment.proxyApi + '/mempoolUrl')
  }

  // Generic file download via POST
  // download(path: string, filename: string, andDelete: boolean) {
  //   // console.debug('download', path, filename, andDelete)
  //   // const params = new HttpParams().set('path', path).set('delete', andDelete ? '1' : '0')
  //   // return this.http.get<Blob>(environment.proxyApi + '/download', { params, /*responseType: 'blob'*/ })
  //   return this.http.post(environment.proxyApi + '/download', { path, filename, andDelete }, { responseType: 'blob' })
  // }

  downloadBackup() {
    return this.http.post(environment.proxyApi + '/downloadBackup', {}, { responseType: 'blob' })
  }

  // Common bitcoin-s calls

  getServerVersion() {
    const m = getMessageBody(MessageType.getversion)
    return <Observable<ServerResponse<ServerVersion>>>this.sendMessage(m)
  }
}

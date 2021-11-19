import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core'
import { Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

import { environment } from 'src/environments/environment'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { WalletServerMessage } from '~type/wallet-server-message'
import { MessageType, ServerResponse, ServerVersion } from '~type/wallet-server-types'
import { BuildConfig, SuccessType } from '~type/proxy-server-types'

import { getMessageBody } from '~util/wallet-server-util'


/** Service that communicates with underlying oracleServer instance through oracle-server-ui-proxy */
@Injectable({ providedIn: 'root' })
export class MessageService {

  // Last server message state for binding, could keep stack
  lastMessageType: string|undefined = undefined
  lastMessageResults: string|undefined = undefined

  constructor(private http: HttpClient, private translate: TranslateService, private dialog: MatDialog) { }

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
    let obs = this.http.post<ServerResponse<any>>(url, message)

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

  walletHeartbeat() {
    return this.http.get<SuccessType>(environment.proxyApi + '/walletHeartbeat')
  }

  buildConfig() {
    return this.http.get<BuildConfig>(environment.proxyApi + '/buildConfig')
  }

  // Common bitcoin-s calls

  getServerVersion() {
    const m = getMessageBody(MessageType.getversion)
    return <Observable<ServerResponse<ServerVersion>>>this.sendMessage(m)
  }
}

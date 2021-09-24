import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { tap } from 'rxjs/operators'

import { environment } from 'src/environments/environment'

import { OracleServerMessage } from '~type/oracle-server-message'
import { MessageType, OracleResponse } from '~type/oracle-server-types'
import { BuildConfig, SuccessType } from '~type/proxy-server-types'


/** Service that communicates with underlying oracleServer instance through oracle-server-ui-proxy */
@Injectable({ providedIn: 'root' })
export class MessageService {

  // Last server message state for binding, could keep stack
  lastMessageType: MessageType|undefined = undefined
  lastMessageResults: string|undefined = undefined

  constructor(private http: HttpClient, private translate: TranslateService) { }

  /** Serializes a OracleServerMessage for sending to oracleServer */
  sendMessage(m: OracleServerMessage) {
    let obs = this.sendServerMessage(m).pipe(tap(result => {
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

  private sendServerMessage(message: OracleServerMessage) {
    const url = environment.oracleServerApi
    return this.http.post<OracleResponse<any>>(url, message)
  }

  // Proxy server calls

  heartbeat() {
    return this.http.get<SuccessType>(environment.proxyApi + '/heartbeat')
  }

  oracleHeartbeat() {
    return this.http.get<SuccessType>(environment.proxyApi + '/oracleHeartbeat')
  }

  buildConfig() {
    return this.http.get<BuildConfig>(environment.proxyApi + '/buildConfig')
  }
}

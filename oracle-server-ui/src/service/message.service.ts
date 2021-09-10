import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { catchError, tap } from 'rxjs/operators';

import { environment } from "src/environments/environment";

import { OracleServerMessage } from "~type/oracle-server-message";
import { MessageType } from "~type/oracle-server-types";
import { SuccessType } from "~type/proxy-server-types";

import { OracleResponse } from "~util/message-util";


@Injectable({ providedIn: 'root' })
export class MessageService {

  // Last server message state for binding, could keep stack
  lastMessageType: MessageType|undefined = undefined
  lastMessageResults: string|undefined = undefined

  constructor(private http: HttpClient) {

  }

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
        this.lastMessageResults = 'Result was empty'
      }
    }))

    return obs
  }

  private sendServerMessage(message: OracleServerMessage) {
    const url = environment.apiRoot
    return this.http.post<OracleResponse<any>>(url, message)
  }

  heartbeat() {
    return this.http.get<SuccessType>('heartbeat')
  }

  oracleHeartbeat() {
    return this.http.get<SuccessType>('oracleHeartbeat')
  }

  // private errorLogger(error: any, caught: Observable<OracleResponse>) {
  //   console.error('MessageService error:', error)
  // }
}

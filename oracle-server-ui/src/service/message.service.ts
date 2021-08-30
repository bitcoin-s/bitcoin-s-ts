import { HttpClient } from "@angular/common/http";
import { CATCH_ERROR_VAR } from "@angular/compiler/src/output/output_ast";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { catchError, tap } from 'rxjs/operators';

import { OracleResponse, OracleServerMessage } from "src/util/message-util";


@Injectable({ providedIn: 'root' })
export class MessageService {

  constructor(private http: HttpClient) {

  }

  sendMessage(host: string, port: string, message: OracleServerMessage) {
    
    const url = 'http://' + host + ':' + port + '/'

    return this.http.post<OracleResponse<any>>(url, message)
  }

  // private errorLogger(error: any, caught: Observable<OracleResponse>) {
  //   console.error('MessageService error:', error)
  // }
}

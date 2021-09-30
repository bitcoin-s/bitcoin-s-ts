import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { environment } from '~environments'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { AddressResponse } from '~type/blockstream-types'

import { TorService } from './tor.service'


@Injectable({ providedIn: 'root' })
export class BlockstreamService {

  private get url() {
    return (this.torService.useTor ? environment.torApi : '') + environment.blockstreamApi
  }

  constructor(private http: HttpClient, private torService: TorService, private dialog: MatDialog) {}

  private errorHandler(error: any, caught: Observable<unknown>) {
    console.error('Blockstream errorHandler')
    let message = error?.message
    const dialog = this.dialog.open(ErrorDialogComponent, {
      data: {
        title: 'dialog.blockstreamError.title',
        content: message,
      }
    })
    throw(Error('Blockstream error ' + error))
    return new Observable<any>() // required for type checking...
  }

  /** Helper functions */

  balanceFromGetBalance(r: AddressResponse) {
    if (r && r.chain_stats) {
      return r.chain_stats.funded_txo_sum - r.chain_stats.spent_txo_sum
    }
    return 0
  }

  /** API Calls */

  getBalance(address: string) {
    return this.http.get<AddressResponse>(this.url + `/address/${address}`)
      .pipe(catchError(this.errorHandler.bind(this)))
  }
}

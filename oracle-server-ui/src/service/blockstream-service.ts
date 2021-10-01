import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { environment } from '~environments'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { AddressResponse } from '~type/blockstream-types'
import { getProxyErrorHandler } from '~type/proxy-server-types'

import { TorService } from './tor.service'


@Injectable({ providedIn: 'root' })
export class BlockstreamService {

  private get url() {
    return (this.torService.useTor ? environment.torApi : '') + environment.blockstreamApi
  }

  constructor(private http: HttpClient, private torService: TorService, private dialog: MatDialog) {}

  private errorHandler = getProxyErrorHandler('blockstream', (message: string) => {
    const dialog = this.dialog.open(ErrorDialogComponent, {
      data: {
        title: 'dialog.blockstreamError.title',
        content: message,
      }
    })
  }).bind(this)

  /** Helper functions */

  balanceFromGetBalance(r: AddressResponse) {
    if (r && r.chain_stats) {
      return r.chain_stats.funded_txo_sum - r.chain_stats.spent_txo_sum
    }
    return 0
  }

  /** API Calls */

  getBalance(address: string) {
    console.debug('getBalance()')
    return this.http.get<AddressResponse>(this.url + `/address/${address}`)
      .pipe(catchError(this.errorHandler))
  }
}

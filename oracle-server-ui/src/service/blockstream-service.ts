import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { environment } from '~environments'

import { AddressResponse } from '~type/blockstream-types'


@Injectable({ providedIn: 'root' })
export class BlockstreamService {

  private url = environment.blockstreamApi // if we want to change at runtime, will need host-override header like Oracle Explorer

  constructor(private http: HttpClient) {}

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
  }
}

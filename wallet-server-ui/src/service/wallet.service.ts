import { EventEmitter, Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject, forkJoin, of, Subscription, timer } from 'rxjs'
import { catchError, concatMap, tap } from 'rxjs/operators'


import { AddressService } from '~service/address.service'
import { AuthService } from '~service/auth.service'
import { ContactService } from './contact-service'
import { DLCService } from '~service/dlc-service'
import { MessageService } from '~service/message.service'
import { OfferService } from '~service/offer-service'

import { Balances, BlockchainMessageType, DLCMessageType, DLCWalletAccounting, GetInfoResponse, ServerResponse, Wallet, WalletInfo, WalletMessageType } from '~type/wallet-server-types'

import { getMessageBody } from '~util/wallet-server-util'


const DEFAULT_WALLET_NAME = ''

@Injectable({ providedIn: 'root' })
export class WalletService {

  initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  private _walletName: string = DEFAULT_WALLET_NAME // current wallet name
  set walletName(s: string) { this._walletName = s }
  get walletName() { return this._walletName }

  wallets: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([])
  wallet: BehaviorSubject<Wallet> = new BehaviorSubject<Wallet>(<Wallet>{})

  constructor(private messageService: MessageService) {}

  initializeState() {
    return forkJoin([
      this.getWallets(),
      this.getWalletInfo(),
    ]).pipe(tap(r => {
      this.initialized.next(true)
    }, err => {
      console.error('error in WalletService.initializeState()')
    }))
  }

  uninitialize() {
    this.initialized.next(false)
    // Could clear state
  }

  getWallets() {
    console.debug('getWallets()')
    return;
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.listwallets)).pipe(tap(r => {
      console.debug(' listwallets', r)
      if (r.result) {
        const wallets = <string[]> r.result || []
        this.wallets.next(wallets)
      }
    }))
  }

  getWalletInfo() {
    console.debug('getWalletInfo()')

    return this.messageService.sendMessage(getMessageBody(WalletMessageType.walletinfo), false).pipe(tap(r => {
      console.debug(' getinfo', r)
      if (r.result) {
        const wallet = (<WalletInfo>r.result).wallet
        this.wallet.next(wallet)
        this.walletName = wallet.walletName
      }
    }))
  }

  loadWallet(walletName: string, passphrase?: string) {
    console.debug('loadWallet()', walletName)

    return this.messageService.sendMessage(getMessageBody(WalletMessageType.loadwallet, [walletName, passphrase])).pipe(tap(r => {
      console.debug(' loadwallet', r)
      if (r.result !== undefined) {
        const walletName = r.result
        this.walletName = walletName
        // this.getWalletInfo().subscribe()
        // TODO : Probably reload wallet and contracts
      } else {
        // Trouble
      }
    }))
    // }), this.getWalletInfo) // Is this legal to follow on action?
  }

  exportWallet(walletName?: string, passphrase?: string) {
    console.debug('exportWallet()', walletName)

    return this.messageService.sendMessage(getMessageBody(WalletMessageType.exportseed, [walletName, passphrase])).pipe(tap(r => {
      // console.debug(' exportseed', r) // TODO : Remove r
    }))
  }

  importSeedWordWallet(walletName: string|undefined, words: string, passphrase?: string) {
    console.debug('importSeedWordWallet()', walletName)

    return this.messageService.sendMessage(getMessageBody(WalletMessageType.importseed, [walletName, words, passphrase])).pipe(tap(r => {
      console.debug(' importseed', r)
      // success : {result: null, error: null}
    }))
  }

  importXprvWallet(walletName: string|undefined, xprv: string, passphrase?: string) {
    console.debug('importXprvWallet()', walletName)

    return this.messageService.sendMessage(getMessageBody(WalletMessageType.importxprv, [walletName, xprv, passphrase])).pipe(tap(r => {
      console.debug(' importxprv', r)
    }))
  }

}

import { EventEmitter, Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject, forkJoin, Observable, throwError, timer } from 'rxjs'
import { catchError, debounceTime, delayWhen, retryWhen, switchMap, tap } from 'rxjs/operators'

import { AddressService } from '~service/address.service'
import { AuthService } from '~service/auth.service'
import { ContactService } from './contact-service'
import { DLCService } from '~service/dlc-service'
import { MessageService } from '~service/message.service'
import { OfferService } from '~service/offer-service'

import { BuildConfig } from '~type/proxy-server-types'
import { Balances, BlockchainMessageType, DLCMessageType, DLCWalletAccounting, GetInfoResponse, ServerResponse, Wallet, WalletMessageType } from '~type/wallet-server-types'

import { BitcoinNetwork, } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'
import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'


export /* const */ enum WalletServiceState {
  offline = 'offline', // not talking with backend
  online = 'online', // backend has responded to a getversion // TODO : Believe this is a dead state, remove
  server_starting = 'server_starting', // torStarted or syncing means the server is up but busy and may not want to respond to requests
  tor_started = 'tor_started', // torStarted is true, may be syncing
  server_ready = 'server_ready', // walletinfo reports backend is ready to go
  wallet_rescan = 'wallet_rescan', // wallet is being rescanned, state is not stable
  polling = 'polling', // may not want to have as a state // TODO : Believe this is a dead state, remove
}

const OFFLINE_POLLING_TIME = 5000 // ms
const STATE_RETRY_DELAY = 15000 // ms

const FEE_RATE_NOT_SET = -1
const DEFAULT_FEE_RATE = 1 // sats/vbyte

const RESTART_DIALOG_DELAY = 120000 // ms

const THREE_DASHES_WORTH = /([.\w]+-[.\w]+-[.\w]+)/ // matches "1.9.3-11-8788b6f4" of "1.9.3-11-8788b6f4-20220907-1105-SNAPSHOT"

/**
 * WalletStateService holds bitcoin-s appServer state that we care about.
 * Interacting with backend goes through these steps:
 * 1. Wait for waitForAppServer()
 *    Receive BlockchainMessageType.getinfo message
 *    state -> WalletServiceState.server_starting
 * 2. Wait for checkServerReady() if torStarting or syncing on backend
 *    (optional) Receive websocket messages updating state of torStarted and syncing
 *    state -> WalletServiceState.tor_started (otherwise stay in loop), WalletServiceState.server_ready
 * 3. initializeWallet(), loads all wallet names and info on current wallet
 * 4. Wait for checkWalletScanning()
 *    state -> WalletServiceState.wallet_rescan if rescanning
 *    (optional) Receive websocket messages for rescancomplete
 *    state -> WalletServiceState.server_ready
 * 5. initializeState(), loads all server state
 *    refreshWalletState(), loads all wallet dependent state
 */
@Injectable({ providedIn: 'root' })
export class WalletStateService {

  // Server

  private _state: WalletServiceState = WalletServiceState.offline
  set state(s: WalletServiceState) { this._state = s }
  get state() { return this._state }

  isServerReady() { // torStarted and synced
    return this.state === WalletServiceState.server_ready
  }

  serverVersion: string
  shortServerVersion: string

  buildConfig: BuildConfig
  shortUIVersion: string

  info: GetInfoResponse
  getNetwork() {
    if (this.info) return <BitcoinNetwork>this.info.network
    else return ''
  }
  // info state passthroughs
  set torStarted(bool: boolean) {
    if (this.info) this.info.torStarted = bool
    // If we receive a torStarted event, no need to show restart dialog
    this.showRestartDialog = false
  }
  set syncing(bool: boolean) {
    if (this.info) this.info.syncing = bool
  }
  set blockHeight(height: number) {
    if (this.info) this.info.blockHeight = height
  }
  // Used during IBD to show compactFilterHeader/compactFilter blockHeight received from Neutrino backend
  compactFilterHeaderBlockHeight = 0 
  compactFilterBlockHeight = 0
  torDLCHostAddress: string
  feeEstimate: number

  showRestartDialog = false // track backend !torStarted state and ask user to restart after threshold

  // Checks to see if the backend is done with startup procedures and if so, loads server state and initializes wallet
  checkForServerReady() {
    console.warn('checkServerReady()', this.info, this.wallet.value, this.state)
    if (this.info && this.info.torStarted === true && this.info.syncing === false) {
      // If tor_started hasn't happened yet, load server state so user has tor address
      if (![WalletServiceState.tor_started,
            WalletServiceState.server_ready].includes(this.state)) {
        console.warn('tor_started, syncing == false, state:', this.state)
        this.initializeServerState().subscribe()
      }
      // If we are transitioning to server_ready, load wallet info
      if (this.state !== WalletServiceState.server_ready) {
        console.warn('server_ready')
        this.initializeWallet().subscribe()
        // Clear IBD flag
        this.refreshBlockchainInfo().subscribe()
      }
      this.state = WalletServiceState.server_ready
    } else if (this.info && this.info.torStarted === true) {
      if (![WalletServiceState.tor_started,
            WalletServiceState.server_ready].includes(this.state)) {
        console.warn('tor_started')
        this.initializeServerState().subscribe()
      }
      this.state = WalletServiceState.tor_started
    } else { // default starting up state
      this.state = WalletServiceState.server_starting
    }
  }

  private checkWalletScanning() {
    console.debug('checkWalletScanning()')
    if (this.wallet.value?.rescan === false) {
      if (!this.initialized) {
        this.initializeState().subscribe()
      }
      this.refreshWalletState().subscribe()
      this.state = WalletServiceState.server_ready
    } else {
      console.warn('wallet is rescanning...', this.wallet.value)
      this.state = WalletServiceState.wallet_rescan
    }
  }

  // Maybe should fold into checkWalletScanning() above
  private checkWalletCurrent() {
    console.debug('checkWalletCurrent() blockHeight:', this.info.blockHeight, this.wallet.value)
    if (this.wallet.value && this.wallet.value.height < this.info.blockHeight) {
      const w = this.wallet.value.walletName || 'Default Wallet'
      const m = `This wallet (${w}) needs a rescan.\n\nWallet blockHeight: ${this.wallet.value.height}, current blockHeight: ${this.info.blockHeight}`
      console.warn(m)
      // TODO : Dialog with offer to rescan wallet up-to-date?
      // this.rescanWallet(false, this.wallet.value.height /* +1? */)
      // TEMP Dialog to say wallet is not synced
      // const dialog = this.dialog.open(ErrorDialogComponent, {
      //   data: {
      //     title: 'dialog.warning',
      //     content: m,
      //     class: 'ws-preline',
      //   }
      // })
    }
  }

  // Wallet
  showWalletSelector: boolean = false // flag for visibility of wallet selection and seed import
  wallets: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([])
  wallet: BehaviorSubject<Wallet|null> = new BehaviorSubject<Wallet|null>(null)

  private setWallet(wallet: Wallet|null) {
    // console.debug('setWallet()', wallet)
    this.wallet.next(wallet)
    this.checkWalletScanning()
    this.checkWalletCurrent()
  }

  private uninitializeWallet() {
    this.wallets.next([])
    this.wallet.next(null)
  }

  // Wallet Specific
  balances: Balances
  dlcWalletAccounting: DLCWalletAccounting

  // Misc
  
  mempoolUrl: string = 'https://mempool.space' // default
  mempoolTransactionURL(txIdHex: string, network: string) {
    switch (network) {
      case BitcoinNetwork.main:
        return `${this.mempoolUrl}/tx/${txIdHex}`
      case BitcoinNetwork.test:
        return `${this.mempoolUrl}/testnet/tx/${txIdHex}`
      case BitcoinNetwork.signet:
        return `${this.mempoolUrl}/signet/tx/${txIdHex}`
      default:
        console.error('mempoolTransactionURL() unknown BitcoinNetwork', network)
        return ''
    }
  }

  // Full State Loaded signal
  stateLoaded: EventEmitter<void> = new EventEmitter()

  private initialized = false // server state fully initialized

  constructor(private dialog: MatDialog, private messageService: MessageService, private authService: AuthService,
    private dlcService: DLCService, private offerService: OfferService, private addressService: AddressService,
    private contactService: ContactService) {
      this.dlcService.initialized.subscribe(v => {
        if (v) this.checkInitialized()
      })
      this.offerService.initialized.subscribe(v => {
        if (v) this.checkInitialized()
      })
    }

  private restartDialogTimer$ = timer(RESTART_DIALOG_DELAY).pipe(tap(_ => {
    if (this.showRestartDialog) {
      console.error('show tor restart dialog')
      this.showRestartDialog = false // Don't show any more restart dialogs
      const dialog = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'dialog.torRestartRequired.title',
          content: 'dialog.torRestartRequired.content',
          params: { sec: RESTART_DIALOG_DELAY },
          action: 'action.close',
        }
      })
    } else {
      console.debug('show tor restart dialog - showRestartDialog == false, nothing to do')
    }
  }))

  // Detect that backend is available and ready for interaction
  public waitForAppServer() {
    console.debug('waitForAppServer()')
    return this.refreshBlockchainInfo().pipe(
      retryWhen(errors => {
        return errors.pipe(
          tap((error) => {
            this.state = WalletServiceState.offline
            this.showRestartDialog = false
            // Handle proxy restart when token has gone invalid
            if (error && error.status === 403) {
              console.debug('waitForAppServer() 403 - doLogout')
              this.authService.doLogout()
            }
          }),
          delayWhen(_ => timer(OFFLINE_POLLING_TIME)),
        );
      }),
      tap(_ => {
        // refreshBlockchainInfo() calls checkForServerReady() which sets WalletServiceState state

        // If tor has not started yet, set timeout to show a restart dialog
        if (this.info && !this.info.torStarted) {
          this.showRestartDialog = true
          this.restartDialogTimer$.subscribe()
        }
      })
    )
  }

  // These could be decoupled and made sure to load on their respective pages.
  // Currently all together to guarantee any state is already known and isn't needed async for frontend operations
  private checkInitialized() {
    if (this.initialized && this.dlcService.initialized.value && this.offerService.initialized.value) {
      console.debug('WalletStateService.checkInitialized() stateLoaded going', this.state)
      this.stateLoaded.next() // initial state loaded event
    }
  }

  // private readonly initializeState$ = this.initializeState().pipe(
  //   debounceTime(STATE_RETRY_DELAY),
  // )

  private initializeState() {
    console.debug('initializeState()')
    return forkJoin([
      this.offerService.loadIncomingOffers(),
      this.contactService.loadContacts(),
    ]).pipe(tap(r => {
      this.initialized = true
      this.checkInitialized()
    }, err => {
      console.error('initializeState() forkJoin error')
      this.state = WalletServiceState.offline
      this.initialized = false
    }))
  }

  public uninitialize() {
    console.debug('WalletStateService.uninitialize()')
    this.state = WalletServiceState.offline
    this.initialized = false
    this.uninitializeWallet()
    this.dlcService.uninitialize()
    this.offerService.uninitialize()
    this.addressService.uninitialize()
    this.contactService.uninitialize()
  }

  /** Server */

  private initializeServerState$: Observable<any>
  private initializeServerState() {
    console.debug('initializeServerState()')
    if (!this.initializeServerState$) {
      this.initializeServerState$ = forkJoin([
        this.getServerVersion(),
        this.getMempoolUrl(),
        this.getFeeEstimate(),
        this.getDLCHostAddress(),
        this.getAboutInfo(), // So we can make tooltips
      ]).pipe(tap(r => {
        
      }, err => {
        console.error('initializeServerState() forkJoin error')
      })).pipe(debounceTime(STATE_RETRY_DELAY))
    }
    return this.initializeServerState$
  }

  private getServerVersion() {
    return this.messageService.getServerVersion().pipe(tap(r => {
      if (r.result) {
        const v = r.result.version
        this.serverVersion = v
        const m = v.match(/([.\w]+-[.\w]+-[.\w]+)/)
        if (m && m.length > 0) this.shortServerVersion = m[0] 
        else this.shortServerVersion = v
      }
    }))
  }

  private getBuildConfig() {
    return this.messageService.buildConfig().pipe(tap(r => {
      if (r) {
        r.dateString = new Date(r.committedOn * 1000).toLocaleDateString()
        this.buildConfig = r
        this.shortUIVersion = this.buildConfig.version + ' ' + this.buildConfig.shortHash
      }
    }))
  }

  getAboutInfo() {
    return forkJoin([
      // this.getServerVersion(), // this is an auth protected route
      this.getBuildConfig(),
    ])
  }

  private getMempoolUrl() {
    return this.messageService.mempoolUrl().pipe(tap(r => {
      if (r && r.url) {
        // HACK HACK HACK - This converts api URL to base URL. Should get passed good URL
        const index = r.url.lastIndexOf('/api')
        if (index !== -1) {
          this.mempoolUrl = r.url.substring(0, index)
        }
      }
    }))
  }

  private getFeeEstimate() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.estimatefee)).pipe(tap(r => {
      if (r.result && r.result !== FEE_RATE_NOT_SET) {
        this.feeEstimate = r.result
      } else {
        this.feeEstimate = DEFAULT_FEE_RATE
      }
    }))
  }

  private getDLCHostAddress() {
    return this.messageService.sendMessage(getMessageBody(DLCMessageType.getdlchostaddress)).pipe(tap(r => {
      if (r.result) {
        this.torDLCHostAddress = r.result
        console.warn('torDLCHostAddress:', this.torDLCHostAddress)
      }
    }))
  }

  /** Wallet */

  public initializeWallet$: Observable<any>
  initializeWallet() {
    if (!this.initializeWallet$) {
      this.initializeWallet$ = forkJoin([
        this.getWallets(),
        this.getWalletInfo(),
        // We do not load all wallet details - just the current wallet. There is no way to load their details yet.
      ]).pipe(tap(r => {
        
      }, err => {
        console.error('error in initializeWallet()')
      })).pipe(debounceTime(STATE_RETRY_DELAY))
    }
    return this.initializeWallet$
  }

  private getWallets() {
    console.debug('getWallets()')
    
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.listwallets)).pipe(tap(r => {
      console.debug(' listwallets', r)
      const wallets = <string[]> r.result || []
      this.wallets.next(wallets)
    }))
  }

  getWalletInfo() {
    console.debug('getWalletInfo()')

    return this.messageService.sendMessage(getMessageBody(WalletMessageType.walletinfo), false).pipe(tap(r => {
      console.debug(' walletinfo', r)
      if (r.error) {
        console.error('getWalletInfo() error', r.error)
      } else if (r.result) {
        const wallet = <Wallet>r.result.wallet
        this.setWallet(wallet)
      }
    }))
  }

  loadWallet(walletName: string, passphrase?: string) {
    console.debug('loadWallet() walletName:', walletName)

    // TEST
    // passphrase = 'wrong'

    const name = walletName || undefined // empty string serializes to undefined

    return this.messageService.sendMessage(getMessageBody(WalletMessageType.loadwallet, [name, passphrase])).pipe(tap(r => {
      console.debug(' loadwallet', r)
      if (r.error) {
        throw Error(r.error)
      } else if (r.result !== undefined) { // r.result is null for default wallet
        const walletName = r.result
      } else {
        // Trouble
      }
    }),
      // get newly loaded wallet info
      switchMap(_ => this.getWalletInfo()),
      // Doing this in checkWalletScanning() now instead
      // switchMap(_ => this.refreshWalletState()), // refresh local state for new wallet
      // Auto-rescan based on loaded wallet
      // tap(_ => {
      //   if (this.wallet.value && this.wallet.value.height < this.info.blockHeight) {
      //     console.warn('wallet is out of date and needs a rescan wallet height:', this.wallet.value.height, 'blockHeight:', this.info.blockHeight)
      //     // TODO
      //   }
      // }),
      catchError((error: any, caught: Observable<unknown>) => {
        console.error('loadWallet() chain error', error)
        let e = error?.message || error
        // Wallet is in an unknown state
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.error',
            content: 'error.error',
            params: { error: e },
          }
        })
        return throwError(error)
      })
    )
  }

  rescanWallet(ignoreCreationTime: boolean = false, startBlock: number|null = null, endBlock: number|null = null) {
    console.debug('rescanWallet() ignoreCreationTime:', ignoreCreationTime, 'startBlock:', startBlock, 'endBlock:', endBlock)

    // Could expose these to the user, but would need to validate
    // [0,0,0,true,true] results in infinite loop in backend
    const batchSize = null // 0
    // const startBlock = null // 0
    // const endBlock = null // this.walletStateService.info.blockHeight
    const force = true
    // const ignoreCreationTime = ignoreCreationTime // false // forces full rescan regardless of wallet creation time

    return this.messageService.sendMessage(getMessageBody(WalletMessageType.rescan, [batchSize, startBlock, endBlock, force, ignoreCreationTime])).pipe(tap(r => {
      console.debug(' rescan', r)

      if (r.result) { // "Rescan started."
        // TODO : Started dialog / message
        if (this.wallet.value) {
          this.wallet.value.rescan = true
        }
        this.state = WalletServiceState.wallet_rescan
      }
    }))
  }

  private refreshWallet$: Observable<any>
  refreshWalletState() {
    // console.debug('refreshWalletState()')
    if (!this.refreshWallet$) {
      this.refreshWallet$ = forkJoin([
        this.refreshBalances(),
        this.refreshDLCWalletAccounting(),
        this.addressService.initializeState(),
        this.dlcService.loadDLCs(),
      ]).pipe(tap(r => {
        // Set flag for wallet initialized?
      }, err => {
        console.error('refreshWalletState() forkJoin error')
      })).pipe(debounceTime(STATE_RETRY_DELAY))
    }
    return this.refreshWallet$
  }

  private refreshBlockchainInfo() {
    return this.messageService.sendMessage(getMessageBody(BlockchainMessageType.getinfo), false).pipe(tap(r => {
      console.debug(' getinfo', r)
      if (r.result) {
        this.info = r.result
        this.checkForServerReady()
      }
    }))
  }

  refreshBalances() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getbalances, [true])).pipe(tap(r => {
      if (r.result) {
        this.balances = r.result
      }
    }))
  }

  private refreshDLCWalletAccounting() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.getdlcwalletaccounting)).pipe(tap(r => {
      if (r.result) {
        this.dlcWalletAccounting = r.result
      }
    }))
  }

  /** Import/Export */

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
      // TODO : Waiting on result: string === walletName
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

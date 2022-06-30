
// Serverside message types
export const enum WalletMessageType {
  // Common
  getversion = 'getversion',

  // appServer

  isempty = 'isempty',
  walletinfo = 'walletinfo',
  getbalance = 'getbalance',
  getconfirmedbalance = 'getconfirmedbalance',
  getunconfirmedbalance = 'getunconfirmedbalance',
  getbalances = 'getbalances',
  getnewaddress = 'getnewaddress',
  gettransaction = 'gettransaction',
  lockunspent = 'lockunspent',
  labeladdress = 'labeladdress',
  dropaddresslabel = 'dropaddresslabel',
  getaddresslabels = 'getaddresslabels',
  dropaddresslabels = 'dropaddresslabels',

  getdlcs = 'getdlcs',
  getdlc = 'getdlc',
  canceldlc = 'canceldlc',
  createdlcoffer = 'createdlcoffer',
  getdlcoffer = 'getdlcoffer',
  acceptdlcoffer = 'acceptdlcoffer',
  acceptdlcofferfromfile = 'acceptdlcofferfromfile',
  signdlc = 'signdlc',
  signdlcfromfile = 'signdlcfromfile',
  adddlcsigs = 'adddlcsigs',
  adddlcsigsfromfile = 'adddlcsigsfromfile',
  adddlcsigsandbroadcast = 'adddlcsigsandbroadcast',
  adddlcsigsandbroadcastfromfile = 'adddlcsigsandbroadcastfromfile',
  getdlcfundingtx = 'getdlcfundingtx',
  broadcastdlcfundingtx = 'broadcastdlcfundingtx',
  executedlc = 'executedlc',
  executedlcrefund = 'executedlcrefund',

  sendtoaddress = 'sendtoaddress',
  sendfromoutpoints = 'sendfromoutpoints',
  sweepwallet = 'sweepwallet',
  sendwithalgo = 'sendwithalgo',
  signpsbt = 'signpsbt',
  opreturncommit = 'opreturncommit',
  bumpfeerbf = 'bumpfeerbf',
  bumpfeecpfp = 'bumpfeecpfp',
  rescan = 'rescan',
  getutxos = 'getutxos',
  listreservedutxos = 'listreservedutxos',
  getaddresses = 'getaddresses',
  getspentaddresses = 'getspentaddresses',
  getfundedaddresses = 'getfundedaddresses',
  getunusedaddresses = 'getunusedaddresses',
  getaccounts = 'getaccounts',
  getaddressinfo = 'getaddressinfo',
  createnewaccount = 'createnewaccount',

  // keymanagerpassphrasechange
  // keymanagerpassphraseset

  importseed = 'importseed',
  importxprv = 'importxprv',
  listwallets = 'listwallets',
  loadwallet = 'loadwallet',
  exportseed = 'exportseed',
  getseedbackuptime = 'getseedbackuptime',
  
  sendrawtransaction = 'sendrawtransaction',
  estimatefee = 'estimatefee',
  getdlcwalletaccounting = 'getdlcwalletaccounting',
  backupwallet = 'backupwallet',

  offeradd = 'offer-add',
  offerremove = 'offer-remove',
  offerslist = 'offers-list',
  offersend = 'offer-send',

  contactadd = 'contact-add',
  contactremove = 'contact-remove',
  contactslist = 'contacts-list',

  dlccontactadd = 'dlc-contact-add',
  dlccontactremove = 'dlc-contact-remove',
}

export interface WalletInfo {
  wallet: Wallet
}

export interface Wallet {
  keymanager: any
  walletName: string
  xpub: string
  hdPath: string // like "m/84'/1'/0'"
  height: number
  blockHash: string
  rescan: boolean // wallet is currently rescanning
}

export interface Balances {
  confirmed: number
  unconfirmed: number
  reserved: number // This is negative when present
  total: number
}

export interface UTXO {
  outpoint: Outpoint
  value: number // sats
}

export interface Outpoint {
  txid: string
  vout: number
}

export interface FundedAddress {
  address: string
  value: number // sats
}

export interface AddressInfo {
  pubkey: string // hex
  path: string // like "m/84'/1'/0'/0/1"
}

export interface DLCWalletAccounting {
  myCollateral: number
  theirCollateral: number
  myPayout: number
  theirPayout: number
  pnl: number
  rateOfReturn: number
}

export interface DLCContract {
  peer: string // tor address of counterparty
  contractInfo: string
  contractMaturity: number // 1635877874
  contractTimeout: number // 1636877874
  dlcId: string // "f735a813f64d600f6179a88d1e6a8984bfa272f3f5caa8c8265fdba9f80e73c0"
  feeRate: number // 1
  isInitiator: boolean // true
  lastUpdated: string // "2021-11-02T18:31:14.789Z"
  localCollateral: number // 100000
  remoteCollateral: number // 100001
  state: string // DLCState //  "Offered"
  temporaryContractId: string // "ddb32c03280b4e064aad9815927f383c87b028a98c07f481e0941624e97d8924"
  totalCollateral: number // 200001
  payoutAddress: { address: string, isExternal: boolean } // isExternal to wallet

  // not present initially
  contractId?: string
  fundingTxId?: string

  // Claimed
  closingTxId?: string // After executing oracle signatures / Claimed state
  counterPartyPayout?: number // sats
  myPayout?: number // sats
  oracleSigs?: string[]
  oracles?: string[]
  outcomes?: string|number[][] // for enum, "outcome", for numeric, [[1, 1, 0, 0, 1, 0, 0]]
  pnl?: number // sats
  rateOfReturn?: number // 0.5744851029794041
}

export enum DLCState {
  // InProgressState
  offered = 'Offered',
  accepting = 'AcceptedComputingAdaptorSigs', // Transitioning
  accepted = 'Accepted',
  signing = 'SignComputingAdaptorSigs', // Transitioning
  signed = 'Signed',
  broadcast = 'Broadcasted',
  confirmed = 'Confirmed',
  // ClosedViaOracleOutcomeState
  claimed = 'Claimed',
  remoteClaimed = 'RemoteClaimed',
  // ClosedState
  refunded = 'Refunded',
}

export interface IncomingOffer {
  hash: string
  receivedAt: number
  peer: string
  message: string
  offerTLV: string
}

export interface Contact {
  alias: string
  address: string
  memo: string
}


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
  // getaddresstags = 'getaddresstags', // dupe of 'getaddresslabels'
  getaddresslabels = 'getaddresslabels',
  dropaddresslabels = 'dropaddresslabels',

  getdlcs = 'getdlcs',
  getdlc = 'getdlc',
  canceldlc = 'canceldlc',
  createdlcoffer = 'createdlcoffer',
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
  sendrawtransaction = 'sendrawtransaction',
  estimatefee = 'estimatefee',
  getdlcwalletaccounting = 'getdlcwalletaccounting',
  backupwallet = 'backupwallet',
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

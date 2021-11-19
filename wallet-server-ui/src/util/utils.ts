import { DLCState } from "~type/wallet-server-types"

export function copyToClipboard(s: string) {
  const hiddenta = document.createElement('textarea')
  hiddenta.style.position = 'fixed'
  hiddenta.style.opacity = '0'
  hiddenta.style.left = '0'
  hiddenta.style.top = '0'
  hiddenta.value = s
  document.body.appendChild(hiddenta)
  hiddenta.focus()
  hiddenta.select()
  document.execCommand('copy')
  document.body.removeChild(hiddenta)
}

export enum BitcoinNetwork {
  // regtest = 'regtest', // NOT VALIDATED AGAINST BACKEND
  test = 'test',
  main = 'main', // NOT VALIDATED AGAINST BACKEND
  signet = 'signet', // NOT VALIDATED AGAINST BACKEND
}

// Network Regex Validators
const TESTNET_REGEX = /^(tb1|[2nm]|bcrt)[a-zA-HJ-NP-Z0-9]{25,40}$/;
const MAINNET_REGEX = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/;

export function validateBitcoinAddress(network: string, address: string) {
  if (!network || !address) return false

  switch (network) {
    case BitcoinNetwork.test:
      return TESTNET_REGEX.test(address)
    case BitcoinNetwork.main:
      return MAINNET_REGEX.test(address)
    default:
      console.error('unknown network', network)
  }
  return false
}

export function formatISODate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString()
}

// units epochSeconds?
export function formatDateTime(dateTime: number) {
  return new Date(dateTime * 1000).toLocaleDateString()
}

// From common-ts
export function dateToSecondsSinceEpoch(date: Date) {
  const secondsSinceEpoch = Math.round(date.getTime() / 1000)
  return secondsSinceEpoch
}


export function formatPercent(num: number, fractionalDigits = 2): string {
  if (num !== undefined) {
    return (num * 100).toFixed(fractionalDigits)
  }
  return ''
}

// Matches upper and lower case hex strings
const UPPERLOWER_CASE_HEX = /[0-9A-Fa-f]{6}/g;

export function validateHexString(s: string) {
  return UPPERLOWER_CASE_HEX.test(s)
}

const SHORT_HEX_LENGTH = 8

export function formatShortHex(s: string|null|undefined) {
  if (s) {
    if (s.length < SHORT_HEX_LENGTH) return s
    return s.substring(0, SHORT_HEX_LENGTH) + '...' // this.translate('unit.ellipsis')
  }
  return ''
}

export function mempoolTransactionURL(txIdHex: string, network: BitcoinNetwork) {
  switch (network) {
    case BitcoinNetwork.main:
      return `https://mempool.space/tx/${txIdHex}`
    case BitcoinNetwork.test:
      return `https://mempool.space/testnet/tx/${txIdHex}`
    case BitcoinNetwork.signet:
      return `https://mempool.space/signet/tx/${txIdHex}`
    default:
      console.error('mempoolTransactionURL() unknown BitcoinNetwork', network)
      return ''
  }
}

const TOR_V3_ADDRESS = /^[a-z2-7]{56}.onion\:\d{4,5}$/;

export function validateTorAddress(address: string) {
  return TOR_V3_ADDRESS.test(address)
}

// DLCState of DLCContract allow operation functions

export function isCancelable(state: DLCState) {
  return [DLCState.offered, DLCState.accepted, DLCState.signed].includes(state)
}

export function isRefundable(state: DLCState) {
  return [DLCState.confirmed, DLCState.broadcast, DLCState.confirmed].includes(state)
}

export function isExecutable(state: DLCState) {
  return [DLCState.confirmed, DLCState.broadcast].includes(state)
}

export function isFundingTxRebroadcastable(state: DLCState) {
  return [DLCState.broadcast].includes(state)
}


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
  // signet = 'signet',  // NOT VALIDATED AGAINST BACKEND
  test = 'test',
  main = 'main', // NOT VALIDATED AGAINST BACKEND
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

export function formatPercent(num: number, fractionalDigits = 2): string {
  if (num !== undefined) {
    return num.toFixed(fractionalDigits)
  }
  return ''
}

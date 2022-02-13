
// Translates bitcoin-s server network names to .bitcoin-s folder names
export function serverNetworkNameToFolderName(network: string) {
  switch (network) {
    case 'test':
      return 'testnet3'
    case 'main':
      return 'mainnet'
    case 'regtest':
      return 'regtest' // correct?
    case 'signet':
      return 'signet' // correct?
    default:
      return null
  }
}

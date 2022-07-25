
export const enum BlockchainMessageType {
  getblockcount = 'getblockcount',
  getfiltercount = 'getfiltercount',
  getfilterheadercount = 'getfilterheadercount',
  getbestblockhash = 'getbestblockhash',
  getblockheader = 'getblockheader',
  // decoderawtransaction = 'decoderawtransaction',
  getinfo = 'getinfo',
}

export interface BlockHeaderResponse {
  raw: string
  hash: string
  confirmations: number
  height: number
  version: number
  versionHex: string // like '20000000'
  merkleroot: string
  time: number
  nonce: number
  bits: string // like '1d00ffff'
  difficulty: number
  chainwork: string
  previousblockhash: string
}

export interface GetInfoResponse {
  network: string // like 'test'
  blockHeight: number
  blockHash: string
  torStarted: boolean
  syncing: boolean // Blockchain data is currently syncing
}

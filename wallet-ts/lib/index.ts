import { SendServerMessage } from '../../common-ts/lib/index'
import { ServerResponse } from '../../common-ts/lib/type/server-types'
import { getMessageBody } from '../../common-ts/lib/util/message-util'
import { validateBoolean, validateNumber, validateString } from '../../common-ts/lib/util/validation-util'

import { BlockchainMessageType, BlockHeaderResponse, GetInfoResponse } from './type/blockchain-types'
import { Accept, Announcement, Attestment, CoreMessageType, Offer, Sign } from './type/core-types'
import { DLCMessageType } from './type/dlc-types'
import { NetworkMessageType } from './type/network-types'
import { AddressInfo, Balances, DLCContract, DLCWalletAccounting, FundedAddress, Outpoint, UTXO, WalletInfo, WalletMessageType } from './type/wallet-types'

// Expose all 'common' endpoints
export * from '../../common-ts/lib/index'


/** Blockchain functions */

export function GetBlockCount() {
  console.debug('GetBlockCount()')

  const m = getMessageBody(BlockchainMessageType.getblockcount)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<number>>response
  })
}

export function GetFilterCount() {
  console.debug('GetFilterCount()')

  const m = getMessageBody(BlockchainMessageType.getfiltercount)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<number>>response
  })
}

export function GetFilterHeaderCount() {
  console.debug('GetFilterHeaderCount()')

  const m = getMessageBody(BlockchainMessageType.getfilterheadercount)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<number>>response
  })
}

// returns "failure" for not found, needs error wrapped
export function GetBlockHeader(sha256hash: string) {
  console.debug('GetBlockHeader()', sha256hash)
  validateString(sha256hash, 'GetBlockHeader()', 'sha256hash')

  const m = getMessageBody(BlockchainMessageType.getblockheader, [sha256hash])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<BlockHeaderResponse>>response
  })
}

export function GetInfo() {
  console.debug('GetInfo()')

  const m = getMessageBody(BlockchainMessageType.getinfo)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<GetInfoResponse>>response
  })
}

/** Network message functions */

export function GetPeers() {
  console.debug('GetPeers()')

  const m = getMessageBody(NetworkMessageType.getpeers)
  return SendServerMessage(m).then(response => {
    // Current response: 'TODO implement getpeers'
    return <ServerResponse<string>>response
  })
}

export function Stop() {
  console.debug('Stop()')

  const m = getMessageBody(NetworkMessageType.stop)
  return SendServerMessage(m).then(response => {
    // Current response: 'Node shutting down'
    return <ServerResponse<string>>response
  })
}

// export function DecodeRawTransaction() {
//   console.debug('GetFilterHeaderCount()')

//   const m = getMessageBody(BlockchainMessageType.decoderawtransaction)
//   return SendOracleMessage(m).then(response => {
//     return <ServerResponse<VersionResponse>>response
//   })
// }

/** Specific Server message functions */

export function IsEmpty() {
  console.debug('IsEmpty()')

  const m = getMessageBody(WalletMessageType.isempty)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<boolean>>response
  })
}

export function WalletInfo() {
  console.debug('WalletInfo()')

  const m = getMessageBody(WalletMessageType.walletinfo)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<WalletInfo>>response
  })
}

// Do we want this to just return a number vs string with label?
export function GetBalance(inSats: boolean) {
  console.debug('GetBalance()', inSats)
  validateBoolean(inSats, 'GetBalance()', 'inSats')

  const m = getMessageBody(WalletMessageType.getbalance, [inSats])
  return SendServerMessage(m).then(response => {
    // This comes with ' sats' or ' BTC' label
    return <ServerResponse<string>>response
  })
}

// Do we want this to just return a number vs string with label?
export function GetConfirmedBalance(inSats: boolean) {
  console.debug('GetConfirmedBalance()', inSats)
  validateBoolean(inSats, 'GetConfirmedBalance()', 'inSats')

  const m = getMessageBody(WalletMessageType.getconfirmedbalance, [inSats])
  return SendServerMessage(m).then(response => {
    // This comes with ' sats' or ' BTC' label
    return <ServerResponse<string>>response
  })
}

// Do we want this to just return a number vs string with label?
export function GetUnconfirmedBalance(inSats: boolean) {
  console.debug('GetUnconfirmedBalance()', inSats)
  validateBoolean(inSats, 'GetUnconfirmedBalance()', 'inSats')

  const m = getMessageBody(WalletMessageType.getunconfirmedbalance, [inSats])
  return SendServerMessage(m).then(response => {
    // This comes with ' sats' or ' BTC' label
    return <ServerResponse<string>>response
  })
}

export function GetBalances(inSats: boolean) {
  console.debug('GetBalances()', inSats)
  validateBoolean(inSats, 'GetBalances()', 'inSats')

  const m = getMessageBody(WalletMessageType.getbalances, [inSats])
  return SendServerMessage(m).then(response => {
    // This comes with ' sats' or ' BTC' label
    return <ServerResponse<Balances>>response
  })
}

// Should it be possible to create a new address without a label?
export function GetNewAddress(label?: string) {
  console.debug('GetNewAddress()', label)

  if (label !== undefined) {
    validateString(label, 'GetNewAddress()', 'label')

    const m = getMessageBody(WalletMessageType.getnewaddress, [label])
    return SendServerMessage(m).then(response => {
      return <ServerResponse<string>>response
    })
  } else {
    const m = getMessageBody(WalletMessageType.getnewaddress)
    return SendServerMessage(m).then(response => {
      return <ServerResponse<string>>response
    })
  }
}

export function GetTransaction(sha256hash: string) {
  console.debug('GetTransaction()', sha256hash)
  validateString(sha256hash, 'GetTransaction()', 'sha256hash')

  const m = getMessageBody(WalletMessageType.gettransaction, [sha256hash])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<string>>response
  })
}

export function LockUnspent(unlock: boolean, outPoints: any[]) {
  console.debug('LockUnspent()', unlock, outPoints)
  validateBoolean(unlock, 'LockUnspent()', 'unlock')
  // validateString(outPoints, 'LockUnspent()', 'outPoints')

  const m = getMessageBody(WalletMessageType.lockunspent, [unlock, outPoints])
  return SendServerMessage(m).then(response => {
    // boolean value === ?
    return <ServerResponse<boolean>>response
  })
}

export function LabelAddress(address: string, label: string) {
  console.debug('LabelAddress()', address, label)
  validateString(address, 'LabelAddress()', 'address')
  validateString(label, 'LabelAddress()', 'label')

  const m = getMessageBody(WalletMessageType.labeladdress, [address, label])
  return SendServerMessage(m).then(response => {
    // response like "Added label 'test label' to tb1qd8ap8lrzvvgw3k3wjfxcxsgz4wtspxysrs7a05",
    return <ServerResponse<string>>response
  })
}

// Dupe of GetAddressLabels()
// export function GetAddressTags(address: string) {
//   console.debug('GetAddressTags()', address)
//   validateString(address, 'GetAddressTags()', 'address')

//   const m = getMessageBody(WalletMessageType.getaddresstags, [address])
//   return SendOracleMessage(m).then(response => {
//     return <ServerResponse<string>>response
//   })
// }

export function GetAddressLabels(address: string) {
  console.debug('GetAddressLabels()', address)
  validateString(address, 'GetAddressLabels()', 'address')

  const m = getMessageBody(WalletMessageType.getaddresslabels, [address])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<string[]>>response
  })
}

export function DropAddressLabels(address: string) {
  console.debug('DropAddressLabels()', address)
  validateString(address, 'DropAddressLabels()', 'address')

  const m = getMessageBody(WalletMessageType.dropaddresslabels, [address])
  return SendServerMessage(m).then(response => {
    // response like '1 label dropped'
    return <ServerResponse<string>>response
  })
}

/** DLC Message Functions */

export function GetDLCHostAddress() {
  console.debug('GetDLCHostAddress()')

  const m = getMessageBody(DLCMessageType.getdlchostaddress)
  return SendServerMessage(m).then(response => {
    // response like '0:0:0:0:0:0:0:0:2862'
    return <ServerResponse<string>>response
  })
}

// payoutsVal: ContractDescriptorV0TLV / tlvPoints
export function CreateContractInfo(announcementTLV: string, totalCollateral: number, payoutsVal: any) {
  console.debug('CreateContractInfo()')

  const m = getMessageBody(DLCMessageType.createcontractinfo, [announcementTLV, totalCollateral, payoutsVal])
  return SendServerMessage(m).then(response => {
    // on fail returns "failure"
    return <ServerResponse<string>|string>response
  })
}

export function GetDLCs() {
  console.debug('GetDLCs()')

  const m = getMessageBody(WalletMessageType.getdlcs)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<DLCContract[]>>response
  })
}

export function GetDLC(sha256hash: string) {
  console.debug('GetDLC()', sha256hash)

  const m = getMessageBody(WalletMessageType.getdlc, [sha256hash])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<DLCContract>>response
  })
}

export function CancelDLC(sha256hash: string) {
  console.debug('CancelDLC()', sha256hash)

  const m = getMessageBody(WalletMessageType.canceldlc, [sha256hash])
  return SendServerMessage(m).then(response => {
    // result like 'Success'
    return <ServerResponse<string>>response
  })
}

// ContractInfoV0TLV
// collateral in sats
// feeRate in sats / vbyte
export function CreateDLCOffer(contractInfoTLV: string, collateral: number, feeRate: number, locktime: number, refundLT: number) {
  console.debug('CreateDLCOffer()', contractInfoTLV, collateral, feeRate, locktime, refundLT)
  validateString(contractInfoTLV, 'CreateDLCOffer()', 'contractInfoTLV')
  validateNumber(collateral, 'CreateDLCOffer()', 'collateral')
  validateNumber(feeRate, 'CreateDLCOffer()', 'feeRate')
  validateNumber(locktime, 'CreateDLCOffer()', 'locktime')
  validateNumber(refundLT, 'CreateDLCOffer()', 'refundLT')

  const m = getMessageBody(WalletMessageType.createdlcoffer, [contractInfoTLV, collateral, feeRate, locktime, refundLT])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<string>>response
  })
}

export function AcceptDLCOffer(offerHex: string) {
  console.debug('AcceptDLCOffer()', offerHex)
  validateString(offerHex, 'AcceptDLCOffer()', 'offerHex')

  // Flexing via UI...
  //       2021-11-22T19:09:37.173Z error: onError socket hang up
  // [HPM] Error occurred while proxying request localhost:4200 to http://localhost:9999/ [ECONNRESET] (https://nodejs.org/api/errors.html#errors_common_system_errors)

  const m = getMessageBody(WalletMessageType.acceptdlcoffer, [offerHex])
  return SendServerMessage(m).then(response => {
    // response is DLC accept message in hex
    // example numeric amount size is 86k
    return <ServerResponse<string>>response
  })
}

export function AcceptDLCOfferFromFile(path: string, destination?: string) {
  console.debug('AcceptDLCOfferFromFile()', path, destination)
  validateString(path, 'AcceptDLCOfferFromFile()', 'path')
  if (destination !== undefined) validateString(destination, 'AcceptDLCOfferFromFile()', 'destination')

  const args = [path]
  if (destination !== undefined) args.push(destination)

  const m = getMessageBody(WalletMessageType.acceptdlcofferfromfile, args)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function SignDLC(acceptHex: string) {
  console.debug('SignDLC()', acceptHex)
  validateString(acceptHex, 'SignDLC()', 'acceptHex')

  const m = getMessageBody(WalletMessageType.signdlc, [acceptHex])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function SignDLCFromFile(path: string, destination?: string) {
  console.debug('SignDLCFromFile()', path, destination)
  validateString(path, 'SignDLCFromFile()', 'path')
  if (destination !== undefined) validateString(destination, 'SignDLCFromFile()', 'destination')

  const args = [path]
  if (destination !== undefined) args.push(destination)

  const m = getMessageBody(WalletMessageType.signdlcfromfile, args)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function AddDLCSigs(sigsHex: string) {
  console.debug('AddDLCSigs()', sigsHex)
  validateString(sigsHex, 'AddDLCSigs()', 'sigsHex')

  const m = getMessageBody(WalletMessageType.adddlcsigs, [sigsHex])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function AddDLCSigsFromFile(path: string, destination?: string) {
  console.debug('AddDLCSigsFromFile()', path, destination)
  validateString(path, 'AddDLCSigsFromFile()', 'path')
  if (destination !== undefined) validateString(destination, 'AddDLCSigsFromFile()', 'destination')

  const args = [path]
  if (destination !== undefined) args.push(destination)

  const m = getMessageBody(WalletMessageType.adddlcsigsfromfile, args)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function AddDLCSigsAndBroadcast(sigsHex: string) {
  console.debug('AddDLCSigsAndBroadcast()', sigsHex)
  validateString(sigsHex, 'AddDLCSigsAndBroadcast()', 'sigsHex')

  const m = getMessageBody(WalletMessageType.adddlcsigsandbroadcast, [sigsHex])
  return SendServerMessage(m).then(response => {
    // Return is txId
    return <ServerResponse<string>>response
  })
}

export function AddDLCSigsAndBroadcastFromFile(path: string, destination?: string) {
  console.debug('AddDLCSigsAndBroadcastFromFile()', path, destination)
  validateString(path, 'AddDLCSigsAndBroadcastFromFile()', 'path')
  if (destination !== undefined) validateString(destination, 'AddDLCSigsAndBroadcastFromFile()', 'destination')

  const args = [path]
  if (destination !== undefined) args.push(destination)

  const m = getMessageBody(WalletMessageType.adddlcsigsandbroadcastfromfile, args)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function GetDLCFundingTx(contractIdHex: string) {
  console.debug('GetDLCFundingTx()', contractIdHex)
  validateString(contractIdHex, 'GetDLCFundingTx()', 'contractIdHex')

  const m = getMessageBody(WalletMessageType.getdlcfundingtx, [contractIdHex])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function BroadcastDLCFundingTx(contractIdHex: string) {
  console.debug('BroadcastDLCFundingTx()', contractIdHex)
  validateString(contractIdHex, 'GetDLCFundingTx()', 'contractIdHex')

  const m = getMessageBody(WalletMessageType.broadcastdlcfundingtx, [contractIdHex])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function ExecuteDLC(contractIdHex: string, oracleSigs: string[], noBroadcast: boolean) {
  console.debug('ExecuteDLC()', contractIdHex, oracleSigs, noBroadcast)
  validateString(contractIdHex, 'ExecuteDLC()', 'contractIdHex')
  // TODO : Validate oracleSigs
  validateBoolean(noBroadcast, 'ExecuteDLC()', 'noBroadcast')

  const m = getMessageBody(WalletMessageType.executedlc, [contractIdHex, oracleSigs, noBroadcast])
  return SendServerMessage(m).then(response => {
    // Return is closing txId
    return <ServerResponse<string>>response
  })
}

export function ExecuteDLCRefund(contractIdHex: string, noBroadcast: boolean) {
  console.debug('ExecuteDLCRefund()', contractIdHex)
  validateString(contractIdHex, 'ExecuteDLC()', 'contractIdHex')
  validateBoolean(noBroadcast, 'ExecuteDLC()', 'noBroadcast')

  const m = getMessageBody(WalletMessageType.executedlcrefund, [contractIdHex, noBroadcast])
  return SendServerMessage(m).then(response => {
    // Return is txId
    return <ServerResponse<string>>response
  })
}

export function SendToAddress(address: string, bitcoins: number, satsPerVByte: number, noBroadcast: boolean) {
  console.debug('SendToAddress()', address, bitcoins, satsPerVByte, noBroadcast)
  validateString(address, 'SendToAddress()', 'address')
  validateNumber(bitcoins, 'SendToAddress()', 'bitcoins')
  validateNumber(satsPerVByte, 'SendToAddress()', 'satsPerVByte')
  validateBoolean(noBroadcast, 'SendToAddress()', 'noBroadcast')

  const m = getMessageBody(WalletMessageType.sendtoaddress, [address, bitcoins, satsPerVByte, noBroadcast])
  return SendServerMessage(m).then(response => {
    // Return is txId
    return <ServerResponse<string>>response
  })
}

export function SendFromOutpoints(outPoints: Outpoint[], bitcoins: number, satsPerVByte: number) {
  console.debug('SendFromOutpoints()', outPoints, bitcoins, satsPerVByte)
  // TODO : Validate outPoints[]
  validateNumber(bitcoins, 'SendFromOutpoints()', 'bitcoins')
  validateNumber(satsPerVByte, 'SendFromOutpoints()', 'satsPerVByte')

  const m = getMessageBody(WalletMessageType.sendfromoutpoints, [outPoints, bitcoins, satsPerVByte])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<string>>response
  })
}

export function SweepWallet(address: string, satsPerVByte: number) {
  console.debug('SweepWallet()', address, satsPerVByte)
  validateString(address, 'SweepWallet()', 'address')
  validateNumber(satsPerVByte, 'SweepWallet()', 'satsPerVByte')

  const m = getMessageBody(WalletMessageType.dropaddresslabels, [address])
  return SendServerMessage(m).then(response => {
    // Return is txId
    return <ServerResponse<string>>response
  })
}

export function SendWithAlgo(address: string, bitcoins: number, satsPerVByte: number, algo: string) {
  console.debug('SendWithAlgo()', address, bitcoins, satsPerVByte, algo)
  validateString(address, 'SendWithAlgo()', 'address')
  validateNumber(bitcoins, 'SendWithAlgo()', 'bitcoins')
  validateNumber(satsPerVByte, 'SendWithAlgo()', 'satsPerVByte')
  validateString(algo, 'SendWithAlgo()', 'algo')

  const m = getMessageBody(WalletMessageType.sendwithalgo, [address, bitcoins, satsPerVByte, algo])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function SignPSBT(hexOrBase64: string) {
  console.debug('SignPSBT()', hexOrBase64)
  validateString(hexOrBase64, 'SignPSBT()', 'hexOrBase64')

  const m = getMessageBody(WalletMessageType.signpsbt, [hexOrBase64])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function OpReturnCommit(message: string, hashMessage: boolean, satsPerVByte: number) {
  console.debug('OpReturnCommit()', message, hashMessage, satsPerVByte)
  validateString(message, 'OpReturnCommit()', 'message')
  validateBoolean(hashMessage, 'OpReturnCommit()', 'hashMessage')
  validateNumber(satsPerVByte, 'OpReturnCommit()', 'satsPerVByte')

  const m = getMessageBody(WalletMessageType.opreturncommit, [message, hashMessage, satsPerVByte])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function BumpFeeRBF(sha256hash: string, satsPerVByte: number) {
  console.debug('BumpFeeRBF()', sha256hash, satsPerVByte)
  validateString(sha256hash, 'BumpFeeRBF()', 'sha256hash')
  validateNumber(satsPerVByte, 'BumpFeeRBF()', 'satsPerVByte')

  const m = getMessageBody(WalletMessageType.bumpfeerbf, [sha256hash, satsPerVByte])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function BumpFeeCPFP(sha256hash: string, satsPerVByte: number) {
  console.debug('BumpFeeCPFP()', sha256hash, satsPerVByte)
  validateString(sha256hash, 'BumpFeeCPFP()', 'sha256hash')
  validateNumber(satsPerVByte, 'BumpFeeCPFP()', 'satsPerVByte')

  const m = getMessageBody(WalletMessageType.bumpfeecpfp, [sha256hash, satsPerVByte])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function Rescan(batchSize: number|null, start: number|null, end: number|null, force: boolean, ignoreCreationTime: boolean) {
  console.debug('Rescan()', batchSize, start, end, force, ignoreCreationTime)
  if (batchSize !== null) validateNumber(batchSize, 'Rescan()', 'batchSize')
  if (start !== null) validateNumber(start, 'Rescan()', 'start')
  if (end !== null) validateNumber(end, 'Rescan()', 'end')
  validateBoolean(force, 'Rescan()', 'force')
  validateBoolean(ignoreCreationTime, 'Rescan()', 'ignoreCreationTime')

  const m = getMessageBody(WalletMessageType.rescan, [batchSize, start, end, force, ignoreCreationTime])
  return SendServerMessage(m).then(response => {
    // result like "Rescan started."
    return <ServerResponse<string>>response
  })
}

export function GetUTXOs() {
  console.debug('GetUTXOs()')

  const m = getMessageBody(WalletMessageType.getutxos)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<UTXO[]>>response
  })
}

export function ListReservedUTXOs() {
  console.debug('ListReservedUTXOs()')

  const m = getMessageBody(WalletMessageType.listreservedutxos)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<UTXO[]>>response
  })
}

export function GetAddresses() {
  console.debug('GetAddresses()')

  const m = getMessageBody(WalletMessageType.getaddresses)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<string[]>>response
  })
}

export function GetSpentAddresses() {
  console.debug('GetSpentAddresses()')

  const m = getMessageBody(WalletMessageType.getspentaddresses)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<string[]>>response
  })
}

export function GetFundedAddresses() {
  console.debug('GetFundedAddresses()')

  const m = getMessageBody(WalletMessageType.getfundedaddresses)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<FundedAddress[]>>response
  })
}

export function GetUnusedAddresses() {
  console.debug('GetUnusedAddresses()')

  const m = getMessageBody(WalletMessageType.getunusedaddresses)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<string[]>>response
  })
}

export function GetAccounts() {
  console.debug('GetAccounts()')

  const m = getMessageBody(WalletMessageType.getaccounts)
  return SendServerMessage(m).then(response => {
    // response like ['tpub...','vpub...','upub...']
    return <ServerResponse<string[]>>response
  })
}

export function GetAddressInfo(address: string) {
  console.debug('GetAddressInfo()', address)

  const m = getMessageBody(WalletMessageType.getaddressinfo, [address])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<AddressInfo>>response
  })
}

// THIS IS UNTESTED
export function CreateNewAccount() {
  console.debug('CreateNewAccount()')

  const m = getMessageBody(WalletMessageType.createnewaccount)
  return SendServerMessage(m).then(response => {
    // response like 
    return <ServerResponse<unknown>>response
  })
}

// keymanagerpassphrasechange
// keymanagerpassphraseset

export function ImportSeed(walletName: string, mnemonic: string, passphrase?: string) {
  console.debug('ImportSeed()', walletName) // not logging mnemonic, passphrase
  validateString(walletName, 'ImportSeed()', 'walletName')
  validateString(mnemonic, 'ImportSeed()', 'mnemonic')
  if (passphrase !== undefined) validateString(passphrase, 'ImportSeed()', 'passphrase')

  const m = getMessageBody(WalletMessageType.importseed, [walletName, mnemonic, passphrase])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function ImportXprv(walletName: string, mnemonic: string, passphrase?: string) {
  console.debug('ImportXprv()', walletName) // not logging mnemonic, passphrase
  validateString(walletName, 'ImportXprv()', 'walletName')
  validateString(mnemonic, 'ImportXprv()', 'mnemonic')
  if (passphrase !== undefined) validateString(passphrase, 'ImportXprv()', 'passphrase')

  const m = getMessageBody(WalletMessageType.importxprv, [walletName, mnemonic, passphrase])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function SendRawTransaction(hex: string) {
  console.debug('SendRawTransaction()', hex)
  validateString(hex, 'SendRawTransaction()', 'hex')

  const m = getMessageBody(WalletMessageType.sendrawtransaction, [hex])
  return SendServerMessage(m).then(response => {
    // Returns txId
    return <ServerResponse<string>>response
  })
}

export function EstimateFee() {
  console.debug('EstimateFee()')

  const m = getMessageBody(WalletMessageType.estimatefee)
  return SendServerMessage(m).then(response => {
    // response like 1, -1 is 'unknown'/'not set'
    return <ServerResponse<number>>response
  })
}

export function GetDLCWalletAccounting() {
  console.debug('GetDLCWalletAccounting()')

  const m = getMessageBody(WalletMessageType.getdlcwalletaccounting)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<DLCWalletAccounting>>response
  })
}

// Do we want to support getting this back as a json payload?
export function BackupWallet(path: string) {
  console.debug('BackupWallet()', path)
  validateString(path, 'BackupWallet()', 'path')

  const m = getMessageBody(WalletMessageType.backupwallet, [path])
  return SendServerMessage(m).then(response => {
    // result: 'done'
    return <ServerResponse<string>>response
  })
}

/** Core Route Functions */

export function FinalizePSBT() {
  console.debug('FinalizePSBT()')

  const m = getMessageBody(CoreMessageType.finalizepsbt)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function ExtractFromPSBT() {
  console.debug('ExtractFromPSBT()')

  const m = getMessageBody(CoreMessageType.extractfrompsbt)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function ConvertToPSBT() {
  console.debug('ConvertToPSBT()')

  const m = getMessageBody(CoreMessageType.converttopsbt)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function CombinePSBT() {
  console.debug('CombinePSBT()')

  const m = getMessageBody(CoreMessageType.combinepsbts)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function JoinPSBTs() {
  console.debug('JoinPSBTs()')

  const m = getMessageBody(CoreMessageType.joinpsbts)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function DecodePSBT() {
  console.debug('DecodePSBT()')

  const m = getMessageBody(CoreMessageType.decodepsbt)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function DecodeRawTransaction() {
  console.debug('DecodeRawTransaction()')

  const m = getMessageBody(CoreMessageType.decoderawtransaction)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function AnalyzePSBT() {
  console.debug('AnalyzePSBT()')

  const m = getMessageBody(CoreMessageType.analyzepsbt)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function DecodeSign(signedHex: string) {
  console.debug('DecodeSign()', signedHex)
  validateString(signedHex, 'DecodeSign()', 'signedHex')

  const m = getMessageBody(CoreMessageType.decodesign, [signedHex])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<Sign>>response
  })
}

export function DecodeAccept(acceptHex: string) {
  console.debug('DecodeAccept()', acceptHex)
  validateString(acceptHex, 'DecodeAccept()', 'acceptHex')

  const m = getMessageBody(CoreMessageType.decodeaccept, [acceptHex])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<Accept>>response
  })
}

export function DecodeOffer(offerHex: string) {
  console.debug('DecodeOffer()', offerHex)
  validateString(offerHex, 'DecodeOffer()', 'offerHex')

  const m = getMessageBody(CoreMessageType.decodeoffer, [offerHex])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<Offer>>response
  })
}

export function DecodeContractInfo(contractInfoHex: string) {
  console.debug('DecodeContractInfo()', contractInfoHex)
  validateString(contractInfoHex, 'DecodeContractInfo()', 'contractInfoHex')

  const m = getMessageBody(CoreMessageType.decodecontractinfo, [contractInfoHex])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

export function DecodeAnnouncement(announcementHex: string) {
  console.debug('DecodeAnnouncement()', announcementHex)
  validateString(announcementHex, 'DecodeAnnouncement()', 'announcementHex')

  const m = getMessageBody(CoreMessageType.decodeannouncement, [announcementHex])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<Announcement>>response
  })
}

// 'failure' on error
export function DecodeAttestments(attestmentHex: string) {
  console.debug('DecodeAttestments()', attestmentHex)
  validateString(attestmentHex, 'DecodeAttestments()', 'attestmentHex')

  const m = getMessageBody(CoreMessageType.decodeattestments, [attestmentHex])
  return SendServerMessage(m).then(response => {
    return <ServerResponse<Attestment>>response
  })
}

export function CreateMultiSig() {
  console.debug('CreateMultiSig()')

  const m = getMessageBody(CoreMessageType.createmultisig)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<unknown>>response
  })
}

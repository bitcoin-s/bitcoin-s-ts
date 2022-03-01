
// Core Routes
export const enum CoreMessageType {
  finalizepsbt = 'finalizepsbt',
  extractfrompsbt = 'extractfrompsbt',
  converttopsbt = 'converttopsbt',
  combinepsbts = 'combinepsbts',
  joinpsbts = 'joinpsbts',
  decodepsbt = 'decodepsbt',
  decoderawtransaction = 'decoderawtransaction',
  analyzepsbt = 'analyzepsbt',
  decodesign = 'decodesign',
  decodeaccept = 'decodeaccept',
  decodeoffer = 'decodeoffer',
  decodecontractinfo = 'decodecontractinfo',
  decodeannouncement = 'decodeannouncement',
  decodeattestments = 'decodeattestments',
  createmultisig = 'createmultisig',
  zipdatadir = 'zipdatadir',
}

export interface Announcement {
  announcementSignature: string
  publicKey: string
  event: Event // Announcement
  hex: string // hex encoding of Announcement
}

export interface Event {
  eventId: string
  descriptor: EnumEventDescriptor|NumericEventDescriptor
  nonces: string[]
  maturity: string // ISODate like '2030-01-01T00:00:00Z'
}

export interface EnumEventDescriptor {
  outcomes: string[] // ['Outcome1','Outcome2']
}

export interface NumericEventDescriptor {
  base: number
  isSigned: boolean
  unit: string
  precision: number
}

export interface Attestment {
  eventId: string
  signatures: string[]
  values: string[] // ['num', 'num2', ...] for numeric, ['outcome'] for enum
}

export interface Sign {
  cetAdaptorSignatures: {ecdsaAdaptorSignatures:{signature: string}[]}[]
  contractId: string
  fundingSignatures: {fundingSignatures:{witness:string}[]}
  refundSignature: string
}

export interface Accept {
  acceptCollateral: number
  cetAdaptorSignatures: {ecdsaAdaptorSignatures:{signature: string}[]}[]
  changeSerialId: string
  changeSpk: string
  fundingInputs: FundingInput[]
  fundingPubkey: string 
  negotiationFields: any // TODO : Type me
  payoutSerialId: string
  payoutSpk: string
  refundSignature: string
  temporaryContractId: string
}

export interface Offer {
  contractFlags: string // '0'
  chainHash: string // '43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000',
  contractInfo: ContractInfo
  fundingPubKey: string // '0384ff93088a11a6348b1a62068dec6fbde06c27cdd13343fe8799064b0c729a2d',
  payoutSPK: string // '160014a6ddd2eaa6a442c89bd1b3d9121fb63c535dd79a',
  payoutSerialId: number // 5529711572335517000,
  offerCollateral: number // 1,
  fundingInputs: FundingInput[],
  changeSPK: string // '160014232606c0cb287c1a5f130281ba52eff5ef20d443',
  changeSerialId: number // 1987381072106030600,
  fundOutputSerialId: number // 6627535332504231000,
  feeRatePerVb: number // 1,
  cetLocktime: number // 0,
  refundLocktime: number // 1622505600
}

export interface ContractInfo {
  totalCollateral: number
  contractDescriptor: EnumContractDescriptor|NumericContractDescriptor
  oracleInfo: OracleInfo
}

export interface FundingInput {
  inputSerialId: number // 4531463595880165000,
  prevTx: string // '02000000000102b0efe9fef953d3326fd3d8ae6ee3eb0b0a3cb86de2617596c6f6fdde02977bc60200000000ffffffffb0efe9fef953d3326fd3d8ae6ee3eb0b0a3cb86de2617596c6f6fdde02977bc60000000000ffffffff036f997b01000000001600140c0d664b87c20fe4bc7a1382c5352e59993ff5cfe2d001000000000022002054b283568f8614efa7185236e618bacbd4d30fa58a74bf83dfb2e32d7491cad09fbdc70100000000160014f259c2abfbcdd9929cad12ba6b034b068a6f47ef0247304402202815f1dfccbffea58fdc466d7440b776298301bf408f31fd41b6cf1223fc0899022010cff684c03765fc3ef0f06ccd698a83e9349440766681dfd2b94b593ae109e001210355c706c7f99d7eb67a4cbb379f9b5e098f096cc84fca0b7f6a6f0e28180475fc0247304402202255452ab35f277b777db458c69bd19d26eb10f48d8219826f32334cb2e87d7b022072377e73078176e2b5c18a08148657f3f42b872247e99e5feb25caa117baaf610121030e9fff45603614fc03696c40ff42ca92d482bf638e85988315099d8b955073d300000000',
  prevTxVout: number // 0,
  sequence: number // 4294967293,
  maxWitnessLen: number // 107,
  redeemScript: string|null // null
}

export interface ContractDescriptor {
  // Is this present on all encodings?
  hex: string // hex encoding of ContractDescriptor
}

export interface EnumContractDescriptor extends ContractDescriptor {
  outcomes: { [key: string]: number } // outcomes: { YES: 1, NO: 0 }
}

export interface NumericContractDescriptor extends ContractDescriptor {
  numDigits: number
  payoutFunction: PayoutFunction
  roundingIntervals: { intervals: unknown[] } // TODO : Type me
}

export interface PayoutFunction {
  points: PayoutFunctionPoint[]
}

export interface PayoutFunctionPoint {
  outcome: number // 30000,
  payout: number // 25000,
  extraPrecision: number // 0,
  isEndpoint: boolean // true
}

export interface OracleInfo {
  announcement: Announcement
}

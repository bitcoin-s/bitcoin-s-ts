
// Serverside message types
export const enum MessageType {
  getpublickey = "getpublickey",
  getstakingaddress = "getstakingaddress",
  listevents = "listevents",
  createenumevent = "createenumevent",
  createnumericevent = "createnumericevent",
  createdigitdecompevent = "createdigitdecompevent",
  getevent = "getevent",
  signevent = "signevent",
  signdigits = "signdigits",
  getsignatures = "getsignatures",
  signmessage = "signmessage",

  // Common
  getversion = "getversion",
}

// Serverside OracleEvent response
export interface OracleEvent {
  announcementSignature: string
  announcementTLV: string
  attestations: string
  eventDescriptorTLV: string
  eventName: string
  eventTLV: string
  maturationTime: string // "2030-01-03T00:30:00Z"
  maturationTimeEpoch: number // 1893630600
  nonces: string[]
  outcomes: string[] // enum, numeric: [["number"]]
  signedOutcome: string
  signingVersion: string

  // ids
  announcementTLVsha256: string
  eventDescriptorTLVsha256: string
}

// Serverside message response
export interface OracleResponse<T> {
  result: T|null // Can also be a complex type like getevent response
  error: string|null
}

// Common bitcoin-s responses

export interface ServerVersion {
  version: string
}


// Serverside message types
export const enum MessageType {
  getpublickey = 'getpublickey',
  getstakingaddress = 'getstakingaddress',
  listannouncements = 'listannouncements',
  createenumannouncement = 'createenumannouncement',
  createnumericannouncement = 'createnumericannouncement',
  createdigitdecompannouncement = 'createdigitdecompannouncement',
  getannouncement = 'getannouncement',
  signenum = 'signenum',
  signdigits = 'signdigits',
  getsignatures = 'getsignatures',
  signmessage = 'signmessage',

  deleteannouncement = 'deleteannouncement',
  deleteattestation = 'deleteattestation',

  getoraclename = 'getoraclename',
  setoraclename = 'setoraclename',

  // Common
  getversion = 'getversion',

  // Deprecated event endpoints
  // createenumevent = 'createenumevent',
  // createnumericevent = 'createnumericevent',
  // createdigitdecompevent = 'createdigitdecompevent',
  // getevent = 'getevent',
  // signevent = 'signevent',
}

// Serverside OracleAnnouncement response
export interface OracleAnnouncement {
  announcementSignature: string
  announcementTLV: string
  attestations: string
  eventDescriptorTLV: string
  eventName: string
  eventTLV: string
  maturationTime: string // "2030-01-03T00:30:00Z"
  maturationTimeEpoch: number // 1893630600
  nonces: string[]
  outcomes: string[] // enum: ["value","value2"], numeric: [["number"]]
  signedOutcome: string|null
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

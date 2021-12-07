import { Accept, Announcement, ContractInfo, Offer, Sign } from './wallet-server-types'

// UI Side types

// Make these into <T> with hex field?

// TODO : Remove - All Announcements come with hex field now
export interface AnnouncementWithHex {
  announcement: Announcement
  hex: string // raw hex of Announcement
}

export interface ContractInfoWithHex {
  contractInfo: ContractInfo
  hex: string // raw hex of Contract Info
}

export interface OfferWithHex {
  offer: Offer
  hex: string // raw hex of Offer
}

export interface AcceptWithHex {
  accept: Accept
  hex: string // raw hex of Accept
}

export interface SignWithHex {
  sign: Sign
  hex: string // raw hex of Accept
}

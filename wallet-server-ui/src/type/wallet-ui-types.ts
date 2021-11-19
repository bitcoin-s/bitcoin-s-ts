import { Announcement, ContractInfo, Offer } from './wallet-server-types'

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

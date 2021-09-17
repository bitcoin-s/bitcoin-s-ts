
export interface OracleNameResponse {
  pubkey: string
  oracleName: string
}

export interface CreateAnnouncementRequest {
  oracleAnnouncementV0: any // OracleAnnouncementV0TLV
  oracleName: string
  description: string
  eventURI?: string
}

export interface OracleAnnouncementsResponse {
  announcement: string
  attestations: string // or null
  description: string
  id: string
  oracleName: string
  outcome: string
  uri: string // or null
}

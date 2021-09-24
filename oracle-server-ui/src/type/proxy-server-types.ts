
// Heartbeat response type
export type SuccessType = { success: boolean }

export interface BuildConfig {
  shortHash: string
  hash: string
  committedOn: number
  dateString?: string
}

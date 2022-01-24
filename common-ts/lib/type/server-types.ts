
// Serverside message types
export const enum MessageType {
  // Common
  getversion = 'getversion',
  zipdatadir = 'zipdatadir',
}

// Serverside message response
export interface ServerResponse<T> {
  result: T|null // Can also be a complex type like getevent response
  error: string|null
}

export interface VersionResponse {
  version: string // like '1.7.0-208-b02a963f-20211011-1207-SNAPSHOT'
}

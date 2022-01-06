import { Observable } from 'rxjs'

// Heartbeat response type
export type SuccessType = { success: boolean }

export interface BuildConfig {
  shortHash: string
  hash: string
  committedOn: number
  dateString?: string
}

export interface UrlResponse {
  url: string
}

export const CONNECTION_REFUSED_ERROR = /connection refused/
export const TOR_CONNECTION_REFUSED_ERROR = /tor connection refused/

type ProxyErrorFn = (message: string) => void

export function getProxyErrorHandler(name: string, onError: ProxyErrorFn) {
  return (error: any, caught: Observable<unknown>) => {
    console.error('getProxyErrorHandler', error)
    const statusText = error?.statusText
    if (CONNECTION_REFUSED_ERROR.test(statusText)) {
      console.error('tor connection failed')
      // Could record error count here...
    }
    let message = error?.error.error || error?.message
    if (onError) {
      onError(message)
    }
    throw(Error(`${name} error`)) // forces failure out of forkJoin() of operations
    return new Observable<any>() // required for type checking...
  }
}

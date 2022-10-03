// Native fetch is not recognized by compiler yet despite the @types/node: 18.x
declare function fetch(url: any, options: any): Promise<any>

import { ServerMessage } from './type/server-message.js'
import { MessageType, ServerResponse, VersionResponse } from './type/server-types'

import { getMessageBody } from './util/message-util.js'
import { validateString } from './util/validation-util.js'


let SERVER_URL = 'http://localhost:9999/' // default to bitcoin-s server
let AUTHORIZATION_HEADER = '' // default to no auth

const DEBUG = true // log actions in console.debug

/** Set Wallet Server endpoint */
export function ConfigureServerURL(url: string): void {
  console.debug('ConfigureServerURL()', url)
  SERVER_URL = url
}
/** Set Wallet Server Authorization header */
export function ConfigureAuthorizationHeader(header: string): void {
  console.debug('ConfigureAuthorizationHeader()', header)
  AUTHORIZATION_HEADER = header
}
/** Set Authorization Header from user and password strings */
export function ConfigureAuthorizationHeaderFromUserPassword(user: string, password: string): void {
  console.debug('ConfigureAuthorizationHeader()', user)
  AUTHORIZATION_HEADER = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64')
}

/** Send any ServerMessage */
export function SendServerMessage(message: ServerMessage, customConfig = {}): Promise<ServerResponse<any>> {
  if (message) {
    const headers: any = { 'Content-Type': 'application/json' }
    if (AUTHORIZATION_HEADER) headers['Authorization'] = AUTHORIZATION_HEADER
    const config: any = {
      method: 'POST',
      // mode: 'no-cors', // 'same-origin',
      ...customConfig,
      headers: {
        ...headers,
      },
      body: JSON.stringify(message)
    }

    // console.debug('config:', config)

    return fetch(`${SERVER_URL}`, config)
      .then(async response => {
        // if (response.status === 401) {
        //   // autologout / redirect
        // }
        if (response.ok) {
          return <ServerResponse<any>> await response.json()
        } else {
          const errorMessage = await response.text()
          return Promise.reject(new Error(errorMessage))
        }
      })
  } else {
    return Promise.reject(Error('SendServerMessage() null message'))
  }
}

/** Common bitcoin-s message functions */ 

/** Get Server Version */
export function GetVersion(): Promise<ServerResponse<VersionResponse>> {
  if (DEBUG) console.debug('GetVersion()')

  const m = getMessageBody(MessageType.getversion)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<VersionResponse>>response
  })
}

/** Zip Server DataDir */
export function ZipDataDir(path: string) {
  if (DEBUG) console.debug('ZipDataDir()')
  validateString(path, 'ZipDataDir()', 'path')

  const m = getMessageBody(MessageType.zipdatadir, [path])
  return SendServerMessage(m).then(response => {
    // result: 'failure' / null
    return <ServerResponse<string|null>>response
  })
}

/** New Observable functions */

// import { BehaviorSubject, forkJoin, from, of, timer } from 'rxjs'
// import { delayWhen, retryWhen, switchMap, tap } from 'rxjs/operators'

// const OFFLINE_POLLING_TIME = 5000 // ms

// Detect that backend is available and ready for interaction
// export function WaitForServer() {
//   console.debug('WaitForServer()')
//   return from(GetVersion()).pipe(
//     retryWhen(errors => {
//       return errors.pipe(
//         tap(_ => { if (DEBUG) console.debug('polling server') }),
//         delayWhen(_ => timer(OFFLINE_POLLING_TIME)),
//       );
//     }),
//     tap(version => {
//       if (version.result) {
//         if (DEBUG) console.debug('WaitForServer()', version.result.version)
//         // Update state model
//         const s = state.getValue()
//         s.version = version.result.version
//         state.next(s)
//       }
//     })
//   )
// }

/** TODO : Inheritable Shared State Model? */

// export interface CommonStateModel {
//   version: string
// }

// export class CommonStateImpl implements CommonStateModel {
//   version: string
// }

// const state = new BehaviorSubject<CommonStateModel>(new CommonStateImpl())
// export const CommonState = state.asObservable()

// export default {
//   // ...ENTRY_POINTS
//   ConfigureServerURL,
//   ConfigureAuthorizationHeader,
//   ConfigureAuthorizationHeaderFromUserPassword,
//   SendServerMessage,
//   GetVersion,
//   ZipDataDir
// };

import needle from 'needle'

import { ServerMessage } from './type/server-message'
import { MessageType, ServerResponse, VersionResponse } from './type/server-types'

import { getMessageBody } from './util/message-util'
import { validateString } from './util/validation-util'


let SERVER_URL = 'http://localhost:9999/' // default to bitcoin-s server
let AUTHORIZATION_HEADER = '' // default to no auth

/** Set Wallet Server endpoint */
export function ConfigureServerURL(url: string) {
  console.debug('ConfigureServerURL()', url)
  SERVER_URL = url
}
/** Set Wallet Server Authorization header */
export function ConfigureAuthorizationHeader(header: string) {
  console.debug('ConfigureAuthorizationHeader()', header)
  AUTHORIZATION_HEADER = header
}
// Convenience function
export function ConfigureAuthorizationHeaderFromUserPassword(user: string, password: string) {
  console.debug('ConfigureAuthorizationHeader()', user)
  AUTHORIZATION_HEADER = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64')
}

/** Send any ServerMessage */
export function SendServerMessage(message: ServerMessage) {
  if (message) {
    const options: any = { json: true }
    if (AUTHORIZATION_HEADER) options.headers = { 'Authorization': AUTHORIZATION_HEADER }
    return needle('post', `${SERVER_URL}`, message, options).then(response => {
      const body = <ServerResponse<any>>response.body
      // Throw backend error to break promise chain for catch handling
      if (body.error) throw(body.error)
      return body
    }).catch(err => {
      console.error('SendServerMessage() error', err)
      throw(err)
    })
  } else {
    throw(Error('SendServerMessage() null message'))
  }
}

/** Common bitcoin-s message functions */ 

export function GetVersion() {
  console.debug('GetVersion()')

  const m = getMessageBody(MessageType.getversion)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<VersionResponse>>response
  })
}

export function ZipDataDir(path: string) {
  console.debug('ZipDataDir()')
  validateString(path, 'ZipDataDir()', 'path')

  const m = getMessageBody(MessageType.zipdatadir, [path])
  return SendServerMessage(m).then(response => {
    // result: 'failure' / null
    return <ServerResponse<string|null>>response
  })
}

// export default [ConfigureWalletServerURL, SendOracleMessage, GetVersion]

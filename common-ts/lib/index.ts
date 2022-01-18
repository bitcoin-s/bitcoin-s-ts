import needle from 'needle'

import { ServerMessage } from './type/server-message'
import { MessageType, ServerResponse, VersionResponse } from './type/server-types'

import { getMessageBody } from './util/message-util'


let SERVER_URL = 'http://localhost:9999/'
let AUTHORIZATION_HEADER = ''

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

/** Specific bitcoin-s Server message functions */ 

export function GetVersion() {
  console.debug('GetVersion()')

  const m = getMessageBody(MessageType.getversion)
  return SendServerMessage(m).then(response => {
    return <ServerResponse<VersionResponse>>response
  })
}

// export default [ConfigureWalletServerURL, SendOracleMessage, GetVersion]

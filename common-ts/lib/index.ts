import needle from 'needle'

import { ServerMessage } from './type/server-message'
import { MessageType, ServerResponse, VersionResponse } from './type/server-types'

import { getMessageBody } from './util/message-util'


let WALLET_SERVER_URL = 'http://localhost:9999/'

/** Set Wallet Server endpoint */
export function ConfigureWalletServerURL(url: string) {
  console.debug('ConfigureWalletServerURL()', url)
  WALLET_SERVER_URL = url
}

/** Send any ServerMessage */
export function SendServerMessage(message: ServerMessage) {
  if (message) {
    return needle('post', `${WALLET_SERVER_URL}`, message, { json: true }).then(response => {
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

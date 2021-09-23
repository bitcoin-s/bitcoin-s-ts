import needle from 'needle'

import { getMessageBody } from './message-util'
import { OracleServerMessage, OracleServerMessageWithParameters } from './oracle-server-message'
import { MessageType, OracleResponse } from './oracle-server-types'


let ORACLE_SERVER_URL = 'http://localhost:9998/'

/** Set Oracle Server endpoint */
export function ConfigureOracleServerURL(url: string) {
  console.debug('ConfigureOracleServerURL()', url)
  ORACLE_SERVER_URL = url
}

/** Send any OracleServerMessage */
export function SendOracleMessage(message: OracleServerMessage) {
  if (message) {
    return needle('post', `${ORACLE_SERVER_URL}`, message, { json: true }).then(response => {
      // console.debug(' SendOracleMessage', response)
      return <OracleResponse<any>>response.body
    }).catch(err => {
      console.error('SendOracleMessage() error', err)
      throw(err)
    })
  } else {
    throw(Error('SendOracleMessage() null message'))
  }
}

/* Specific Oracle Server message functions */

export function GetPublicKey() {
  console.debug('GetPublicKey()')
  const m = getMessageBody(MessageType.getpublickey)
  return SendOracleMessage(m).then(response => {
    // console.debug('GetPublicKey response:', response)
    return <OracleResponse<string>>response
  })
}

export function GetStakingAddress() {
  console.debug('GetStakingAddress()')
  const m = getMessageBody(MessageType.getstakingaddress)
  return SendOracleMessage(m).then(response => {
    // console.debug('GetStakingAddress response:', response)
    return <OracleResponse<string>>response
  })
}

export function ListEvents() {
  console.debug('ListEvents()')
  const m = getMessageBody(MessageType.listevents)
  return SendOracleMessage(m).then(response => {
    // console.debug('ListEvents response:', response)
    return <OracleResponse<string[]>>response
  })
}

// TODO : The rest

import needle from 'needle'

import { getMessageBody } from './message-util'
import { OracleServerMessage, OracleServerMessageWithParameters } from './oracle-server-message'
import { MessageType, OracleEvent, OracleResponse } from './oracle-server-types'
import { validateEnumOutcomes, validateISODateString, validateNumber, validateString } from './util'


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

export function SignMessage(message: string) {
  console.debug('SignMessage()', message)
  validateString(message, 'SignMessage()', 'message')

  const m = getMessageBody(MessageType.signmessage, [message])
  return SendOracleMessage(m).then(response => {
    // console.debug('SignMessage response:', response)
    return <OracleResponse<string>>response
  })
}

export function GetEvent(eventName: string) {
  console.debug('GetEvent()', eventName)
  validateString(eventName, 'GetEvent()', 'eventName')

  const m = getMessageBody(MessageType.getevent, [eventName])
  return SendOracleMessage(m).then(response => {
    // console.debug('GetEvent response:', response)
    return <OracleResponse<OracleEvent>>response
  })
}
 
export function CreateEnumEvent(eventName: string, maturationTimeISOString: string, outcomes: string[]) {
  console.debug('CreateEnumEvent()')
  validateString(eventName, 'CreateEnumEvent()', 'eventName')
  validateISODateString(maturationTimeISOString, 'CreateEnumEvent()', 'maturationTimeISOString')
  validateEnumOutcomes(outcomes, 'CreateEnumEvent()')

  const m = getMessageBody(MessageType.createenumevent, [eventName, maturationTimeISOString, outcomes])
  return SendOracleMessage(m).then(response => {
    // console.debug('CreateEnumEvent response:', response)
    return <OracleResponse<string>>response
  })
}

export function CreateNumericEvent(eventName: string, maturationTimeISOString: string, minValue: number, maxValue: number, unit: string, precision: number) {
  console.debug('CreateNumericEvent()')
  validateString(eventName, 'CreateEnumEvent()', 'eventName')
  validateISODateString(maturationTimeISOString, 'CreateEnumEvent()', 'maturationTimeISOString')
  validateNumber(minValue, 'CreateEnumEvent()', 'minValue')
  validateNumber(maxValue, 'CreateEnumEvent()', 'maxValue')
  // TODO : Validate minValue/maxValue?
  validateString(unit, 'CreateEnumEvent()', 'unit') // unit can be an empty string
  validateNumber(precision, 'CreateEnumEvent()', 'precision')
  if (precision < 0) throw(Error('CreateEnumEvent() precision must be >= 0'))

  const m = getMessageBody(MessageType.createnumericevent, [eventName, maturationTimeISOString, minValue, maxValue, unit, precision])
  return SendOracleMessage(m).then(response => {
    // console.debug('CreateNumericEvent response:', response)
    return <OracleResponse<string>>response
  })
}

// Rename SignEnum()?
export function SignEvent(eventName: string, outcome: string) {
  console.debug('SignEvent()', eventName, outcome)
  validateString(eventName, 'SignEvent()', 'eventName')
  validateString(outcome, 'SignEvent()', 'outcome')

  const m = getMessageBody(MessageType.signevent, [eventName, outcome])
  return SendOracleMessage(m).then(response => {
    // console.debug('SignEvent response:', response)
    return <OracleResponse<string>>response
  })
}

export function SignDigits(eventName: string, outcome: number) {
  console.debug('SignDigits()', eventName, outcome)
  validateString(eventName, 'SignDigits()', 'eventName')
  validateNumber(outcome, 'SignDigits()', 'outcome')

  const m = getMessageBody(MessageType.signdigits, [eventName, outcome])
  return SendOracleMessage(m).then(response => {
    // console.debug('SignDigits response:', response)
    return <OracleResponse<string>>response
  })
}

export function GetSignatures(eventName: string) {
  console.debug('GetSignatures()')
  validateString(eventName, 'GetSignatures()', 'eventName')

  const m = getMessageBody(MessageType.getsignatures, [eventName])
  return SendOracleMessage(m).then(response => {
    // console.debug('GetSignatures response:', response)
    return <OracleResponse<OracleEvent>>response
  })
}

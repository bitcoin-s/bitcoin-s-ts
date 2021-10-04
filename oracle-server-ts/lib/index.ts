import needle from 'needle'

import { getMessageBody } from './util/message-util'
import { OracleServerMessage, OracleServerMessageWithParameters } from './type/oracle-server-message'
import { MessageType, OracleEvent, OracleResponse } from './type/oracle-server-types'
import { validateEnumOutcomes, validateISODateString, validateNumber, validateString } from './util/validation-util'


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

export function ListAnnouncements() {
  console.debug('ListAnnouncements()')
  const m = getMessageBody(MessageType.listannouncements)
  return SendOracleMessage(m).then(response => {
    // console.debug('ListAnnouncements response:', response)
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

export function GetAnnouncement(eventName: string) {
  console.debug('GetAnnouncement()', eventName)
  validateString(eventName, 'GetAnnouncement()', 'eventName')

  const m = getMessageBody(MessageType.getannouncement, [eventName])
  return SendOracleMessage(m).then(response => {
    // console.debug('GetAnnouncement response:', response)
    return <OracleResponse<OracleEvent>>response
  })
}
 
export function CreateEnumAnnouncement(eventName: string, maturationTimeISOString: string, outcomes: string[]) {
  console.debug('CreateEnumAnnouncement()')
  validateString(eventName, 'CreateEnumAnnouncement()', 'eventName')
  validateISODateString(maturationTimeISOString, 'CreateEnumAnnouncement()', 'maturationTimeISOString')
  validateEnumOutcomes(outcomes, 'CreateEnumAnnouncement()')

  const m = getMessageBody(MessageType.createenumannouncement, [eventName, maturationTimeISOString, outcomes])
  return SendOracleMessage(m).then(response => {
    // console.debug('CreateEnumEvent response:', response)
    return <OracleResponse<string>>response
  })
}

export function CreateNumericAnnouncement(eventName: string, maturationTimeISOString: string, minValue: number, maxValue: number, unit: string, precision: number) {
  console.debug('CreateNumericAnnouncement()')
  validateString(eventName, 'CreateNumericAnnouncement()', 'eventName')
  validateISODateString(maturationTimeISOString, 'CreateNumericAnnouncement()', 'maturationTimeISOString')
  validateNumber(minValue, 'CreateNumericAnnouncement()', 'minValue')
  validateNumber(maxValue, 'CreateNumericAnnouncement()', 'maxValue')
  // TODO : Validate minValue/maxValue?
  validateString(unit, 'CreateNumericAnnouncement()', 'unit') // unit can be an empty string
  validateNumber(precision, 'CreateNumericAnnouncement()', 'precision')
  if (precision < 0) throw(Error('CreateNumericAnnouncement() precision must be >= 0'))

  const m = getMessageBody(MessageType.createnumericannouncement, [eventName, maturationTimeISOString, minValue, maxValue, unit, precision])
  return SendOracleMessage(m).then(response => {
    // console.debug('CreateNumericAnnouncement response:', response)
    return <OracleResponse<string>>response
  })
}

// Rename SignEnum()?
export function SignEnum(eventName: string, outcome: string) {
  console.debug('SignEnum()', eventName, outcome)
  validateString(eventName, 'SignEnum()', 'eventName')
  validateString(outcome, 'SignEnum()', 'outcome')

  const m = getMessageBody(MessageType.signenum, [eventName, outcome])
  return SendOracleMessage(m).then(response => {
    // console.debug('SignEnum response:', response)
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

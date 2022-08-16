import { OracleServerMessage, OracleServerMessageWithParameters } from '~type/oracle-server-message'
import { MessageType } from '~type/oracle-server-types'


export function getMessageBody(type: MessageType, params?: any[]): OracleServerMessage {
  switch (type) {
    case MessageType.getpublickey:
    case MessageType.getstakingaddress:
    case MessageType.exportstakingaddresswif:
    case MessageType.listannouncements:
    case MessageType.getoraclename:
    // Common
    case MessageType.getversion:
      return new OracleServerMessage(type)
    case MessageType.getannouncement:
    case MessageType.signenum:
    case MessageType.signdigits:
    case MessageType.signmessage:
    case MessageType.getsignatures:
    case MessageType.createenumannouncement:
    case MessageType.createnumericannouncement:
    case MessageType.createdigitdecompannouncement:
    case MessageType.deleteannouncement:
    case MessageType.deleteattestation:
    case MessageType.setoraclename:
      return new OracleServerMessageWithParameters(type, params!)
    default:
      throw(Error('getMessageBody() unknown message type: ' + type))
  }
}

const DIGIT_SPACER = '..'

export function formatOutcomes(outcomes: any[]): string {
  if (outcomes && outcomes.length > 0) {
    const head = outcomes[0]
    if (Array.isArray(head) && head.length === 2) {
      // numeric outcomes
      const signed = head[0] === '+' && head[1] === '-'
      const exp = signed ? outcomes.length - 1 : outcomes.length
      const outcome = (2 ** exp) - 1
      return signed ? '-' + outcome + DIGIT_SPACER + outcome : '0' + DIGIT_SPACER + outcome
    } else {
      // enum and all other outcomes
      return '' + outcomes
    }
  } else {
    return ''
  }
}

export function outcomesToMinMax(outcomes: any[]) {
  if (outcomes && outcomes.length > 0) {
    const head = outcomes[0]
    if (Array.isArray(head) && head.length === 2) {
      // numeric outcomes
      const signed = head[0] === '+' && head[1] === '-'
      const exp = signed ? outcomes.length - 1 : outcomes.length
      const outcome = (2 ** exp) - 1
      const min = signed ? -outcome : 0
      return { min, max: outcome }
    }
  }
  return null
}

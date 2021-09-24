import { OracleServerMessage, OracleServerMessageWithParameters } from '~type/oracle-server-message'
import { MessageType } from '~type/oracle-server-types'


export function getMessageBody(type: MessageType, params?: any[]): OracleServerMessage {
  switch (type) {
    case MessageType.getpublickey:
    case MessageType.getstakingaddress:
    case MessageType.listevents:
    case MessageType.getversion: // Common
      return new OracleServerMessage(type)
    case MessageType.getevent:
    case MessageType.signevent:
    case MessageType.signdigits:
    case MessageType.signmessage:
    case MessageType.getsignatures:
    case MessageType.createenumevent:
    case MessageType.createnumericevent:
    case MessageType.createdigitdecompevent:
      return new OracleServerMessageWithParameters(type, params!)
    default:
      throw(Error('getMessageBody() unknown message type: ' + type))
  }
}

export class OracleResponse<T> {
  result: T|null = null // Can also be a complex type like getevent response
  error: string|null = null
}



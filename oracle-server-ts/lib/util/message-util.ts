import { OracleServerMessage, OracleServerMessageWithParameters } from '../type/oracle-server-message'
import { MessageType } from '../type/oracle-server-types'


export function getMessageBody(type: MessageType, params?: any[]): OracleServerMessage {
  switch (type) {
    case MessageType.getpublickey:
    case MessageType.getstakingaddress:
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

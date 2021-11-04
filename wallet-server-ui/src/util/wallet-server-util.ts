import { WalletStateService } from "~service/wallet-state-service"
import { WalletServerMessage, WalletServerMessageWithParameters } from "~type/wallet-server-message"
import { BlockchainMessageType, CoreMessageType, MessageType, WalletMessageType } from "~type/wallet-server-types"

export function getMessageBody(type: string /*MessageType*/, params?: any[]): WalletServerMessage {
  switch (type) {
    // BlockchainMessageType
    case BlockchainMessageType.getinfo:
    case WalletMessageType.getfundedaddresses:
    case WalletMessageType.getdlcwalletaccounting:
    case WalletMessageType.estimatefee:
    case WalletMessageType.getdlcs:
    // case MessageType.getpublickey:
    // case MessageType.getstakingaddress:
    // case MessageType.listannouncements:
    // case MessageType.getoraclename:
    // Common
    case MessageType.getversion:
      return new WalletServerMessage(type)
    // case MessageType.getannouncement:
    // case MessageType.signenum:
    // case MessageType.signdigits:
    // case MessageType.signmessage:
    // case MessageType.getsignatures:
    // case MessageType.createenumannouncement:
    // case MessageType.createnumericannouncement:
    // case MessageType.createdigitdecompannouncement:
    // case MessageType.deleteannouncement:
    // case MessageType.deleteattestation:
    // case MessageType.setoraclename:

    case CoreMessageType.decodeannouncement:
    case CoreMessageType.decodecontractinfo:
    case CoreMessageType.decodeoffer:

    case WalletMessageType.getbalances:
      return new WalletServerMessageWithParameters(type, params!)
    default:
      throw(Error('getMessageBody() unknown message type: ' + type))
  }
}

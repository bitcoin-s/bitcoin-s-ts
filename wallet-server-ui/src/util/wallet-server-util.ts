import { WalletStateService } from "~service/wallet-state-service"
import { WalletServerMessage, WalletServerMessageWithParameters } from "~type/wallet-server-message"
import { BlockchainMessageType, CoreMessageType, MessageType, WalletMessageType } from "~type/wallet-server-types"

export function getMessageBody(type: string /*MessageType*/, params?: any[]): WalletServerMessage {
  if (params) {
    return new WalletServerMessageWithParameters(type, params!)
  } else {
    return new WalletServerMessage(type)
  }
}

import { ServerMessage, ServerMessageWithParameters } from '../type/server-message.js'


export function getMessageBody(type: string /*MessageType*/, params?: any[]): ServerMessage {
  if (params) {
    return new ServerMessageWithParameters(type, params)
  } else {
    return new ServerMessage(type)
  }
}

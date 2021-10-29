
export class ServerMessage {
  method: string // MessageType

  constructor(type: string /*MessageType*/) {
    this.method = type
  }
}

export class ServerMessageWithParameters extends ServerMessage {
  params: any[]

  constructor(type: string /*MessageType*/, params: any[]) {
    super(type)
    this.params = params
  }
}

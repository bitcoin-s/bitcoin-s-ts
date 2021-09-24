import { MessageType } from '~type/oracle-server-types'


export class OracleServerMessage {
  method: MessageType

  constructor(type: MessageType) {
    this.method = type
  }
}

export class OracleServerMessageWithParameters extends OracleServerMessage {
  params: any[] // usually string[]

  constructor(type: MessageType, params: any[]) {
    super(type)
    this.params = params
  }
}

import { MessageType } from '~type/wallet-server-types'


export class WalletServerMessage {
  method: string // MessageType

  constructor(type: string /*MessageType*/) {
    this.method = type
  }
}

export class WalletServerMessageWithParameters extends WalletServerMessage {
  params: any[] // usually string[]

  constructor(type: string /*MessageType*/, params: any[]) {
    super(type)
    this.params = params
  }
}

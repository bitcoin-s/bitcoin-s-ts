
export const enum MESSAGE_TYPE {
  getpublickey = "getpublickey",
  getstakingaddress = "getstakingaddress",
  listevents = "listevents",
  createenumevent = "createenumevent",
  createnumericevent = "createnumericevent",
  createdigitdecompevent = "createdigitdecompevent",
  getevent = "getevent",
  signevent = "signevent",
  signdigits = "signdigits",
  getsignatures = "getsignatures",
  signmessage = "signmessage"
}

export class OracleServerMessage {
  method: MESSAGE_TYPE

  constructor(type: MESSAGE_TYPE) {
    this.method = type
  }
}
export class OracleServerMessageWithParameters extends OracleServerMessage {
  params: any[] // usually string[]

  constructor(type: MESSAGE_TYPE, params: any[]) {
    super(type)
    this.params = params
  }
}

export function getMessageBody(type: MESSAGE_TYPE, params?: any[]): OracleServerMessage {
  switch (type) {
    case MESSAGE_TYPE.getpublickey:
    case MESSAGE_TYPE.getstakingaddress:
    case MESSAGE_TYPE.listevents:
      return new OracleServerMessage(type)
    case MESSAGE_TYPE.getevent:
    case MESSAGE_TYPE.signevent:
    case MESSAGE_TYPE.signdigits:
    case MESSAGE_TYPE.signmessage:
    case MESSAGE_TYPE.getsignatures:
    case MESSAGE_TYPE.createenumevent:
    case MESSAGE_TYPE.createnumericevent:
    case MESSAGE_TYPE.createdigitdecompevent:
      return new OracleServerMessageWithParameters(type, params!)
    default:
      throw(Error('getMessageBody() unknown message type: ' + type))
  }
}

export class OracleResponse<T> {
  result: T|null = null; // Can also be a complex type like getevent response
  error: string|null = null;
}

export enum EventType {
  ENUM = 'enum',
  NUMERIC = 'numeric',
  DIGIT_DECOMP = 'digitdecomp',
}

export interface OracleEvent {
  announcementSignature: string;
  announcementTLV: string;
  attestations: string[];
  eventDescriptorTLV: string;
  eventName: string;
  eventTLV: string;
  maturationTime: string; // "2030-01-03T00:30:00Z"
  maturationTimeEpoch: number; // 1893630600
  nonces: string[];
  outcomes: string[]; // enum, numeric: [["number"]]
  signedOutcome: string;
  signingVersion: string;
}

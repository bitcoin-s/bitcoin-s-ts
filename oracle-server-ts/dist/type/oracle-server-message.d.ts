import { MessageType } from './oracle-server-types';
export declare class OracleServerMessage {
    method: MessageType;
    constructor(type: MessageType);
}
export declare class OracleServerMessageWithParameters extends OracleServerMessage {
    params: any[];
    constructor(type: MessageType, params: any[]);
}

export declare const enum MessageType {
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
export interface OracleEvent {
    announcementSignature: string;
    announcementTLV: string;
    attestations: string;
    eventDescriptorTLV: string;
    eventName: string;
    eventTLV: string;
    maturationTime: string;
    maturationTimeEpoch: number;
    nonces: string[];
    outcomes: string[] | string[][];
    signedOutcome: string;
    signingVersion: string;
    announcementTLVsha256: string;
    eventDescriptorTLVsha256: string;
}
export interface OracleResponse<T> {
    result: T | null;
    error: string | null;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageBody = void 0;
var oracle_server_message_1 = require("./oracle-server-message");
function getMessageBody(type, params) {
    switch (type) {
        case "getpublickey" /* getpublickey */:
        case "getstakingaddress" /* getstakingaddress */:
        case "listevents" /* listevents */:
            return new oracle_server_message_1.OracleServerMessage(type);
        case "getevent" /* getevent */:
        case "signevent" /* signevent */:
        case "signdigits" /* signdigits */:
        case "signmessage" /* signmessage */:
        case "getsignatures" /* getsignatures */:
        case "createenumevent" /* createenumevent */:
        case "createnumericevent" /* createnumericevent */:
        case "createdigitdecompevent" /* createdigitdecompevent */:
            return new oracle_server_message_1.OracleServerMessageWithParameters(type, params);
        default:
            throw (Error('getMessageBody() unknown message type: ' + type));
    }
}
exports.getMessageBody = getMessageBody;

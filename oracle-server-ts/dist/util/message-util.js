"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageBody = void 0;
var oracle_server_message_1 = require("../type/oracle-server-message");
function getMessageBody(type, params) {
    switch (type) {
        case "getpublickey" /* getpublickey */:
        case "getstakingaddress" /* getstakingaddress */:
        case "listannouncements" /* listannouncements */:
        // Common
        case "getversion" /* getversion */:
            return new oracle_server_message_1.OracleServerMessage(type);
        case "getannouncement" /* getannouncement */:
        case "signenum" /* signenum */:
        case "signdigits" /* signdigits */:
        case "signmessage" /* signmessage */:
        case "getsignatures" /* getsignatures */:
        case "createenumannouncement" /* createenumannouncement */:
        case "createnumericannouncement" /* createnumericannouncement */:
        case "createdigitdecompannouncement" /* createdigitdecompannouncement */:
            return new oracle_server_message_1.OracleServerMessageWithParameters(type, params);
        default:
            throw (Error('getMessageBody() unknown message type: ' + type));
    }
}
exports.getMessageBody = getMessageBody;

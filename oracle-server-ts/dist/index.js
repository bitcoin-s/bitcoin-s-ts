"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListEvents = exports.GetStakingAddress = exports.GetPublicKey = exports.SendOracleMessage = exports.ConfigureOracleServerURL = void 0;
var needle_1 = __importDefault(require("needle"));
var message_util_1 = require("./message-util");
var ORACLE_SERVER_URL = 'http://localhost:9998/';
/** Set Oracle Server endpoint */
function ConfigureOracleServerURL(url) {
    console.debug('ConfigureOracleServerURL()', url);
    ORACLE_SERVER_URL = url;
}
exports.ConfigureOracleServerURL = ConfigureOracleServerURL;
/** Send any OracleServerMessage */
function SendOracleMessage(message) {
    if (message) {
        return (0, needle_1.default)('post', "" + ORACLE_SERVER_URL, message, { json: true }).then(function (response) {
            // console.debug(' SendOracleMessage', response)
            return response.body;
        }).catch(function (err) {
            console.error('SendOracleMessage() error', err);
            throw (err);
        });
    }
    else {
        throw (Error('SendOracleMessage() null message'));
    }
}
exports.SendOracleMessage = SendOracleMessage;
/* Specific Oracle Server message functions */
function GetPublicKey() {
    console.debug('GetPublicKey()');
    var m = (0, message_util_1.getMessageBody)("getpublickey" /* getpublickey */);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('GetPublicKey response:', response)
        return response;
    });
}
exports.GetPublicKey = GetPublicKey;
function GetStakingAddress() {
    console.debug('GetStakingAddress()');
    var m = (0, message_util_1.getMessageBody)("getstakingaddress" /* getstakingaddress */);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('GetStakingAddress response:', response)
        return response;
    });
}
exports.GetStakingAddress = GetStakingAddress;
function ListEvents() {
    console.debug('ListEvents()');
    var m = (0, message_util_1.getMessageBody)("listevents" /* listevents */);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('ListEvents response:', response)
        return response;
    });
}
exports.ListEvents = ListEvents;
// TODO : The rest

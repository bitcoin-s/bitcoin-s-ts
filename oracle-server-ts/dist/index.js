"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSignatures = exports.SignDigits = exports.SignEvent = exports.CreateNumericEvent = exports.CreateEnumEvent = exports.GetEvent = exports.SignMessage = exports.ListEvents = exports.GetStakingAddress = exports.GetPublicKey = exports.SendOracleMessage = exports.ConfigureOracleServerURL = void 0;
var needle_1 = __importDefault(require("needle"));
var message_util_1 = require("./message-util");
var util_1 = require("./util");
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
function SignMessage(message) {
    console.debug('SignMessage()', message);
    (0, util_1.validateString)(message, 'SignMessage()', 'message');
    var m = (0, message_util_1.getMessageBody)("signmessage" /* signmessage */, [message]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('SignMessage response:', response)
        return response;
    });
}
exports.SignMessage = SignMessage;
function GetEvent(eventName) {
    console.debug('GetEvent()', eventName);
    (0, util_1.validateString)(eventName, 'GetEvent()', 'eventName');
    var m = (0, message_util_1.getMessageBody)("getevent" /* getevent */, [eventName]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('GetEvent response:', response)
        return response;
    });
}
exports.GetEvent = GetEvent;
function CreateEnumEvent(eventName, maturationTimeISOString, outcomes) {
    console.debug('CreateEnumEvent()');
    (0, util_1.validateString)(eventName, 'CreateEnumEvent()', 'eventName');
    (0, util_1.validateISODateString)(maturationTimeISOString, 'CreateEnumEvent()', 'maturationTimeISOString');
    (0, util_1.validateEnumOutcomes)(outcomes, 'CreateEnumEvent()');
    var m = (0, message_util_1.getMessageBody)("createenumevent" /* createenumevent */, [eventName, maturationTimeISOString, outcomes]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('CreateEnumEvent response:', response)
        return response;
    });
}
exports.CreateEnumEvent = CreateEnumEvent;
function CreateNumericEvent(eventName, maturationTimeISOString, minValue, maxValue, unit, precision) {
    console.debug('CreateNumericEvent()');
    (0, util_1.validateString)(eventName, 'CreateEnumEvent()', 'eventName');
    (0, util_1.validateISODateString)(maturationTimeISOString, 'CreateEnumEvent()', 'maturationTimeISOString');
    (0, util_1.validateNumber)(minValue, 'CreateEnumEvent()', 'minValue');
    (0, util_1.validateNumber)(maxValue, 'CreateEnumEvent()', 'maxValue');
    // TODO : Validate minValue/maxValue?
    (0, util_1.validateString)(unit, 'CreateEnumEvent()', 'unit'); // unit can be an empty string
    (0, util_1.validateNumber)(precision, 'CreateEnumEvent()', 'precision');
    if (precision < 0)
        throw (Error('CreateEnumEvent() precision must be >= 0'));
    var m = (0, message_util_1.getMessageBody)("createnumericevent" /* createnumericevent */, [eventName, maturationTimeISOString, minValue, maxValue, unit, precision]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('CreateNumericEvent response:', response)
        return response;
    });
}
exports.CreateNumericEvent = CreateNumericEvent;
// Rename SignEnum()?
function SignEvent(eventName, outcome) {
    console.debug('SignEvent()', eventName, outcome);
    (0, util_1.validateString)(eventName, 'SignEvent()', 'eventName');
    (0, util_1.validateString)(outcome, 'SignEvent()', 'outcome');
    var m = (0, message_util_1.getMessageBody)("signevent" /* signevent */, [eventName, outcome]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('SignEvent response:', response)
        return response;
    });
}
exports.SignEvent = SignEvent;
function SignDigits(eventName, outcome) {
    console.debug('SignDigits()', eventName, outcome);
    (0, util_1.validateString)(eventName, 'SignDigits()', 'eventName');
    (0, util_1.validateNumber)(outcome, 'SignDigits()', 'outcome');
    var m = (0, message_util_1.getMessageBody)("signdigits" /* signdigits */, [eventName, outcome]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('SignDigits response:', response)
        return response;
    });
}
exports.SignDigits = SignDigits;
function GetSignatures(eventName) {
    console.debug('GetSignatures()');
    (0, util_1.validateString)(eventName, 'GetSignatures()', 'eventName');
    var m = (0, message_util_1.getMessageBody)("getsignatures" /* getsignatures */, [eventName]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('GetSignatures response:', response)
        return response;
    });
}
exports.GetSignatures = GetSignatures;

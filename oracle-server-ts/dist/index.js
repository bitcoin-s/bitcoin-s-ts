"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSignatures = exports.SignDigits = exports.SignEnum = exports.CreateNumericAnnouncement = exports.CreateEnumAnnouncement = exports.GetAnnouncement = exports.SignMessage = exports.ListAnnouncements = exports.GetStakingAddress = exports.GetPublicKey = exports.SendOracleMessage = exports.ConfigureOracleServerURL = void 0;
var needle_1 = __importDefault(require("needle"));
var message_util_1 = require("./util/message-util");
var validation_util_1 = require("./util/validation-util");
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
function ListAnnouncements() {
    console.debug('ListAnnouncements()');
    var m = (0, message_util_1.getMessageBody)("listannouncements" /* listannouncements */);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('ListAnnouncements response:', response)
        return response;
    });
}
exports.ListAnnouncements = ListAnnouncements;
function SignMessage(message) {
    console.debug('SignMessage()', message);
    (0, validation_util_1.validateString)(message, 'SignMessage()', 'message');
    var m = (0, message_util_1.getMessageBody)("signmessage" /* signmessage */, [message]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('SignMessage response:', response)
        return response;
    });
}
exports.SignMessage = SignMessage;
function GetAnnouncement(eventName) {
    console.debug('GetAnnouncement()', eventName);
    (0, validation_util_1.validateString)(eventName, 'GetAnnouncement()', 'eventName');
    var m = (0, message_util_1.getMessageBody)("getannouncement" /* getannouncement */, [eventName]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('GetAnnouncement response:', response)
        return response;
    });
}
exports.GetAnnouncement = GetAnnouncement;
function CreateEnumAnnouncement(eventName, maturationTimeISOString, outcomes) {
    console.debug('CreateEnumAnnouncement()');
    (0, validation_util_1.validateString)(eventName, 'CreateEnumAnnouncement()', 'eventName');
    (0, validation_util_1.validateISODateString)(maturationTimeISOString, 'CreateEnumAnnouncement()', 'maturationTimeISOString');
    (0, validation_util_1.validateEnumOutcomes)(outcomes, 'CreateEnumAnnouncement()');
    var m = (0, message_util_1.getMessageBody)("createenumannouncement" /* createenumannouncement */, [eventName, maturationTimeISOString, outcomes]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('CreateEnumEvent response:', response)
        return response;
    });
}
exports.CreateEnumAnnouncement = CreateEnumAnnouncement;
function CreateNumericAnnouncement(eventName, maturationTimeISOString, minValue, maxValue, unit, precision) {
    console.debug('CreateNumericAnnouncement()');
    (0, validation_util_1.validateString)(eventName, 'CreateNumericAnnouncement()', 'eventName');
    (0, validation_util_1.validateISODateString)(maturationTimeISOString, 'CreateNumericAnnouncement()', 'maturationTimeISOString');
    (0, validation_util_1.validateNumber)(minValue, 'CreateNumericAnnouncement()', 'minValue');
    (0, validation_util_1.validateNumber)(maxValue, 'CreateNumericAnnouncement()', 'maxValue');
    // TODO : Validate minValue/maxValue?
    (0, validation_util_1.validateString)(unit, 'CreateNumericAnnouncement()', 'unit'); // unit can be an empty string
    (0, validation_util_1.validateNumber)(precision, 'CreateNumericAnnouncement()', 'precision');
    if (precision < 0)
        throw (Error('CreateNumericAnnouncement() precision must be >= 0'));
    var m = (0, message_util_1.getMessageBody)("createnumericannouncement" /* createnumericannouncement */, [eventName, maturationTimeISOString, minValue, maxValue, unit, precision]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('CreateNumericAnnouncement response:', response)
        return response;
    });
}
exports.CreateNumericAnnouncement = CreateNumericAnnouncement;
// Rename SignEnum()?
function SignEnum(eventName, outcome) {
    console.debug('SignEnum()', eventName, outcome);
    (0, validation_util_1.validateString)(eventName, 'SignEnum()', 'eventName');
    (0, validation_util_1.validateString)(outcome, 'SignEnum()', 'outcome');
    var m = (0, message_util_1.getMessageBody)("signenum" /* signenum */, [eventName, outcome]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('SignEnum response:', response)
        return response;
    });
}
exports.SignEnum = SignEnum;
function SignDigits(eventName, outcome) {
    console.debug('SignDigits()', eventName, outcome);
    (0, validation_util_1.validateString)(eventName, 'SignDigits()', 'eventName');
    (0, validation_util_1.validateNumber)(outcome, 'SignDigits()', 'outcome');
    var m = (0, message_util_1.getMessageBody)("signdigits" /* signdigits */, [eventName, outcome]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('SignDigits response:', response)
        return response;
    });
}
exports.SignDigits = SignDigits;
function GetSignatures(eventName) {
    console.debug('GetSignatures()');
    (0, validation_util_1.validateString)(eventName, 'GetSignatures()', 'eventName');
    var m = (0, message_util_1.getMessageBody)("getsignatures" /* getsignatures */, [eventName]);
    return SendOracleMessage(m).then(function (response) {
        // console.debug('GetSignatures response:', response)
        return response;
    });
}
exports.GetSignatures = GetSignatures;

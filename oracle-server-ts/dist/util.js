"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNumber = exports.validateEnumOutcomes = exports.validateISODateString = exports.validateString = void 0;
function validateString(s, fromFn, paramName) {
    if (typeof s !== 'string') {
        throw (Error(fromFn + ' non-string ' + paramName));
    }
}
exports.validateString = validateString;
var ISO_DATE_REGEX = /[+-]?\d{4}(-[01]\d(-[0-3]\d(T[0-2]\d:[0-5]\d:?([0-5]\d(\.\d+)?)?[+-][0-2]\d:[0-5]\dZ?)?)?)?/;
function validateISODateString(s, fromFn, paramName) {
    validateString(s, fromFn, paramName);
    // TODO : Validate ISO Date String
    if (!ISO_DATE_REGEX.test(s)) {
        throw (Error(fromFn + 'ISO Date invalid'));
    }
}
exports.validateISODateString = validateISODateString;
function validateEnumOutcomes(outcomes, fromFn) {
    if (outcomes && outcomes.length > 1) {
        var hasEmpty = outcomes.filter(function (i) { return i !== ''; });
        if (hasEmpty.length !== outcomes.length) {
            throw (Error(fromFn + ' outcomes has empty element'));
        }
        var unique = __spreadArray([], __read(new Set(outcomes)), false); // required --downlevelIteration in tsconfig.json
        if (unique.length !== outcomes.length) {
            throw (Error(fromFn + ' outcomes not unique'));
        }
    }
    else if (outcomes) {
        throw (Error(fromFn + ' must have at least two outcomes'));
    }
    else {
        throw (Error(fromFn + ' outcomes invalid'));
    }
}
exports.validateEnumOutcomes = validateEnumOutcomes;
function validateNumber(n, fromFn, paramName) {
    if (typeof n !== 'number') {
        throw (Error(fromFn + ' non-number ' + paramName));
    }
}
exports.validateNumber = validateNumber;

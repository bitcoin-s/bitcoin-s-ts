
console.debug('test.js')

// Import Library
const OracleServer = require('./dist/lib/index')

const validationUtil = require('./dist/lib/util/validation-util')

// Set oracleServer URL
OracleServer.ConfigureOracleServerURL('http://localhost:9998/')

// Test config variables

const ENUM_NAME = 'enum_' + validationUtil.makeId(4)
const NUMERIC_NAME = 'numeric_' + validationUtil.makeId(4)

const OUTCOME_1 = 'outcome1'
const OUTCOME_2 = 'outcome2'

console.debug('ENUM_NAME:', ENUM_NAME, 'NUMERIC_NAME:', NUMERIC_NAME)

const TEST_MESSAGE = 'test message'
const EXISTING_EVENT_NAME = 'test'
const EXISTING_EVENT_WITH_SIGS = 'numericEvent'

let minDate = new Date()
minDate.setDate(minDate.getDate() + 1)

const BAD_ISODATE_ENUM_EVENT = [ENUM_NAME, 'xxx', [OUTCOME_1,OUTCOME_2]]
const BAD_OUTCOMES_ENUM_EVENT_1 = [ENUM_NAME, minDate.toISOString(), [OUTCOME_1,'']]
const BAD_OUTCOMES_ENUM_EVENT_2 = [ENUM_NAME, minDate.toISOString(), [OUTCOME_1]]
const BAD_OUTCOMES_ENUM_EVENT_3 = [ENUM_NAME, minDate.toISOString(), [OUTCOME_1,OUTCOME_1]]
const BAD_OUTCOMES_ENUM_EVENT_4 = [ENUM_NAME, minDate.toISOString(), []]
const BAD_OUTCOMES_ENUM_EVENT_5 = [ENUM_NAME, minDate.toISOString(), null]

const VALID_ENUM_EVENT = [ENUM_NAME, minDate.toISOString(), [OUTCOME_1,OUTCOME_2]]

// TODO : More invalid numeric events
const BAD_OUTCOME_NUMERIC_EVENT = ['numericName2', 'xxx', 0, 100, 'units', 0]

const VALID_NUMERIC_EVENT = ['numericName', minDate.toISOString(), 0, 100, 'units', 0]

const SIGN_ENUM = ['eventName', 'outcome2']
const SIGN_NUMERIC = ['numericName', 42]

const BAD_SIGN_ENUM = ['eventName', 'outcome3']
const BAD_SIGN_NUMERIC = ['numericName', -1]

// Run tests

OracleServer.GetPublicKey().then(response => {
  console.debug('test.js GetPublicKey response:', response)
})

OracleServer.GetStakingAddress().then(response => {
  console.debug('test.js GetStakingAddress response:', response)
})

OracleServer.SignMessage(TEST_MESSAGE).then(response => {
  console.debug('test.js SignMessage response:', response)
})

OracleServer.ListAnnouncements().then(response => {
  console.debug('test.js ListAnnouncements response:', response)
})

// OracleServer.GetAnnouncement(EXISTING_EVENT_NAME).then(response => {
//   console.debug('test.js GetAnnouncement response:', response)
// })

// These work, but couldn't recreate with same name or cleanup after creation

// OracleServer.CreateEnumAnnouncement(...BAD_ISODATE_ENUM_EVENT).then(response => {
//   console.debug('test.js CreateEnumAnnouncement response:', response)
// })

// OracleServer.CreateEnumAnnouncement(...BAD_OUTCOMES_ENUM_EVENT_1).then(response => {
//   console.debug('test.js CreateEnumAnnouncement response:', response)
// })

// OracleServer.CreateEnumAnnouncement(...BAD_OUTCOMES_ENUM_EVENT_2).then(response => {
//   console.debug('test.js CreateEnumAnnouncement response:', response)
// })

// OracleServer.CreateEnumAnnouncement(...BAD_OUTCOMES_ENUM_EVENT_3).then(response => {
//   console.debug('test.js CreateEnumAnnouncement response:', response)
// })

// OracleServer.CreateEnumAnnouncement(...BAD_OUTCOMES_ENUM_EVENT_4).then(response => {
//   console.debug('test.js CreateEnumAnnouncement response:', response)
// })

// OracleServer.CreateEnumAnnouncement(...BAD_OUTCOMES_ENUM_EVENT_5).then(response => {
//   console.debug('test.js CreateEnumAnnouncement response:', response)
// })

// OracleServer.CreateEnumAnnouncement(...VALID_ENUM_EVENT).then(response => {
//   console.debug('test.js CreateEnumAnnouncement response:', response)
// })

// TODO : Numeric test cases

// OracleServer.CreateNumericAnnouncement(...VALID_NUMERIC_EVENT).then(response => {
//   console.debug('test.js CreateNumericEvent response:', response)
// })

// OracleServer.SignEnum(...SIGN_ENUM).then(response => {
//   console.debug('test.js SignEnum response:', response)
// })

// OracleServer.SignEnum(...BAD_SIGN_ENUM).then(response => {
//   console.debug('test.js SignEnum response:', response)
// })

// OracleServer.SignDigits(...SIGN_NUMERIC).then(response => {
//   console.debug('test.js SignDigits response:', response)
// })

// OracleServer.SignDigits(...BAD_SIGN_NUMERIC).then(response => {
//   console.debug('test.js SignDigits response:', response)
// })

OracleServer.GetSignatures(EXISTING_EVENT_WITH_SIGS).then(response => {
  console.debug('test.js GetSignatures response:', response)
})

console.debug('test.js over')

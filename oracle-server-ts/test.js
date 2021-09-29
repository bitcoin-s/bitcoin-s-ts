
console.debug('test.js')

// Import Library
const OracleServer = require('./dist/index')

// Set oracleServer URL
OracleServer.ConfigureOracleServerURL('http://localhost:9998/')

// Test config variables
const TEST_MESSAGE = 'test message'
const EXISTING_EVENT_NAME = 'test'
const EXISTING_EVENT_WITH_SIGS = 'numericEvent'

let minDate = new Date()
minDate.setDate(minDate.getDate() + 1)

const BAD_ISODATE_ENUM_EVENT = ['eventName', 'xxx', ['outcome1','outcome2']]
const BAD_OUTCOMES_ENUM_EVENT_1 = ['eventName', minDate.toISOString(), ['outcome1','']]
const BAD_OUTCOMES_ENUM_EVENT_2 = ['eventName', minDate.toISOString(), ['outcome1']]
const BAD_OUTCOMES_ENUM_EVENT_3 = ['eventName', minDate.toISOString(), ['outcome1','outcome1']]
const BAD_OUTCOMES_ENUM_EVENT_4 = ['eventName', minDate.toISOString(), []]
const BAD_OUTCOMES_ENUM_EVENT_5 = ['eventName', minDate.toISOString(), null]

const VALID_ENUM_EVENT = ['eventName', minDate.toISOString(), ['outcome1','outcome2']]

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

OracleServer.ListEvents().then(response => {
  console.debug('test.js ListEvents response:', response)
})

OracleServer.SignMessage(TEST_MESSAGE).then(response => {
  console.debug('test.js SignMessage response:', response)
})

OracleServer.GetEvent(EXISTING_EVENT_NAME).then(response => {
  console.debug('test.js GetEvent response:', response)
})

// These work, but couldn't recreate with same name or cleanup after creation

// OracleServer.CreateEnumEvent(...BAD_ISODATE_ENUM_EVENT).then(response => {
//   console.debug('test.js CreateEnumEvent response:', response)
// })

// OracleServer.CreateEnumEvent(...BAD_OUTCOMES_ENUM_EVENT_1).then(response => {
//   console.debug('test.js CreateEnumEvent response:', response)
// })

// OracleServer.CreateEnumEvent(...BAD_OUTCOMES_ENUM_EVENT_2).then(response => {
//   console.debug('test.js CreateEnumEvent response:', response)
// })

// OracleServer.CreateEnumEvent(...BAD_OUTCOMES_ENUM_EVENT_3).then(response => {
//   console.debug('test.js CreateEnumEvent response:', response)
// })

// OracleServer.CreateEnumEvent(...BAD_OUTCOMES_ENUM_EVENT_4).then(response => {
//   console.debug('test.js CreateEnumEvent response:', response)
// })

// OracleServer.CreateEnumEvent(...BAD_OUTCOMES_ENUM_EVENT_5).then(response => {
//   console.debug('test.js CreateEnumEvent response:', response)
// })

// OracleServer.CreateEnumEvent(...VALID_ENUM_EVENT).then(response => {
//   console.debug('test.js CreateEnumEvent response:', response)
// })

// TODO : Numeric test cases

// OracleServer.CreateNumericEvent(...VALID_NUMERIC_EVENT).then(response => {
//   console.debug('test.js CreateNumericEvent response:', response)
// })

// OracleServer.SignEvent(...SIGN_ENUM).then(response => {
//   console.debug('test.js SignEvent response:', response)
// })

// OracleServer.SignEvent(...BAD_SIGN_ENUM).then(response => {
//   console.debug('test.js SignEvent response:', response)
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

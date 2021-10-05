
import * as OracleServer from './lib/index'
import * as validationUtil from './lib/util/validation-util'

console.debug('demo.ts')

const ENUM_NAME = 'enum_' + validationUtil.makeId(4)
const NUMERIC_NAME = 'numeric_' + validationUtil.makeId(4)
const NON_EXISTENT_NAME = 'nonexistent_' + validationUtil.makeId(4)

const TEST_MESSAGE = 'test message'

let minDate = new Date()
minDate.setDate(minDate.getDate() + 1)

const OUTCOME_1 = 'outcome1'
const OUTCOME_2 = 'outcome2'
const NUMERIC_OUTCOME = 50

const VALID_ENUM_EVENT:[string,string,string[]] = 
  [ENUM_NAME, minDate.toISOString(), [OUTCOME_1,OUTCOME_2]]

const VALID_NUMERIC_EVENT:[string,string,number,number,string,number] = 
  [NUMERIC_NAME, minDate.toISOString(), 0, 100, 'units', 0]

// await only likes to be used in async functions
async function runDemo() {
  await OracleServer.GetPublicKey().then(response => {
    console.debug('GetPublicKey response:', response)
  })
  await OracleServer.GetStakingAddress().then(response => {
    console.debug('GetStakingAddress response:', response)
  })
  await OracleServer.SignMessage(TEST_MESSAGE).then(response => {
    console.debug('SignMessage response:', response)
  })
  await OracleServer.ListAnnouncements().then(response => {
    console.debug('ListAnnouncements response:', response)
  })
  await OracleServer.CreateEnumAnnouncement(...VALID_ENUM_EVENT).then(response => {
    console.debug('CreateEnumAnnouncement response:', response)
    if (response.result) { // Created successfully
      OracleServer.GetAnnouncement(ENUM_NAME).then(response => {
        console.debug(`GetAnnouncement ${ENUM_NAME} response:`, response)

        OracleServer.SignEnum(ENUM_NAME, OUTCOME_1).then(response => {
          console.debug(`SignEnum ${ENUM_NAME} ${OUTCOME_1} response:`, response)

          OracleServer.GetAnnouncement(ENUM_NAME).then(response => {
            console.debug(`GetAnnouncement ${ENUM_NAME} response:`, response)

            OracleServer.DeleteAttestation(ENUM_NAME).then(response => {
              console.debug(` DeleteAttestation ${ENUM_NAME} response:`, response)

              OracleServer.DeleteAnnouncement(ENUM_NAME).then(response => {
                console.debug(` DeleteAnnouncement ${ENUM_NAME} response:`, response)
              })
            })
          })
        })
      })
    }
  })
  await OracleServer.CreateNumericAnnouncement(...VALID_NUMERIC_EVENT).then(response => {
    console.debug('CreateNumericAnnouncement response:', response)
    if (response.result) { // Created successfully
      OracleServer.GetAnnouncement(NUMERIC_NAME).then(response => {
        console.debug(`GetAnnouncement ${NUMERIC_NAME} response:`, response)
  
        OracleServer.SignDigits(NUMERIC_NAME, NUMERIC_OUTCOME).then(response => {
          console.debug(`SignDigits ${NUMERIC_NAME} ${NUMERIC_OUTCOME} response:`, response)

          OracleServer.GetAnnouncement(NUMERIC_NAME).then(response => {
            console.debug(`GetAnnouncement ${NUMERIC_NAME} response:`, response)

            OracleServer.DeleteAttestation(NUMERIC_NAME).then(response => {
              console.debug(` DeleteAttestation ${NUMERIC_NAME} response:`, response)

              OracleServer.DeleteAnnouncement(NUMERIC_NAME).then(response => {
                console.debug(` DeleteAnnouncement ${NUMERIC_NAME} response:`, response)
              })
            })
          })
        })
      })
    }
  })
  
  // TEST
  // await OracleServer.DeleteAnnouncement(NON_EXISTENT_NAME).then(response => {
  //   console.debug(` DeleteAnnouncement ${NON_EXISTENT_NAME} response:`, response)
  //   // TODO : Assert error
  // })
}

runDemo()

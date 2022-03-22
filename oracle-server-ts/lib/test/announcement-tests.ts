
import assert from 'assert'

import * as OracleServer from '../index'
import * as validationUtil from '../util/validation-util'


const ENUM_NAME = 'enum_' + validationUtil.makeId(4)
const NUMERIC_NAME = 'numeric_' + validationUtil.makeId(4)

let minDate = new Date()
minDate.setDate(minDate.getDate() + 1)

const OUTCOME_1 = 'outcome1'
const OUTCOME_2 = 'outcome2'
const OUTCOME_3 = 'outcome3'

const NUMERIC_MIN = 0
const NUMERIC_MAX = 100
const NUMERIC_OUTCOME = validationUtil.getRandomInt(NUMERIC_MIN, NUMERIC_MAX)

const VALID_ENUM_EVENT:[string,string,string[]] = 
  [ENUM_NAME, minDate.toISOString(), [OUTCOME_1,OUTCOME_2]]

const VALID_NUMERIC_EVENT:[string,string,number,number,string,number] = 
  [NUMERIC_NAME, minDate.toISOString(), NUMERIC_MIN, NUMERIC_MAX, 'units', 0]

// await only likes to be used in async functions
export async function announcementTests() {

  await OracleServer.CreateEnumAnnouncement(...VALID_ENUM_EVENT).then(r => {
    console.debug(`CreateEnumAnnouncement ${ENUM_NAME} response:`, r)
    assert(r.result)
    assert.ifError(r.error)

    OracleServer.GetAnnouncement(ENUM_NAME).then(async (r) => {
      console.debug(`GetAnnouncement ${ENUM_NAME} response:`, r)
      assert(r.result)
      assert.ifError(r.error)
      assert.equal(r.result.eventName, ENUM_NAME)

      await OracleServer.ListAnnouncements().then(r => {
        console.debug(`ListAnnouncements ${ENUM_NAME} response:`, r)
        assert(r.result)
        assert.ifError(r.error)
        assert(r.result.indexOf(ENUM_NAME) !== -1)
      })

      // Test sign non-existent outcome
      await assert.rejects(() => OracleServer.SignEnum(ENUM_NAME, OUTCOME_3))

      OracleServer.SignEnum(ENUM_NAME, OUTCOME_1).then(async (r) => {
        console.debug(`SignEnum ${ENUM_NAME} ${OUTCOME_1} response:`, r)
        assert(r.result)
        assert.ifError(r.error)

        // Test re-sign
        await assert.rejects(() => OracleServer.SignEnum(ENUM_NAME, OUTCOME_2))

        OracleServer.GetAnnouncement(ENUM_NAME).then(async (r) => {
          console.debug(`GetAnnouncement ${ENUM_NAME} response:`, r)
          assert(r.result)
          assert.ifError(r.error)
          assert.equal(r.result.eventName, ENUM_NAME)
          assert.equal(r.result.signedOutcome, OUTCOME_1)

          // Cannot delete yet because the Announcement is signed
          await assert.rejects(() => OracleServer.DeleteAnnouncement(ENUM_NAME))

          OracleServer.DeleteAttestation(ENUM_NAME).then(r => {
            console.debug(`DeleteAttestation ${ENUM_NAME} response:`, r)
            assert(r.result)
            assert.ifError(r.error)

            OracleServer.DeleteAnnouncement(ENUM_NAME).then(r => {
              console.debug(`DeleteAnnouncement ${ENUM_NAME} response:`, r)
              assert(r.result)
              assert.ifError(r.error)
            })
          })
        })
      })
    })
  })

  await OracleServer.CreateNumericAnnouncement(...VALID_NUMERIC_EVENT).then(r => {
    console.debug(`CreateNumericAnnouncement ${NUMERIC_NAME} response:`, r)
    assert(r.result)
    assert.ifError(r.error)

    OracleServer.GetAnnouncement(NUMERIC_NAME).then(async (r) => {
      console.debug(`GetAnnouncement ${NUMERIC_NAME} response:`, r)
      assert(r.result)
      assert.ifError(r.error)
      assert.equal(r.result.eventName, NUMERIC_NAME)

      await OracleServer.ListAnnouncements().then(r => {
        console.debug(`ListAnnouncements ${NUMERIC_NAME} response:`, r)
        assert(r.result)
        assert.ifError(r.error)
        assert(r.result.indexOf(NUMERIC_NAME) !== -1)
      })

      OracleServer.SignDigits(NUMERIC_NAME, NUMERIC_OUTCOME).then(async (r) => {
        console.debug(`SignDigits ${NUMERIC_NAME} ${NUMERIC_OUTCOME} response:`, r)
        assert(r.result)
        assert.ifError(r.error)
        
        // Cannot delete yet because the Announcement is signed
        await assert.rejects(() => OracleServer.DeleteAnnouncement(NUMERIC_NAME))

        OracleServer.GetAnnouncement(NUMERIC_NAME).then(async (r) => {
          console.debug(`GetAnnouncement ${NUMERIC_NAME} response:`, r)
          assert(r.result)
          assert.ifError(r.error)
          assert.equal(r.result.eventName, NUMERIC_NAME)
          assert.equal(r.result.signedOutcome, NUMERIC_OUTCOME)

          // Cannot delete yet because the Announcement is signed
          await assert.rejects(() => OracleServer.DeleteAnnouncement(NUMERIC_NAME))

          OracleServer.DeleteAttestation(NUMERIC_NAME).then(r => {
            console.debug(`DeleteAttestation ${NUMERIC_NAME} response:`, r)
            assert(r.result)
            assert.ifError(r.error)

            OracleServer.DeleteAnnouncement(NUMERIC_NAME).then(r => {
              console.debug(`DeleteAnnouncement ${NUMERIC_NAME} response:`, r)
              assert(r.result)
              assert.ifError(r.error)
            })
          })
        })
      })
    })
  })

  // TODO : Testing signing behavior past min/max bounds
  
}

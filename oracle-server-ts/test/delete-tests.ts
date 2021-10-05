
import assert from 'assert/strict';

import * as OracleServer from '../lib/index'
import * as validationUtil from '../lib/util/validation-util'


const NON_EXISTENT_NAME = 'nonexistent_' + validationUtil.makeId(4)

// await only likes to be used in async functions
export async function deleteTests() {
  await assert.rejects(
    async () => OracleServer.DeleteAnnouncement(NON_EXISTENT_NAME)
  )
  await assert.rejects(
    async () => OracleServer.DeleteAttestation(NON_EXISTENT_NAME)
  )
}


import assert from 'assert/strict';

import * as OracleServer from '../lib/index'


const TEST_MESSAGE = 'test message'

// await only likes to be used in async functions
export async function noinputTests() {
  await OracleServer.GetPublicKey().then(r => {
    console.debug('GetPublicKey() response:', r)
    assert(r.result)
    assert.ifError(r.error)
  })
  await OracleServer.GetStakingAddress().then(r => {
    console.debug('GetStakingAddress() response:', r)
    assert(r.result)
    assert.ifError(r.error)
  })
  await OracleServer.SignMessage(TEST_MESSAGE).then(r => {
    console.debug('SignMessage() response:', r)
    assert(r.result)
    assert.ifError(r.error)
  })
  await OracleServer.ListAnnouncements().then(r => {
    console.debug('ListAnnouncements() response:', r)
    assert(r.result)
    assert.ifError(r.error)
  })
}


import assert from 'assert'

import * as WalletServer from '../index'


export async function dlcTests() {
  console.debug('dlcTests()')

  await WalletServer.GetDLCHostAddress().then(r => {
    console.debug('GetDLCHostAddress()', r)
    assert.ifError(r.error)
  })
  
}


import assert from 'assert'
import { request } from 'needle'

import * as WalletServer from '../lib/index'


export async function dlcTests() {
  console.debug('dlcTests()')

  await WalletServer.GetDLCHostAddress().then(r => {
    console.debug('GetDLCHostAddress()', r)
    assert.ifError(r.error)
  })
  
}

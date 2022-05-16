
import assert from 'assert'

import * as WalletServer from '../index'


export async function networkTests() {
  console.debug('networkTests()')

  await WalletServer.GetPeers().then(r => {
    console.debug('GetPeers()', r)
    assert.ifError(r.error)
  })
  
  // await WalletServer.Stop().then(r => {
  //   console.debug('Stop()', r)
  //   assert.ifError(r.error)
  // })

}

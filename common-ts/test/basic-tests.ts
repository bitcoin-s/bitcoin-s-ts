
import assert from 'assert/strict'

import * as Server from '../lib/index'


// await only likes to be used in async functions
export async function basicTests() {
  console.debug('basicTests()')

  Server.GetVersion().then(r => {
    console.debug('GetVersion()', r)
  })
}

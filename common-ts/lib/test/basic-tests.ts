
import * as Server from '../index'


// await only likes to be used in async functions
export async function basicTests() {
  console.debug('basicTests()')

  Server.GetVersion().then(r => {
    console.debug('GetVersion()', r)
  })
}

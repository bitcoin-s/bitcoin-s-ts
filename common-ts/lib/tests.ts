
import * as CommonServer from './index'

import { basicTests } from './test/basic-tests'


console.debug('tests.ts')

CommonServer.ConfigureServerURL('http://localhost:9999/')
CommonServer.ConfigureAuthorizationHeader('Basic ' + Buffer.from('bitcoins:password').toString('base64'))

export async function runTests() {
  await basicTests()
}

runTests()

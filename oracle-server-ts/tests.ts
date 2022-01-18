
import * as OracleServer from './lib/index'

import { deleteTests } from './test/delete-tests'
import { announcementTests } from './test/announcement-tests'
import { noinputTests } from './test/noinput-tests'

console.debug('tests.ts')

OracleServer.ConfigureServerURL('http://localhost:9998/')
OracleServer.ConfigureAuthorizationHeader('Basic ' + Buffer.from('bitcoins:password').toString('base64'))

export async function runTests() {
  await deleteTests()
  await announcementTests()
  await noinputTests()
}

runTests()

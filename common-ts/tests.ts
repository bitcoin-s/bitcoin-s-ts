
import * as WalletServer from './lib/index'

import { basicTests } from './test/basic-tests'

console.debug('tests.ts')

WalletServer.ConfigureWalletServerURL('http://localhost:9999/')

export async function runTests() {
  await basicTests()
}

runTests()
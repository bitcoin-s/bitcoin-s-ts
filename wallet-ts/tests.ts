
import * as WalletServer from './lib/index'

import { basicTests } from './test/basic-tests'
import { blockchainTests } from './test/blockchain-tests'
import { coreTests } from './test/core-tests'
import { dlcTests } from './test/dlc-tests'
import { networkTests } from './test/network-tests'

console.debug('tests.ts')

WalletServer.ConfigureWalletServerURL('http://localhost:9999/')

export async function runTests() {
  await blockchainTests()
  await coreTests()
  await networkTests()
  await dlcTests()
  await basicTests()
}

runTests()

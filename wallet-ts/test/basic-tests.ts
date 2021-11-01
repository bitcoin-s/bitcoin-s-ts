
import assert from 'assert'
import { request } from 'needle'

import * as WalletServer from '../lib/index'


export async function basicTests() {
  console.debug('basicTests()')

  await WalletServer.GetVersion().then(r => {
    console.debug('GetVersion()', r)
    assert.ifError(r.error)
  })

  await WalletServer.IsEmpty().then(r => {
    console.debug('IsEmpty()', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetBalance(true).then(r => {
    console.debug('GetBalance() in sats', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetBalance(false).then(r => {
    console.debug('GetBalance() in BTC', r)
    assert.ifError(r.error)
  })

  await WalletServer.WalletInfo().then(r => {
    console.debug('WalletInfo()', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetConfirmedBalance(true).then(r => {
    console.debug('GetConfirmedBalance() in sats', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetConfirmedBalance(false).then(r => {
    console.debug('GetConfirmedBalance() in BTC', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetUnconfirmedBalance(true).then(r => {
    console.debug('GetUnconfirmedBalance() in sats', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetUnconfirmedBalance(false).then(r => {
    console.debug('GetUnconfirmedBalance() in BTC', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetBalances(true).then(r => {
    console.debug('GetBalances() in sats', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetBalances(false).then(r => {
    console.debug('GetBalances() in BTC', r)
    assert.ifError(r.error)
  })

  await WalletServer.LockUnspent(true, []).then(r => {
    console.debug('LockUnspent()', r)
    assert.ifError(r.error)
  })

  const TEST_LABEL = 'test'
  const TEST_LABEL_2 = 'test label'

  // Should it be possible to create a new address without a label?
  await WalletServer.GetNewAddress(TEST_LABEL).then(async (r) => {
    console.debug('GetNewAddress()', r)

    const address = <string>r.result

    // Should this be valid to do here? Seems like yes.
    // await WalletServer.LabelAddress(address, TEST_LABEL_2).then(result => {
    //   console.debug('LabelAddress()', result)
    // })

    await WalletServer.GetAddressLabels(address).then(r => {
      console.debug('GetAddressLabels()', r)
      assert.ifError(r.error)
      assert(r.result)
      assert(r.result[0] === TEST_LABEL)
    })

    await WalletServer.DropAddressLabels(address).then(r => {
      console.debug('DropAddressLabels()', r)
      assert.ifError(r.error)
    })

    await WalletServer.GetAddressLabels(address).then(r => {
      console.debug('GetAddressLabels()', r)
      assert.ifError(r.error)
    })

    await WalletServer.LabelAddress(address, TEST_LABEL_2).then(r => {
      console.debug('LabelAddress()', r)
      assert.ifError(r.error)
    })

    await WalletServer.GetAddressLabels(address).then(r => {
      console.debug('GetAddressLabels()', r)
      assert.ifError(r.error)
      assert(r.result)
      assert(r.result[0] === TEST_LABEL_2)
    })

    // await WalletServer.DropAddressLabels(address).then(result => {
    //   console.debug('DropAddressLabels()', result)
    // })
  })

  // await WalletServer.GetTransaction('xxx').then(result => {
  //   console.debug('GetTransaction()', result)
  // })

  // await WalletServer.LockUnspent(true).then(result => {
  //   console.debug('LockUnspent()', result)
  // })

  await WalletServer.GetDLCs().then(r => {
    console.debug('GetDLCs()', r)
  })

  // TODO : More DLC Fns

  await WalletServer.GetUTXOs().then(r => {
    console.debug('GetUTXOs()', r)
    if (r && r.result && r.result.length > 0) {
      console.debug('[0]:', r.result[0]);
    }
  })

  await WalletServer.ListReservedUTXOs().then(r => {
    console.debug('ListReservedUTXOs()', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetAddresses().then(r => {
    console.debug('GetAddresses()', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetSpentAddresses().then(r => {
    console.debug('GetSpentAddresses()', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetFundedAddresses().then(r => {
    console.debug('GetFundedAddresses()', r)
    assert.ifError(r.error)
    assert(r.result)
    // All values should be greater than zero in the address list
    for (const a of r.result) {
      assert(a.value > 0)
    }
  })

  await WalletServer.GetUnusedAddresses().then(r => {
    console.debug('GetUnusedAddresses()', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetAccounts().then(async (r) => {
    console.debug('GetAccounts()', r)
    assert.ifError(r.error)
    assert(r.result)

    // What can I do with these results?
  })

  await WalletServer.GetAddressInfo('tb1qw70ssz2a2y87v0cp2ue2nvam8gdyz053f8j5j6').then(r => {
    console.debug('GetAddressInfo()', r)
    assert.ifError(r.error)
  })

  // Untested
  // await WalletServer.CreateNewAccount().then(async (r) => {
  //   console.debug('CreateNewAccount()', r)
  //   assert.ifError(r.error)
  // })

  await WalletServer.EstimateFee().then(r => {
    console.debug('EstimateFee()', r)
    assert.ifError(r.error)
  })

  await WalletServer.GetDLCWalletAccounting().then(r => {
    console.debug('GetDLCWalletAccounting()', r)
    assert.ifError(r.error)
  })


}

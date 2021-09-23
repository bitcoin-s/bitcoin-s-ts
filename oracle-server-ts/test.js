
console.debug('test.js')

const OracleServer = require('./dist/index')

// Set oracleServer URL
OracleServer.ConfigureOracleServerURL('http://localhost:9998/')

OracleServer.GetPublicKey().then(response => {
  console.debug('test.js GetPublicKey response:', response)
})

OracleServer.GetStakingAddress().then(response => {
  console.debug('test.js GetStakingAddress response:', response)
})

OracleServer.ListEvents().then(response => {
  console.debug('test.js ListEvents response:', response)
})

console.debug('test.js over')

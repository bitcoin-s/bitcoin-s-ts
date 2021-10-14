# WalletServerTS

This project is a NodeJS module for making calls to bitcoin-s walletServer.

## Install Dependencies

This project requires local NodeJS `https://nodejs.org/`. Run `npm i` in the project root to install project dependencies.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Test

Run `npm run test` to start JavaScript invocation test script.

## Basic Proof of System Working Programs

### Typescript
```
import * as OracleServer from '@bitcoin-s-ts/oracle-server-ts'

OracleServer.ConfigureOracleServerURL('http://localhost:9998/')

OracleServer.GetPublicKey().then(r => {
	console.debug('GetPublicKey()', r)
})
```

### Javascript
```
const OracleServer = require('@bitcoin-s-ts/oracle-server-ts')

OracleServer.ConfigureOracleServerURL('http://localhost:9998/')

OracleServer.GetPublicKey().then(r => {
	console.debug('GetPublicKey()', r)
})
```

# OracleServerUi

This project is a frontend for bitcoin-s oracleServer. It can perform all the basic operations exposed in `bitcoin-s/app/oracle-server/src/main/scala/org/bitcoins/oracle/server/OracleRoutes.scala` except keymanagerpassphrasechange and keymanagerpassphraseset.

## Install Dependencies

This project requires local NodeJS `https://nodejs.org/`. Run `npm i` in the project root to install project dependencies.

## Starting Backend

This project runs on top of bitcoin-s. To setup bitcoin-s, see `https://bitcoin-s.org/docs/next/getting-started`.

Once bitcoin-s is building and configured, run `oracleServer/run` to start the oracle-server.

## Development server

Run `npm run start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

The development server is configured for the default 127.0.0.1 IP and 9998 port of the oracle-server and should be ready to run. Try pressing the 'Get Public Key' button.

## Build

Run `npm build` to build the project. The build artifacts will be stored in the `dist/` directory.

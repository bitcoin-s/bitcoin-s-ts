# OracleServerUi

This project is a frontend for bitcoin-s oracleServer. It can perform all the basic operations exposed in `bitcoin-s/app/oracle-server/src/main/scala/org/bitcoins/oracle/server/OracleRoutes.scala` except keymanagerpassphrasechange and keymanagerpassphraseset.

## Install Dependencies

This project requires local NodeJS `https://nodejs.org/`. Run `npm i` in the project root to install project dependencies.

## Starting Backend

This project runs on top of bitcoin-s oracleServer through oracle-server-ui-proxy. To setup bitcoin-s, see `https://bitcoin-s.org/docs/next/getting-started`.

Once bitcoin-s is building and configured, run `oracleServer/run` to start the oracle-server.

In the oracle-server-ui-proxy project root after installing packages with `npm i`, run `npm run start` to host the UI (this project) on `http://localhost:3001/`.

## Development server

Run `npm run startproxy` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

The development server is configured for the default oracle-server-ui-proxy `http://localhost:3001/` endpoint over a bitcoin-s oracleServer as described above.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

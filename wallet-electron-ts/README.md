# Suredbits Desktop Wallet

This project wraps wallet-server-ui, wallet-server-ui-proxy, and bitcoin-s appServer into a standalone native application.

## Dependencies

All modules that are dependencies of local /bin items are included in the package.json here.

## Building Prerequisites

Run `npm run build` to build all prerequisites and move binaries into this folder. NOTE : You must supply your own bitcoin-s-server.zip in this folder.

## Starting development server

Run `npm run start` to generate an Electron shell and run application in development mode.

## Packaging native application

Run `npm run make` to build a native application for this platform.

NOTE : Right now, building on macOS requires manually setting the JAVA_HOME environment variable in index.ts:31. The JAVA_HOME environment variable does not pass through when double clicking an application.

## Notes

The packaged instance of appServer runs off of ~/.bitcoin-s/bitcoin-s.conf. Values in proxy-config.json locally will need to match values set in the conf prior to building, specifically: serverPassword, walletServerUrl, and walletServerWs.

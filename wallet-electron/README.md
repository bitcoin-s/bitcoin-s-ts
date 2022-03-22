# Electron Suredbits Wallet Wrapper

This project wraps wallet-server-ui, wallet-server-ui-proxy, and bitcoin-s appServer into a standalone native application.

## Dependencies

All modules that are dependencies of local /bin items are included in the package.json here. Electron has issues with file:../xxx type imports which made it necessary to copy built assets locally into /bin.

## Building Prerequisites

Run `npm run build` to build all prerequisites and move binaries into this folder. NOTE : You must supply your own bitcoin-s-server.zip in this folder.

## Starting development server

Run `npm run start` to generate Electron shell and run application in development mode.

## Packaging native application

Run `npm run make` to build native application for this platform. NOTE : This does not work yet on m1 Mac, may not for any platform yet.

## Notes

The packaged instance of appServer runs off of ~/.bitcoin-s/bitcoin-s.conf. Values in proxy-config.json locally will need to match values set in the conf, specifically: serverPassword, walletServerUrl, and walletServerWs.

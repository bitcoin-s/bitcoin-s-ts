# WalletServerUi

This project is a frontend for bitcoin-s appServer / bundleGui.

## Install Dependencies

This project requires local NodeJS `https://nodejs.org/`. Run `npm i` in the project root to install project dependencies.

## Starting Backend

This project runs on top of bitcoin-s appServer through wallet-server-ui-proxy. To setup bitcoin-s, see `https://bitcoin-s.org/docs/next/getting-started`.

Once bitcoin-s is building and configured, run `appServer/run` to start the app-server. Bitcoin-s `bundle/run` can also be used to host the desktop UI and appServer underneath this project.

In the wallet-server-ui-proxy project root after installing packages with `npm i`, run `npm run start` to host the UI (this project) on `http://localhost:3002/`.

## Development server

Run `npm run startproxy` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

The development server is configured for the default wallet-server-ui-proxy `http://localhost:3002/` endpoint over a bitcoin-s appServer as described above.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Login

The default password is "none". It can be overwritten at the proxy by setting the environment variable `DEFAULT_UI_PASSWORD`. Authorization token secrets are randomly generated at each server start and do not persist validity between server runs.

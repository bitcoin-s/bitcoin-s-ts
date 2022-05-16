# Krystal Bull Desktop Oracle

This project wraps oracle-server-ui, oracle-server-ui-proxy, and bitcoin-s oracleServer into a standalone native application.

## Dependencies

All modules that are dependencies of local /bin items are included in the package.json here.

You must `npm install` in this folder to get Electron installed properly. `npm i` in the top level monorepo seems to remove node_modules here, requiring another `npm install` here before building with Electron.

## Building Prerequisites

Run `npm run build` to build all prerequisites and move binaries into this folder. NOTE : You must supply your own bitcoin-s-oracle-server.zip in this folder.

## Starting development server

Run `npm run start` to generate an Electron shell and run application in development mode.

## Packaging native application

Run `npm run make` to build a native application for this platform.

## Environment Requirements

User needs to have Java installed and JAVA_HOME defined. They also need it exposed to Launch Services on Mac OS. This will look something like the following in ~/.zprofile:
```
export JAVA_HOME="/Users/username/Library/Caches/Coursier/jvm/openjdk@1.11.0-2/Contents/Home"
launchctl setenv JAVA_HOME $JAVA_HOME
```

## Notes

The packaged instance of oracleServer runs off of ~/.bitcoin-s/bitcoin-s.conf. Values in proxy-config.json locally will need to match values set in the conf prior to building, specifically: serverPassword and oracleServerUrl.

# RPM Build Config

This takes a bit longer to build than deb bundling. Disabling until necessary.
```
{
    "name": "@electron-forge/maker-rpm",
    "config": {
        "options": {
            "name": "krystal-bull",
            "productName": "Krystal Bull",
            "icon": "assets/krystal_bull.png",
            "homepage": "https://suredbits.com"
        }
    }
}
```

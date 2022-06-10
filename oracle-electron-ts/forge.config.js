
// See https://stackoverflow.com/questions/69046910/electron-forge-securely-add-appleid-and-password

const CONFIG = {
  packagerConfig: {
    "icon": "assets/krystal_bull.icns",
    "executableName": "oracle-electron-ts",

    // "osxSign": {
    //   "identity": process.env.APP_SIGNING_ID,
    //   "hardened-runtime": true,
    //   "entitlements": "entitlements.plist",
    //   "entitlements-inherit": "entitlements.plist",
    //   "signature-flags": "library"
    // },
    // "osxNotarize": {
    //   "appleId": process.env.NOTORIZE_APPLE_ID,
    //   "appleIdPassword": process.env.NOTORIZE_APPLE_PW,
    // }
  },
  // electronRebuildConfig: {},
  makers: [ {
    "name": "@electron-forge/maker-squirrel",
    "config": {
      "name": "oracle-electron-ts"
    }
  },
  {
    "name": "@electron-forge/maker-zip",
    "platforms": [
      "darwin",
      "linux"
    ]
  },
  {
    "name": "@electron-forge/maker-dmg",
    "config": {
      "iconSize": 128
    }
  },
  {
    "name": "@electron-forge/maker-deb",
    "config": {
      "options": {
        "name": "krystal-bull",
        "productName": "Krystal Bull",
        "icon": "assets/krystal_bull.png",
        "homepage": "https://suredbits.com",
        "maintainer": "Suredbits"
      }
    }
  }],
  publishers: [],
  plugins: [[
    "@electron-forge/plugin-webpack",
    {
      "mainConfig": "./webpack.main.config.js",
      "renderer": {
        "config": "./webpack.renderer.config.js",
        "entryPoints": [
          {
            "html": "./src/index.html",
            "js": "./src/renderer.ts",
            "name": "main_window",
            "preload": {
              "js": "./src/preload.ts"
            }
          }
        ]
      }
    }
  ]],
  // hooks: {},
  buildIdentifier: 'my-build'
}

// TODO : Windows platform modifications to config

// Add macos signing and notarization
if (process.env.APP_SIGNING_ID) {
  console.debug('Signing app. APP_SIGNING_ID:', process.env.APP_SIGNING_ID)
  CONFIG.packagerConfig.osxSign = {
    "identity": process.env.APP_SIGNING_ID,
    "hardened-runtime": true,
    "entitlements": "entitlements.plist",
    "entitlements-inherit": "entitlements.plist",
    "signature-flags": "library"
  }
}
if (process.env.NOTORIZE_APPLE_ID && process.env.NOTORIZE_APPLE_PW) {
  console.debug('Notarizing app. NOTORIZE_APPLE_ID:', process.env.NOTORIZE_APPLE_ID)
  CONFIG.packagerConfig.osxNotarize = {
    "appleId": process.env.NOTORIZE_APPLE_ID,
    "appleIdPassword": process.env.NOTORIZE_APPLE_PW,
  }
}

module.exports = CONFIG
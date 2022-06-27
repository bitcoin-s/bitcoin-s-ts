const os = require('os')

const p = os.platform() // 'darwin', 'linux', 'win32'
const DARWIN = 'darwin'
const LINUX = 'linux'
const WIN32 = 'win32'

// See https://stackoverflow.com/questions/69046910/electron-forge-securely-add-appleid-and-password

// const { utils: { fromBuildIdentifier } } = require('@electron-forge/core');

// module.exports = {
//   buildIdentifier: process.env.IS_BETA ? 'beta' : 'prod',
//   packagerConfig: {
//     appBundleId: fromBuildIdentifier({ beta: 'com.beta.app', prod: 'com.app' })
//   }
// }

// See https://github.com/electron/electron-notarize

// TODO : Set this from a flag
const appType = 'development' //, 'distribution'
const keychain = 'signing_temp.keychain' // keychain name, could pass in
const appBundleId = 'org.bitcoins.krystalbull'

function getIcon() {
  switch (p) {
    case 'darwin':
      return 'assets/krystal_bull.icns'
    case 'linux':
      return 'assets/krystal_bull.png'
    case 'win32':
      return 'assets/krystal_bull.ico'
    default:
      throw new Error(
        'forge.config.js error: your OS is not supported. Supported OS are: darwin, linux, win32',
      )
  }
}

const CONFIG = {
  packagerConfig: {
    "icon": getIcon(),
    "executableName": "oracle-electron-ts",
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
  // {
  //   "name": "@electron-forge/maker-dmg",
  //   "config": {
  //     "iconSize": 128
  //   }
  // },
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
  // buildIdentifier: 'my-build'
}

/** Platform specific config changes */

if (p === DARWIN) {
  // Add macos signing and notarization
  // See https://github.com/electron/osx-sign
  if (process.env.APP_SIGNING_ID) {
    console.debug('Signing app with APP_SIGNING_ID:', process.env.APP_SIGNING_ID)
    CONFIG.packagerConfig.osxSign = {
      "identity": process.env.APP_SIGNING_ID,
      "identityValidation": true,
      "keychain": keychain,
      "type": appType,
      "gatekeeper-assess": false,
      "hardened-runtime": true,
      // TODO : Need to address signing issues in https://osxapps-ssl.itunes.apple.com/itunes-assets/Enigma112/v4/f7/35/cb/f735cb93-f916-de7c-2d25-f63464888437/developer_log.json?accessKey=1656241094_3099320763189474635_sq%2F2q9mZhc0FWHrKyij7yu3n5Fh0xtY9mJwhvdrWAFMCLCIRDdzMW11yuvFoxik8NgbdKL0BDAwpcSRgxhpkx7YxCQJc%2F4DPoX2knxgn9FtrlIfmDM60uKiagsTR5EHVrVQXxlDcCePPntOieCv%2FaaIFVPP1C%2BPyZNE%2BD5XjJiU%3D
      "entitlements": "entitlements.plist",
      "entitlements-inherit": "entitlements.plist",
      "signature-flags": "library",
      // This is going to be a pain as versions change
      "binaries": [
        'Krystal Bull.app/Contents/Resources/app/.webpack/main/bin/bitcoin-s-oracle-server/lib/org.xerial.sqlite-jdbc-3.36.0.3.jar/org/sqlite/native/Mac/aarch64/libsqlitejdbc.jnilib',
        'Krystal Bull.app/Contents/Resources/app/.webpack/main/bin/bitcoin-s-oracle-server/lib/org.xerial.sqlite-jdbc-3.36.0.3.jar/org/sqlite/native/Mac/x86_64/libsqlitejdbc.jnilib'],
    }
  }
  // See https://github.com/electron/electron-notarize
  if (process.env.NOTORIZE_APPLE_ID && process.env.NOTORIZE_APPLE_PW && process.env.NOTORIZE_APPLE_TEAM) {
    console.debug('Notarizing app with NOTORIZE_APPLE_ID:', process.env.NOTORIZE_APPLE_ID, 'NOTORIZE_APPLE_TEAM:', process.env.NOTORIZE_APPLE_TEAM)
    CONFIG.packagerConfig.osxNotarize = {
      "appBundleId": appBundleId,
      "appleId": process.env.NOTORIZE_APPLE_ID,
      "appleIdPassword": process.env.NOTORIZE_APPLE_PW,
      "ascProvider": process.env.NOTORIZE_APPLE_TEAM,
      // May need to use keychain / keychainProfile https://github.com/electron/electron-notarize#safety-when-using-appleidpassword
      "keychain": keychain,
      "keychainProfile": process.env.NOTORIZE_APPLE_ID,
    }
  }
} else if (p === LINUX) {
  // Nothing to do here? May need to adjust icon
} else if (p === WIN32) {
  console.debug('TODO : update forge.config output for win32')
  CONFIG.packagerConfig.executableName = "Krystal Bull"
}

module.exports = CONFIG

import path from 'path'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'

import { app, BrowserWindow, dialog, shell } from 'electron'

// This allows TypeScript to pick up the magic constant that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// https://www.npmjs.com/package/es6-shim was useful to get compile to not complain about Promise being defined

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit()
}

// environment var JAVA_HOME is not making it to the application when double clicked to open on Mac
// When the internal application (Suredbits Wallet.app/Contents/MacOS/Suredbits Wallet) is double clicked, it is set
// User must configure .zprofile like
// export JAVA_HOME="/Users/username/Library/Caches/Coursier/jvm/openjdk@1.11.0-2/Contents/Home"
// launchctl setenv JAVA_HOME $JAVA_HOME
// See https://apple.stackexchange.com/questions/51677/how-to-set-path-for-finder-launched-applications
if (app.isPackaged) {
  if (!process.env['JAVA_HOME']) {
    console.error('JAVA_HOME is not set, starting appServer is going to fail')
    dialog.showErrorBox('An error occurred', `The JAVA_HOME environment variable must be set and exposed. Please see README for more information.`)
    app.quit()
  }
}

// disable Insecure Content-Security-Policy warning in console
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

/** Run Config */

const START_FILE_LOGGING = true
const START_APP_SERVER = true

/** Environment Specific Parameters */

// set to your local absolute path for log files
const pathRoot = '/Users/ivan/code/bitcoin-s-ts-w/wallet-electron-ts'

/** File logging */

// https://stackoverflow.com/questions/45485262/how-to-debug-electron-production-binaries
import fs from 'fs'
import util  from 'util'

const startFileLogging = (): void => {
  // use a fixed path, to ensure log shows outside Electron dist
  const logPath = `${pathRoot}/debug-${app.isPackaged ? 'prod' : 'dev' }.log`
  const logFile = fs.createWriteStream(logPath, { flags: 'w' })
  const logStdout = process.stdout

  console.log = function(...args) {
    // @ts-ignore
    logFile.write(util.format.apply(null, args) + '\n')
    // @ts-ignore
    logStdout.write(util.format.apply(null, args) + '\n')
  }
  console.debug = console.log
  console.error = console.log

  console.log('logger running')
}

if (START_FILE_LOGGING) startFileLogging()

console.debug('process.env:', process.env)

/** AppServer Thread */

let serverProcess: ChildProcessWithoutNullStreams = null
let expectedKill = false

const startAppServer = (): void => {
  console.debug('startAppServer')
  let platform = process.platform
  let p: string

  if (platform === 'win32') {
    serverProcess = spawn('cmd.exe', ['/c', 'bitcoin-s-server.bat'],
      {
        cwd: './bin/bitcoin-s-server/bin'
      })
  } else {
    // Needs chmod +x before being able to spawn
    p = path.join(__dirname, 'bin', 'bitcoin-s-server', 'bin', 'bitcoin-s-server')
    console.debug('spawn path: ' + p)
    serverProcess = spawn(p)
    // serverProcess = spawn('ls', ['-la'])
  }

  if (!serverProcess) {
    console.error('Unable to start appServer from ' + __dirname)
    app.quit()
    return
  }
  console.log('appServer PID: ' + serverProcess.pid)

  serverProcess.stdout.on('data', function (data) {
    process.stdout.write(data) // 'appServer: ' + data)
  })
  serverProcess.stderr.on('data', function (data) {
    process.stderr.write('appServer error: ' + data)
  })

  serverProcess.on('exit', code => {
    if (expectedKill) {
      return
    }

    serverProcess = null
    console.warn('serverProcess exit code: ' + code)

    // Cmd-Q code 130 is triggering this
    if (code !== 0) {
      console.error(`appServer stopped unexpectedly with code ${code}`);
      dialog.showErrorBox('An error occurred', `The appServer stopped unexpectedly with code ${code}, app will close. Path: ${p}`)
    }
    if (mainWindow !== null) {
      mainWindow.close()
    }
  });
}

const stopAppServer = (): void => {
  console.debug('stopAppServer')
  if (serverProcess) {
    serverProcess.stdout.destroy()
    serverProcess.stderr.destroy()
    serverProcess.kill('SIGINT')
  }
}

/** Proxy Thread */

// import * as Proxy from 'wallet-server-ui-proxy/server'

const startProxy = (): void => {
  console.debug('startProxy')
  // Loading using Typescript wallet-server-ui-proxy source
  // This will look for JSON config files at /.webpack instead of in /.webpack/main
  // Type checking does not find Promise etc and complains about it. es6-shim seems to help
  // but it's not clear why lib settings in tsconfig.json don't solve the issue themselves
  // import('wallet-server-ui-proxy/server').then((_: NodeModule) => {
  //   console.debug('wallet-server-ui-proxy loaded', _)
  // })

  // Works in debug and prod
  const proxy = require('wallet-server-ui-proxy-bundle')
}

const stopProxy = (): void => {
  console.debug('stopProxy')
  // Currently nothing to do
}

/** Browser Window */

let mainWindow: BrowserWindow = null

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 900,
    icon: path.join(__dirname, 'assets/icon.png'), // Linux app icon
    webPreferences: {
      nodeIntegration: true,
      // May want to use app.getAppPath() instead
      // preload: path.join(__dirname, 'preload.js'), // use a preload script
      // preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      // allowRunningInsecureContent: true,
      // webSecurity: false,
      // sandbox: false,
    }
  });

  // and load the index.html of the app.
  // mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.loadURL('http://localhost:3002')

  // Open the DevTools
  if (!app.isPackaged)
    mainWindow.webContents.openDevTools()

  mainWindow.on('close', function () {
    console.debug('close')
    clearLocalStorage()
  })
  mainWindow.on('closed', function () {
    console.debug('closed')
    mainWindow = null
  })

  // Open links in browser instead of new electron window
  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault()
    shell.openExternal(url)
  })
}

// Clear all old access token state - prevents complaints on next app startup
const clearLocalStorage = (): void => {
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript('localStorage.removeItem("access_token");')
    mainWindow.webContents.executeJavaScript('localStorage.removeItem("refresh_token");')
    mainWindow.webContents.executeJavaScript('localStorage.removeItem("expires_at");')
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (BrowserWindow.getAllWindows().length === 0) {
  //   createWindow();
  // }
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', () => {
  console.debug('before-quit')
})
app.on('will-quit', () => {
  console.debug('will-quit')
  stopProxy()
  stopAppServer()
})
app.on('quit', () => {
  console.debug('quit')
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

/** Start the backends */

if (START_APP_SERVER) startAppServer()
startProxy()

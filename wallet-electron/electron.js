import path from 'path'
import url from 'url'
import { spawn } from 'child_process'

import { app, BrowserWindow, session, dialog, globalShortcut } from 'electron'


const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
console.debug('__dirname:', __dirname)

/** Proxy Thread */

function startProxy() {
  import('wallet-server-ui-proxy/server').then(_ => {
    console.debug('wallet-server-ui-proxy loaded')
  })  
}

/* This process does work with ESM modules yet

let proxyProcess = null

function startProxy() {
  console.debug('startProxy')

  // proxyProcess = spawn('node', [
  //   '--loader', 'ts-node/esm', '--es-module-specifier-resolution=node',
  //   './bin/wallet-server-ui-proxy/server.js']) //, { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] })

  // This has to be .mjs to load ESM module and then all sub-modules also need .mjs extensions, which they don't currently have
  proxyProcess = fork('./bin/wallet-server-ui-proxy/server.js')

  if (!proxyProcess) {
    console.error('Unable to start proxy server from ' + __dirname) 
    app.quit()
    return
  }
  console.log('proxy server PID: ' + proxyProcess.pid)
  // createWindow()

  proxyProcess.stdout.on('data', function (data) {
    process.stdout.write(data) // 'proxy: ' + data)
  })
  proxyProcess.stderr.on('data', function (data) {
    process.stderr.write('proxy error: ' + data)
  })

  proxyProcess.on('exit', code => {
    // if (expectedKill) {
    //   return
    // }

    proxyProcess = null;
    console.warn('proxyProcess exit code: ' + code)

    if (code !== 0) {
      console.error(`proxy server stopped unexpectedly with code ${code}`);
      dialog.showErrorBox('An error occurred', 'The proxy server stopped unexpectedly, app will close.')
    }
    if (mainWindow !== null) {
      mainWindow.close()
    }
  });
}

function stopProxy() {
  console.debug('stopProxy')
  if (proxyProcess) {
    proxyProcess.stdout.destroy()
    proxyProcess.stderr.destroy()
    proxyProcess.kill('SIGINT')
  }
}
*/

/** AppServer Thread */

let serverProcess = null
let expectedKill = false

function startAppServer() {
  console.debug('startAppServer')
  let platform = process.platform

  if (platform === 'win32') {
    serverProcess = spawn('cmd.exe', ['/c', 'bitcoin-s-server.bat'],
      {
        cwd: './bin/bitcoin-s-server/bin'
      })
  } else {
    // Needs chmod +x before being able to spawn
    serverProcess = spawn(__dirname + '/bin/bitcoin-s-server/bin/bitcoin-s-server')
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
    // if (code !== 0) {
    //   console.error(`appServer stopped unexpectedly with code ${code}`);
    //   dialog.showErrorBox('An error occurred', 'The appServer stopped unexpectedly, app will close.')
    // }
    if (mainWindow !== null) {
      mainWindow.close()
    }
  });
}

function stopAppServer() {
  console.debug('stopAppServer')
  if (serverProcess) {
    serverProcess.stdout.destroy()
    serverProcess.stderr.destroy()
    serverProcess.kill('SIGINT')
  }
}

/** Browser Window */

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      // webSecurity: false,
      // allowRunningInsecureContent: true,
    }
  })

  // Open the DevTools automatically
  // mainWindow.webContents.openDevTools()

  mainWindow.loadURL('http://localhost:3002')

  mainWindow.on('close', function () {
    console.debug('close')
    // stopProxy()
    stopAppServer()

    // TODO : Clear UI access token
  })
  mainWindow.on('closed', function () {
    console.debug('closed')
    mainWindow = null
  })

  // This seems to get in the way of the default handler
  // Trying to get ride of Cmd-Q exit code 130 error on appServer
  // globalShortcut.register('Command+Q', () => {
  //   console.log('Command+Q')
  //   expectedKill = true
  // })
}

app.on('ready', function () {
  console.debug('ready')
  createWindow()
  // if (mainWindow === null) createWindow()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  console.debug('activate')
  // if (mainWindow === null) createWindow()
})

app.on('did-finish-load', function () {
  console.debug('did-finish-load')
})

app.on('did-fail-provisional-load', function () {
  console.debug('did-fail-provisional-load')
})

app.on('did-stop-loading', function () {
  console.debug('did-stop-loading')
})

app.on('certificate-error', function (event) {
  console.debug('certificate-error', event)
})

/** Start the backends */

startAppServer()
startProxy()

import fs from 'fs'
import http from 'http'
import https from 'https'
import os from 'os'
import path from 'path'

import express, { Request, Response } from 'express'
import fetch from 'node-fetch'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { SocksProxyAgent } from 'socks-proxy-agent'
import winston from 'winston'
const  { combine, timestamp, label, printf } = winston.format

import { BuildConfig } from './build-config'
import { ServerConfig } from './server-config'


const Config = <ServerConfig>require('./config.json')

// Setup logging
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`
})
const LOG_PATH = process.env.LOG_PATH || ''
const LOG_FILENAME = 'wallet-server-ui-proxy.log'
const logger = winston.createLogger({
  exitOnError: Config.stopOnError,
  level: 'info',
  format: combine(timestamp(), logFormat),
  transports: [
    new winston.transports.Console(), // Log to console
    new winston.transports.File({ filename: LOG_PATH + LOG_FILENAME }), // Log to file
  ],
})

logger.info('Starting wallet-server-ui-proxy')

let Build: BuildConfig
try {
  Build = <BuildConfig>require('./build.json')
} catch (err) {
  logger.error('did not find BuildConfig')
}

/** Error Handlers */

process.on('uncaughtException', error => {
  logger.error('uncaught error', error)
  if (Config.stopOnError) process.exit(1)
})

process.on('unhandledRejection', error => {
  logger.error('uncaught rejection', error)
  if (Config.stopOnError) process.exit(1)
})

/** bitcoin-s path handling */

function resolveHome(filepath: string) {
  if (filepath[0] === '~') {
    return path.join(os.homedir(), filepath.slice(1))
  }
  return filepath
}

const BACKUP_PATH = 'backup/' // inside .bitcoin-s/ , assumes backup/ exists, does not current create it

const bitcoinsHome = process.env.BITCOIN_S_HOME || resolveHome(Config.bitcoinsHome)
const backupPath = bitcoinsHome + BACKUP_PATH

/** State */

const UI_PATH = path.join(__dirname, Config.uiPath)
const proxyRoot = Config.proxyRoot
const walletServerUrl = process.env.WALLET_SERVER_API_URL || Config.walletServerUrl
const walletServerWs = process.env.WALLET_SERVER_WS || Config.walletServerWs
const oracleExplorerHost = Config.oracleExplorerHost // overriden by 'host-override' header
const blockstreamUrl = Config.blockstreamUrl
const mempoolUrl = process.env.MEMPOOL_API_URL || Config.mempoolUrl

logger.info('proxyRoot: ' + proxyRoot + ' walletServerEndpoint: ' + walletServerUrl
  + ' walletServerWs: ' + walletServerWs + ' oracleExplorerHost: ' + oracleExplorerHost
  + ' mempoolUrl: ' + mempoolUrl)

const app = express()

// Host oracle-server-ui
app.use(express.static(UI_PATH))

/** Heartbeat Routes */

app.get(`/heartbeat`, (req: Request, res: Response) => {
  res.json({ success: true })
})
app.get(`/walletHeartbeat`, async (req: Request, res: Response) => {
  let success = false
  // TODO : this can use wallet-ts now
  await fetch(walletServerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'getversion' }) 
  }).then(_ => {
    success = true
  }).catch(err => {
    // errno: 'ECONNREFUSED', code: 'ECONNREFUSED' for no wallet server present to talk to
    success = false
  })
  res.send({ success })
})
app.get('/buildConfig', (req: Request, res: Response) => {
  res.json(Build)
})
// Filesystem download
interface DownloadRequest {
  // path: string, // Currently absolute path
  filename: string
  // andDelete: boolean 
}
interface BodyRequest<T> extends Request {
  body: T
}
// Download generic file from filesystem via POST
// app.post('/download', express.json(), (req: BodyRequest<DownloadRequest>, res: Response) => {
//   const body = req.body
//   if (body.path && body.filename) {
//     // const fullPath = resolveHome(body.path + body.filename)
//     const fullPath = body.path + body.filename
//     try {
//       fs.accessSync(fullPath) // Will throw error if file does not exist

//       const readStream = fs.createReadStream(fullPath)
//       readStream.on('open', () => res.setHeader('Content-Type', 'application/zip; charset=utf-8'))
//       readStream.on('error', (err) => { console.error('readStream error', err) })
//       readStream.on('end', () => {
//         if (body.andDelete) {
//           fs.unlink(fullPath, function() {
//             logger.debug('deleted file', fullPath)
//           })
//         }
//       })
//       readStream.pipe(res)

//       // works for .get()
//       // res.download(body.path, function(err) {
//       //   if (err) {
//       //     console.error('error downloading', body.path, err)
//       //   }
//       //   if (body.andDelete) {
//       //     fs.unlink(body.path, function() {
//       //       console.warn('deleted file', body.path)
//       //     })
//       //   }
//       // })
//     } catch (err) {
//       logger.error('/download path is not valid', fullPath)
//       res.end() // Blob size 0 returned
//     }
//   } else {
//     logger.error('did not receive path or filename on /download')
//     res.end() // Blob size 0 returned
//   }
// })

// Make bitcoin-s state backup and return zip
import * as WalletServer from 'wallet-ts/lib/index'
app.post('/downloadBackup', express.json(), (req: BodyRequest<DownloadRequest>, res: Response) => {
  const r = req.body
  console.debug('/downloadBackup', r)

  if (r.filename) {
    const fullPath = backupPath + r.filename

    // Sanity check
    try {
      fs.accessSync(backupPath) // Will throw error if file does not exist
    } catch (err) {
      logger.error('/downloadBackup backupPath is not accessible', backupPath)
      res.end() // Blob size 0 returned
    }

    // Use wallet-ts to create backup
    WalletServer.ZipDataDir(fullPath).then(result => {
      console.debug(' ZipDataDir() complete', result)
      if (result.result === null) { // success case
        // Sanity check
        try {
          fs.accessSync(fullPath) // Will throw error if file does not exist
        } catch (err) {
          logger.error('/downloadBackup fullPath is not accessible', fullPath)
          res.end() // Blob size 0 returned
        }

        const readStream = fs.createReadStream(fullPath)
        readStream.on('open', () => res.setHeader('Content-Type', 'application/zip; charset=utf-8'))
        readStream.on('error', (err) => { logger.error('readStream error', err) })
        readStream.on('end', () => {
          // Always delete backup zip after sending
          fs.unlink(fullPath, function() {
            // Nothing to do
          })
        })
        readStream.pipe(res)
      } else {
        logger.error('ZipDataDir failed', result)
        res.end() // Blob size 0 returned
      }
    })
  } else {
    logger.error('/downloadBackup no filename specified', r)
    res.end() // Blob size 0 returned
  }
})

/** External Proxy Routes */

// Strip unnecessary header from requests through proxy
function removeFrontendHeaders(proxyReq: http.ClientRequest) {
  proxyReq.removeHeader('cookie')
  proxyReq.removeHeader('referer')
}

// Use the HOST_OVERRIDE_HEADER if present to set the Oracle Explorer host
const HOST_OVERRIDE_HEADER = 'host-override'
function hostRouter(req: http.IncomingMessage) {
  const host = req.headers[HOST_OVERRIDE_HEADER] || oracleExplorerHost
  return `https://${host}/v2`
}

const EXPLORER_PROXY_TIMEOUT = 10 * 1000; // 10 seconds
const BLOCKSTREAM_PROXY_TIMEOUT = 10 * 1000; // 10 seconds
const MEMPOOL_PROXY_TIMEOUT = 10 * 1000; // 10 seconds

const ECONNREFUSED = 'ECONNREFUSED'
const ECONNREFUSED_REGEX = /ECONNREFUSED/

const TOR_CONNECTION_REFUSED = 'tor connection refused'
const CONNECTION_REFRUSED_ERROR = 'connection refused'
const CONNECTION_ERROR = 'connection error' // generic error

function getProxyErrorHandler(name: string, agent?: SocksProxyAgent) {
  return (err: Error, req: Request, res: Response) => {
    if (err) {
      // console.error(err, res.statusCode, res.statusMessage)
      logger.error(`${name}`, { err, statusCode: res.statusCode, statusMessage: res.statusMessage })
      const connectionRefused = ECONNREFUSED_REGEX.test(err.message)
      if (connectionRefused) {
        if (agent) {
          res.writeHead(500, `${name} ${TOR_CONNECTION_REFUSED}`).end()
        } else {
          res.writeHead(500, `${name} ${CONNECTION_REFRUSED_ERROR}`).end()
        }
      } else {
        res.writeHead(500, `${name} ${CONNECTION_ERROR}`).end()
      }
    }
  }
}

// Proxy calls to this server on to Oracle Explorer
function createOracleExplorerProxy(agent?: SocksProxyAgent) {
  const root = (agent ? Config.torProxyRoot : '') + Config.oracleExplorerRoot
  app.use(root, createProxyMiddleware({
    // target: oracleExplorerUrl,
    agent,
    router: hostRouter, // Dynamic target
    changeOrigin: true,
    pathRewrite: {
      [`^${root}`]: '',
    },
    proxyTimeout: EXPLORER_PROXY_TIMEOUT,
    onProxyReq: (proxyReq: http.ClientRequest, req: http.IncomingMessage, res: http.ServerResponse, options/*: httpProxy.ServerOptions*/) => {
      if (!agent) { // this throws error with 'agent' set
        // Use HOST_OVERRIDE_HEADER value to set underlying oracle explorer proxyReq host header
        const host = req.headers[HOST_OVERRIDE_HEADER] || oracleExplorerHost
        proxyReq.setHeader('host', host)
        proxyReq.removeHeader(HOST_OVERRIDE_HEADER)
        // Remove unnecessary headers
        removeFrontendHeaders(proxyReq)
        res.removeHeader('x-powered-by') 
      }
      
      // console.debug('onProxyReq() req headers:', req.headers)
      // console.debug('onProxyReq() proxyReq headers:', proxyReq.getHeaders())
      // console.debug('onProxyReq() res headers:', res.getHeaders())
    },
    onError: getProxyErrorHandler('oracleExplorer', agent),
  }))
}

// Proxy calls to this server to Blockstream API
function createBlockstreamProxy(agent?: SocksProxyAgent | null) {
  const root = (agent ? Config.torProxyRoot : '') + Config.blockstreamRoot
  app.use(root, createProxyMiddleware({
    agent,
    target: blockstreamUrl,
    changeOrigin: true,
    pathRewrite: {
      [`^${root}`]: '',
    },
    proxyTimeout: BLOCKSTREAM_PROXY_TIMEOUT,
    onProxyReq: (proxyReq: http.ClientRequest, req: http.IncomingMessage, res: http.ServerResponse, options/*: httpProxy.ServerOptions*/) => {
      if (!agent) { // this throws error with 'agent' set
        removeFrontendHeaders(proxyReq)
      }

      // console.debug('onProxyReq() req headers:', req.headers)
      // console.debug('onProxyReq() proxyReq headers:', proxyReq.getHeaders())
      // console.debug('onProxyReq() res headers:', res.getHeaders())
    },
    onError: getProxyErrorHandler('blockstream', agent),
  }))
}

// Proxy calls to this server to Mempool API
function createMempoolProxy(agent?: SocksProxyAgent | null) {
  const root = (agent ? Config.torProxyRoot : '') + Config.mempoolRoot
  app.use(root, createProxyMiddleware({
    agent,
    target: mempoolUrl,
    changeOrigin: true,
    pathRewrite: {
      [`^${root}`]: '',
    },
    proxyTimeout: MEMPOOL_PROXY_TIMEOUT,
    onProxyReq: (proxyReq: http.ClientRequest, req: http.IncomingMessage, res: http.ServerResponse, options/*: httpProxy.ServerOptions*/) => {
      if (!agent) { // this throws error with 'agent' set
        removeFrontendHeaders(proxyReq)
      }

      // console.debug('onProxyReq() req headers:', req.headers)
      // console.debug('onProxyReq() proxyReq headers:', proxyReq.getHeaders())
      // console.debug('onProxyReq() res headers:', res.getHeaders())
    },
    onError: getProxyErrorHandler('mempool', agent),
  }))
}

function createProxies(agent?: SocksProxyAgent) {
  createOracleExplorerProxy(agent)
  createBlockstreamProxy(agent)
  createMempoolProxy(agent)
}

createProxies()

const DEFAULT_TOR_PROXY = Config.torProxyUrl
const USE_TOR_PROXY = !!process.env.TOR_PROXY || !!DEFAULT_TOR_PROXY
if (USE_TOR_PROXY) {
  const torProxyUrl = process.env.TOR_PROXY || DEFAULT_TOR_PROXY
  const agent = new SocksProxyAgent(torProxyUrl)
  createProxies(agent)
}

/** Server Proxy */

// Proxy calls to this server to appServer/run or bundle/run instance
const PROXY_TIMEOUT = 300 * 1000; // 300 seconds, upped for AcceptDLC. 3 point numeric contract takes around 23 seconds on MBP
app.use(Config.apiRoot, createProxyMiddleware({
  target: walletServerUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${Config.apiRoot}`]: '',
  },
  proxyTimeout: PROXY_TIMEOUT,
  onError: (err: Error, req: Request, res: Response) => {
    // Handle server is unavailable
    if (err && (<any>err).code === ECONNREFUSED) {
      res.writeHead(500, 'appServer connection refused').end()
    } else {
      logger.error('onError', err, res.statusCode, res.statusMessage)
    }
  }
}))

// Proxy websocket calls to this server to appServer/run or bundle/run instance
const WS_PROXY_TIMEOUT = 300 * 1000; // 300 seconds, upped for AcceptDLC. 3 point numeric contract takes around 23 seconds on MBP
const wsProxy =  createProxyMiddleware({
  target: walletServerWs,
  ws: true,
  changeOrigin: true, // doesn't seem to matter locally
  pathRewrite: {
    [`^${Config.wsRoot}`]: '',
  },
  proxyTimeout: WS_PROXY_TIMEOUT,
  // onOpen: () => {
  //   console.debug('onOpen()')
  // },
  // onProxyReqWs: () => {
  //   console.debug('onProxyReqWs()')
  // },
  // onProxyReq: (proxyReq: http.ClientRequest, req: http.IncomingMessage, res: http.ServerResponse, options/*: httpProxy.ServerOptions*/) => {
  //   console.debug('onProxyReq() ws')
  // },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error('websocket onError', err, res.statusCode, res.statusMessage)
    // (<any>err).code === ECONNRESET
    // [2021-12-17T15:43:20.234Z error: websocket onError read ECONNRESET
    // [HPM] Error occurred while proxying request localhost:4200 to undefined [ECONNRESET] (https://nodejs.org/api/errors.html#errors_common_system_errors)
  }
})
app.use(Config.wsRoot, wsProxy)

/** Server Instance */

let server
if (Config.useHTTPS) {
  logger.info('starting HTTPS server with certs')
  const options = {
    key: fs.readFileSync('config/keys/key.pem'),
    cert: fs.readFileSync('config/keys/cert.pem'),
  }
  server = https.createServer(options, app)
} else {
  logger.info('starting HTTP server')
  server = http.createServer(app)
}

server.listen(Config.port, async () => {
  logger.info(`Web Server started on port: ${Config.port} ⚡`)
})

// Required to get websocket proxying online
// https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/websocket.md
server.on('upgrade', wsProxy.upgrade)

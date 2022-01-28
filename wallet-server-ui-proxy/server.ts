import fs from 'fs'
import http from 'http'
import https from 'https'

import express, { Request, Response } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

import * as CommonServer from 'common-ts/lib/index'

import { RunConfig } from './type/run-config'


/** State */

const Config = <RunConfig>require('./type/run-config')

/** Logging */

const logger = require('./middleware/logger')
logger.info('Starting wallet-server-ui-proxy')
Config.show(logger)

/** Error Handling  */

require('./middleware/error').setErrorHandlers()

/** Configure common-ts, wallet-ts */

CommonServer.ConfigureServerURL(Config.walletServerUrl)
CommonServer.ConfigureAuthorizationHeader(Config.serverAuthHeader)

/** Application */

const app = express()

// Host oracle-server-ui
app.use(express.static(Config.uiDirectory))

// Host all proxy routes
app.use(Config.proxyRoot, require('./routes/index'))

/** Authenticated Server Proxy Routes */

const verifyAuth = require('./middleware/auth').verify

// Proxy calls to this server to appServer/run or bundle/run instance
const PROXY_TIMEOUT = 300 * 1000; // 300 seconds, upped for AcceptDLC. 3 point numeric contract takes around 23 seconds on MBP
const ECONNREFUSED = 'ECONNREFUSED'
app.use(Config.apiRoot, verifyAuth, createProxyMiddleware({
  target: Config.walletServerUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${Config.apiRoot}`]: '',
  },
  // auth: `${Config.serverUser}:${Config.serverPassword}`, // Does not work to get auth set against backend
  proxyTimeout: PROXY_TIMEOUT,
  onProxyReq: (proxyReq: http.ClientRequest, req: http.IncomingMessage, res: http.ServerResponse, options/*: httpProxy.ServerOptions*/) => {
    // console.debug('onProxyReq() ws')
    // If we have a user and password set, add a Basic auth header for them
    // Backend server will ignore if it does not currently have a password set
    if (Config.serverUser && Config.serverPassword) {
      proxyReq.setHeader('Authorization', Config.serverAuthHeader)
    }
  },
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
const wsProxy = createProxyMiddleware({
  target: Config.walletServerWs,
  ws: true,
  changeOrigin: true, // doesn't seem to matter locally
  pathRewrite: {
    [`^${Config.wsRoot}`]: '',
  },
  proxyTimeout: WS_PROXY_TIMEOUT,
  auth: `${Config.serverUser}:${Config.serverPassword}`,
  // onOpen: () => {
  //   console.debug('onOpen()')
  // },
  // onProxyReqWs: () => {
  //   console.debug('onProxyReqWs()')
  // },
  // Currently setting login info at UI
  // onProxyReq: (proxyReq: http.ClientRequest, req: http.IncomingMessage, res: http.ServerResponse, options/*: httpProxy.ServerOptions*/) => {
  //   console.debug('onProxyReq() ws', proxyReq.getHeader('Authorization'))
  //   // If we have a user and password set, add a Basic auth header for them
  //   // Backend server will ignore if it does not currently have a password set
  //   if (Config.serverUser && Config.serverPassword) {
  //     proxyReq.setHeader('Authorization', Config.serverAuthHeader)
  //   }
  // },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error('websocket onError', err, res.statusCode, res.statusMessage)
    // (<any>err).code === ECONNRESET
    // [2021-12-17T15:43:20.234Z error: websocket onError read ECONNRESET
    // [HPM] Error occurred while proxying request localhost:4200 to undefined [ECONNRESET] (https://nodejs.org/api/errors.html#errors_common_system_errors)
  }
})
// Using verifyAuth here works without actual auth set on local, but not on Docker
app.use(Config.wsRoot, verifyAuth, wsProxy)

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

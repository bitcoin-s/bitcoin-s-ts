import fs from 'fs'
import http from 'http'
import https from 'https'

import express, { Request, Response } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { SocksProxyAgent } from 'socks-proxy-agent'

import * as CommonServer from 'common-ts/lib/index'

import { RunConfig } from './type/run-config'


/** State */

const Config = <RunConfig>require('./type/run-config')

/** Logging */

const logger = require('./middleware/logger')
logger.info('Starting wallet-server-ui-proxy')
Config.show(logger) // TODO : Why is this not working?

/** Error Handling  */

require('./middleware/error').setErrorHandlers()

/** Configure common-ts, oracle-server-ts */

CommonServer.ConfigureServerURL(Config.oracleServerUrl)
CommonServer.ConfigureAuthorizationHeader(Config.serverAuthHeader)

/** Application */

const app = express()

// Host oracle-server-ui
app.use(express.static(Config.uiDirectory))

// Host all proxy routes
app.use(Config.proxyRoot, require('./routes/index'))

const EXPLORER_PROXY_TIMEOUT = 10 * 1000 // 10 seconds
const BLOCKSTREAM_PROXY_TIMEOUT = 10 * 1000 // 10 seconds
const MEMPOOL_PROXY_TIMEOUT = 10 * 1000 // 10 seconds

const removeFrontendHeaders = require('./middleware/proxy').removeFrontendHeaders
const getProxyErrorHandler = require('./middleware/proxy').getProxyErrorHandler
const hostRouter = require('./middleware/proxy').hostRouter

// Use the HOST_OVERRIDE_HEADER if present to set the Oracle Explorer host
const HOST_OVERRIDE_HEADER = 'host-override'
const ECONNREFUSED = 'ECONNREFUSED'

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
        const host = req.headers[HOST_OVERRIDE_HEADER] || Config.oracleExplorerHost
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
    target: Config.blockstreamUrl,
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
    target: Config.mempoolUrl,
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

/** Authenticated Oracle Server Proxy Routes */

const verifyAuth = require('./middleware/auth').verify

// Proxy calls to this server to oracleServer/run instance
const PROXY_TIMEOUT = 10 * 1000; // 10 seconds
app.use(Config.apiRoot, verifyAuth, createProxyMiddleware({
  target: Config.oracleServerUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${Config.apiRoot}`]: '',
  },
  proxyTimeout: PROXY_TIMEOUT,
  onProxyReq: (proxyReq: http.ClientRequest, req: http.IncomingMessage, res: http.ServerResponse, options/*: httpProxy.ServerOptions*/) => {
    // console.debug('onProxyReq() ws')
    // If we have a user and password set, add a Basic auth header for them
    // Backend server will ignore if it does not currently have a password set
    if (Config.serverUser && Config.serverPassword) {
      proxyReq.setHeader('Authorization', 
        'Basic ' + Buffer.from(Config.serverUser + ':' + Config.serverPassword).toString('base64'))
    }
  },
  onError: (err: Error, req: Request, res: Response) => {
    // Handle oracleServer is unavailable
    if (err && (<any>err).code === ECONNREFUSED) {
      res.writeHead(500, 'oracleServer connection refused').end()
    } else {
      logger.error('onError', err, res.statusCode, res.statusMessage)
    }
  }
}))

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

import fs from 'fs'
import http from 'http'
import https from 'https'

import express, { Request, Response } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

// CJS import. This doesn't allow typing things properly, but seems to work
import { default as createSocksProxyAgent } from 'socks-proxy-agent'
const SocksProxyAgent = createSocksProxyAgent.SocksProxyAgent

import * as CommonServer from 'common-ts/index'

/** State */

import { Config } from './config/run-config'

/** Logging */

import { Logger } from './middleware/logger'
Logger.info('Starting wallet-server-ui-proxy ' + Config.getState())

/** Error Handling  */

import { setErrorHandlers } from './middleware/error'
setErrorHandlers()

/** Configure common-ts, oracle-server-ts */

CommonServer.ConfigureServerURL(Config.oracleServerUrl)
CommonServer.ConfigureAuthorizationHeader(Config.serverAuthHeader)

/** Application */

const app = express()

// Host oracle-server-ui
app.use(express.static(Config.uiDirectory))

// Host all proxy routes
import { router } from './routes/index'
app.use(Config.proxyRoot, router)

const EXPLORER_PROXY_TIMEOUT = 10 * 1000 // 10 seconds
const BLOCKSTREAM_PROXY_TIMEOUT = 10 * 1000 // 10 seconds
const MEMPOOL_PROXY_TIMEOUT = 10 * 1000 // 10 seconds

import * as proxy from './middleware/proxy'

// Use the HOST_OVERRIDE_HEADER if present to set the Oracle Explorer host
const HOST_OVERRIDE_HEADER = 'host-override'
const ECONNREFUSED = 'ECONNREFUSED'

// Proxy calls to this server on to Oracle Explorer
function createOracleExplorerProxy(agent?: any /* SocksProxyAgent */) {
  const root = (agent ? Config.torProxyRoot : '') + Config.oracleExplorerRoot
  app.use(root, createProxyMiddleware({
    // target: oracleExplorerUrl,
    agent,
    router: proxy.hostRouter, // Dynamic target
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
        proxy.removeFrontendHeaders(proxyReq)
        res.removeHeader('x-powered-by')
      }
      
      // console.debug('onProxyReq() req headers:', req.headers)
      // console.debug('onProxyReq() proxyReq headers:', proxyReq.getHeaders())
      // console.debug('onProxyReq() res headers:', res.getHeaders())
    },
    onError: proxy.getProxyErrorHandler('oracleExplorer', agent),
  }))
}

// Proxy calls to this server to Blockstream API
function createBlockstreamProxy(agent?: any /* SocksProxyAgent */) {
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
        proxy.removeFrontendHeaders(proxyReq)
      }

      // console.debug('onProxyReq() req headers:', req.headers)
      // console.debug('onProxyReq() proxyReq headers:', proxyReq.getHeaders())
      // console.debug('onProxyReq() res headers:', res.getHeaders())
    },
    onError: proxy.getProxyErrorHandler('blockstream', agent),
  }))
}

// Proxy calls to this server to Mempool API
function createMempoolProxy(agent?: any /* SocksProxyAgent */) {
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
        proxy.removeFrontendHeaders(proxyReq)
      }

      // console.debug('onProxyReq() req headers:', req.headers)
      // console.debug('onProxyReq() proxyReq headers:', proxyReq.getHeaders())
      // console.debug('onProxyReq() res headers:', res.getHeaders())
    },
    onError: proxy.getProxyErrorHandler('mempool', agent),
  }))
}

function createProxies(agent?: any /* SocksProxyAgent */) {
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

import { verify as verifyAuth } from './middleware/auth'

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
      Logger.error('onError', err, res.statusCode, res.statusMessage)
    }
  }
}))

/** Server Instance */

let server
if (Config.useHTTPS) {
  Logger.info('starting HTTPS server with certs')
  const options = {
    key: fs.readFileSync('config/keys/key.pem'),
    cert: fs.readFileSync('config/keys/cert.pem'),
  }
  server = https.createServer(options, app)
} else {
  Logger.info('starting HTTP server')
  server = http.createServer(app)
}

server.listen(Config.port, async () => {
  Logger.info(`Web Server started on port: ${Config.port} ⚡`)
})

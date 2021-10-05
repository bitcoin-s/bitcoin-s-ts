import fs from 'fs'
import http from 'http'
import https from 'https'
import path from 'path'

import express, { Request, Response } from 'express'
import fetch from 'node-fetch'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { SocksProxyAgent } from 'socks-proxy-agent'

import { BuildConfig } from './build-config'
import { ServerConfig } from './server-config'


console.debug(new Date().toISOString(), 'Starting oracle-server-ui-proxy')

const Config = <ServerConfig>require('./config.json')
let Build: BuildConfig
try {
  Build = <BuildConfig>require('./build.json')
} catch (err) {
  console.error('did not find BuildConfig')
}

/** Error Handlers */

process.on('uncaughtException', error => {
  console.error(new Date().toISOString(), 'uncaught error', error)
  if (Config.stopOnError) process.exit(1)
})

process.on('unhandledRejection', error => {
  console.error(new Date().toISOString(), 'uncaught rejection', error)
  if (Config.stopOnError) process.exit(1)
})

const UI_PATH = path.join(__dirname, Config.uiPath)
const proxyRoot = Config.proxyRoot
const oracleServerUrl = process.env.ORACLE_SERVER_API_URL || Config.oracleServerUrl
const oracleExplorerHost = Config.oracleExplorerHost // overriden by 'host-override' header
const blockstreamUrl = Config.blockstreamUrl
const mempoolUrl = process.env.MEMPOOL_API_URL || Config.mempoolUrl

console.debug('proxyRoot:', proxyRoot, 'oracleServerEndpoint:', oracleServerUrl, 'oracleExplorerHost:', oracleExplorerHost, 'mempoolUrl:', mempoolUrl)

const app = express()

// Host oracle-server-ui
app.use(express.static(UI_PATH))

/** Heartbeat Routes */

app.get(`/heartbeat`, (req: Request, res: Response) => {
  res.json({ sucess: true })
})
app.get(`/oracleHeartbeat`, async (req: Request, res: Response) => {
  let success = false
  await fetch(oracleServerUrl, {
    method: 'POST',
    body: JSON.stringify({ method: 'getpublickey' })
  }).then(_ => {
    success = true
  }).catch(err => {
    // errno: 'ECONNREFUSED', code: 'ECONNREFUSED' for no oracle present to talk to
    success = false
  })
  res.send({ success })
})
app.get('/buildConfig', (req: Request, res: Response) => {
  res.json(Build)
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
  return `https://${host}/v1`
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
    console.error(new Date().toISOString(), `${name} onError`)
    if (err) {
      console.error(err, res.statusCode, res.statusMessage)
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

/** Oracle Server Proxy */

// Proxy calls to this server to oracleServer/run instance
const PROXY_TIMEOUT = 10 * 1000; // 10 seconds
app.use(Config.apiRoot, createProxyMiddleware({
  target: oracleServerUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${Config.apiRoot}`]: '',
  },
  proxyTimeout: PROXY_TIMEOUT,
  onError: (err: Error, req: Request, res: Response) => {
    // Handle oracleServer is unavailable
    if (err && (<any>err).code === ECONNREFUSED) {
      res.writeHead(500, 'oracleServer connection refused').end()
    } else {
      console.error(new Date().toISOString(), 'onError', err, res.statusCode, res.statusMessage)
    }
  }
}))

/** Server Instance */

let server
if (Config.useHTTPS) {
  console.debug(new Date().toISOString(), 'starting HTTPS server with certs')
  const options = {
    key: fs.readFileSync('config/keys/key.pem'),
    cert: fs.readFileSync('config/keys/cert.pem'),
  }
  server = https.createServer(options, app)
} else {
  console.debug(new Date().toISOString(), 'starting HTTP server')
  server = http.createServer(app)
}

server.listen(Config.port, async () => {
  console.debug(new Date().toISOString(), `Web Server started on port: ${Config.port} ⚡`)
})

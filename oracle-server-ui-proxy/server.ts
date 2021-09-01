import fs from 'fs'
import http from 'http'
import https from 'https'
import path from 'path'

import express, { Request, Response } from 'express'
import fetch from 'node-fetch'
import { createProxyMiddleware } from 'http-proxy-middleware'

import { ServerConfig } from './server-config'


console.debug(new Date().toISOString(), 'Starting oracle-server-ui-proxy')

const Config = <ServerConfig>require('./config.json')

process.on('uncaughtException', error => {
	console.error(new Date().toISOString(), 'uncaught error', error)
	if (Config.stopOnError) process.exit(1)
})

process.on('unhandledRejection', error => {
	console.error(new Date().toISOString(), 'uncaught rejection', error)
	if (Config.stopOnError) process.exit(1)
})

const app = express()

// Host UI
const UI_PATH = path.join(__dirname, Config.uiPath)
app.use(express.static(UI_PATH))

// Heartbeat Routes

app.get('/heartbeat', (req: Request, res: Response) => {
	res.json({ sucess: true })
})

app.get('/oracleHeartbeat', async (req: Request, res: Response) => {
	let success = false
	await fetch(Config.oracleUrl, {
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

// Proxy calls to this server to oracleServer/run instance
const PROXY_TIMEOUT = 10 * 1000; // 10 seconds
app.use(Config.apiRoot, createProxyMiddleware({
  target: Config.oracleUrl,
  changeOrigin: true,
  pathRewrite: {
		[`^${Config.apiRoot}`]: '',
  },
	proxyTimeout: PROXY_TIMEOUT,
	onError: (err: Error, req: Request, res: Response) => {
		// Handle oracleServer is unavailable
		if (err && (<any>err).code === 'ECONNREFUSED') {
			res.writeHead(500, 'oracleServer connection refused').end()
		} else {
			console.error(new Date().toISOString(), 'onError', err, res.statusCode, res.statusMessage)
		}
	}
}));

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

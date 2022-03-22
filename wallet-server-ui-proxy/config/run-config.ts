import module from 'module'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import { ServerConfig } from 'common-ts/config/server-config'
import { resolveHome } from 'common-ts/util/fs-util'


const _require = module.createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

const config = <ServerConfig>_require('../config.json')
config.rootDirectory = path.resolve(__dirname, '..')
const LOG_FILENAME = 'wallet-server-ui-proxy.log'


export class RunConfig {

  private c: ServerConfig
  
  constructor(serverConfig: ServerConfig) {
    this.c = serverConfig
  }

  // private static instance: RunConfig
  // static getInstance(serverConfig?: ServerConfig) {
  //   if (!RunConfig.instance) {
  //     RunConfig.instance = new RunConfig(<ServerConfig>serverConfig)
  //   }
  //   return RunConfig.instance
  // }

  // server
  get stopOnError() { return this.c.stopOnError }
  get port() { return this.c.port }
  get useHTTPS() { return this.c.useHTTPS }
  // auth
  get serverUser() { return this.c.serverUser }
  get serverPassword() { return process.env.BITCOIN_S_SERVER_RPC_PASSWORD || this.c.serverPassword }
  get serverAuthHeader() { return 'Basic ' + Buffer.from(this.serverUser + ':' + this.serverPassword).toString('base64') }
  get uiPassword() { return process.env.DEFAULT_UI_PASSWORD || this.c.uiPassword }
  // fs
  get rootDirectory() { return this.c.rootDirectory }
  get uiDirectory() { return path.resolve(this.c.uiPath) }
  get bitcoinsDirectory() {
    if (process.env.BITCOIN_S_HOME) return path.resolve(process.env.BITCOIN_S_HOME)
    return resolveHome(this.c.bitcoinsPath)
  }
  get logFilepath() {
    const basePath = process.env.LOG_PATH || this.rootDirectory
    return path.join(basePath, LOG_FILENAME)
  }
  // routes
  get apiRoot() { return this.c.apiRoot }
  get wsRoot() { return this.c.wsRoot }
  get proxyRoot() { return this.c.proxyRoot }
  // appServer
  get walletServerUrl() { return process.env.WALLET_SERVER_API_URL || this.c.walletServerUrl }
  get walletServerWs() { return process.env.WALLET_SERVER_WS || this.c.walletServerWs }
  // proxy
  // get oracleExplorerHost() { return Config.oracleExplorerHost } // get overriden by 'host-override' header
  // get blockstreamUrl() { return Config.blockstreamUrl }
  // get mempoolUrl() { return process.env.MEMPOOL_API_URL || Config.mempoolUrl }
  // get torProxyRoot() { return Config.torProxyRoot }
  // ui data
  get mempoolUrl() { return process.env.MEMPOOL_API_URL || this.c.mempoolUrl } // BAD env var value incoming, should be updated
  getState() {
    return `Config:
stopOnError: ${this.stopOnError}
port: ${this.port}
useHTTPS: ${this.useHTTPS}
rootDirectory: ${this.rootDirectory}
uiDirectory: ${this.uiDirectory}
bitcoinsDirectory: ${this.bitcoinsDirectory}
logFilename: ${this.logFilepath}
serverUser: ${this.serverUser}
apiRoot: ${this.apiRoot}
wsRoot: ${this.wsRoot}
proxyRoot: ${this.proxyRoot}
walletServerUrl: ${this.walletServerUrl}
walletServerWs: ${this.walletServerWs}
mempoolUrl: ${this.mempoolUrl}
`
// serverPassword: ${this.serverPassword}
// uiPassword: ${this.uiPassword}
  }
}

export const Config = new RunConfig(config)

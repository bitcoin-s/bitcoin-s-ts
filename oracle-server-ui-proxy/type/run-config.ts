import path from 'path'

import { resolveHome } from 'common-ts/lib/util/fs-util'

import { ServerConfig } from './server-config'


const Config = <ServerConfig>require('../config.json')

const LOG_FILENAME = 'oracle-server-ui-proxy.log'

export class RunConfig {
  // server
  get stopOnError() { return Config.stopOnError }
  get port() { return Config.port }
  get useHTTPS() { return Config.useHTTPS }
  // auth
  get serverUser() { return Config.serverUser }
  get serverPassword() { return process.env.BITCOIN_S_ORACLE_RPC_PASSWORD || Config.serverPassword }
  get serverAuthHeader() { return 'Basic ' + Buffer.from(this.serverUser + ':' + this.serverPassword).toString('base64') }
  get uiPassword() { return process.env.DEFAULT_UI_PASSWORD || Config.uiPassword }
  // fs
  private _rootDirectory // must be set after initialization
  get rootDirectory() { return this._rootDirectory }
  set rootDirectory(directory: string) { this._rootDirectory = path.resolve(directory) }
  get uiDirectory() { return Config.uiPath }
  get bitcoinsDirectory() {
    if (process.env.BACKUP_PATH) return path.resolve(process.env.BACKUP_PATH) // TODO : Change env var to BITCOIN_S_PATH
    return resolveHome(Config.bitcoinsPath)
  }
  get logFilepath() {
    const basePath = process.env.LOG_PATH || this.rootDirectory
    return path.join(basePath, LOG_FILENAME)
  }
  // routes
  get apiRoot() { return Config.apiRoot }
  // get wsRoot() { return Config.wsRoot }
  get proxyRoot() { return Config.proxyRoot }
  get oracleExplorerRoot() { return Config.oracleExplorerRoot }
  // appServer
  get oracleServerUrl() { return process.env.ORACLE_SERVER_API_URL || Config.oracleServerUrl }
  // get walletServerWs() { return process.env.WALLET_SERVER_WS || Config.walletServerWs }
  // proxy
  get oracleExplorerHost() { return Config.oracleExplorerHost } // overriden by 'host-override' header
  get blockstreamRoot() { return Config.blockstreamRoot }
  get blockstreamUrl() { return Config.blockstreamUrl }
  get mempoolRoot() { return Config.mempoolRoot }
  get mempoolUrl() { return process.env.MEMPOOL_API_URL || Config.mempoolUrl }
  get torProxyRoot() { return Config.torProxyRoot }
  get torProxyUrl() { return Config.torProxyUrl }
  // ui data
  // get mempoolUrl() { return process.env.MEMPOOL_API_URL || Config.mempoolUrl } // BAD env var value incoming, should be updated
  show(logger) {
    logger.info(`Config:
stopOnError: ${this.stopOnError}
port: ${this.port}
useHTTPS: ${this.useHTTPS}
rootDirectory: ${this.rootDirectory}
uiDirectory: ${this.uiDirectory}
bitcoinsDirectory: ${this.bitcoinsDirectory}
logFilename: ${this.logFilepath}
serverUser: ${this.serverUser}
apiRoot: ${this.apiRoot}
proxyRoot: ${this.proxyRoot}
oracleExplorerRoot: ${this.oracleExplorerRoot}
oracleServerUrl: ${this.oracleServerUrl}
oracleExplorerHost: ${this.oracleExplorerHost}
blockstreamRoot: ${this.blockstreamRoot}
blockstreamUrl: ${this.blockstreamUrl}
mempoolRoot: ${this.mempoolRoot}
mempoolUrl: ${this.mempoolUrl}
torProxyRoot: ${this.torProxyRoot}
torProxyUrl: ${this.torProxyUrl}
`)
// serverPassword: ${this.serverPassword}
// uiPassword: ${this.uiPassword}
  }
}

const instance = new RunConfig()

module.exports = instance

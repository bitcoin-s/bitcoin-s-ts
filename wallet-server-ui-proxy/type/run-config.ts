import path from 'path'

import { ServerConfig } from './server-config'


const Config = <ServerConfig>require('../config.json')

const LOG_PATH = process.env.LOG_PATH || ''
const LOG_FILENAME = 'wallet-server-ui-proxy.log'
const LOG_FILEPATH = LOG_PATH + LOG_FILENAME // path.join(LOG_PATH, LOG_FILENAME)

export class RunConfig {
  // constructor(private rootDir: string) {}
  // server
  get stopOnError() { return Config.stopOnError }
  get port() { return Config.port }
  get useHTTPS() { return Config.useHTTPS }
  // auth
  get serverUser() { return Config.serverUser }
  get serverPassword() { return process.env.BITCOIN_S_SERVER_RPC_PASSWORD || Config.serverPassword }
  get serverAuthHeader() { return 'Basic ' + Buffer.from(this.serverUser + ':' + this.serverPassword).toString('base64') }
  get uiPassword() { return process.env.DEFAULT_UI_PASSWORD || Config.uiPassword }
  // fs
  get rootDirectory() { return '' } // everything on relative path, could run on absolute // { return this.rootDir }
  get uiDirectory() { return Config.uiPath } // return path.join(this.rootDirectory, Config.uiPath) }
  get backupDirectory() {
    if (process.env.BACKUP_PATH) return path.resolve(process.env.BACKUP_PATH)
    return path.resolve(this.rootDirectory)
  }
  get logFilepath() { return LOG_FILEPATH }
  // routes
  get apiRoot() { return Config.apiRoot }
  get wsRoot() { return Config.wsRoot }
  get proxyRoot() { return Config.proxyRoot }
  // appServer
  get walletServerUrl() { return process.env.WALLET_SERVER_API_URL || Config.walletServerUrl }
  get walletServerWs() { return process.env.WALLET_SERVER_WS || Config.walletServerWs }
  // proxy
  // get oracleExplorerHost() { return Config.oracleExplorerHost } // get overriden by 'host-override' header
  // get blockstreamUrl() { return Config.blockstreamUrl }
  // get mempoolUrl() { return process.env.MEMPOOL_API_URL || Config.mempoolUrl }
  // get torProxyRoot() { return Config.torProxyRoot }
  // ui data
  get mempoolUrl() { return process.env.MEMPOOL_API_URL || Config.mempoolUrl } // BAD env var value incoming, should be updated
  show(logger) {
    logger.info(`Config:
stopOnError: ${this.stopOnError}
port: ${this.port}
useHTTPS: ${this.useHTTPS}
rootDirectory: ${this.rootDirectory}
uiDirectory: ${this.uiDirectory}
backupDirectory: ${this.backupDirectory}
logFilename: ${this.logFilepath}
serverUser: ${this.serverUser}
apiRoot: ${this.apiRoot}
wsRoot: ${this.wsRoot}
proxyRoot: ${this.proxyRoot}
walletServerUrl: ${this.walletServerUrl}
walletServerWs: ${this.walletServerWs}
mempoolUrl: ${this.mempoolUrl}
`)
// serverPassword: ${this.serverPassword}
// uiPassword: ${this.uiPassword}
  }
}

const instance = new RunConfig()

module.exports = instance

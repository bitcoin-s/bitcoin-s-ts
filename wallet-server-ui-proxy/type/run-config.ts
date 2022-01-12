import path from 'path'

import { ServerConfig } from './server-config'


const Config = <ServerConfig>require('../config.json')

const LOG_PATH = process.env.LOG_PATH || ''
const LOG_FILENAME = 'wallet-server-ui-proxy.log'
const LOG_FILEPATH = LOG_PATH + LOG_FILENAME

export class RunConfig {
  // constructor(private rootDir: string) {}
  // server
  get stopOnError() { return Config.stopOnError }
  get port() { return Config.port }
  get useHTTPS() { return Config.useHTTPS }
  // fs
  get rootDirectory() { return '' } // everything on relative path, could run on absolute // { return this.rootDir }
  get uiDirectory() { return Config.uiPath } // return path.join(this.rootDirectory, Config.uiPath) }
  get backupDirectory() { return process.env.BACKUP_PATH || path.resolve(this.rootDirectory) }
  get logFilename() { return LOG_FILEPATH }
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
}

const instance = new RunConfig()

module.exports = instance

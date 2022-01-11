import path from 'path'

import { ServerConfig } from './server-config'


const Config = <ServerConfig>require('../config.json')

// const LOG_PATH = process.env.LOG_PATH || ''
// const LOG_FILENAME = 'wallet-server-ui-proxy.log'
// const LOG_FILEPATH = LOG_PATH + LOG_FILENAME

export class RunConfig {
  // constructor(private rootDir: string) {}
  // server
  get stopOnError() { return Config.stopOnError }
  get port() { return Config.port }
  get useHTTPS() { return Config.useHTTPS }
  // fs
  get rootDirectory() { return '' } // everything on relative path, could run on absolute // { return this.rootDir }
  get uiDirectory() { return Config.uiPath } // return path.join(this.rootDirectory, Config.uiPath) }
  get backupDirectory() { return path.resolve(this.rootDirectory) }
  get logFilename() { return 'wallet-server-ui-proxy.log' }
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

// module.exports = (rootDir: string) => {
//   return new RunConfig(rootDir)
  
  // rootDirectory: () => rootDir
  // uiDirectory: () => path.join(rootDir, Config.uiPath)
  // proxyRoot: () => Config.proxyRoot
  // walletServerUrl: () => process.env.WALLET_SERVER_API_URL || Config.walletServerUrl
  // walletServerWs: () => process.env.WALLET_SERVER_WS || Config.walletServerWs
  // oracleExplorerHost: () => Config.oracleExplorerHost // overriden by 'host-override' header
  // blockstreamUrl: () => Config.blockstreamUrl
  // mempoolUrl: () => process.env.MEMPOOL_API_URL || Config.mempoolUrl
// }

// exports.stopOnError = Config.stopOnError
// exports.rootDirectory = rootDir
// exports.uiDirectory = path.join(rootDir, Config.uiPath)
// exports.proxyRoot = Config.proxyRoot
// exports.walletServerUrl = process.env.WALLET_SERVER_API_URL || Config.walletServerUrl
// exports.walletServerWs = process.env.WALLET_SERVER_WS || Config.walletServerWs
// exports.oracleExplorerHost = Config.oracleExplorerHost // overriden by 'host-override' header
// exports.blockstreamUrl = Config.blockstreamUrl
// exports.mempoolUrl = process.env.MEMPOOL_API_URL || Config.mempoolUrl

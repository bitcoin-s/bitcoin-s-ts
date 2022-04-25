import module from 'module'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import { ServerConfig } from 'common-ts/config/server-config'
import { isESMRuntime } from 'common-ts/util/env-util'
import { loadJSON, resolveHome } from 'common-ts/util/fs-util'


// Figure out if this module is running in ESM or CJS and load ServerConfig
let config: ServerConfig
// See https://nodejs.org/docs/latest/api/modules.html#modules_accessing_the_main_module
if (isESMRuntime()) { // require.main) { // ESM Module run
  const _dirname = process.cwd() // getting around ESM vs CMJ allowance of import.meta.url
  config = <ServerConfig>loadJSON(path.resolve(_dirname, 'config.json'))
  config.rootDirectory = _dirname
} else { // CJS Module run
  // __dirname is legal to use
  config = <ServerConfig>loadJSON(path.resolve(__dirname, 'config.json'))
  config.rootDirectory = __dirname
}

const LOG_FILENAME = 'oracle-server-ui-proxy.log'


export class RunConfig {

  private c: ServerConfig
  
  constructor(serverConfig: ServerConfig) {
    this.c = serverConfig
  }

  // server
  get stopOnError() { return this.c.stopOnError }
  get port() { return this.c.port }
  get useHTTPS() { return this.c.useHTTPS }
  // auth
  get serverUser() { return this.c.serverUser }
  get serverPassword() { return process.env.BITCOIN_S_ORACLE_RPC_PASSWORD || this.c.serverPassword }
  get serverAuthHeader() { return 'Basic ' + Buffer.from(this.serverUser + ':' + this.serverPassword).toString('base64') }
  get uiPassword() { return process.env.DEFAULT_UI_PASSWORD || this.c.uiPassword }
  // fs
  get rootDirectory() { return this.c.rootDirectory }
  get uiDirectory() { return path.resolve(this.c.rootDirectory, this.c.uiPath) }
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
  // get wsRoot() { return this.c.wsRoot }
  get proxyRoot() { return this.c.proxyRoot }
  get oracleExplorerRoot() { return this.c.oracleExplorerRoot }
  // appServer
  get oracleServerUrl() { return process.env.ORACLE_SERVER_API_URL || this.c.oracleServerUrl }
  // get oracleServerWs() { return process.env.ORACLE_SERVER_WS || this.c.oracleServerWs }
  // proxy
  get oracleExplorerHost() { return this.c.oracleExplorerHost } // overriden by 'host-override' header
  get blockstreamRoot() { return this.c.blockstreamRoot }
  get blockstreamUrl() { return this.c.blockstreamUrl }
  get mempoolRoot() { return this.c.mempoolRoot }
  get mempoolUrl() { return process.env.MEMPOOL_API_URL || this.c.mempoolUrl }
  get torProxyRoot() { return this.c.torProxyRoot }
  get torProxyUrl() { return this.c.torProxyUrl }
  // ui data
  // get mempoolUrl() { return process.env.MEMPOOL_API_URL || Config.mempoolUrl } // BAD env var value incoming, should be updated
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
`
// serverPassword: ${this.serverPassword}
// uiPassword: ${this.uiPassword}
  }
}

export const Config = new RunConfig(config)

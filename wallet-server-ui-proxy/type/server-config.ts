
export class ServerConfig {
  // server
  port: number
  stopOnError: boolean = false
  useHTTPS: boolean = false
  // fs
  uiPath: string    // path to UI from local project root
  // auth
  serverUser: string
  serverPassword: string
  uiPassword: string
  // routes
  apiRoot: string // prefix on local forwarding endpoint paths like '/api/v0'
  wsRoot: string // prefix on local websocket forwarding endpoint paths like '/ws'
  proxyRoot: string // prefix on local paths like '/proxy'
  // appServer
  walletServerUrl: string // wallet server endpoint like 'http://host:port/'
  walletServerWs: string // wallet server websocket endpoint like 'ws://host:port/'
  // ui data
  mempoolUrl: string // Blockstream API endpoint like 'https://blockstream.info/api'
  
  // oracle
  // torProxyRoot: string // prefix on local paths like '/tor'
  // torProxyUrl: string // like 'socks5://127.0.0.1:9050'
  // oracleExplorerRoot: string // prefix on local paths like '/oracleexplorer'
  // oracleExplorerHost: string // oracle explorer host like 'test.oracle.suredbits.com'
  // blockstreamRoot: string // prefix on local paths like '/blockstream'
  // blockstreamUrl: string // Blockstream API endpoint like 'https://blockstream.info/api'
  // mempoolRoot: string // prefix on local paths like '/blockstream'
  // mempoolUrl: string // Blockstream API endpoint like 'https://blockstream.info/api'
}

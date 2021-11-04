
export class ServerConfig {
	port: number
	stopOnError: boolean = false
	useHTTPS: boolean = false
	apiRoot: string   // prefix on local forwarding endpoint paths like '/api/v0'
	torProxyRoot: string // prefix on local paths like '/tor'
	torProxyUrl: string // like 'socks5://127.0.0.1:9050'
	proxyRoot: string // prefix on local paths like '/proxy'
	oracleExplorerRoot: string // prefix on local paths like '/oracleexplorer'
	walletServerUrl: string // oracle server endpoint like 'http://host:port/'
	oracleExplorerHost: string // oracle explorer host like 'test.oracle.suredbits.com'
	blockstreamRoot: string // prefix on local paths like '/blockstream'
	blockstreamUrl: string // Blockstream API endpoint like 'https://blockstream.info/api'
	mempoolRoot: string // prefix on local paths like '/blockstream'
	mempoolUrl: string // Blockstream API endpoint like 'https://blockstream.info/api'
	uiPath: string    // path to UI from local project root
}

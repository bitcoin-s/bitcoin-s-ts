
export class ServerConfig {
	port: number
	stopOnError: boolean = false
	useHTTPS: boolean = false
	apiRoot: string   // prefix on local endpoint paths
	oracleUrl: string // oracle endpoint like 'http://host:port/'
	uiPath: string    // path to UI from local project root
}

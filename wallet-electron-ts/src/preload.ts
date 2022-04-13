console.debug('preload.ts')

const startProxy = (): void => {
  console.debug('startProxy')
  // Typescript source
  // Logs like it loads successfully, but is not externally or internally accessible
  // import('wallet-server-ui-proxy/server').then((_: NodeModule) => {
  //   console.debug('wallet-server-ui-proxy loaded', _)
  // })

  // proxy = require('wallet-server-ui-proxy/server')

  // import('./bin/bundle-static.js').then(module => {
  //   console.debug('wallet-server-ui-proxy loaded', module)
  //   // module.default()
  // })
}

startProxy()

const path = require('path')

const CopyPlugin = require('copy-webpack-plugin')
const PermissionsOutputPlugin = require('webpack-permissions-plugin')

const packagedPath = path.resolve(__dirname, '.webpack/main')
console.log('\n  webpack.main.config packagedPath:', packagedPath)

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'assets'), to: 'assets' },
        // This is destroying +x permission on items in bin
        { from: path.resolve(__dirname, 'bin'), to: 'bin' },
        { from: path.resolve(__dirname, 'proxy-config.json'), to: 'config.json' },
        { from: path.resolve(__dirname, 'bin', 'wallet-server-ui-proxy', 'build.json'), to: 'build.json' },
      ]
    }),
    // Re-set the +x permissions on bitcoin-s-server executables
    new PermissionsOutputPlugin({
      buildFiles: [{
        path: path.resolve(packagedPath, 'bin/bitcoin-s-server/bin/bitcoin-s-server'),
        fileMode: '755'
      }, {
        path: path.resolve(packagedPath, 'bin/bitcoin-s-server/bin/bitcoin-s-server.bat'),
        fileMode: '755'
      }],
    })
  ],
  // externals: {
  //   'wallet-server-ui-proxy': 'commonjs wallet-server-ui-proxy'
  // },
};

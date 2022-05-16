import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import nodeExternals from 'webpack-node-externals'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  entry: './server.ts', // path.resolve(__dirname, 'server.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle-static.js',
    library: {
      type: 'commonjs-static',
      // type: 'module',
      // type: 'commonjs2',
      // type: 'commonjs',
      // type: 'commonjs-module',
    },
  },
  target: ['node'],
  // For type: 'module' above
  // experiments: {
  //   outputModule: true,
  // },
  mode: 'development',
  module: {
    rules: [{ test: /\.ts$/, exclude: [/node_modules/], use: 'ts-loader' }],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    // fallback: {
    //   'assert': false,
    //   'crypto': false,
    //   'fs': false,
    //   'http': false,
    //   'https': false,
    //   'net': false,
    //   'os': false,
    //   'path': false,
    //   'querystring': false,
    //   'stream': false,
    //   'url': false,
    //   'util': false,
    //   'zlib': false,
    // },
    // symlinks: false
  },
  externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
}

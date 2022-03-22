
// Wrapper to allow ESM module loading inside Electron which only likes CJS modules at this point
const _require = require('esm')(module)
_require('./electron.js')

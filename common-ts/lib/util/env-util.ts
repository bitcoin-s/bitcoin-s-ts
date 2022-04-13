
// Returns true if running in a ESM Module
export function isESMRuntime() {
  // See https://www.npmjs.com/package/es-main
  return !process.mainModule
}

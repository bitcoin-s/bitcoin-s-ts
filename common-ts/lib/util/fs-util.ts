import fs from 'fs'
import path from 'path'
import os from 'os'

export function resolveHome(filepath: string) {
  if (filepath && filepath[0] === '~') {
    return path.join(os.homedir(), filepath.slice(1))
  }
  return filepath
}

// See https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/
export function loadJSON(filename: string) {
  let file: string
  try {
    fs.accessSync(filename)
    file = fs.readFileSync(filename, { encoding: 'utf8' })
  } catch (err) {
    console.error('error reading JSON for', filename, err)
    return
  }
  try {
    const json = JSON.parse(file)
    return json
  } catch(err) {
    console.error('error parsing JSON for', filename, err)
  }
}

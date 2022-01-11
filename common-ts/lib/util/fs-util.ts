import path from 'path'
import os from 'os'

export function resolveHome(filepath: string) {
  if (filepath && filepath[0] === '~') {
    return path.join(os.homedir(), filepath.slice(1))
  }
  return filepath
}

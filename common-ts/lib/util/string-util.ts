import crypto from 'crypto'

export function get64randomBytes() {
  return crypto.randomBytes(64).toString('hex')
}

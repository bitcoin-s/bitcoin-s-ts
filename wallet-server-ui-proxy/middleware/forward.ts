import http from 'http'

import { Request, Response } from 'express'

const ENDPOINT = '127.0.0.1'
const PATH = '/postJSON'
const PORT = 9000

// Forwards incoming JSON body to arbitrary endpoint
exports.forward = (req: Request, res: Response) => {
  const body = req.body
  console.debug('forward', body)

  const stringBody = JSON.stringify(body)
  const options = {
    host: ENDPOINT,
    port: PORT,
    path: PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(stringBody)
    },
  }

  const request = http.request(options)
  request.write(stringBody)
  request.end()
  res.end()
}

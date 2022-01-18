import { Request, Response } from 'express'
import fetch from 'node-fetch'


/** 'Is this proxy running' endpoint */
exports.heartbeat = (req: Request, res: Response) => {
  res.json({ success: true })
}

/** 'Is the appServer running' endpoint */
exports.serverHeartbeat = (serverUrl: string) => async (req: Request, res: Response) => {
  let success = false
  // TODO : this can use wallet-ts now
  await fetch(serverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'getversion' }) 
  }).then(_ => {
    success = true
  }).catch(err => {
    // errno: 'ECONNREFUSED', code: 'ECONNREFUSED' for no wallet server present to talk to
    success = false
  })
  res.send({ success })
}

import { Request, Response } from 'express'

import * as CommonServer from 'common-ts/lib/index'


/** 'Is this proxy running' endpoint */
exports.heartbeat = (req: Request, res: Response) => {
  res.json({ success: true })
}

/** 'Is the appServer/oracleServer running' endpoint */
exports.serverHeartbeat = (serverUrl: string) => async (req: Request, res: Response) => {
  let success = false

  await CommonServer.GetVersion().then(_ => {
    success = true
  }).catch(err => {
    // errno: 'ECONNREFUSED', code: 'ECONNREFUSED' for no server present to talk to
    success = false;
  })

  res.send({ success })
}

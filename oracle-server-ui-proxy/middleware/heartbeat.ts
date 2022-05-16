import { Request, Response } from 'express'

import * as CommonServer from 'common-ts/index'


/** 'Is this proxy running' endpoint */
export const heartbeat = (req: Request, res: Response) => {
  res.json({ success: true })
}

/** 'Is the appServer/oracleServer running' endpoint */
export const serverHeartbeat = (serverUrl: string) => async (req: Request, res: Response) => {
  let success = false

  await CommonServer.GetVersion().then(() => {
    success = true
  }).catch((err: any) => {
    // errno: 'ECONNREFUSED', code: 'ECONNREFUSED' for no server present to talk to
    success = false;
  })

  res.send({ success })
}

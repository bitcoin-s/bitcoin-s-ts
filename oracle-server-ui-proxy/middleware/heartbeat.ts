import { Request, Response } from 'express'

import * as CommonServer from 'common-ts/lib/index'

import { RunConfig } from '../type/run-config'


const Config = <RunConfig>require('../type/run-config')

CommonServer.ConfigureServerURL(Config.oracleServerUrl)
CommonServer.ConfigureAuthorizationHeader(Config.serverAuthHeader)

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

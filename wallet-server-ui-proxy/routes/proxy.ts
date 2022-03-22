import express, { Request, Response } from 'express'

import { verify as verifyAuth } from '../middleware/auth'
import { getBuildConfig } from '../middleware/buildConfig'
import { downloadBackup, downloadBitcoinsLog, downloadProxyLog } from '../middleware/download'
import { heartbeat, serverHeartbeat } from '../middleware/heartbeat'

import { Config } from '../config/run-config'


export const router = express.Router()

/** Data Routes */
router.get('/buildConfig', getBuildConfig)
// TODO : This should probably return a map with keys for various items the UI might want to know
router.get('/mempoolUrl', (req: Request, res: Response) => {
  res.json({ url: Config.mempoolUrl })
})

/** Download Routes */
router.post('/downloadBackup', express.json(), verifyAuth, downloadBackup)
router.post('/downloadBitcoinsLog', express.json(), verifyAuth, downloadBitcoinsLog)
router.post('/downloadProxyLog', express.json(), verifyAuth, downloadProxyLog)

/** Heartbeat Routes */
router.get(`/heartbeat`, heartbeat)
router.get(`/serverHeartbeat`, serverHeartbeat(Config.walletServerUrl))

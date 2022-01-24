import express, { Request, Response } from 'express'

import { RunConfig } from '../type/run-config'


const router = express.Router()

const Config = <RunConfig>require('../type/run-config')

const heartbeatController = require('../middleware/heartbeat')
const buildController = require('../middleware/buildConfig')
const backupController = require('../middleware/backup').downloadBackup
const verifyAuth = require('../middleware/auth').verify

// It's hard to pull a .ts in from another library
// See https://www.typescriptlang.org/docs/handbook/esm-node.html
// import { heartbeat, serverHeartbeat } from 'common-ts/lib/middleware/heartbeat'
// const heartbeatController = require('common-ts/lib/middleware/heartbeat.ts')
// import * as heartbeatController from 'common-ts/lib/middleware/heartbeat'

/** Heartbeat Routes */
router.get(`/heartbeat`, heartbeatController.heartbeat)
router.get(`/serverHeartbeat`, heartbeatController.serverHeartbeat(Config.oracleServerUrl))

/** Data Routes */
router.get('/buildConfig', buildController.get)
// TODO : This should probably return a map with keys for various items the UI might want to know
// router.get('/mempoolUrl', (req: Request, res: Response) => {
//   res.json({ url: Config.mempoolUrl })
// })

/** Download Route */
router.post('/downloadBackup', express.json(), verifyAuth, backupController)

module.exports = router

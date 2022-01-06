import express, { Router } from 'express'
import winston from 'winston'

import { RunConfig } from '../type/run-config'
// import authRouter from './auth'
// import proxyRouter from './proxy'

const Config = <RunConfig>require('../type/run-config')

// const authRouter = require('./auth')
// const proxyRouter = require('./proxy')

// module.exports = (router: Router, logger: winston.Logger) => {
//   authRouter(router, logger)
//   proxyRouter(router, logger)
//   return router
// }

const router = express.Router()

router.use('/auth', express.json(), require('./auth'))

router.use('/', require('./proxy'))

module.exports = router

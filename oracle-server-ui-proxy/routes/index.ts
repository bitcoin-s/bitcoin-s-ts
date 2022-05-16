import express from 'express'

import { router as authRouter } from './auth'
import { router as proxyRouter } from './proxy'


export const router = express.Router()

router.use('/auth', express.json(), authRouter)
router.use('/', proxyRouter)

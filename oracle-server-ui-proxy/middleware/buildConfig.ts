import module from 'module'

import { Request, Response } from 'express'

import { BuildConfig } from 'common-ts/config/build-config'

import { Logger } from '../middleware/logger'


const _require = module.createRequire(import.meta.url)

// Cache
let Build: BuildConfig
try {
  Build = <BuildConfig>_require('../build.json')
} catch (err) {
  Logger.error('did not find BuildConfig')
  // undefined returned to client
}

export const getBuildConfig = (req: Request, res: Response) => {
  res.json(Build)
}

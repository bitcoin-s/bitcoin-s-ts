import path from 'path'

import { Request, Response } from 'express'

import { BuildConfig } from 'common-ts/config/build-config'
import { isESMRuntime } from 'common-ts/util/env-util'
import { loadJSON } from 'common-ts/util/fs-util'

import { Logger } from '../middleware/logger'


// Cache
let Build: BuildConfig
try {
  if (isESMRuntime()) {
    const _dirname = process.cwd()
    Build = <BuildConfig>loadJSON(path.resolve(_dirname, 'build.json'))
  } else {
    Build = <BuildConfig>loadJSON(path.resolve(__dirname, 'build.json'))
  }
  console.debug('BuildConfig:', Build)
} catch (err) {
  Logger.error('did not find BuildConfig')
  // undefined returned to client
}

export const getBuildConfig = (req: Request, res: Response) => {
  res.json(Build)
}

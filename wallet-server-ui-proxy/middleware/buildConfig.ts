import { Request, Response } from 'express'

import { BuildConfig } from '../type/build-config'

const logger = require('../middleware/logger')

// Cache
let Build: BuildConfig
try {
  Build = <BuildConfig>require('../build.json')
} catch (err) {
  logger.error('did not find BuildConfig')
  // undefined returned to client
}

// module.exports = {
//   get: () => {
//     if (Build === undefined) {
//       try {
//         Build = <BuildConfig>require('../build.json')
//       } catch (err) {
//         logger.error('did not find BuildConfig')
//         // undefined returned to client
//       }
//     }
//     return (req: Request, res: Response) => {
//       res.json(Build)
//     }
//   }
// }

// exports.get = () => {
//   if (Build === undefined) {
//     try {
//       Build = <BuildConfig>require('../build.json')
//     } catch (err) {
//       logger.error('did not find BuildConfig')
//       // undefined returned to client
//     }
//   }
//   return (req: Request, res: Response) => {
//     res.json(Build)
//   }
// }

exports.get = (req: Request, res: Response) => {
  res.json(Build)
}

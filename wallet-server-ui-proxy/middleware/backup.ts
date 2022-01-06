import fs from 'fs'

import { Response } from 'express'

import * as WalletServer from 'wallet-ts/lib/index'
import { BodyRequest } from 'common-ts/lib/util/express-util'

import { RunConfig } from '../type/run-config'

const Config = <RunConfig>require('../type/run-config')
const logger = require('../middleware/logger')

// Filesystem download
interface DownloadRequest {
  filename: string
}

// module.exports = {
//   // Make bitcoin-s state backup and return zip
//   // downloadBackup: (logger, backupPath: string) => {
//   //   return (req: BodyRequest<DownloadRequest>, res: Response) => {
//   downloadBackup: (req: BodyRequest<DownloadRequest>, res: Response) => {
//     const r = req.body
//     console.debug('/downloadBackup', r)
  
//     if (r.filename) {
//       const fullPath = Config.backupDirectory + r.filename
  
//       // Sanity check
//       try {
//         fs.accessSync(Config.backupDirectory) // Will throw error if file does not exist
//       } catch (err) {
//         logger.error('/downloadBackup backupPath is not accessible', Config.backupDirectory)
//         res.end() // Blob size 0 returned
//       }
  
//       // Use wallet-ts to create backup
//       WalletServer.ZipDataDir(fullPath).then(result => {
//         console.debug(' ZipDataDir() complete', result)
//         if (result.result === null) { // success case
//           // Sanity check
//           try {
//             fs.accessSync(fullPath) // Will throw error if file does not exist
//           } catch (err) {
//             logger.error('/downloadBackup fullPath is not accessible', fullPath)
//             res.end() // Blob size 0 returned
//           }
  
//           const readStream = fs.createReadStream(fullPath)
//           readStream.on('open', () => res.setHeader('Content-Type', 'application/zip; charset=utf-8'))
//           readStream.on('error', (err) => { logger.error('readStream error', err) })
//           readStream.on('end', () => {
//             // Always delete backup zip after sending
//             fs.unlink(fullPath, function() {
//               // Nothing to do
//             })
//           })
//           readStream.pipe(res)
//         } else {
//           logger.error('ZipDataDir failed', result)
//           res.end() // Blob size 0 returned
//         }
//       })
//     } else {
//       logger.error('/downloadBackup no filename specified', r)
//       res.end() // Blob size 0 returned
//     }
//   }
//   // }
// }

exports.downloadBackup = (req: BodyRequest<DownloadRequest>, res: Response) => {
  const r = req.body
  console.debug('/downloadBackup', r)

  if (r.filename) {
    const fullPath = Config.backupDirectory + r.filename

    // Sanity check
    try {
      fs.accessSync(Config.backupDirectory) // Will throw error if directory does not exist
    } catch (err) {
      logger.error('/downloadBackup backupDirectory is not accessible', Config.backupDirectory)
      res.end() // Blob size 0 returned
    }

    // Use wallet-ts to create backup
    WalletServer.ZipDataDir(fullPath).then(result => {
      console.debug(' ZipDataDir() complete', result)
      if (result.result === null) { // success case
        // Sanity check
        try {
          fs.accessSync(fullPath) // Will throw error if file does not exist
        } catch (err) {
          logger.error('/downloadBackup fullPath is not accessible', fullPath)
          res.end() // Blob size 0 returned
        }

        const readStream = fs.createReadStream(fullPath)
        readStream.on('open', () =>
          res.setHeader('Content-Type', 'application/zip; charset=utf-8'))
        readStream.on('error',
          (err) => { logger.error('readStream error', err) })
        readStream.on('end', () => {
          // Always delete backup zip after sending
          fs.unlink(fullPath, function() {
            // Nothing to do
          })
        })
        readStream.pipe(res)
      } else {
        logger.error('ZipDataDir failed', result)
        res.end() // Blob size 0 returned
      }
    })
  } else {
    logger.error('/downloadBackup no filename specified', r)
    res.end() // Blob size 0 returned
     // TODO : Should this 500 error instead?
  }
}

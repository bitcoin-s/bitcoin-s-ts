import fs from 'fs'
import path from 'path'

import { Request, Response } from 'express'

import * as WalletServer from 'wallet-ts/lib/index'
import { BodyRequest } from 'common-ts/lib/util/express-util'

import { RunConfig } from '../type/run-config'


const Config = <RunConfig>require('../type/run-config')
const logger = require('../middleware/logger')

// Filesystem download
// interface DownloadRequest {
//   filename: string
// }

const filename = 'bitcoin-s-backup.zip'

exports.downloadBackup = (req: Request, res: Response) => {
  // const r = req.body // don't currently care about request
  console.debug('downloadBackup')

  const fullPath = path.join(Config.backupDirectory, filename)

  // Sanity check
  try {
    fs.accessSync(Config.backupDirectory) // Will throw error if directory does not exist
  } catch (err) {
    logger.error('downloadBackup backupDirectory is not accessible', Config.backupDirectory)
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
        logger.error('downloadBackup fullPath is not accessible', fullPath)
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
      logger.error('downloadBackup ZipDataDir failed', result)
      res.end() // Blob size 0 returned
    }
  })
}

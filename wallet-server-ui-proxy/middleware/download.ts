import fs from 'fs'
import path from 'path'

import { Request, Response } from 'express'

import { ServerResponse } from 'common-ts/type/server-types'
import { serverNetworkNameToFolderName } from 'common-ts/util/server-util'
import { BodyRequest } from 'common-ts/util/express-util'

import * as WalletServer from '@bitcoin-s-ts/wallet-ts/index'

import { Config } from '../config/run-config'
import { Logger } from '../middleware/logger'


const filename = 'bitcoin-s-backup.zip'

export const downloadBackup = (req: Request, res: Response) => {
  Logger.info('downloadBackup ' + Config.bitcoinsDirectory)

  const fullPath = path.join(Config.bitcoinsDirectory, filename)
  Logger.info('fullPath: ' + fullPath)

  // logger.info('auth header: ' + res.getHeader('Authorization'))

  // Sanity check
  try {
    fs.accessSync(Config.bitcoinsDirectory) // Will throw error if directory does not exist
  } catch (err) {
    Logger.error('downloadBackup bitcoinsDirectory is not accessible ' + Config.bitcoinsDirectory)
    res.end() // Blob size 0 returned
  }

  // Use wallet-ts to create backup
  WalletServer.ZipDataDir(fullPath).then((result: ServerResponse<string|null>) => {
    Logger.info('ZipDataDir() complete')
    if (result.result === null) { // success case
      // Sanity check
      try {
        fs.accessSync(fullPath) // Will throw error if file does not exist
      } catch (err) {
        Logger.error('downloadBackup fullPath is not accessible ' + fullPath)
        res.end() // Blob size 0 returned
      }

      const readStream = fs.createReadStream(fullPath)
      readStream.on('open', () =>
        res.setHeader('Content-Type', 'application/zip; charset=utf-8'))
      readStream.on('error',
        (err) => { Logger.error('readStream error ' + err) })
      readStream.on('end', () => {
        // Always delete backup zip after sending
        fs.unlink(fullPath, function() {
          // Nothing to do
        })
      })
      readStream.pipe(res)
    } else {
      Logger.error('downloadBackup ZipDataDir failed')
      res.end() // Blob size 0 returned
    }
  })
}

interface LogRequest {
  network: string
}

// Read and return a plaintext file
function sendPlainText(res: Response, filePath: string) {
  const readStream = fs.createReadStream(filePath)
  readStream.on('open', () =>
    res.setHeader('Content-Type', 'text/plain; charset=utf-8'))
  readStream.on('error',
    (err) => { Logger.error('readStream error ' + err) })
  readStream.pipe(res)
}

export const downloadBitcoinsLog = (req: BodyRequest<LogRequest>, res: Response) => {
  const network = req.body.network;
  Logger.info('downloadBitcoinsLog network:' + network)

  // Translate bitcoin-s network name to real network folder name
  const networkFolderName = serverNetworkNameToFolderName(network)
  console.debug('networkFolderName:', networkFolderName, 'Config.bitcoinsDirectory:', Config.bitcoinsDirectory)

  if (networkFolderName) {
    const logFileName = 'bitcoin-s.log'
    const logPath = path.join(Config.bitcoinsDirectory, networkFolderName, logFileName)
    console.debug('logPath:', logPath)
  
    try {
      fs.accessSync(logPath)
    } catch (err) {
      Logger.error('downloadBitcoinsLog log is not accessible ' + logPath)
      res.end() // Blob size 0 returned
    }
  
    sendPlainText(res, logPath)
  } else {
    Logger.error('networkFolderName was not set')
  }
}

export const downloadProxyLog = (req: Request, res: Response) => {
  Logger.info('downloadProxyLog')

  const logPath = Config.logFilepath

  try {
    fs.accessSync(logPath)
  } catch (err) {
    Logger.error('downloadProxyLog log is not accessible ' + logPath)
    res.end() // Blob size 0 returned
  }

  sendPlainText(res, logPath)
}

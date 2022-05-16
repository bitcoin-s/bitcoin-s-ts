import fs from 'fs'
import path from 'path'

import { Request, Response } from 'express'

import { ServerResponse } from 'common-ts/type/server-types'

import * as OracleServer from '@bitcoin-s-ts/oracle-server-ts/index'

import { Config } from '../config/run-config'
import { Logger } from '../middleware/logger'


const filename = 'oracle-backup.zip'

export const downloadBackup = (req: Request, res: Response) => {
  Logger.info('downloadBackup ' + Config.bitcoinsDirectory)

  const fullPath = path.join(Config.bitcoinsDirectory, filename)
  Logger.info('fullPath: ' + fullPath)

  // logger.info('auth header: ' + res.getHeader('Authorization'))

  // Sanity check
  try {
    fs.accessSync(Config.bitcoinsDirectory) // Will throw error if directory does not exist
  } catch (err) {
    Logger.error('downloadBackup backupDirectory is not accessible ' + Config.bitcoinsDirectory)
    res.end() // Blob size 0 returned
  }

  // Use wallet-ts to create backup
  OracleServer.ZipDataDir(fullPath).then((result: ServerResponse<string|null>) => {
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

// Read and return a plaintext file
function sendPlainText(res: Response, filePath: string) {
  const readStream = fs.createReadStream(filePath)
  readStream.on('open', () =>
    res.setHeader('Content-Type', 'text/plain; charset=utf-8'))
  readStream.on('error',
    (err) => { Logger.error('readStream error ' + err) })
  readStream.pipe(res)
}

export const downloadOracleServerLog = (req: Request, res: Response) => {
  Logger.info('downloadOracleServerLog')

  const oracleFolderName = 'oracle'
  const logFileName = 'bitcoin-s.log'
  const logPath = path.join(Config.bitcoinsDirectory, oracleFolderName, logFileName)
  console.debug('logPath:', logPath)

  try {
    fs.accessSync(logPath)
  } catch (err) {
    Logger.error('downloadOracleServerLog log is not accessible ' + logPath)
    res.end() // Blob size 0 returned
  }

  sendPlainText(res, logPath)
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

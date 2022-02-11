import fs from 'fs'
import path from 'path'

import { Request, Response } from 'express'

import * as OracleServer from 'oracle-server-ts/lib/index'

import { RunConfig } from '../type/run-config'


const Config = <RunConfig>require('../type/run-config')
const logger = require('../middleware/logger')

const filename = 'oracle-backup.zip'

exports.downloadBackup = (req: Request, res: Response) => {
  logger.info('downloadBackup ' + Config.bitcoinsDirectory)

  const fullPath = path.join(Config.bitcoinsDirectory, filename)
  logger.info('fullPath: ' + fullPath)

  // logger.info('auth header: ' + res.getHeader('Authorization'))

  // Sanity check
  try {
    fs.accessSync(Config.bitcoinsDirectory) // Will throw error if directory does not exist
  } catch (err) {
    logger.error('downloadBackup backupDirectory is not accessible ' + Config.bitcoinsDirectory)
    res.end() // Blob size 0 returned
  }

  // Use wallet-ts to create backup
  OracleServer.ZipDataDir(fullPath).then(result => {
    logger.info('ZipDataDir() complete')
    if (result.result === null) { // success case
      // Sanity check
      try {
        fs.accessSync(fullPath) // Will throw error if file does not exist
      } catch (err) {
        logger.error('downloadBackup fullPath is not accessible ' + fullPath)
        res.end() // Blob size 0 returned
      }

      const readStream = fs.createReadStream(fullPath)
      readStream.on('open', () =>
        res.setHeader('Content-Type', 'application/zip; charset=utf-8'))
      readStream.on('error',
        (err) => { logger.error('readStream error ' + err) })
      readStream.on('end', () => {
        // Always delete backup zip after sending
        fs.unlink(fullPath, function() {
          // Nothing to do
        })
      })
      readStream.pipe(res)
    } else {
      logger.error('downloadBackup ZipDataDir failed')
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
    (err) => { logger.error('readStream error ' + err) })
  readStream.pipe(res)
}

exports.downloadOracleServerLog = (req: Request, res: Response) => {
  logger.info('downloadOracleServerLog')

  const oracleFolderName = 'oracle'
  const logFileName = 'bitcoin-s.log'
  const logPath = path.join(Config.bitcoinsDirectory, oracleFolderName, logFileName)
  console.debug('logPath:', logPath)

  try {
    fs.accessSync(logPath)
  } catch (err) {
    logger.error('downloadOracleServerLog log is not accessible ' + logPath)
    res.end() // Blob size 0 returned
  }

  sendPlainText(res, logPath)
}

exports.downloadProxyLog = (req: Request, res: Response) => {
  logger.info('downloadProxyLog')

  const logPath = Config.logFilepath

  try {
    fs.accessSync(logPath)
  } catch (err) {
    logger.error('downloadProxyLog log is not accessible ' + logPath)
    res.end() // Blob size 0 returned
  }

  sendPlainText(res, logPath)
}

import winston from 'winston'
const { combine, timestamp, printf } = winston.format

import { RunConfig } from '../type/run-config'


const Config = <RunConfig>require('../type/run-config')

// Logger formatting
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`
})

function createLoggerInstance(): winston.Logger {
  return winston.createLogger({
      exitOnError: Config.stopOnError,
      level: 'info',
      format: combine(timestamp(), logFormat),
      transports: [
        // Log to console
        new winston.transports.Console(),
        // Log to file
        new winston.transports.File({ filename: Config.logFilename }),
      ],
    })
}

const instance: winston.Logger = createLoggerInstance()

module.exports = instance

import winston from 'winston'
const { combine, timestamp, printf } = winston.format

import { Config } from '../config/run-config'


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
      new winston.transports.File({ filename: Config.logFilepath }),
    ],
  })
}

export const Logger: winston.Logger = createLoggerInstance()

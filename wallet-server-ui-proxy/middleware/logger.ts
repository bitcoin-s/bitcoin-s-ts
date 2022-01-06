import winston, { createLogger } from 'winston'
const { combine, timestamp, printf } = winston.format

import { RunConfig } from '../type/run-config'

const Config = <RunConfig>require('../type/run-config')

// Logger formatting
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`
})

function createLoggerInstance(): winston.Logger {
  console.debug('createLoggerInstance()')
  return winston.createLogger({
      exitOnError: Config.stopOnError,
      level: 'info',
      format: combine(timestamp(), logFormat),
      transports: [
        new winston.transports.Console(), // Log to console
        new winston.transports.File({ filename: Config.logFilename }), // Log to file
      ],
    })
}

// This could probably be setup as a singleton and be easier to pass around
// module.exports = {
//   initializeLogger: (filepath: string, exitOnError: boolean): winston.Logger => {
//     return createLogger(filepath, exitOnError)
//   },
//   Logger: (): winston.Logger => {
//     return instance
//   }
// }

const instance: winston.Logger = createLoggerInstance()

module.exports = instance

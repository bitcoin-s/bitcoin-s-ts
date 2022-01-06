import { RunConfig } from '../type/run-config'


const Config = <RunConfig>require('../type/run-config')
const logger = require('../middleware/logger')

exports.setErrorHandlers = () => {
  process.on('uncaughtException', error => {
    logger.error('uncaught error', error)
    if (Config.stopOnError) process.exit(1)
  })
  
  process.on('unhandledRejection', error => {
    logger.error('uncaught rejection', error)
    if (Config.stopOnError) process.exit(1)
  })
}

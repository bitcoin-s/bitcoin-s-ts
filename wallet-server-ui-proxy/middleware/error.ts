import { RunConfig } from '../type/run-config'

const Config = <RunConfig>require('../type/run-config')
const logger = require('../middleware/logger')

// module.exports = {
//   setErrorHandlers: (logger, stopOnError: boolean) => {
//     process.on('uncaughtException', error => {
//       logger.error('uncaught error', error)
//       if (stopOnError) process.exit(1)
//     })
    
//     process.on('unhandledRejection', error => {
//       logger.error('uncaught rejection', error)
//       if (stopOnError) process.exit(1)
//     })
//   }
// }

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

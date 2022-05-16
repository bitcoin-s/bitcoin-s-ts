import { Config } from '../config/run-config'
import { Logger } from '../middleware/logger'


export const setErrorHandlers = () => {
  process.on('uncaughtException', error => {
    Logger.error('uncaught error', error)
    if (Config.stopOnError) process.exit(1)
  })
  
  process.on('unhandledRejection', error => {
    Logger.error('uncaught rejection', error)
    if (Config.stopOnError) process.exit(1)
  })
}

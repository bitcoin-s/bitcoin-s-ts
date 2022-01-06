import express, { Router } from 'express'
import winston from 'winston'

const controller = require('../middleware/auth')

// module.exports = (router: Router, logger: winston.Logger) => {
//   router.route('/login').post(controller.login)
//   router.route('/logout').post(controller.logout)
//   router.route('/refresh').post(controller.refresh)
//   // Test route to validate that auth with restrict/verify access
//   router.route('/test').post(controller.verify, controller.test)
//   return router
// }

const router = express.Router()

router.route('/login').post(controller.login)
router.route('/logout').post(controller.logout)
router.route('/refresh').post(controller.refresh)
// Test route to validate that auth with restrict/verify access
router.route('/test').post(controller.verify, controller.test)

module.exports = router

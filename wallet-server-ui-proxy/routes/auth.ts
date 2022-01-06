import express from 'express'


const router = express.Router()

const controller = require('../middleware/auth')

router.route('/login').post(controller.login)
router.route('/refresh').post(controller.refresh)
router.route('/logout').post(controller.logout)

// Test route to validate that auth with restrict/verify access
router.route('/test').post(controller.verify, controller.test)

module.exports = router

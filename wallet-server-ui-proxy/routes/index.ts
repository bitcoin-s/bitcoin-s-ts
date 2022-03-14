import express from 'express'


const router = express.Router()

router.use('/auth', express.json(), require('./auth'))

router.use('/', require('./proxy'))

router.post('/forward', express.json(), require('../middleware/forward').forward)

module.exports = router

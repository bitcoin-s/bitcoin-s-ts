import express from 'express'


const router = express.Router()

router.use('/auth', express.json(), require('./auth'))

router.use('/', require('./proxy'))

module.exports = router

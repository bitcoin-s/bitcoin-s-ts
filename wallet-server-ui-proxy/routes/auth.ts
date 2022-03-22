import express from 'express'

import { login, refresh, logout, verify, test } from '../middleware/auth'


export const router = express.Router()

router.route('/login').post(login)
router.route('/refresh').post(refresh)
router.route('/logout').post(logout)

// Test route to validate that auth with restrict/verify access
router.route('/test').post(verify, test)

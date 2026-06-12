import express from 'express'
import { solicitarLogin, verificarOTP } from '../controllers/authController.js'

const router = express.Router()

router.post('/login', solicitarLogin)
router.post('/verify-2fa', verificarOTP)

export default router

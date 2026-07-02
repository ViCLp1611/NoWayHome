import express from 'express'
import { geocodeAddressHandler } from '../controllers/geocodeController.js'

const router = express.Router()

router.get('/', geocodeAddressHandler)

export default router

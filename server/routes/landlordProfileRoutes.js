import express from 'express'
import {
  getLandlordProfileHandler,
  updateLandlordProfileHandler,
} from '../controllers/landlordProfileController.js'

const router = express.Router()

router.get('/:id', getLandlordProfileHandler)
router.patch('/:id', updateLandlordProfileHandler)

export default router

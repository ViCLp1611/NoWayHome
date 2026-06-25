import { Router } from 'express'
import {
  listLandlordReservationsHandler,
  updateReservationStatusHandler,
} from '../controllers/landlordBookingController.js'

const router = Router()

router.get('/', listLandlordReservationsHandler)
router.patch('/:id/estado', updateReservationStatusHandler)

export default router

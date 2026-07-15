import { Router } from 'express'
import {
  listLandlordReservationsHandler,
  updateReservationStatusHandler,
} from '../controllers/landlordBookingController.js'

const router = Router()

// Ruta para listar las reservas de un arrendatario
router.get('/', listLandlordReservationsHandler)

// Ruta unificada para actualizar el estado de una reserva (CONFIRMAR/RECHAZAR)
router.patch('/:idReserva/status', updateReservationStatusHandler)

export default router

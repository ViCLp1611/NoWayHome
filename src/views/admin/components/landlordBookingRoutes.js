import express from 'express'
import {
  listLandlordReservationsHandler,
  updateReservationStatusHandler,
} from '../controllers/landlordBookingController.js'

const router = express.Router()

// Ruta para listar las reservas de un arrendatario
// GET /api/arrendatario/reservas?id_arrendatario=...
router.get('/', listLandlordReservationsHandler)

// Ruta para actualizar el estado de una reserva (Aceptar/Rechazar)
// PATCH /api/arrendatario/reservas/:idReserva/status
router.patch('/:idReserva/status', updateReservationStatusHandler)

export default router

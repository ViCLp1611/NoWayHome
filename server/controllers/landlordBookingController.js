import {
  getLandlordReservations,
  updateReservationStatus,
  ValidationError,
} from '../services/landlordBookingService.js'

function sendError(res, error, fallbackMessage = 'No se pudo completar la solicitud.') {
  console.error('[landlordBookingController]', error?.message || error)

  if (error instanceof ValidationError || error.statusCode === 400) {
    return res.status(400).json({ ok: false, message: error.message })
  }

  return res.status(500).json({ ok: false, message: fallbackMessage })
}

export async function listLandlordReservationsHandler(req, res) {
  try {
    const idArrendatario = req.query?.id_arrendatario || req.query?.arrendatarioId
    const reservations = await getLandlordReservations(idArrendatario)

    return res.json({ ok: true, reservations })
  } catch (error) {
    return sendError(res, error, 'No se pudieron cargar las reservas.')
  }
}

export async function updateReservationStatusHandler(req, res) {
  try {
    const idReserva = req.params?.id
    const { id_arrendatario, estado } = req.body

    const reservation = await updateReservationStatus(idReserva, id_arrendatario, estado)

    return res.json({
      ok: true,
      message: 'Estado de reserva actualizado correctamente',
      reserva: reservation,
    })
  } catch (error) {
    return sendError(res, error, 'No se pudo actualizar el estado de la reserva.')
  }
}

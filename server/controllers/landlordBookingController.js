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
    if (!idArrendatario) {
      return sendError(res, new ValidationError('Se requiere el ID del arrendatario.'))
    }

    // Usar el servicio para obtener las reservas, que ya maneja toda la lógica compleja.
    const reservations = await getLandlordReservations(idArrendatario)

    return res.json({ ok: true, reservations })
  } catch (error) {
    // El servicio puede lanzar ValidationError, que nuestro handler sendError maneja.
    return sendError(res, error, 'No se pudieron cargar las reservas.')
  }
}

export async function updateReservationStatusHandler(req, res) {
  try {
    const { idReserva } = req.params
    const { id_arrendatario, estado } = req.body // estado debe ser 'CONFIRMADA' o 'RECHAZADA' o 'CANCELADA'

    // Delegamos toda la lógica de validación, permisos y actualización al servicio.
    // El servicio ya valida el ID, el estado, la transición y la propiedad del arrendatario.
    const updatedReserva = await updateReservationStatus(idReserva, id_arrendatario, estado)

    return res.json({
      ok: true,
      message: `Estado de reserva actualizado a ${estado} correctamente`,
      reserva: updatedReserva,
    })
  } catch (error) {
    // El servicio lanza ValidationError para errores de cliente (400, 403, 404), que sendError maneja.
    return sendError(res, error, `No se pudo actualizar el estado de la reserva.`)
  }
}

// Se eliminan los handlers approveReservationHandler, rejectReservationHandler y la función local
// verifyOwnership porque su lógica ahora está centralizada y mejorada en el
// landlordBookingService, y es consumida por updateReservationStatusHandler.

import { supabase } from '../config/supabase.js'
import {
  getLandlordReservations,
  updateReservationStatus,
  ValidationError,
} from '../services/landlordBookingService.js'
import { sendReservationCancelledEmail } from '../services/emailNotificationService.js'

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
    const { id_arrendatario } = req.body
    const estado = String(req.body.estado || '').toUpperCase() // Normalizamos el estado a mayúsculas.
    // Solución de robustez: Acepta el motivo tanto si llega como 'motivo_rechazo' o como 'motivo'.
    // Esto soluciona el problema si el frontend envía el campo con un nombre incorrecto.
    const motivo_rechazo = req.body.motivo_rechazo || req.body.motivo

    // Solución para permitir cancelación por parte del arrendatario con motivo.
    // Esto evita el error "Estado no válido" del servicio para el caso 'CANCELADA'.
    if (estado === 'CANCELADA') {
      // Ahora la comparación es segura.
      if (!id_arrendatario) {
        return sendError(res, new ValidationError('Se requiere el ID del arrendatario.'))
      }
      if (!motivo_rechazo || !motivo_rechazo.trim()) {
        return sendError(
          res,
          new ValidationError('Se requiere un motivo para cancelar la reserva.')
        )
      }

      // Verificación de propiedad de la reserva
      const { data: reserva, error: findError } = await supabase
        .from('reserva')
        .select('id_reserva, estado, propiedad (id_arrendatario)')
        .eq('id_reserva', idReserva)
        .single()

      if (findError) throw new Error(`Error al verificar la reserva: ${findError.message}`)
      if (!reserva) return sendError(res, new ValidationError('Reserva no encontrada.'))

      if (reserva.propiedad.id_arrendatario !== Number(id_arrendatario)) {
        return res
          .status(403)
          .json({ ok: false, message: 'No tienes permiso para modificar esta reserva.' })
      }

      // Solo se pueden cancelar reservas que ya estaban confirmadas.
      const estadoActual = String(reserva.estado || '').toUpperCase()
      if (estadoActual !== 'CONFIRMADA') {
        return sendError(
          res,
          new ValidationError(`No se puede cancelar una reserva en estado '${reserva.estado}'.`)
        )
      }

      const { data: updatedReserva, error: updateError } = await supabase
        .from('reserva')
        .update({ estado: 'CANCELADA', motivo_rechazo: motivo_rechazo.trim() })
        .eq('id_reserva', idReserva)
        .select()
        .single()

      if (updateError) throw updateError

      const [propertyResult, tenantResult, paymentsResult] = await Promise.all([
        supabase.from('propiedad').select('*').eq('id_propiedad', updatedReserva.id_propiedad).maybeSingle(),
        supabase.from('inquilino').select('nombre,correo').eq('id_inquilino', updatedReserva.id_inquilino).maybeSingle(),
        supabase.from('pago').select('estado_pago').eq('id_reserva', updatedReserva.id_reserva),
      ])
      const paidStatuses = ['COMPLETADO', 'COMPLETED', 'CONFIRMADO', 'CONFIRMED', 'PAGADO', 'PAID']
      const hasPayment = (paymentsResult.data || []).some(payment =>
        paidStatuses.includes(String(payment?.estado_pago || '').toUpperCase())
      )
      await sendReservationCancelledEmail({
        to: tenantResult.data?.correo,
        name: tenantResult.data?.nombre,
        propertyTitle: propertyResult.data?.titulo || propertyResult.data?.descripcion,
        startDate: updatedReserva?.fecha_inicio,
        endDate: updatedReserva?.fecha_fin,
        total: updatedReserva?.pago,
        reason: motivo_rechazo.trim(),
        role: 'inquilino',
        hasPayment,
      })

      return res.json({
        ok: true,
        message: `Estado de reserva actualizado a ${estado} correctamente`,
        reserva: updatedReserva,
      })
    }

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

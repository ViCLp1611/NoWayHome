import {
  confirmTenantReservation,
  cancelTenantReservation,
  createTenantReservation,
  getTenantFavorites,
  getTenantProfile,
  getTenantProperties,
  getTenantPropertyById,
  getTenantReservationById,
  getTenantReservations,
  updateTenantProfile,
  ValidationError,
} from '../services/tenantService.js'

function sendError(res, error, fallbackMessage = 'No se pudo completar la solicitud.') {
  if (error instanceof ValidationError || error.statusCode === 400) {
    return res.status(400).json({ ok: false, message: error.message })
  }

  return res.status(500).json({ ok: false, message: fallbackMessage })
}

export async function getTenantProfileHandler(req, res) {
  try {
    const profile = await getTenantProfile(req.params?.id)
    const [reservations, favorites] = await Promise.all([
      getTenantReservations(req.params?.id),
      getTenantFavorites(req.params?.id),
    ])

    return res.json({ ok: true, profile, reservations, favorites })
  } catch (error) {
    return sendError(res, error, 'No se pudo cargar el perfil de inquilino.')
  }
}

export async function updateTenantProfileHandler(req, res) {
  try {
    const profile = await updateTenantProfile(req.params?.id, req.body)

    return res.json({
      ok: true,
      message: 'Perfil actualizado correctamente.',
      profile,
    })
  } catch (error) {
    return sendError(res, error, 'No se pudo actualizar el perfil de inquilino.')
  }
}

export async function listTenantPropertiesHandler(_req, res) {
  try {
    const properties = await getTenantProperties()

    return res.json({ ok: true, properties })
  } catch (error) {
    return sendError(res, error, 'No se pudieron cargar las propiedades.')
  }
}

export async function getTenantPropertyHandler(req, res) {
  try {
    const property = await getTenantPropertyById(req.params?.id)

    return res.json({ ok: true, property })
  } catch (error) {
    return sendError(res, error, 'No se pudo cargar la propiedad.')
  }
}

export async function listTenantReservationsHandler(req, res) {
  try {
    const reservations = await getTenantReservations(
      req.query?.id_inquilino || req.query?.inquilinoId
    )

    return res.json({ ok: true, reservations })
  } catch (error) {
    return sendError(res, error, 'No se pudieron cargar las reservas.')
  }
}

export async function getTenantReservationHandler(req, res) {
  try {
    const reservation = await getTenantReservationById(req.params?.id)

    return res.json({ ok: true, reservation })
  } catch (error) {
    return sendError(res, error, 'No se pudo cargar la reserva.')
  }
}

export async function createTenantReservationHandler(req, res) {
  try {
    const reservation = await createTenantReservation(req.body)

    return res.status(201).json({
      ok: true,
      message: 'Reserva creada correctamente.',
      reservation,
    })
  } catch (error) {
    return sendError(res, error, 'No se pudo crear la reserva.')
  }
}

export async function confirmTenantReservationHandler(req, res) {
  try {
    const reservation = await confirmTenantReservation(req.body?.reservation || req.params?.id)

    return res.json({
      ok: true,
      message: 'Reserva confirmada correctamente.',
      reservation,
    })
  } catch (error) {
    return sendError(res, error, 'No se pudo confirmar la reserva.')
  }
}

export const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params
    const { id_inquilino, motivo_cancelacion } = req.body

    if (!id_inquilino) {
      return sendError(res, new ValidationError('Se requiere el ID del inquilino.'))
    }

    const reservaCancelada = await cancelTenantReservation(id, id_inquilino, motivo_cancelacion)

    // [POLÍTICA DE NEGOCIO] Cancelación exitosa. No se dispara reembolso automático vía API de PayPal. Requiere validación manual.
    console.log(`[INFO] Reserva ${id} cancelada. No se emite reembolso automático.`)

    return res.status(200).json({
      ok: true,
      message: 'Reserva cancelada correctamente.',
      data: reservaCancelada,
    })
  } catch (error) {
    return sendError(res, error, 'No se pudo cancelar la reserva.')
  }
}

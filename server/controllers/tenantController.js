import {
  confirmTenantReservation,
  cancelTenantReservation,
  getTenantFavorites,
  getTenantProfile,
  getTenantProperties,
  getTenantPropertyById,
  getTenantReservations,
  updateTenantProfile,
  ValidationError,
} from '../services/tenantService.js'
import { supabase } from '../config/supabase.js'
import {
  sendReservationCancelledEmail,
  sendReservationCreatedEmail,
} from '../services/emailNotificationService.js'

async function getReservationNotificationContext(reservation) {
  const [propertyResult, tenantResult] = await Promise.all([
    supabase.from('propiedad').select('*').eq('id_propiedad', reservation?.id_propiedad).maybeSingle(),
    supabase.from('inquilino').select('nombre,correo').eq('id_inquilino', reservation?.id_inquilino).maybeSingle(),
  ])
  const property = propertyResult.data || null
  const tenant = tenantResult.data || null
  let landlord = null

  if (property?.id_arrendatario) {
    const result = await supabase
      .from('arrendatario')
      .select('nombre,correo')
      .eq('id_arrendatario', property.id_arrendatario)
      .maybeSingle()
    landlord = result.data || null
  }

  return { property, tenant, landlord }
}

function sendError(res, error, fallbackMessage = 'No se pudo completar la solicitud.') {
  if (error instanceof ValidationError || error.statusCode === 400) {
    return res.status(400).json({ ok: false, message: error.message })
  }

  return res.status(500).json({ ok: false, message: fallbackMessage })
}

export async function getTenantProfileHandler(req, res) {
  try {
    const tenantId = req.params?.id
    if (!tenantId) {
      return sendError(res, new ValidationError('Se requiere el ID del inquilino.'))
    }

    // Se reemplaza la llamada a getTenantReservations para asegurar que la consulta
    // a Supabase incluya la columna 'oculto_para_inquilino'.
    const getReservationsPromise = supabase
      .from('reserva')
      .select('*, propiedad:id_propiedad(*, imagenes:propiedad_imagen(*)), pagos:pago(*)')
      .eq('id_inquilino', tenantId)

    const [profile, { data: reservations, error: reservationsError }, favorites] =
      await Promise.all([
        getTenantProfile(tenantId),
        getReservationsPromise,
        getTenantFavorites(tenantId),
      ])

    if (reservationsError) throw reservationsError

    return res.json({ ok: true, profile, reservations: reservations || [], favorites })
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
    const idReservaParam = req.params?.id
    const { populate } = req.query

    const isCompositeKey = String(idReservaParam).includes('-')

    let query
    if (isCompositeKey) {
      const parts = idReservaParam.split('-')
      const id_propiedad = parseInt(parts[0], 10)
      const id_inquilino = parseInt(parts[1], 10)
      const fecha_inicio = parts.slice(2).join('-') // Reconstruye la fecha (ej: '2026-07-11')

      if (isNaN(id_propiedad) || isNaN(id_inquilino)) {
        return res
          .status(400)
          .json({ ok: false, message: 'El identificador de reserva compuesto no es válido.' })
      }
      query = supabase
        .from('reserva')
        .select(
          '*, inquilino:id_inquilino(*), propiedad:id_propiedad(*, imagenes:propiedad_imagen(*)), pagos:pago(*)'
        )
        .match({ id_propiedad, id_inquilino, fecha_inicio })
        .maybeSingle()
    } else {
      query = supabase
        .from('reserva')
        .select(
          '*, inquilino:id_inquilino(*), propiedad:id_propiedad(*, imagenes:propiedad_imagen(*)), pagos:pago(*)'
        )
        .eq('id_reserva', idReservaParam)
        .maybeSingle()
    }

    const { data: reservation, error: reservationError } = await query

    if (reservationError) {
      throw reservationError
    }

    if (!reservation) {
      return res.status(404).json({ ok: false, message: 'Reserva no encontrada.' })
    }

    // Paso 1.1: Adjuntar el contrato manualmente para evitar el error de relación.
    // El error PGRST200 indica que Supabase no encuentra la relación FK para el join implícito.
    // Esta es una solución alternativa que hace una segunda consulta.
    // La solución ideal es arreglar la FK en la base de datos.
    if (reservation.id_reserva) {
      const { data: contrato, error: contratoError } = await supabase
        .from('contrato')
        .select('*')
        .match({
          id_propiedad: reservation.id_propiedad,
          id_inquilino: reservation.id_inquilino,
          fecha_inicio: reservation.fecha_inicio,
        })

      if (contratoError) {
        console.error(
          `[WORKAROUND] No se pudo obtener el contrato para la reserva ${reservation.id_reserva}:`,
          contratoError.message
        )
        reservation.contrato = []
      } else {
        reservation.contrato = contrato || []
      }
    }

    // Paso 2: Si se solicita y es posible, obtener el arrendatario y adjuntarlo.
    if (populate?.includes('arrendatario') && reservation.propiedad?.id_arrendatario) {
      const { data: arrendatario, error: arrendatarioError } = await supabase
        .from('arrendatario')
        .select('*')
        .eq('id_arrendatario', reservation.propiedad.id_arrendatario)
        .single()

      if (arrendatarioError) {
        // No fallar toda la solicitud si el arrendatario no se encuentra, solo registrar el error.
        console.error(
          `[tenantController] No se pudo obtener el arrendatario para la propiedad ${reservation.propiedad.id_propiedad}:`,
          arrendatarioError.message
        )
        reservation.propiedad.arrendatario = null
      } else {
        reservation.propiedad.arrendatario = arrendatario
      }
    }

    return res.json({ ok: true, reservation })
  } catch (error) {
    console.error('[tenantController] Fallo en getTenantReservationHandler:', error)
    return sendError(res, error, 'No se pudo cargar la reserva.')
  }
}

export async function createTenantReservationHandler(req, res) {
  try {
    // El pago ya no se procesa en este punto.
    const { id_propiedad, id_inquilino, fecha_inicio, fecha_fin, pago } = req.body

    // Validación básica de los datos de entrada.
    if (!id_propiedad || !id_inquilino || !fecha_inicio || !fecha_fin || !pago) {
      return res
        .status(400)
        .json({ ok: false, message: 'Faltan datos para la solicitud de reserva.' })
    }

    const reservationData = {
      id_propiedad,
      id_inquilino,
      fecha_inicio,
      fecha_fin,
      pago, // Guardamos el total esperado, pero no se ha cobrado.
      estado: 'PENDIENTE', // Estado inicial unificado según la nueva regla de negocio.
    }

    const { data: nuevaReserva, error } = await supabase
      .from('reserva')
      .insert(reservationData)
      .select()
      .single()

    if (error) throw error

    const { property, landlord } = await getReservationNotificationContext(nuevaReserva)
    await sendReservationCreatedEmail({
      to: landlord?.correo,
      name: landlord?.nombre,
      propertyTitle: property?.titulo || property?.descripcion,
      startDate: nuevaReserva?.fecha_inicio,
      endDate: nuevaReserva?.fecha_fin,
      total: nuevaReserva?.pago,
      role: 'arrendatario',
    })

    return res.status(201).json({
      ok: true,
      message: '¡Solicitud de reserva enviada! El estado ahora es PENDIENTE.',
      reservation: nuevaReserva,
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

export async function cancelTenantReservationHandler(req, res) {
  try {
    const { id: idReservaParam } = req.params
    const { id_inquilino, motivo_cancelacion } = req.body

    if (!id_inquilino) {
      return sendError(res, new ValidationError('Se requiere el ID del inquilino.'))
    }
    const reservaCancelada = await cancelTenantReservation(
      idReservaParam,
      id_inquilino,
      motivo_cancelacion
    )

    console.log(
      `[INFO] Reserva ${idReservaParam} cancelada por el inquilino. No se emite reembolso automático.`
    )

    const { property, landlord } = await getReservationNotificationContext(reservaCancelada)
    await sendReservationCancelledEmail({
      to: landlord?.correo,
      name: landlord?.nombre,
      propertyTitle: property?.titulo || property?.descripcion,
      startDate: reservaCancelada?.fecha_inicio,
      endDate: reservaCancelada?.fecha_fin,
      total: reservaCancelada?.pago,
      reason: motivo_cancelacion?.trim(),
      role: 'arrendatario',
      hasPayment: reservaCancelada?.pago_confirmado === true,
    })

    return res.status(200).json({
      ok: true,
      message: 'Reserva cancelada correctamente.',
      reserva: reservaCancelada, // Cambiado de 'data' a 'reserva' para consistencia con el frontend
    })
  } catch (error) {
    console.error('[tenantController] Fallo en cancelTenantReservationHandler:', error)
    if (error instanceof ValidationError) {
      return res.status(400).json({ ok: false, message: error.message })
    }
    return sendError(res, error, 'No se pudo cancelar la reserva.')
  }
}

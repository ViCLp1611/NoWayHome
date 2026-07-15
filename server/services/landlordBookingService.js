import { supabase } from '../config/supabase.js'
import {
  sendReservationConfirmedEmail,
  sendReservationRejectedEmail,
} from './emailNotificationService.js'

class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = 400
  }
}

function parsePositiveInteger(value, fieldName) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new ValidationError(`${fieldName} es obligatorio.`)
  }

  return parsedValue
}

function validateStatus(status) {
  const validStatuses = ['CONFIRMADA', 'RECHAZADA']

  if (!validStatuses.includes(String(status || '').toUpperCase())) {
    throw new ValidationError(`Estado no válido. Debe ser: ${validStatuses.join(', ')}.`)
  }

  return String(status).toUpperCase()
}

function validateTransition(currentStatus, nextStatus) {
  const normalizedCurrent = String(currentStatus || 'PENDIENTE').toUpperCase()
  const normalizedNext = String(nextStatus || '').toUpperCase()

  if (normalizedCurrent === normalizedNext) {
    throw new ValidationError('La reserva ya tiene ese estado.')
  }

  if (
    normalizedCurrent === 'PENDIENTE' &&
    (normalizedNext === 'CONFIRMADA' || normalizedNext === 'RECHAZADA')
  ) {
    return
  }

  throw new ValidationError(
    `No se puede cambiar el estado de ${normalizedCurrent} a ${normalizedNext}.`
  )
}

function resolvePropertyPrice(propiedad) {
  const candidates = [propiedad?.precio_por_noche, propiedad?.precio_noche, propiedad?.precio]

  for (const value of candidates) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed
    }
  }

  return 0
}

function calculateTotalFallback(reserva, propiedad) {
  const pago = Number(reserva?.pago)
  if (Number.isFinite(pago) && pago > 0) {
    return pago
  }

  const explicitTotal = Number(reserva?.total)
  if (Number.isFinite(explicitTotal) && explicitTotal >= 0) {
    return explicitTotal
  }

  const startDate = new Date(reserva?.fecha_inicio)
  const endDate = new Date(reserva?.fecha_fin)
  const hasValidDates = !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
  if (!hasValidDates) {
    return 0
  }

  const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  if (nights <= 0) {
    return 0
  }

  const pricePerNight = resolvePropertyPrice(propiedad)
  return pricePerNight > 0 ? nights * pricePerNight : 0
}

function getPrincipalImageByProperty(images) {
  const imagesByProperty = {}

  for (const image of images || []) {
    if (!imagesByProperty[image.id_propiedad]) {
      imagesByProperty[image.id_propiedad] = []
    }

    imagesByProperty[image.id_propiedad].push(image)
  }

  const principalByProperty = {}

  for (const [propertyId, propertyImages] of Object.entries(imagesByProperty)) {
    const ordered = [...propertyImages].sort((a, b) => {
      const orderA = Number.isFinite(Number(a.orden)) ? Number(a.orden) : 9999
      const orderB = Number.isFinite(Number(b.orden)) ? Number(b.orden) : 9999
      return orderA - orderB
    })

    const principal = ordered.find(image => image.es_principal) || ordered[0] || null
    principalByProperty[propertyId] = principal?.url || null
  }

  return principalByProperty
}

export async function getLandlordReservations(idArrendatario) {
  const landlordId = parsePositiveInteger(idArrendatario, 'id_arrendatario')

  // Obtener propiedades del arrendatario
  const { data: propiedades, error: propiedadesError } = await supabase
    .from('propiedad')
    .select('*')
    .eq('id_arrendatario', landlordId)

  if (propiedadesError) {
    throw new Error('No se pudieron cargar las propiedades.')
  }

  if (!propiedades || propiedades.length === 0) {
    return []
  }

  const propertyIds = propiedades.map(p => p.id_propiedad)
  const propertiesById = Object.fromEntries(propiedades.map(item => [item.id_propiedad, item]))

  // Obtener imagen principal por propiedad (si existe)
  const { data: propertyImages, error: imagesError } = await supabase
    .from('propiedad_imagen')
    .select('id_propiedad,url,orden,es_principal')
    .in('id_propiedad', propertyIds)

  if (imagesError) {
    console.error('Error al obtener imágenes de propiedades:', imagesError.message)
  }

  const principalImageByProperty = getPrincipalImageByProperty(propertyImages)

  // Obtener reservas de estas propiedades con id_reserva real.
  let reservas = []
  let reservasError = null

  const primaryReservationsQuery = await supabase
    .from('reserva')
    .select(
      `
      id_reserva,
      id_propiedad,
      id_inquilino,
      fecha_inicio,
      fecha_fin,
      pago,
      estado,
      estado_pago
      `
    )
    .in('id_propiedad', propertyIds)
    .order('fecha_inicio', { ascending: false })

  reservas = primaryReservationsQuery.data || []
  reservasError = primaryReservationsQuery.error || null

  // Fallback por compatibilidad con esquemas sin estado_pago.
  if (reservasError) {
    const fallbackReservationsQuery = await supabase
      .from('reserva')
      .select(
        `
        id_reserva,
        id_propiedad,
        id_inquilino,
        fecha_inicio,
        fecha_fin,
        pago,
        estado
        `
      )
      .in('id_propiedad', propertyIds)
      .order('fecha_inicio', { ascending: false })

    reservas = fallbackReservationsQuery.data || []
    reservasError = fallbackReservationsQuery.error || null
  }

  if (reservasError) {
    throw new Error(`No se pudieron cargar las reservas. ${reservasError.message}`)
  }

  const tenantIds = [...new Set((reservas || []).map(item => item.id_inquilino).filter(Boolean))]
  let tenantsById = {}

  if (tenantIds.length > 0) {
    const { data: inquilinos, error: inquilinosError } = await supabase
      .from('inquilino')
      .select('id_inquilino,nombre,correo,telefono')
      .in('id_inquilino', tenantIds)

    if (inquilinosError) {
      console.error('Error al obtener inquilinos de reservas:', inquilinosError.message)
    } else {
      tenantsById = Object.fromEntries((inquilinos || []).map(item => [item.id_inquilino, item]))
    }
  }

  return (reservas || []).map(reserva => {
    const propiedad = propertiesById[reserva.id_propiedad] || null
    const inquilino = tenantsById[reserva.id_inquilino] || null
    const idReserva = reserva.id_reserva ?? null
    const imagenPrincipal = principalImageByProperty[reserva.id_propiedad] || null
    const total = calculateTotalFallback(reserva, propiedad)
    const estadoNormalizado = String(reserva.estado || 'PENDIENTE').toUpperCase()

    return {
      id: idReserva,
      id_reserva: idReserva,
      id_propiedad: reserva.id_propiedad,
      titulo_propiedad: propiedad?.titulo || propiedad?.descripcion || 'Propiedad',
      imagen_principal: imagenPrincipal,
      id_inquilino: reserva.id_inquilino,
      nombre_inquilino: inquilino?.nombre || null,
      correo_inquilino: inquilino?.correo || null,
      telefono_inquilino: inquilino?.telefono || null,
      fecha_inicio: reserva.fecha_inicio,
      fecha_fin: reserva.fecha_fin,
      total,
      pago: Number.isFinite(Number(reserva.pago)) ? Number(reserva.pago) : null,
      estado: estadoNormalizado,
      estado_pago: reserva.estado_pago || null,
      fecha_creacion: reserva.fecha_creacion || null,
      created_at: reserva.fecha_creacion || null,
      propiedad: {
        id_propiedad: reserva.id_propiedad,
        titulo: propiedad?.titulo || propiedad?.descripcion || 'Propiedad',
        descripcion: propiedad?.descripcion || null,
        imagen_principal: imagenPrincipal,
      },
      inquilino: {
        id_inquilino: reserva.id_inquilino,
        nombre: inquilino?.nombre || null,
        correo: inquilino?.correo || null,
        telefono: inquilino?.telefono || null,
      },
    }
  })
}

export async function updateReservationStatus(idReserva, idArrendatario, nuevoEstado, motivoRechazo = '') {
  const landlordId = parsePositiveInteger(idArrendatario, 'id_arrendatario')
  const estado = validateStatus(nuevoEstado)
  const reservationId = parsePositiveInteger(idReserva, 'id_reserva')

  // Obtener la reserva
  const { data: reserva, error: reservaError } = await supabase
    .from('reserva')
    .select(
      `
      id_reserva,
      id_propiedad,
      id_inquilino,
      fecha_inicio,
      estado,
      propiedad:propiedad(id_arrendatario)
      `
    )
    .eq('id_reserva', reservationId)
    .maybeSingle()

  if (reservaError) {
    throw new Error('No se pudo cargar la reserva.')
  }

  if (!reserva) {
    throw new ValidationError('La reserva no existe.')
  }

  // Validar que el arrendatario sea dueño de la propiedad
  if (!reserva.propiedad || reserva.propiedad.id_arrendatario !== landlordId) {
    throw new ValidationError('No tienes permiso para modificar esta reserva.')
  }

  // Validar transición de estado permitida.
  validateTransition(reserva.estado, estado)
  const motivo = typeof motivoRechazo === 'string' ? motivoRechazo.trim() : ''
  if (estado === 'RECHAZADA' && !motivo) {
    throw new ValidationError('Se requiere un motivo para rechazar la reserva.')
  }
  if (motivo.length > 500) throw new ValidationError('El motivo no puede exceder 500 caracteres.')

  // Actualizar estado
  const { data: updatedReserva, error: updateError } = await supabase
    .from('reserva')
    .update({ estado, ...(estado === 'RECHAZADA' ? { motivo_rechazo: motivo } : {}) })
    .eq('id_reserva', reservationId)
    .select()
    .single()

  if (updateError) {
    throw new Error('No se pudo actualizar la reserva.')
  }

  // --- ENRIQUECER LA RESERVA ACTUALIZADA ---
  // Para asegurar que el frontend reciba un objeto con todos los datos necesarios (propiedad, inquilino, etc.)
  // y no solo los datos planos de la tabla 'reserva'.

  const propertyId = updatedReserva.id_propiedad
  const tenantId = updatedReserva.id_inquilino

  const [propertyResult, imagesResult, tenantResult] = await Promise.all([
    supabase.from('propiedad').select('*').eq('id_propiedad', propertyId).maybeSingle(),
    supabase
      .from('propiedad_imagen')
      .select('id_propiedad,url,orden,es_principal')
      .eq('id_propiedad', propertyId),
    tenantId
      ? supabase
          .from('inquilino')
          .select('id_inquilino,nombre,correo,telefono')
          .eq('id_inquilino', tenantId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  // No se interrumpe la ejecución si falla el enriquecimiento, solo se registra en consola.
  if (propertyResult.error) {
    console.error('Error al enriquecer la reserva (propiedad):', propertyResult.error.message)
  }
  if (imagesResult.error) {
    console.error('Error al enriquecer la reserva (imágenes):', imagesResult.error.message)
  }
  if (tenantResult.error) {
    console.error('Error al enriquecer la reserva (inquilino):', tenantResult.error.message)
  }

  const propiedad = propertyResult.data || null
  const inquilino = tenantResult.data || null
  const principalImageByProperty = getPrincipalImageByProperty(imagesResult.data)
  const imagenPrincipal = principalImageByProperty[propertyId] || null

  const enrichedReservation = {
    ...updatedReserva,
    id: updatedReserva.id_reserva,
    titulo_propiedad: propiedad?.titulo || propiedad?.descripcion || 'Propiedad',
    imagen_principal: imagenPrincipal,
    nombre_inquilino: inquilino?.nombre || null,
    total: calculateTotalFallback(updatedReserva, propiedad),
    propiedad: propiedad ? { ...propiedad, imagen_principal: imagenPrincipal } : null,
    inquilino,
  }

  const notificationData = {
    to: inquilino?.correo,
    name: inquilino?.nombre,
    propertyTitle: propiedad?.titulo || propiedad?.descripcion,
    startDate: updatedReserva?.fecha_inicio,
    endDate: updatedReserva?.fecha_fin,
    total: enrichedReservation.total,
    reason: updatedReserva?.motivo_rechazo,
    role: 'inquilino',
  }

  if (estado === 'CONFIRMADA') {
    await sendReservationConfirmedEmail(notificationData)
  } else if (estado === 'RECHAZADA') {
    await sendReservationRejectedEmail(notificationData)
  }

  return enrichedReservation
}

export { ValidationError }

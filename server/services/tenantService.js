import { supabase } from '../config/supabase.js'

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

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseStoredCapacity(value) {
  const text = normalizeText(value)

  return {
    capacidad: text.match(/Capacidad:\s*(\d+)/i)?.[1]
      ? Number(text.match(/Capacidad:\s*(\d+)/i)[1])
      : null,
    numero_habitaciones: text.match(/Habitaciones:\s*(\d+)/i)?.[1]
      ? Number(text.match(/Habitaciones:\s*(\d+)/i)[1])
      : null,
    numero_banos: text.match(/Banos:\s*(\d+)/i)?.[1]
      ? Number(text.match(/Banos:\s*(\d+)/i)[1])
      : null,
  }
}

function withCapacityFields(property) {
  if (!property) return property

  const storedCapacity = parseStoredCapacity(property.resena)

  return {
    ...property,
    capacidad: property.capacidad ?? storedCapacity.capacidad,
    numero_habitaciones: property.numero_habitaciones ?? storedCapacity.numero_habitaciones,
    numero_banos: property.numero_banos ?? storedCapacity.numero_banos,
  }
}

function withReservationPropertyCapacity(reservation) {
  if (!reservation?.propiedad) return reservation

  return {
    ...reservation,
    propiedad: withCapacityFields(reservation.propiedad),
  }
}

function validateDate(value, fieldName) {
  const normalizedValue = normalizeText(value)
  const date = new Date(normalizedValue)

  if (!normalizedValue || Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} no es valida.`)
  }

  return normalizedValue
}

function normalizeReservationIdentifier(identifier) {
  if (!identifier) {
    throw new ValidationError('Identificador de reserva no valido.')
  }

  if (typeof identifier === 'object') {
    return {
      id: identifier.id,
      id_reserva: identifier.id_reserva,
      id_propiedad: identifier.id_propiedad,
      id_inquilino: identifier.id_inquilino,
      fecha_inicio: identifier.fecha_inicio,
    }
  }

  return { id: identifier }
}

function applyReservationIdentifier(query, identifier) {
  const normalizedIdentifier = normalizeReservationIdentifier(identifier)

  if (normalizedIdentifier.id) {
    return query.eq('id', normalizedIdentifier.id)
  }

  if (normalizedIdentifier.id_reserva) {
    return query.eq('id_reserva', normalizedIdentifier.id_reserva)
  }

  if (
    normalizedIdentifier.id_propiedad &&
    normalizedIdentifier.id_inquilino &&
    normalizedIdentifier.fecha_inicio
  ) {
    return query
      .eq('id_propiedad', normalizedIdentifier.id_propiedad)
      .eq('id_inquilino', normalizedIdentifier.id_inquilino)
      .eq('fecha_inicio', normalizedIdentifier.fecha_inicio)
  }

  throw new ValidationError('Datos de reserva incompletos para confirmar.')
}

function resolveReservationId(reserva) {
  if (reserva?.id_reserva || reserva?.id) {
    return reserva.id_reserva ?? reserva.id
  }

  if (reserva?.id_propiedad && reserva?.id_inquilino && reserva?.fecha_inicio) {
    return `${reserva.id_propiedad}:${reserva.id_inquilino}:${reserva.fecha_inicio}`
  }

  return null
}

function parseReservationCompositeId(idReserva) {
  const raw = decodeURIComponent(String(idReserva || '').trim())
  // Se modifica la regex para aceptar tanto ':' como '-' como separadores.
  const match = raw.match(/^(\d+)[:|-](\d+)[:|-](\d{4}-\d{2}-\d{2})$/)

  if (!match) {
    return null
  }

  return {
    id_propiedad: Number(match[1]),
    id_inquilino: Number(match[2]),
    fecha_inicio: match[3],
  }
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

function splitStoredPropertyDescription(value) {
  const parts = normalizeText(value)
    .split('\n')
    .map(part => part.trim())
    .filter(Boolean)

  return {
    titulo: parts[0] || '',
    descripcion: parts.slice(1).join('\n') || '',
  }
}

function getPropertyTitle(propiedad, idPropiedad) {
  const storedDescription = splitStoredPropertyDescription(propiedad?.descripcion)

  return (
    normalizeText(propiedad?.titulo) ||
    normalizeText(propiedad?.nombre) ||
    storedDescription.titulo ||
    `Propiedad ${idPropiedad || ''}`.trim()
  )
}

function getPropertyLocation(propiedad) {
  return (
    normalizeText(propiedad?.ubicacion) ||
    normalizeText(propiedad?.ciudad) ||
    normalizeText(propiedad?.direccion) ||
    ''
  )
}

function normalizeProfileReservation(row) {
  if (!row) return null

  return {
    ...row,
    id: row.id_reserva,
    id_reserva: row.id_reserva,
    titulo_propiedad: row.titulo,
    ubicacion_propiedad: row.ubicacion,
    imagen_principal: row.imagen_portada,
    fecha_inicio: row.fecha_entrada,
    fecha_fin: row.fecha_salida,
    estado: row.estado_reserva,
    pago: row.total_pagado,
    total: row.total_pagado,
    precio_total: row.total_pagado,
    tarifa_servicio: row.comision_y_otros,
    propiedad: {
      id_propiedad: row.id_propiedad,
      titulo: row.titulo,
      ubicacion: row.ubicacion,
      direccion: row.ubicacion,
      imagen_principal: row.imagen_portada,
      precio: row.precio_base,
    },
  }
}

async function enrichReservationsWithProperties(reservations) {
  const propertyIds = [
    ...new Set((reservations || []).map(item => item.id_propiedad).filter(Boolean)),
  ]

  if (propertyIds.length === 0) {
    return reservations || []
  }

  let propertiesById = {}

  const { data: properties, error: propertiesError } = await supabase
    .from('propiedad')
    .select('*')
    .in('id_propiedad', propertyIds)

  if (propertiesError) {
    console.error('Error al obtener propiedades de reservas:', propertiesError.message)
  } else {
    propertiesById = Object.fromEntries((properties || []).map(item => [item.id_propiedad, item]))
  }

  const { data: images, error: imagesError } = await supabase
    .from('propiedad_imagen')
    .select('id_propiedad,url,orden,es_principal')
    .in('id_propiedad', propertyIds)

  if (imagesError) {
    console.error('Error al obtener imagenes de propiedades reservadas:', imagesError.message)
  }

  const principalImageByProperty = getPrincipalImageByProperty(images)

  return (reservations || []).map(reserva => {
    const propiedad = propertiesById[reserva.id_propiedad] || reserva.propiedad || null
    const imagenPrincipal =
      reserva.imagen_principal ||
      propiedad?.imagen_principal ||
      principalImageByProperty[reserva.id_propiedad] ||
      null
    const tituloPropiedad =
      reserva.titulo_propiedad ||
      getPropertyTitle(propiedad, reserva.id_propiedad) ||
      `Propiedad ${reserva.id_propiedad || ''}`.trim()
    const ubicacionPropiedad =
      reserva.ubicacion_propiedad ||
      getPropertyLocation(propiedad) ||
      reserva.ubicacion ||
      reserva.direccion ||
      ''
    const storedDescription = splitStoredPropertyDescription(propiedad?.descripcion)

    return {
      ...reserva,
      id: resolveReservationId(reserva),
      id_reserva: resolveReservationId(reserva),
      titulo_propiedad: tituloPropiedad,
      ubicacion_propiedad: ubicacionPropiedad,
      imagen_principal: imagenPrincipal,
      propiedad: propiedad
        ? {
            ...propiedad,
            titulo: tituloPropiedad,
            descripcion_detalle: storedDescription.descripcion || propiedad.descripcion || null,
            ubicacion: ubicacionPropiedad,
            imagen_principal: imagenPrincipal,
          }
        : null,
    }
  })
}

export async function getTenantProfile(idInquilino) {
  const tenantId = parsePositiveInteger(idInquilino, 'id_inquilino')

  const { data, error } = await supabase
    .from('inquilino')
    .select('id_inquilino,nombre,correo,telefono')
    .eq('id_inquilino', tenantId)
    .maybeSingle()

  if (error) {
    throw new Error('No se pudo cargar el perfil de inquilino.')
  }

  if (!data) {
    throw new ValidationError('El perfil de inquilino no existe.')
  }

  return data
}

export async function updateTenantProfile(idInquilino, updates) {
  const tenantId = parsePositiveInteger(idInquilino, 'id_inquilino')
  const nombre = normalizeText(updates?.nombre)
  const telefono = normalizeText(updates?.telefono).replace(/\D/g, '')

  if (!nombre) {
    throw new ValidationError('El nombre es obligatorio.')
  }

  if (telefono && telefono.length !== 10) {
    throw new ValidationError('El telefono debe contener exactamente 10 numeros.')
  }

  const { data, error } = await supabase
    .from('inquilino')
    .update({ nombre, telefono })
    .eq('id_inquilino', tenantId)
    .select('id_inquilino,nombre,correo,telefono')
    .single()

  if (error) {
    throw new Error('No se pudo actualizar el perfil de inquilino.')
  }

  return data
}

export async function getTenantReservations(idInquilino) {
  const tenantId = parsePositiveInteger(idInquilino, 'id_inquilino')

  const { data, error } = await supabase
    .from('reserva')
    .select(
      '*, propiedad:propiedad(id_propiedad,descripcion,titulo,ubicacion,precio_noche,precio,direccion,estado,resena,latitud,longitud,capacidad,numero_habitaciones,numero_banos)'
    )
    .eq('id_inquilino', tenantId)
    .order('fecha_inicio', { ascending: false })

  if (!error) {
    return (data || []).map(withReservationPropertyCapacity)
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('reserva')
    .select('*')
    .eq('id_inquilino', tenantId)
    .order('fecha_entrada', { ascending: false })

  if (!fallbackError) {
    return (fallbackData || []).map(withReservationPropertyCapacity)
  }

  const { data: profileData, error: profileError } = await supabase
    .from('vista_perfil_reservas')
    .select('*')
    .eq('id_inquilino', tenantId)
    .order('fecha_entrada', { ascending: false })

  if (profileError) {
    throw new Error('No se pudieron cargar las reservas.')
  }

  const normalized = (profileData || []).map(normalizeProfileReservation)
  return enrichReservationsWithProperties(normalized)
}

export async function getTenantReservationById(idReserva) {
  const rawReservationId = decodeURIComponent(String(idReserva || '').trim())
  const parsedReservationId = Number(rawReservationId)
  const reservationId =
    Number.isInteger(parsedReservationId) && parsedReservationId > 0 ? parsedReservationId : null
  const baseSelect =
    '*, propiedad:propiedad(id_propiedad,descripcion,titulo,ubicacion,precio_noche,precio,direccion,estado,resena,latitud,longitud,capacidad,numero_habitaciones,numero_banos)'

  let data = null
  let error = null

  if (reservationId) {
    let query = supabase
      .from('reserva')
      .select(baseSelect)
      .eq('id_reserva', reservationId)
      .maybeSingle()
    ;({ data, error } = await query)

    if (error || !data) {
      query = supabase.from('reserva').select(baseSelect).eq('id', reservationId).maybeSingle()
      ;({ data, error } = await query)
    }
  }

  if (!data) {
    const compositeId = parseReservationCompositeId(rawReservationId)

    if (compositeId) {
      const compositeQuery = supabase
        .from('reserva')
        .select(baseSelect)
        .eq('id_propiedad', compositeId.id_propiedad)
        .eq('id_inquilino', compositeId.id_inquilino)
        .eq('fecha_inicio', compositeId.fecha_inicio)
        .maybeSingle()

      ;({ data, error } = await compositeQuery)
    }
  }

  if (!data) {
    const { data: profileData, error: profileError } = await supabase
      .from('vista_perfil_reservas')
      .select('*')
      .eq('id_reserva', rawReservationId)
      .maybeSingle()

    if (!profileError && profileData) {
      const [enriched] = await enrichReservationsWithProperties([
        normalizeProfileReservation(profileData),
      ])
      return enriched
    }

    error = profileError || error
  }

  if (error) {
    throw new Error('No se pudo cargar la reserva.')
  }

  if (!data) {
    throw new ValidationError('La reserva no existe.')
  }

  const propertyId = data.propiedad?.id_propiedad
  if (propertyId && data.propiedad) {
    const { data: images, error: imagesError } = await supabase
      .from('propiedad_imagen')
      .select('id_imagen, url, orden, es_principal')
      .eq('id_propiedad', propertyId)
      .order('orden', { ascending: true })

    if (imagesError) {
      console.error(
        `Error al obtener imágenes para la propiedad ${propertyId}:`,
        imagesError.message
      )
      data.propiedad.imagenes = []
    } else {
      data.propiedad.imagenes = images || []
    }

    if (!data.propiedad.imagen_principal) {
      const mainImage = (images || []).find(img => img.es_principal) || (images || [])[0] || null
      if (mainImage) {
        data.propiedad.imagen_principal = mainImage.url
      }
    }
  }
  return withReservationPropertyCapacity(data)
}

export async function getTenantFavorites(idInquilino) {
  const tenantId = parsePositiveInteger(idInquilino, 'id_inquilino')

  const { data, error } = await supabase
    .from('favoritos')
    .select(
      '*, propiedad:propiedad(id_propiedad,descripcion,titulo,ubicacion,precio_noche,precio,direccion,resena,latitud,longitud,capacidad,numero_habitaciones,numero_banos)'
    )
    .eq('id_inquilino', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === '42P01' || /Could not find the table/i.test(error.message)) {
      return []
    }

    throw new Error('No se pudieron cargar los favoritos.')
  }

  return (data || []).map(favorite => ({
    ...favorite,
    propiedad: withCapacityFields(favorite.propiedad),
  }))
}

export async function getTenantProperties() {
  const { data: properties, error: propertiesError } = await supabase
    .from('propiedad')
    .select('*')
    .order('id_propiedad', { ascending: false })

  if (propertiesError) {
    throw new Error('No se pudieron cargar las propiedades.')
  }

  if (!properties || properties.length === 0) {
    return []
  }

  // Identificar propiedades con reservas activas para excluirlas del catálogo
  const today = new Date().toISOString().split('T')[0]
  const { data: activeReservations, error: reservationsError } = await supabase
    .from('reserva')
    .select('id_propiedad')
    .in('estado', ['pendiente', 'confirmada', 'confirmed'])
    .gte('fecha_fin', today)

  if (reservationsError) {
    // No bloqueamos la carga, pero advertimos que el filtro de disponibilidad falló
    console.error(
      'Error al verificar reservas activas, se mostrarán todas las propiedades:',
      reservationsError.message
    )
  }

  const reservedPropertyIds = new Set((activeReservations || []).map(r => r.id_propiedad))

  // Filtrar el arreglo de propiedades para DEJAR ÚNICAMENTE las que no están reservadas
  const availableProperties = properties.filter(
    property => !reservedPropertyIds.has(property.id_propiedad)
  )

  if (availableProperties.length === 0) {
    return []
  }

  // Obtener todas las imágenes para las propiedades disponibles
  const propertyIds = availableProperties.map(p => p.id_propiedad)
  const { data: images, error: imagesError } = await supabase
    .from('propiedad_imagen')
    .select('id_imagen, id_propiedad, url, storage_path, orden, es_principal')
    .in('id_propiedad', propertyIds)
    .order('orden', { ascending: true })

  if (imagesError) {
    console.error('Error al obtener imágenes:', imagesError)
  }

  // Agrupar imágenes por id_propiedad
  const imagesByProperty = {}
  if (images) {
    images.forEach(img => {
      if (!imagesByProperty[img.id_propiedad]) {
        imagesByProperty[img.id_propiedad] = []
      }
      imagesByProperty[img.id_propiedad].push(img)
    })
  }

  // Para cada propiedad disponible, asignar su imagen principal
  const propertiesWithImages = availableProperties.map(property => {
    const propertyImages = imagesByProperty[property.id_propiedad] || []

    // Regla: buscar imagen con es_principal = true, sino la primera ordenada
    const mainImage = propertyImages.find(img => img.es_principal) || propertyImages[0] || null

    return {
      ...withCapacityFields(property),
      imagen_principal: mainImage ? mainImage.url : null,
    }
  })

  return propertiesWithImages
}

export async function getTenantPropertyById(idPropiedad) {
  const propertyId = parsePositiveInteger(idPropiedad, 'id_propiedad')

  const { data: property, error: propertyError } = await supabase
    .from('propiedad')
    .select('*')
    .eq('id_propiedad', propertyId)
    .maybeSingle()

  if (propertyError) {
    throw new Error('No se pudo cargar la propiedad.')
  }

  if (!property) {
    throw new ValidationError('La propiedad no existe.')
  }

  // Obtener todas las imágenes de esta propiedad
  const { data: images, error: imagesError } = await supabase
    .from('propiedad_imagen')
    .select('id_imagen, id_propiedad, url, storage_path, orden, es_principal')
    .eq('id_propiedad', propertyId)
    .order('orden', { ascending: true })

  if (imagesError) {
    console.error('Error al obtener imágenes:', imagesError)
  }

  // Encontrar imagen principal
  const propertyImages = images || []
  const mainImage = propertyImages.find(img => img.es_principal) || propertyImages[0] || null

  return {
    ...withCapacityFields(property),
    imagenes: propertyImages,
    imagen_principal: mainImage ? mainImage.url : null,
  }
}

export async function createTenantReservation(reservationData) {
  const idInquilino = parsePositiveInteger(reservationData?.id_inquilino, 'id_inquilino')
  const idPropiedad = parsePositiveInteger(reservationData?.id_propiedad, 'id_propiedad')
  const fechaInicio = validateDate(reservationData?.fecha_inicio, 'fecha_inicio')
  const fechaFin = validateDate(reservationData?.fecha_fin, 'fecha_fin')
  const pago = Number(reservationData?.pago)

  if (new Date(fechaFin) <= new Date(fechaInicio)) {
    throw new ValidationError('La fecha de fin debe ser posterior a la fecha de inicio.')
  }

  if (!Number.isFinite(pago) || pago <= 0) {
    throw new ValidationError('El pago debe ser mayor a 0.')
  }

  // Validar disponibilidad para evitar solapamiento de reservas
  const { data: conflictingReservations, error: conflictCheckError } = await supabase
    .from('reserva')
    .select('id_propiedad, fecha_inicio, fecha_fin', { count: 'exact', head: true })
    .eq('id_propiedad', idPropiedad)
    .in('estado', ['pendiente', 'confirmada', 'confirmed'])
    .lt('fecha_inicio', fechaFin) // Una reserva existente comienza antes de que termine la nueva
    .gt('fecha_fin', fechaInicio) // Y termina después de que comience la nueva

  if (conflictCheckError) {
    console.error('Error al verificar conflictos de reserva:', conflictCheckError.message)
    throw new Error('No se pudo verificar la disponibilidad de la propiedad.')
  }

  if (conflictingReservations && conflictingReservations.length > 0) {
    throw new Error(
      'La propiedad ya se encuentra reservada o apartada para las fechas seleccionadas.'
    )
  }

  const payload = {
    id_inquilino: idInquilino,
    id_propiedad: idPropiedad,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    pago,
    estado: normalizeText(reservationData?.estado) || 'pendiente',
  }

  const { data, error } = await supabase.from('reserva').insert(payload).select().single()

  if (error) {
    throw new Error('No se pudo crear la reserva.')
  }

  return data
}

export async function cancelTenantReservation(idReserva, idInquilino, motivoCancelacion) {
  const reservationId = decodeURIComponent(String(idReserva || '').trim())
  const tenantId = parsePositiveInteger(idInquilino, 'id_inquilino')
  const motivo = normalizeText(motivoCancelacion)

  if (!motivo) {
    throw new ValidationError('El motivo de cancelación es obligatorio.')
  }

  const compositeId = parseReservationCompositeId(reservationId)

  if (!compositeId) {
    throw new ValidationError('Identificador de reserva no válido.')
  }

  if (compositeId.id_inquilino !== tenantId) {
    throw new ValidationError('No tienes permiso para cancelar esta reserva.')
  }

  const { data: reservation, error: fetchError } = await supabase
    .from('reserva')
    .select('estado')
    .eq('id_propiedad', compositeId.id_propiedad)
    .eq('id_inquilino', compositeId.id_inquilino)
    .eq('fecha_inicio', compositeId.fecha_inicio)
    .single()

  if (fetchError || !reservation) {
    throw new Error('Reserva no encontrada.')
  }

  const currentState = String(reservation.estado || '')
    .trim()
    .toLowerCase()
  const cancellableStates = ['pendiente', 'confirmada', 'confirmed']
  if (!cancellableStates.includes(currentState)) {
    throw new ValidationError(
      `Transición de estado inválida. La reserva ya está en estado "${reservation.estado}".`
    )
  }

  const { data: updatedReservation, error: updateError } = await supabase
    .from('reserva')
    .update({ estado: 'cancelada', motivo_cancelacion: motivo })
    .eq('id_propiedad', compositeId.id_propiedad)
    .eq('id_inquilino', compositeId.id_inquilino)
    .eq('fecha_inicio', compositeId.fecha_inicio)
    .select()
    .single()

  if (updateError) {
    throw new Error('No se pudo cancelar la reserva.')
  }

  return updatedReservation
}

export async function confirmTenantReservation(identifier) {
  const baseQuery = supabase.from('reserva').update({ estado: 'confirmada' })
  const query = applyReservationIdentifier(baseQuery, identifier)
  const { data, error } = await query.select()

  if (error) {
    throw new Error('No se pudo confirmar la reserva.')
  }

  const reservation = Array.isArray(data) ? data[0] : data

  if (!reservation) {
    throw new ValidationError('La reserva no existe o no se pudo confirmar.')
  }

  return reservation
}

export { ValidationError }

import { supabase } from '../config/supabase.js'
import { deletePropertyImages, uploadPropertyImages } from './storageService.js'

class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = 400
  }
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function parsePositiveNumber(value, fieldName) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new ValidationError(`${fieldName} debe ser mayor a 0.`)
  }

  return numberValue
}

function parseNonNegativeInteger(value, fieldName) {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new ValidationError(`${fieldName} debe ser mayor o igual a 0.`)
  }

  return numberValue
}

function normalizePriceType(value) {
  const tipoPrecio = normalizeText(value) || 'noche'

  if (tipoPrecio !== 'noche' && tipoPrecio !== 'mensual') {
    throw new ValidationError('El tipo de precio no es valido.')
  }

  return tipoPrecio
}

function normalizePropertyStatus(value) {
  const estado = normalizeText(value) || 'activa'

  if (estado !== 'activa' && estado !== 'inactiva' && estado !== 'suspendida') {
    throw new ValidationError('El estado de la propiedad no es valido.')
  }

  return estado
}

function normalizeListedStatus(value) {
  const status = normalizeText(value).toLowerCase()

  if (status === 'disponible') return 'activa'
  if (status === 'activa' || status === 'inactiva' || status === 'suspendida') return status
  return status || 'activa'
}

function normalizeEditablePropertyStatus(value, currentStatus) {
  const normalizedCurrentStatus = normalizeListedStatus(currentStatus)
  const estado = normalizeText(value) || normalizedCurrentStatus

  if (normalizedCurrentStatus === 'suspendida' && estado !== 'suspendida') {
    throw new ValidationError('No puedes cambiar el estado de una propiedad suspendida.')
  }

  if (normalizedCurrentStatus === 'suspendida') {
    return 'suspendida'
  }

  if (estado !== 'activa' && estado !== 'inactiva') {
    throw new ValidationError('El estado debe ser activa o inactiva.')
  }

  return estado
}

function validatePropertyData(data) {
  const titulo = normalizeText(data?.titulo)
  const descripcion = normalizeText(data?.descripcion)
  const direccion = normalizeText(data?.direccion)
  const ciudad = normalizeText(data?.ciudad)
  const pais = normalizeText(data?.pais)
  const tipoPrecio = normalizePriceType(data?.tipo_precio)
  const estado = normalizePropertyStatus(data?.estado)
  const idArrendatario = Number(data?.id_arrendatario)
  const precioPorNoche = parsePositiveNumber(data?.precio_por_noche, 'precio_por_noche')
  const capacidad = parsePositiveNumber(data?.capacidad, 'capacidad')
  const numeroHabitaciones = parseNonNegativeInteger(data?.numero_habitaciones, 'numero_habitaciones')
  const numeroBanos = parseNonNegativeInteger(data?.numero_banos, 'numero_banos')

  if (!titulo) throw new ValidationError('titulo es obligatorio.')
  if (!descripcion) throw new ValidationError('descripcion es obligatoria.')
  if (!direccion) throw new ValidationError('direccion es obligatoria.')
  if (!ciudad) throw new ValidationError('ciudad es obligatoria.')
  if (!pais) throw new ValidationError('pais es obligatorio.')
  if (!Number.isInteger(idArrendatario) || idArrendatario <= 0) {
    throw new ValidationError('id_arrendatario es obligatorio.')
  }

  return {
    titulo,
    descripcion,
    direccion,
    ciudad,
    pais,
    tipoPrecio,
    estado,
    idArrendatario,
    precioPorNoche,
    capacidad,
    numeroHabitaciones,
    numeroBanos,
  }
}

function validateEditablePropertyData(data, currentStatus) {
  const propertyData = validatePropertyData(data)

  return {
    ...propertyData,
    estado: normalizeEditablePropertyStatus(data?.estado, currentStatus),
  }
}

function buildPropertyPayload(propertyData) {
  return {
    descripcion: `${propertyData.titulo}\n\n${propertyData.descripcion}`,
    direccion: `${propertyData.direccion}, ${propertyData.ciudad}, ${propertyData.pais}`,
    precio: propertyData.precioPorNoche,
    tipo_precio: propertyData.tipoPrecio,
    estado: propertyData.estado,
    resena: `Capacidad: ${propertyData.capacidad}. Habitaciones: ${propertyData.numeroHabitaciones}. Banos: ${propertyData.numeroBanos}.`,
  }
}

function buildPropertyInsertPayload(propertyData) {
  return {
    ...buildPropertyPayload(propertyData),
    id_arrendatario: propertyData.idArrendatario,
  }
}

export async function createProperty(data, files) {
  const propertyData = validatePropertyData(data)
  const propertyPayload = buildPropertyInsertPayload(propertyData)
  let createdProperty = null
  let uploadedImages = []

  try {
    const { data: property, error: propertyError } = await supabase
      .from('propiedad')
      .insert(propertyPayload)
      .select('id_propiedad,descripcion,direccion,precio,tipo_precio,estado,resena,id_arrendatario')
      .single()

    if (propertyError) {
      throw new Error('No se pudo crear la propiedad.')
    }

    createdProperty = property
    uploadedImages = await uploadPropertyImages(property.id_propiedad, files)

    const imagePayload = uploadedImages.map((image) => ({
      id_propiedad: property.id_propiedad,
      url: image.url,
      storage_path: image.storage_path,
      orden: image.orden,
      es_principal: image.es_principal,
    }))

    const { data: images, error: imageError } = await supabase
      .from('propiedad_imagen')
      .insert(imagePayload)
      .select('id_imagen,id_propiedad,url,storage_path,orden,es_principal,fecha_creacion')

    if (imageError) {
      throw new Error('No se pudieron guardar las imagenes de la propiedad.')
    }

    return {
      property,
      images,
    }
  } catch (error) {
    await deletePropertyImages(uploadedImages.map((image) => image.storage_path))

    if (createdProperty?.id_propiedad) {
      await supabase.from('propiedad').delete().eq('id_propiedad', createdProperty.id_propiedad)
    }

    throw error
  }
}

function splitStoredDescription(value) {
  const parts = normalizeText(value)
    .split('\n')
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    titulo: parts[0] || 'Propiedad sin titulo',
    descripcion: parts.slice(1).join('\n') || '',
  }
}

function splitStoredAddress(value) {
  const parts = normalizeText(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    direccion: parts.slice(0, Math.max(parts.length - 2, 1)).join(', '),
    ciudad: parts.length >= 2 ? parts[parts.length - 2] : '',
    pais: parts.length >= 1 ? parts[parts.length - 1] : '',
  }
}

function parseStoredCapacity(value) {
  const text = normalizeText(value)

  return {
    capacidad: Number(text.match(/Capacidad:\s*(\d+)/i)?.[1] || 0),
    numero_habitaciones: Number(text.match(/Habitaciones:\s*(\d+)/i)?.[1] || 0),
    numero_banos: Number(text.match(/Banos:\s*(\d+)/i)?.[1] || 0),
  }
}

async function getPropertyImages(propertyIds) {
  const imagesByPropertyId = new Map()

  if (propertyIds.length === 0) {
    return imagesByPropertyId
  }

  const { data: images, error: imagesError } = await supabase
    .from('propiedad_imagen')
    .select('id_imagen,id_propiedad,url,storage_path,orden,es_principal,fecha_creacion')
    .in('id_propiedad', propertyIds)
    .order('orden', { ascending: true })

  if (imagesError) {
    throw new Error('No se pudieron cargar las imagenes de las propiedades.')
  }

  ;(images || []).forEach((image) => {
    const currentImages = imagesByPropertyId.get(image.id_propiedad) || []
    currentImages.push(image)
    imagesByPropertyId.set(image.id_propiedad, currentImages)
  })

  return imagesByPropertyId
}

function mapPropertyForLandlord(property, imagesByPropertyId) {
  const description = splitStoredDescription(property.descripcion)
  const address = splitStoredAddress(property.direccion)
  const capacity = parseStoredCapacity(property.resena)
  const images = imagesByPropertyId.get(property.id_propiedad) || []
  const mainImage = images.find((image) => image.es_principal) || images[0] || null

  return {
    id_propiedad: property.id_propiedad,
    titulo: description.titulo,
    descripcion: description.descripcion,
    direccion: address.direccion,
    ciudad: address.ciudad,
    pais: address.pais,
    precio_por_noche: property.precio,
    tipo_precio: property.tipo_precio || 'noche',
    capacidad: capacity.capacidad,
    numero_habitaciones: capacity.numero_habitaciones,
    numero_banos: capacity.numero_banos,
    estado: normalizeListedStatus(property.estado),
    fecha_publicacion: null,
    imagen_principal: mainImage?.url || '',
    imagenes: images,
  }
}

export async function getLandlordProperties(idArrendatario) {
  const landlordId = Number(idArrendatario)

  if (!Number.isInteger(landlordId) || landlordId <= 0) {
    throw new ValidationError('id_arrendatario es obligatorio.')
  }

  const { data: properties, error: propertiesError } = await supabase
    .from('propiedad')
    .select('id_propiedad,descripcion,direccion,precio,tipo_precio,estado,resena,id_arrendatario')
    .eq('id_arrendatario', landlordId)
    .order('id_propiedad', { ascending: false })

  if (propertiesError) {
    throw new Error('No se pudieron cargar las propiedades.')
  }

  const propertyIds = (properties || []).map((property) => property.id_propiedad)
  const imagesByPropertyId = await getPropertyImages(propertyIds)

  return (properties || []).map((property) => mapPropertyForLandlord(property, imagesByPropertyId))
}

export async function getLandlordPropertyById(idPropiedad, idArrendatario) {
  const propertyId = Number(idPropiedad)
  const landlordId = Number(idArrendatario)

  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    throw new ValidationError('id_propiedad es obligatorio.')
  }

  if (!Number.isInteger(landlordId) || landlordId <= 0) {
    throw new ValidationError('id_arrendatario es obligatorio.')
  }

  const { data: property, error: propertyError } = await supabase
    .from('propiedad')
    .select('id_propiedad,descripcion,direccion,precio,tipo_precio,estado,resena,id_arrendatario')
    .eq('id_propiedad', propertyId)
    .maybeSingle()

  if (propertyError) {
    throw new Error('No se pudo cargar la propiedad.')
  }

  if (!property) {
    throw new ValidationError('La propiedad no existe.')
  }

  if (Number(property.id_arrendatario) !== landlordId) {
    throw new ValidationError('No tienes permiso para acceder a esta propiedad.')
  }

  const imagesByPropertyId = await getPropertyImages([propertyId])
  return mapPropertyForLandlord(property, imagesByPropertyId)
}

export async function updateLandlordProperty(idPropiedad, data, files = []) {
  const propertyId = Number(idPropiedad)
  const landlordId = Number(data?.id_arrendatario)

  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    throw new ValidationError('id_propiedad es obligatorio.')
  }

  if (!Number.isInteger(landlordId) || landlordId <= 0) {
    throw new ValidationError('id_arrendatario es obligatorio.')
  }

  const currentProperty = await getLandlordPropertyById(propertyId, landlordId)
  const propertyData = validateEditablePropertyData(data, currentProperty.estado)
  const propertyPayload = buildPropertyPayload(propertyData)
  const existingImages = currentProperty.imagenes || []
  const newFiles = files || []

  if (existingImages.length + newFiles.length > 20) {
    throw new ValidationError('Solo puedes tener un maximo de 20 fotografias.')
  }

  let uploadedImages = []

  try {
    const { data: property, error: propertyError } = await supabase
      .from('propiedad')
      .update(propertyPayload)
      .eq('id_propiedad', propertyId)
      .eq('id_arrendatario', landlordId)
      .select('id_propiedad,descripcion,direccion,precio,tipo_precio,estado,resena,id_arrendatario')
      .single()

    if (propertyError) {
      throw new Error('No se pudo actualizar la propiedad.')
    }

    if (newFiles.length > 0) {
      const maxExistingOrder = existingImages.reduce(
        (maxOrder, image) => Math.max(maxOrder, Number(image.orden) || 0),
        0
      )

      uploadedImages = await uploadPropertyImages(propertyId, newFiles, {
        startOrder: maxExistingOrder + 1,
        markFirstAsPrincipal: existingImages.length === 0,
      })

      const imagePayload = uploadedImages.map((image) => ({
        id_propiedad: propertyId,
        url: image.url,
        storage_path: image.storage_path,
        orden: image.orden,
        es_principal: image.es_principal,
      }))

      const { error: imageError } = await supabase.from('propiedad_imagen').insert(imagePayload)

      if (imageError) {
        throw new Error('No se pudieron guardar las imagenes nuevas de la propiedad.')
      }
    }

    const imagesByPropertyId = await getPropertyImages([propertyId])
    return mapPropertyForLandlord(property, imagesByPropertyId)
  } catch (error) {
    await deletePropertyImages(uploadedImages.map((image) => image.storage_path))
    throw error
  }
}

export { ValidationError }

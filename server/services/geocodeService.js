import { GEOAPIFY_API_KEY } from '../config/env.js'

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

export async function geocodeAddress(address) {
  const normalizedAddress = normalizeText(address)

  if (!normalizedAddress) {
    throw new ValidationError('La direccion es requerida.')
  }

  if (!GEOAPIFY_API_KEY) {
    const error = new Error('Servicio de geocodificacion no configurado.')
    error.statusCode = 500
    throw error
  }

  const params = new URLSearchParams({
    text: normalizedAddress,
    limit: '1',
    apiKey: GEOAPIFY_API_KEY,
  })

  let response
  try {
    response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    throw new Error('El servicio de geocodificacion no respondio a tiempo.')
  }

  if (!response.ok) {
    throw new Error('No se pudo consultar el servicio de geocodificacion.')
  }

  const data = await response.json()
  const feature = data?.features?.[0]

  if (!feature) {
    const error = new ValidationError('No se encontro una ubicacion para esa direccion.')
    error.statusCode = 404
    throw error
  }

  const properties = feature.properties || {}
  const coordinates = feature.geometry?.coordinates || []
  const longitud = Number(properties.lon ?? coordinates[0])
  const latitud = Number(properties.lat ?? coordinates[1])

  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
    throw new Error('La respuesta de geocodificacion no incluyo coordenadas validas.')
  }

  return {
    latitud,
    longitud,
    direccion_formateada: properties.formatted || normalizedAddress,
  }
}

export { ValidationError }

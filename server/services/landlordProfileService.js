import { supabase } from '../config/supabase.js'

class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = 400
  }
}

const ALLOWED_UPDATE_FIELDS = ['nombre', 'telefono']

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseLandlordId(idArrendatario) {
  const landlordId = Number(idArrendatario)

  if (!Number.isInteger(landlordId) || landlordId <= 0) {
    throw new ValidationError('id_arrendatario es obligatorio.')
  }

  return landlordId
}

function mapLandlordProfile(profile) {
  return {
    id_arrendatario: profile.id_arrendatario,
    nombre: profile.nombre || '',
    correo: profile.correo || '',
    email: profile.correo || '',
    telefono: profile.telefono || '',
  }
}

function validateUpdatePayload(data) {
  const receivedFields = Object.keys(data || {})
  const unsupportedFields = receivedFields.filter(field => !ALLOWED_UPDATE_FIELDS.includes(field))

  if (unsupportedFields.length > 0) {
    throw new ValidationError('Solo puedes actualizar nombre y telefono desde esta seccion.')
  }

  const nombre = normalizeText(data?.nombre)
  const rawTelefono = normalizeText(data?.telefono)
  const telefono = rawTelefono.replace(/\D/g, '')

  if (!nombre) {
    throw new ValidationError('El nombre es obligatorio.')
  }

  if (rawTelefono && (telefono.length < 7 || telefono.length > 20)) {
    throw new ValidationError('Ingresa un telefono valido.')
  }

  return {
    nombre,
    telefono,
  }
}

export async function getLandlordProfile(idArrendatario) {
  const landlordId = parseLandlordId(idArrendatario)

  const { data: profile, error } = await supabase
    .from('arrendatario')
    .select('id_arrendatario,nombre,correo,telefono')
    .eq('id_arrendatario', landlordId)
    .maybeSingle()

  if (error) {
    throw new Error('No se pudo cargar el perfil del arrendatario.')
  }

  if (!profile) {
    throw new ValidationError('El perfil del arrendatario no existe.')
  }

  return mapLandlordProfile(profile)
}

export async function updateLandlordProfile(idArrendatario, data) {
  const landlordId = parseLandlordId(idArrendatario)
  const profileData = validateUpdatePayload(data)

  await getLandlordProfile(landlordId)

  const { data: updatedProfile, error } = await supabase
    .from('arrendatario')
    .update(profileData)
    .eq('id_arrendatario', landlordId)
    .select('id_arrendatario,nombre,correo,telefono')
    .single()

  if (error) {
    throw new Error('No se pudo actualizar tu informacion.')
  }

  return mapLandlordProfile(updatedProfile)
}

export { ValidationError }

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function createProperty(formData) {
  const response = await fetch(`${API_URL}/api/arrendatario/properties`, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo registrar la propiedad')
  }

  return data
}

export async function getLandlordProperties(idArrendatario) {
  const params = new URLSearchParams({
    id_arrendatario: String(idArrendatario),
  })

  const response = await fetch(`${API_URL}/api/arrendatario/properties?${params.toString()}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudieron cargar tus propiedades. Intenta nuevamente.')
  }

  return data.properties || []
}

export async function getPropertyById(idPropiedad, idArrendatario) {
  const params = new URLSearchParams({
    id_arrendatario: String(idArrendatario),
  })

  const response = await fetch(
    `${API_URL}/api/arrendatario/properties/${idPropiedad}?${params.toString()}`
  )
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo cargar la propiedad.')
  }

  return data.property
}

export async function updateProperty(idPropiedad, formData) {
  const response = await fetch(`${API_URL}/api/arrendatario/properties/${idPropiedad}`, {
    method: 'PATCH',
    body: formData,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo actualizar la propiedad.')
  }

  return data
}

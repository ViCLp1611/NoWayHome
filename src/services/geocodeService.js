const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function geocodeAddress(address) {
  const params = new URLSearchParams({
    address,
  })

  const response = await fetch(`${API_URL}/api/geocode?${params.toString()}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo buscar la ubicacion.')
  }

  return data.location
}

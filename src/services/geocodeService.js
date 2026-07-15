import { API_URL } from '@/config/api'

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

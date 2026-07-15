import { API_URL } from '@/config/api'

async function requestJson(path) {
  const response = await fetch(`${API_URL}${path}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudieron cargar las propiedades.')
  }

  return data
}

export const tenantPropertyService = {
  obtenerPropiedadesDisponibles: async () => {
    const data = await requestJson('/api/inquilino/properties')
    return data.properties || []
  },

  obtenerPropiedadPorId: async id => {
    const data = await requestJson(`/api/inquilino/properties/${id}`)
    return data.property
  },
}

import { API_URL } from '@/config/api'

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo completar la solicitud.')
  }

  return data
}

export const tenantService = {
  obtenerPerfil: async idInquilino => {
    const data = await requestJson(`/api/inquilino/profile/${idInquilino}`)
    return data.profile
  },

  obtenerPerfilCompleto: async idInquilino => {
    const data = await requestJson(`/api/inquilino/profile/${idInquilino}`)
    return {
      perfil: data.profile,
      reservas: data.reservations || [],
      favoritos: data.favorites || [],
    }
  },

  actualizarPerfil: async (idInquilino, updates) => {
    const data = await requestJson(`/api/inquilino/profile/${idInquilino}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    return data.profile
  },

  obtenerReservas: async idInquilino => {
    const params = new URLSearchParams({ id_inquilino: String(idInquilino) })
    const data = await requestJson(`/api/inquilino/reservas?${params.toString()}`)
    return data.reservations || []
  },

  obtenerFavoritos: async idInquilino => {
    const data = await requestJson(`/api/inquilino/profile/${idInquilino}`)
    return data.favorites || []
  },
}

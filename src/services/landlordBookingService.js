const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

export const landlordBookingService = {
  obtenerReservasRecibidas: async idArrendatario => {
    const data = await requestJson(`/api/arrendatario/reservas?id_arrendatario=${idArrendatario}`)
    return data.reservations || []
  },

  cambiarEstadoReserva: async (idReserva, idArrendatario, estado) => {
    const parsedIdReserva = Number(idReserva)
    if (!Number.isInteger(parsedIdReserva) || parsedIdReserva <= 0) {
      throw new Error('La reserva no tiene un id_reserva valido.')
    }

    const encodedId = encodeURIComponent(String(parsedIdReserva))
    const data = await requestJson(`/api/arrendatario/reservas/${encodedId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ id_arrendatario: idArrendatario, estado }),
    })
    return data.reserva
  },
}

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

export const tenantBookingService = {
  crearReservaPendiente: async reservaData => {
    const data = await requestJson('/api/inquilino/reservas', {
      method: 'POST',
      body: JSON.stringify(reservaData),
    })
    return data.reservation
  },

  confirmarReserva: async reservaIdentifier => {
    const id =
      typeof reservaIdentifier === 'object'
        ? reservaIdentifier.id_reserva || reservaIdentifier.id || 'actual'
        : reservaIdentifier
    const data = await requestJson(`/api/inquilino/reservas/${id}/confirm`, {
      method: 'PATCH',
      body: JSON.stringify({ reservation: reservaIdentifier }),
    })
    return data.reservation
  },

  cancelarReserva: async ({ idReserva, idInquilino, motivoCancelacion }) => {
    const data = await requestJson(
      `/api/inquilino/reservas/${encodeURIComponent(idReserva)}/cancel`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          id_inquilino: idInquilino,
          motivo_cancelacion: motivoCancelacion || '',
        }),
      }
    )
    return data.reserva
  },
}

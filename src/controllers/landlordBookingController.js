// src/controllers/landlordBookingController.js
import { API_URL } from '@/config/api'

// Helper para manejar las respuestas de la API
const handleResponse = async response => {
  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.message || 'Ocurrió un error en el servidor.')
  }
  return result
}

export const landlordBookingController = {
  /**
   * Obtiene todas las reservas para un arrendatario específico.
   * @param {number} landlordId - El ID del arrendatario.
   * @returns {Promise<object>}
   */
  async getReservations(landlordId) {
    if (!landlordId) {
      throw new Error('El ID del arrendatario es requerido.')
    }
    const response = await fetch(
      `${API_URL}/api/arrendatario/reservas?id_arrendatario=${landlordId}`
    )
    return handleResponse(response)
  },

  /**
   * Aprueba una solicitud de reserva.
   * @param {number} reservationId - El ID de la reserva.
   * @param {number} landlordId - El ID del arrendatario autenticado.
   * @returns {Promise<object>}
   */
  async approveReservation(reservationId, landlordId) {
    const response = await fetch(`${API_URL}/api/arrendatario/reservas/${reservationId}/aprobar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_arrendatario_autenticado: landlordId }),
    })
    return handleResponse(response)
  },

  /**
   * Rechaza una solicitud de reserva.
   * @param {number} reservationId - El ID de la reserva.
   * @param {number} landlordId - El ID del arrendatario autenticado.
   * @param {string} reason - El motivo del rechazo.
   * @returns {Promise<object>}
   */
  async rejectReservation(reservationId, landlordId, reason) {
    if (!reason || reason.trim() === '') {
      throw new Error('El motivo de rechazo es obligatorio.')
    }
    const response = await fetch(`${API_URL}/api/arrendatario/reservas/${reservationId}/rechazar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_arrendatario_autenticado: landlordId,
        motivo: reason,
      }),
    })
    return handleResponse(response)
  },
}

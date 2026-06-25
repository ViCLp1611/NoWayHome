import { supabase } from '@/lib/supabaseClient'

export const reservaService = {
  crearReservaPendiente: async reservaData => {
    const reservaPayload = {
      id_inquilino: reservaData.id_inquilino,
      id_propiedad: reservaData.id_propiedad,
      fecha_inicio: reservaData.fecha_inicio,
      fecha_fin: reservaData.fecha_fin,
      pago: reservaData.pago,
      estado: reservaData.estado || 'pendiente',
    }

    const { data, error } = await supabase.from('reserva').insert([reservaPayload]).select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  confirmarReserva: async reservaIdentifier => {
    if (!reservaIdentifier) {
      throw new Error('Identificador de reserva no válido')
    }

    const reservationUpdate = supabase.from('reserva').update({ estado: 'confirmada' })

    if (typeof reservaIdentifier === 'object' && reservaIdentifier !== null) {
      const { id, id_reserva, id_propiedad, id_inquilino, fecha_inicio } = reservaIdentifier

      if (id) {
        reservationUpdate.eq('id', id)
      } else if (id_reserva) {
        reservationUpdate.eq('id_reserva', id_reserva)
      } else if (id_propiedad && id_inquilino && fecha_inicio) {
        reservationUpdate.match({ id_propiedad, id_inquilino, fecha_inicio })
      } else {
        throw new Error('Datos de reserva incompletos para confirmar')
      }
    } else {
      reservationUpdate.eq('id', reservaIdentifier)
    }

    const { data, error } = await reservationUpdate.select()

    if (error) throw new Error(error.message)
    return Array.isArray(data) ? data[0] : data
  },
}

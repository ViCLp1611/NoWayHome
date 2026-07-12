import { supabase } from '../config/supabase.js'

/**
 * Middleware o función de servicio para verificar que el arrendatario que hace la petición
 * es el dueño de la propiedad asociada a la reserva.
 * @param {number} idReserva - El ID de la reserva a verificar.
 * @param {number} idArrendatario - El ID del arrendatario autenticado.
 * @returns {Promise<boolean>}
 */
const verifyOwnership = async (idReserva, idArrendatario) => {
  const { data, error } = await supabase
    .from('reserva')
    .select(
      `
            id_reserva,
            propiedad (
                id_arrendatario
            )
        `
    )
    .eq('id_reserva', idReserva)
    .single()

  if (error) throw new Error(`Error al verificar la reserva: ${error.message}`)
  if (!data) throw new Error('Reserva no encontrada.')

  // Comparamos el id del arrendatario de la propiedad con el id del usuario que hace la petición.
  if (data.propiedad.id_arrendatario !== idArrendatario) {
    throw new Error('No tienes permiso para modificar esta reserva.')
  }
  return true
}

export const approveReservationHandler = async (req, res) => {
  const { idReserva } = req.params
  // IMPORTANTE: El id del arrendatario debe venir de una sesión autenticada (ej: req.user.id).
  // Para este ejemplo, lo simularemos recibiéndolo en el body.
  const { id_arrendatario_autenticado } = req.body

  if (!id_arrendatario_autenticado) {
    return res.status(401).json({ success: false, message: 'No estás autenticado.' })
  }

  try {
    // Seguridad: Verificar que quien aprueba es el dueño.
    await verifyOwnership(Number(idReserva), Number(id_arrendatario_autenticado))

    const { data, error } = await supabase
      .from('reserva')
      .update({ estado: 'aprobada_esperando_pago' })
      .eq('id_reserva', idReserva)
      .eq('estado', 'pendiente_aprobacion') // Solo se puede aprobar si está pendiente
      .select()
      .single()

    if (error) throw error
    if (!data)
      return res
        .status(404)
        .json({
          success: false,
          message: 'La reserva no se encontró o su estado no permite esta acción.',
        })

    res
      .status(200)
      .json({
        success: true,
        message: 'Reserva aprobada. Esperando pago del inquilino.',
        reserva: data,
      })
  } catch (error) {
    console.error('Error al aprobar la reserva:', error.message)
    const isAuthError = error.message.includes('permiso') || error.message.includes('autenticado')
    res.status(isAuthError ? 403 : 500).json({ success: false, message: error.message })
  }
}

export const rejectReservationHandler = async (req, res) => {
  const { idReserva } = req.params
  const { motivo, id_arrendatario_autenticado } = req.body

  if (!id_arrendatario_autenticado) {
    return res.status(401).json({ success: false, message: 'No estás autenticado.' })
  }

  if (!motivo || motivo.trim() === '') {
    return res.status(400).json({ success: false, message: 'El motivo de rechazo es obligatorio.' })
  }

  try {
    // Seguridad: Verificar que quien rechaza es el dueño.
    await verifyOwnership(Number(idReserva), Number(id_arrendatario_autenticado))

    const { data, error } = await supabase
      .from('reserva')
      .update({ estado: 'rechazada', motivo_rechazo: motivo.trim() })
      .eq('id_reserva', idReserva)
      .eq('estado', 'pendiente_aprobacion') // Solo se puede rechazar si está pendiente
      .select()
      .single()

    if (error) throw error
    if (!data)
      return res
        .status(404)
        .json({
          success: false,
          message: 'La reserva no se encontró o su estado no permite esta acción.',
        })

    res
      .status(200)
      .json({ success: true, message: 'Reserva rechazada correctamente.', reserva: data })
  } catch (error) {
    console.error('Error al rechazar la reserva:', error.message)
    const isAuthError = error.message.includes('permiso') || error.message.includes('autenticado')
    res.status(isAuthError ? 403 : 500).json({ success: false, message: error.message })
  }
}

// --- OTROS HANDLERS EXISTENTES ---
export const listLandlordReservationsHandler = async (req, res) => {
  /* Tu código existente */
}
export const updateReservationStatusHandler = async (req, res) => {
  /* Tu código existente */
}

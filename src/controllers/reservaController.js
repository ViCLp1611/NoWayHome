import { reservaService } from '../services/reservaService'
import { propiedadService } from '../services/propiedadService'

export const reservaController = {
  cargarDetallesPropiedad: async id => {
    try {
      const propiedad = await propiedadService.obtenerPropiedadPorId(id)
      return { success: true, data: propiedad }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  calcularCostos: (precioNoche, fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return { error: 'Fechas incompletas' }

    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    const diferenciaTiempo = fin - inicio
    const dias = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24))

    if (dias <= 0) return { error: 'La fecha de fin debe ser posterior a la de inicio' }

    const subtotal = precioNoche * dias
    const tarifaServicio = subtotal * 0.1 // 10% comisión
    const total = subtotal + tarifaServicio

    return { dias, subtotal, tarifaServicio, total }
  },

  iniciarReserva: async datos => {
    try {
      // Validaciones básicas antes de enviar
      if (!datos.id_inquilino || !datos.id_propiedad) {
        throw new Error('Datos de reserva incompletos (ID faltante)')
      }
      const nuevaReserva = await reservaService.crearReservaPendiente(datos)
      return { success: true, data: nuevaReserva }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  confirmarReserva: async id_reserva => {
    try {
      const confirmada = await reservaService.confirmarReserva(id_reserva)
      return { success: true, data: confirmada }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
}

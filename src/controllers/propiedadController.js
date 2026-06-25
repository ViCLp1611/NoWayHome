import { propiedadService } from '@/services/propiedadService'

export const propiedadController = {
  cargarPropiedades: async () => {
    try {
      const data = await propiedadService.obtenerPropiedadesDisponibles()
      return { success: true, data: data || [] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  cargarDetallesPropiedad: async id => {
    try {
      const data = await propiedadService.obtenerPropiedadPorId(id)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
}

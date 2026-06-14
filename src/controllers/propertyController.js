import { propertyService } from '../services/propertyService'

export const propertyController = {
  getPropertiesByHost: async id_arrendatario => {
    try {
      if (!id_arrendatario) {
        return { success: false, error: 'ID de arrendatario no proporcionado' }
      }

      const properties = await propertyService.getPropertiesByHostId(id_arrendatario)
      return { success: true, data: properties }
    } catch (error) {
      return { success: false, error: 'Ocurrió un error al obtener las propiedades.' }
    }
  },
}

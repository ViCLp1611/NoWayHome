import { supabase } from '@/lib/supabaseClient' // <-- Ajusta esta ruta si tu archivo de supabase está en otro lado

export const propertyService = {
  // Método para obtener las propiedades de un anfitrión específico
  getPropertiesByHostId: async id_arrendatario => {
    try {
      const { data, error } = await supabase
        .from('propiedad')
        .select('*')
        .eq('id_arrendatario', id_arrendatario)

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error en propertyService.getPropertiesByHostId:', error)
      throw error
    }
  },
}

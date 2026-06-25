import { supabase } from '@/lib/supabaseClient'

export const propiedadService = {
  obtenerPropiedadesDisponibles: async () => {
    const { data, error } = await supabase.from('propiedad').select('*')

    if (error) {
      console.error('Error de Supabase al cargar propiedades:', error)
      throw error
    }

    return data
  },

  obtenerPropiedadPorId: async id => {
    const { data, error } = await supabase
      .from('propiedad')
      .select('*')
      .eq('id_propiedad', id)
      .single()

    if (error) {
      console.error('Error al obtener propiedad por ID:', error)
      throw error
    }
    return data
  },
}

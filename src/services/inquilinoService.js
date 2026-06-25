import { supabase } from '@/lib/supabaseClient'

export const inquilinoService = {
  obtenerPerfil: async id_inquilino => {
    const { data, error } = await supabase
      .from('inquilino')
      .select('*')
      .eq('id_inquilino', id_inquilino)
      .single()

    if (error) throw new Error('Error al obtener perfil de inquilino: ' + error.message)
    return data
  },

  actualizarPerfil: async (id_inquilino, updates) => {
    const { data, error } = await supabase
      .from('inquilino')
      .update(updates)
      .eq('id_inquilino', id_inquilino)
      .select()
      .single()

    if (error) throw new Error('Error al actualizar perfil de inquilino: ' + error.message)
    return data
  },

  obtenerReservas: async id_inquilino => {
    const { data, error } = await supabase
      .from('reserva')
      .select(
        `*, propiedad (id_propiedad, descripcion, titulo, ubicacion, precio_noche, precio, direccion)`
      )
      .eq('id_inquilino', id_inquilino)
      .order('fecha_inicio', { ascending: false })

    if (!error) {
      return data || []
    }

    console.warn(
      'Error al obtener reservas con relación anidada, reintentando con select simple:',
      error.message
    )

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('reserva')
      .select('*')
      .eq('id_inquilino', id_inquilino)
      .order('fecha_inicio', { ascending: false })

    if (fallbackError) {
      throw new Error('Error al obtener reservas: ' + fallbackError.message)
    }

    return fallbackData || []
  },

  obtenerFavoritos: async id_inquilino => {
    const { data, error } = await supabase
      .from('favoritos')
      .select(
        `*, propiedad (id_propiedad, descripcion, titulo, ubicacion, precio_noche, precio, direccion)`
      )
      .eq('id_inquilino', id_inquilino)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01' || /Could not find the table/i.test(error.message)) {
        console.warn(
          'Tabla favoritos no existe en Supabase, retornando lista vacía:',
          error.message
        )
        return []
      }
      throw new Error('Error al obtener favoritos: ' + error.message)
    }

    return data || []
  },
}

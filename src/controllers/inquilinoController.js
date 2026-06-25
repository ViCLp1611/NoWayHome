import { inquilinoService } from '../services/inquilinoService'

export const inquilinoController = {
  cargarPerfilCompleto: async id_inquilino => {
    const [perfilResult, reservasResult, favoritosResult] = await Promise.allSettled([
      inquilinoService.obtenerPerfil(id_inquilino),
      inquilinoService.obtenerReservas(id_inquilino),
      inquilinoService.obtenerFavoritos(id_inquilino),
    ])

    if (perfilResult.status === 'rejected') {
      console.error('Error al obtener perfil de inquilino:', perfilResult.reason)
      return {
        success: false,
        error: perfilResult.reason?.message || String(perfilResult.reason),
      }
    }

    const reservas = reservasResult.status === 'fulfilled' ? reservasResult.value : []
    const favoritos = favoritosResult.status === 'fulfilled' ? favoritosResult.value : []

    if (reservasResult.status === 'rejected') {
      console.warn('No se pudieron cargar las reservas del inquilino:', reservasResult.reason)
    }
    if (favoritosResult.status === 'rejected') {
      console.warn('No se pudieron cargar los favoritos del inquilino:', favoritosResult.reason)
    }

    return {
      success: true,
      data: {
        perfil: perfilResult.value,
        reservas,
        favoritos,
      },
    }
  },

  actualizarPerfil: async (id_inquilino, updates) => {
    try {
      const perfil = await inquilinoService.actualizarPerfil(id_inquilino, updates)
      return { success: true, data: perfil }
    } catch (error) {
      console.error('Error actualizando perfil de inquilino:', error)
      return { success: false, error: error.message }
    }
  },
}

import { inquilinoService } from '../services/inquilinoService'

export const inquilinoController = {
  cargarPerfilCompleto: async id_inquilino => {
    try {
      const [perfil, reservas, favoritos] = await Promise.all([
        inquilinoService.obtenerPerfil(id_inquilino),
        inquilinoService.obtenerReservas(id_inquilino),
        inquilinoService.obtenerFavoritos(id_inquilino),
      ])

      return {
        success: true,
        data: {
          perfil,
          reservas,
          favoritos,
        },
      }
    } catch (error) {
      console.error('Error en el controlador del inquilino:', error)
      return {
        success: false,
        error: error.message,
      }
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

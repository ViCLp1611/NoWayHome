const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function postJson(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    return {
      success: false,
      message: data.message || 'No se pudo completar la solicitud.',
    }
  }

  return data
}

// Servicio de Autenticacion para Usuarios y Administradores
class AuthService {
  constructor() {
    // Supabase se usa como cliente de datos para las tablas del proyecto.
  }

  isSupabaseConfigured() {
    return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
  }

  // ----------------------------------------------------------------------
  // METODOS PARA ADMINISTRADOR
  // ----------------------------------------------------------------------

  async loginAdmin(correo, contrasena) {
    return this.loginUser(correo, contrasena)
  }

  async logoutAdmin() {
    return {
      success: true,
      message: 'Sesion cerrada exitosamente',
    }
  }

  // ----------------------------------------------------------------------
  // METODOS PARA USUARIOS COMUNES (INQUILINOS Y ARRENDATARIOS)
  // ----------------------------------------------------------------------

  async loginUser(correo, contrasena) {
    const normalizedEmail = correo.trim().toLowerCase()

    try {
      return await postJson('/api/auth/login', {
        correo: normalizedEmail,
        contrasena,
      })
    } catch (error) {
      console.error('Error en loginUser:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido en la autenticacion',
      }
    }
  }

  async verify2FA(correo, codigo, role) {
    try {
      return await postJson('/api/auth/verify-2fa', {
        correo: correo.trim().toLowerCase(),
        codigo,
        role,
      })
    } catch (error) {
      console.error('Error en verify2FA:', error)
      return {
        success: false,
        message: error.message || 'Error al verificar el codigo.',
      }
    }
  }

  async registerUser(userData) {
    try {
      return await postJson('/api/auth/register', userData)
    } catch (error) {
      console.error('Error en registerUser:', error)
      return {
        success: false,
        message: error.message || 'Error en el registro',
      }
    }
  }
}

export const authService = new AuthService()

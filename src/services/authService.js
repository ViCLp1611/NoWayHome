const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/*
|--------------------------------------------------------------------------
| Servicio frontend de autenticacion
|--------------------------------------------------------------------------
| Consume los endpoints Express para login unificado, verificacion 2FA y
| registro. Supabase se usa solo desde backend para estas operaciones.
|
| Endpoints:
| - POST /api/auth/login
| - POST /api/auth/verify-2fa
| - POST /api/auth/register
|
| Seguridad:
| - No compara contrasenas en frontend.
| - No maneja hashes, tokens ni codigos almacenados.
| - No completa sesion hasta que LoginPage recibe respuesta valida de 2FA.
*/
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
    // Login unificado para administrador, inquilino y arrendatario.
    // Envia correo/contrasena y espera requires2FA antes de completar sesion.
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
    // Verifica codigo de 6 digitos contra /api/auth/verify-2fa.
    // El backend consulta two_factor_codes y devuelve usuario seguro.
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
    // Registra inquilino o arrendatario segun role.
    // El backend valida duplicados y hashea la contrasena.
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

  async updatePassword(data) {
    // Llama al endpoint del backend para actualizar la contraseña.
    // El backend se encarga de hashear la contraseña y actualizar la DB.
    try {
      return await postJson('/api/auth/update-password', data)
    } catch (error) {
      console.error('Error en updatePassword:', error)
      return {
        success: false,
        message: error.message || 'Error al actualizar la contraseña.',
      }
    }
  }
}

export const authService = new AuthService()

import { supabase } from '../lib/supabaseClient.js'

// Nueva URL de tu backend (Asegúrate de que el puerto coincida con tu servidor Express)
const API_URL = 'http://localhost:5000/api/auth'

// Servicio de Autenticación para Usuarios y Administradores
class AuthService {
  constructor() {
    // No necesitamos estado local ya que Supabase/Controlador manejan la sesión
  }

  // Verificar si Supabase está configurado
  isSupabaseConfigured() {
    return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
  }

  // ----------------------------------------------------------------------
  // MÉTODOS PARA ADMINISTRADOR (CÓDIGO ORIGINAL INTACTO)
  // ----------------------------------------------------------------------

  // Login de administrador
  async loginAdmin(correo, contrasena) {
    if (!this.isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado. Verifica las variables de entorno.')
    }

    if (!correo || !contrasena) {
      throw new Error('Correo y contraseña son requeridos')
    }

    try {
      // Consultar directamente la tabla administrador
      const { data, error } = await supabase
        .from('administrador')
        .select('*')
        .eq('correo', correo)
        .eq('contrasena', contrasena)
        .single()

      if (error) {
        // Manejar errores específicos de Supabase
        if (error.code === 'PGRST116') {
          throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.')
        } else if (error.message.includes('relation "public.administrador" does not exist')) {
          throw new Error('La tabla administrador no existe. Crea la tabla en Supabase SQL Editor.')
        } else if (error.message.includes('permission denied')) {
          throw new Error('Permisos insuficientes. Verifica la configuración de RLS en Supabase.')
        } else {
          throw new Error(`Error de autenticación: ${error.message}`)
        }
      }

      if (!data) {
        throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.')
      }

      // Retornar datos del administrador (sin contraseña)
      const adminData = {
        id: data.id_admin,
        nombre: data.nombre,
        correo: data.correo,
      }

      return {
        success: true,
        admin: adminData,
        message: 'Inicio de sesión exitoso',
      }
    } catch (error) {
      console.error('Error en loginAdmin:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido en la autenticación',
      }
    }
  }

  // Logout para el admin
  async logoutAdmin() {
    return {
      success: true,
      message: 'Sesión cerrada exitosamente',
    }
  }

  // ----------------------------------------------------------------------
  // MÉTODOS NUEVOS PARA USUARIOS COMUNES (INQUILINOS Y ARRENDATARIOS)
  // ----------------------------------------------------------------------

  // Login para inquilinos y arrendatarios (Modificado para 2FA vía Servidor)
  async loginUser(correo, contrasena) {
    try {
      // Fase 1: Enviar credenciales al backend para validar y recibir el código 2FA
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contrasena }),
      })

      const data = await response.json()
      return data // Devuelve { success, message, role }
    } catch (error) {
      console.error('Error al conectar con el servidor backend:', error)
      return {
        success: false,
        message: 'Error de conexión con el servidor. Verifica que tu backend esté en ejecución.',
      }
    }
  }

  // NUEVO MÉTODO: Validar el código 2FA (Fase 2)
  async verificar2FA(correo, codigo, role) {
    try {
      const response = await fetch(`${API_URL}/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, codigo, role }),
      })

      const data = await response.json()
      return data // Devuelve { success, user, message }
    } catch (error) {
      console.error('Error al verificar el código:', error)
      return {
        success: false,
        message: 'Error al procesar la verificación. Intenta de nuevo.',
      }
    }
  }

  // Registro para inquilinos y arrendatarios (CÓDIGO ORIGINAL INTACTO)
  async registerUser(userData) {
    if (!this.isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado. Verifica las variables de entorno.')
    }

    const { name, email, phone, password, role } = userData
    const table = role === 'guest' ? 'inquilino' : 'arrendatario'

    try {
      // 1. Verificar existencia previa por correo en ambas tablas para evitar duplicados
      const { data: existInq } = await supabase
        .from('inquilino')
        .select('correo')
        .eq('correo', email)
        .maybeSingle()
      const { data: existArr } = await supabase
        .from('arrendatario')
        .select('correo')
        .eq('correo', email)
        .maybeSingle()

      if (existInq || existArr) {
        throw new Error('Este correo ya se encuentra registrado en la plataforma.')
      }

      // 2. Insertar en la tabla correspondiente
      const { data, error } = await supabase
        .from(table)
        .insert([
          {
            nombre: name,
            correo: email,
            telefono: phone,
            contrasena: password,
          },
        ])
        .select()
        .single()

      if (error) {
        throw new Error(`Error al crear la cuenta: ${error.message}`)
      }

      // 3. Normalizar respuesta
      return {
        success: true,
        user: {
          id: role === 'guest' ? data.id_inquilino : data.id_arrendatario,
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono,
          role: role,
        },
        message: 'Registro exitoso',
      }
    } catch (error) {
      console.error('Error en registerUser:', error)
      return {
        success: false,
        message: error.message || 'Error en el registro',
      }
    }
  }
}

// Exportar instancia singleton
export const authService = new AuthService()

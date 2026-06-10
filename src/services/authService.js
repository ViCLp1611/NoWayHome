import { supabase } from '../lib/supabaseClient.js'

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
    if (!this.isSupabaseConfigured()) {
      throw new Error('Supabase no esta configurado. Verifica las variables de entorno.')
    }

    if (!correo || !contrasena) {
      throw new Error('Correo y contrasena son requeridos')
    }

    try {
      const { data, error } = await supabase
        .from('administrador')
        .select('*')
        .eq('correo', correo)
        .eq('contrasena', contrasena)
        .maybeSingle()

      if (error) {
        if (error.message.includes('relation "public.administrador" does not exist')) {
          throw new Error('La tabla administrador no existe. Crea la tabla en Supabase SQL Editor.')
        } else if (error.message.includes('permission denied')) {
          throw new Error('Permisos insuficientes. Verifica la configuracion de RLS en Supabase.')
        } else {
          throw new Error(`Error de autenticacion: ${error.message}`)
        }
      }

      if (!data) {
        return {
          success: false,
          message: 'Credenciales incorrectas. Verifica tu correo y contrasena.',
        }
      }

      return {
        success: true,
        admin: {
          id: data.id_admin,
          nombre: data.nombre,
          correo: data.correo,
        },
        message: 'Inicio de sesion exitoso',
      }
    } catch (error) {
      console.error('Error en loginAdmin:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido en la autenticacion',
      }
    }
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
    if (!this.isSupabaseConfigured()) {
      throw new Error('Supabase no esta configurado. Verifica las variables de entorno.')
    }

    const normalizedEmail = correo.trim().toLowerCase()

    try {
      let { data: user, error: tenantError } = await supabase
        .from('inquilino')
        .select('*')
        .eq('correo', normalizedEmail)
        .eq('contrasena', contrasena)
        .maybeSingle()

      if (tenantError) {
        throw new Error(`No se pudo consultar el perfil de inquilino: ${tenantError.message}`)
      }

      let role = 'guest'

      if (!user) {
        const { data: host, error: hostError } = await supabase
          .from('arrendatario')
          .select('*')
          .eq('correo', normalizedEmail)
          .eq('contrasena', contrasena)
          .maybeSingle()

        if (hostError) {
          throw new Error(`No se pudo consultar el perfil de arrendatario: ${hostError.message}`)
        }

        if (!host) {
          return {
            success: false,
            message: 'Credenciales incorrectas. Verifica tu correo y contrasena.',
          }
        }

        user = host
        role = 'host'
      }

      return {
        success: true,
        user: {
          id: role === 'guest' ? user.id_inquilino : user.id_arrendatario,
          nombre: user.nombre,
          correo: user.correo,
          telefono: user.telefono,
          role,
        },
        message: 'Inicio de sesion exitoso',
      }
    } catch (error) {
      console.error('Error en loginUser:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido en la autenticacion',
      }
    }
  }

  async registerUser(userData) {
    if (!this.isSupabaseConfigured()) {
      throw new Error('Supabase no esta configurado. Verifica las variables de entorno.')
    }

    const { name, email, phone, password, role } = userData
    const table = role === 'guest' ? 'inquilino' : 'arrendatario'
    const normalizedEmail = email.trim().toLowerCase()

    try {
      const { data: existInq } = await supabase
        .from('inquilino')
        .select('correo')
        .eq('correo', normalizedEmail)
        .maybeSingle()

      const { data: existArr } = await supabase
        .from('arrendatario')
        .select('correo')
        .eq('correo', normalizedEmail)
        .maybeSingle()

      if (existInq || existArr) {
        throw new Error('Este correo ya se encuentra registrado en la plataforma.')
      }

      const { data, error } = await supabase
        .from(table)
        .insert([
          {
            nombre: name,
            correo: normalizedEmail,
            telefono: phone,
            contrasena: password,
          },
        ])
        .select()
        .single()

      if (error) {
        throw new Error(`Error al crear la cuenta: ${error.message}`)
      }

      return {
        success: true,
        user: {
          id: role === 'guest' ? data.id_inquilino : data.id_arrendatario,
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono,
          role,
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

export const authService = new AuthService()

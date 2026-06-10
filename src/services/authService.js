import { supabase } from '../lib/supabaseClient.js'

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

  // Login para inquilinos y arrendatarios
  async loginUser(correo, contrasena) {
    if (!this.isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado. Verifica las variables de entorno.')
    }

    try {
      // 1. Buscar primero en la tabla inquilino
      let { data: user, error: errInquilino } = await supabase
        .from('inquilino')
        .select('*')
        .eq('correo', correo)
        .eq('contrasena', contrasena)
        .maybeSingle()

      let role = 'guest'

      // 2. Si no se encuentra en inquilino, buscar en arrendatario
      if (!user) {
        const { data: host, error: errArrendatario } = await supabase
          .from('arrendatario')
          .select('*')
          .eq('correo', correo)
          .eq('contrasena', contrasena)
          .maybeSingle()

        if (!host) {
          throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.')
        }

        user = host
        role = 'host'
      }

      // 3. Normalizar la data devuelta excluyendo la contraseña
      const userData = {
        id: role === 'guest' ? user.id_inquilino : user.id_arrendatario,
        nombre: user.nombre,
        correo: user.correo,
        telefono: user.telefono,
        role: role,
      }

      return {
        success: true,
        user: userData,
        message: 'Inicio de sesión exitoso',
      }
    } catch (error) {
      console.error('Error en loginUser:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido en la autenticación',
      }
    }
  }

  // Registro para inquilinos y arrendatarios
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

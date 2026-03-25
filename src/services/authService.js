import { supabase } from '../lib/supabaseClient.js';

// Servicio de Autenticación para Administradores
class AuthService {
  constructor() {
    // No necesitamos estado local ya que Supabase maneja la sesión
  }

  // Verificar si Supabase está configurado
  isSupabaseConfigured() {
    return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  }

  // Login de administrador
  async loginAdmin(correo, contrasena) {
    if (!this.isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado. Verifica las variables de entorno.');
    }

    if (!correo || !contrasena) {
      throw new Error('Correo y contraseña son requeridos');
    }

    try {
      // Consultar directamente la tabla administrador
      const { data, error } = await supabase
        .from('administrador')
        .select('*')
        .eq('correo', correo)
        .eq('contrasena', contrasena)
        .single();

      if (error) {
        // Manejar errores específicos de Supabase
        if (error.code === 'PGRST116') {
          throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else if (error.message.includes('relation "public.administrador" does not exist')) {
          throw new Error('La tabla administrador no existe. Crea la tabla en Supabase SQL Editor.');
        } else if (error.message.includes('permission denied')) {
          throw new Error('Permisos insuficientes. Verifica la configuración de RLS en Supabase.');
        } else {
          throw new Error(`Error de autenticación: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
      }

      // Retornar datos del administrador (sin contraseña)
      const adminData = {
        id: data.id_admin,
        nombre: data.nombre,
        correo: data.correo,
        // No incluimos la contraseña en la respuesta
      };

      return {
        success: true,
        admin: adminData,
        message: 'Inicio de sesión exitoso'
      };

    } catch (error) {
      console.error('Error en loginAdmin:', error);
      return {
        success: false,
        message: error.message || 'Error desconocido en la autenticación'
      };
    }
  }

  // Logout (si fuera necesario en el futuro)
  async logoutAdmin() {
    // Por ahora no necesitamos logout ya que no usamos sesiones de Supabase
    // Solo limpiamos el estado local si fuera necesario
    return {
      success: true,
      message: 'Sesión cerrada exitosamente'
    };
  }
}

// Exportar instancia singleton
export const authService = new AuthService();
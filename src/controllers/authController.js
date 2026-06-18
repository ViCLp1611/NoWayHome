// Controlador de Autenticación - Maneja la lógica de negocio y estado local
import { authService } from '../services/authService.js'
// Opcional: import { UserModel } from '../models/userModel.js'; si aún ocupas algo específico de ahí

/*
|--------------------------------------------------------------------------
| Controlador frontend de autenticacion
|--------------------------------------------------------------------------
| Orquesta validaciones visibles y delega las llamadas reales a authService.
|
| Flujos:
| - login() consume POST /api/auth/login.
| - verify2FA() consume POST /api/auth/verify-2fa.
| - register() consume POST /api/auth/register.
|
| Seguridad:
| - No compara contrasenas ni codigos contra hashes en frontend.
| - No debe guardar una sesion completa antes de terminar 2FA.
*/
export class AuthController {
  constructor() {
    this.currentUser = null
    this.isAuthenticated = false
  }

  // Método para iniciar sesión (Inquilinos y Arrendatarios)
  async login(email, password) {
    // Valida formato basico antes de solicitar al backend el inicio de login.
    // Si el backend responde requires2FA, LoginPage pasa al paso de codigo.
    if (!email || !password) {
      return {
        success: false,
        message: 'Por favor, complete todos los campos',
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Email inválido',
      }
    }

    try {
      // Llamada al servicio real de base de datos
      const result = await authService.loginUser(email, password)

      if (result.success && !result.requires2FA) {
        this.currentUser = result.user
        this.isAuthenticated = true
      }

      return result
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error inesperado al iniciar sesión',
      }
    }
  }

  async verify2FA(email, code, role) {
    // Verifica codigo temporal de 6 digitos. El backend decide si el codigo
    // coincide, no esta expirado, no fue usado y pertenece al rol indicado.
    if (!email || !code || !role) {
      return {
        success: false,
        message: 'Ingresa el codigo de verificacion',
      }
    }

    if (!/^\d{6}$/.test(code)) {
      return {
        success: false,
        message: 'El codigo debe tener 6 digitos',
      }
    }

    try {
      const result = await authService.verify2FA(email, code, role)

      if (result.success) {
        this.currentUser = result.user
        this.isAuthenticated = true
      }

      return result
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error inesperado al verificar el codigo',
      }
    }
  }

  // Método para registrar un nuevo usuario
  async register(userData) {
    const { name, email, phone, password, confirmPassword, role } = userData

    // Validaciones
    if (!name || !email || !phone || !password || !confirmPassword) {
      return {
        success: false,
        message: 'Por favor, complete todos los campos',
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Email inválido',
      }
    }

    // Validación básica de teléfono (puedes ajustarla según necesites)
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/
    if (!phoneRegex.test(phone)) {
      return {
        success: false,
        message: 'Teléfono inválido',
      }
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        message: 'Las contraseñas no coinciden',
      }
    }

    if (password.length < 6) {
      return {
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      }
    }

    try {
      // Llamada al servicio real para insertar en la tabla
      const result = await authService.registerUser(userData)

      if (result.success) {
        this.currentUser = result.user
        this.isAuthenticated = true
      }

      return result
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error inesperado en el registro',
      }
    }
  }

  // Método para cerrar sesión
  logout() {
    this.currentUser = null
    this.isAuthenticated = false

    return {
      success: true,
      message: 'Sesión cerrada exitosamente',
    }
  }

  // Método para obtener el usuario actual
  getCurrentUser() {
    return this.currentUser
  }

  // Método para verificar si el usuario está autenticado
  checkAuth() {
    return this.isAuthenticated
  }

  // Método para actualizar el usuario (Se mantiene para no romper Vistas futuras/actuales)
  updateUser(userData) {
    if (!this.isAuthenticated || !this.currentUser) {
      return {
        success: false,
        message: 'Usuario no autenticado',
      }
    }

    // Actualización local en memoria
    Object.assign(this.currentUser, userData)

    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: this.currentUser,
    }
  }

  // Método para cambiar el rol del usuario (Se mantiene local para no romper Vistas)
  switchUserRole(newRole) {
    if (!this.isAuthenticated || !this.currentUser) {
      return {
        success: false,
        message: 'Usuario no autenticado',
      }
    }

    if (newRole === 'host' || newRole === 'guest') {
      this.currentUser.role = newRole
      return {
        success: true,
        message: `Rol cambiado a ${newRole === 'host' ? 'Anfitrión' : 'Huésped'}`,
        user: this.currentUser,
      }
    }

    return {
      success: false,
      message: 'Rol inválido',
    }
  }
}

// ------------------------------------------------------------------
// Función para login de administrador (separada del controlador de usuarios)
// ------------------------------------------------------------------

export const handleAdminLogin = async (correo, contrasena) => {
  try {
    // Validación básica de campos vacíos
    if (!correo || !correo.trim()) {
      return {
        success: false,
        message: 'El correo electrónico es requerido',
      }
    }

    if (!contrasena || !contrasena.trim()) {
      return {
        success: false,
        message: 'La contraseña es requerida',
      }
    }

    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(correo.trim())) {
      return {
        success: false,
        message: 'El formato del correo electrónico no es válido',
      }
    }

    // Llamar al servicio de autenticación
    const result = await authService.loginAdmin(correo.trim(), contrasena)

    if (result.success) {
      return {
        success: true,
        admin: result.admin,
        message: result.message,
      }
    } else {
      return {
        success: false,
        message: result.message,
      }
    }
  } catch (error) {
    console.error('Error en handleAdminLogin:', error)
    return {
      success: false,
      message: error.message || 'Error desconocido en la autenticación',
    }
  }
}

// Instancia singleton del controlador de autenticación
export const authController = new AuthController()

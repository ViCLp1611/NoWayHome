// Controlador de Autenticación - Maneja la lógica de autenticación

import { UserModel, mockUser } from '../models/userModel';

export class AuthController {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  // Método para iniciar sesión
  login(email, password) {
    // En producción, esto haría una llamada a la API
    // Por ahora, usamos datos mock
    
    if (!email || !password) {
      return {
        success: false,
        message: 'Por favor, complete todos los campos'
      };
    }

    if (!UserModel.validateEmail(email)) {
      return {
        success: false,
        message: 'Email inválido'
      };
    }

    // Simulamos una autenticación exitosa
    this.currentUser = mockUser;
    this.isAuthenticated = true;

    return {
      success: true,
      message: 'Inicio de sesión exitoso',
      user: this.currentUser
    };
  }

  // Método para registrar un nuevo usuario
  register(userData) {
    const { name, email, phone, password, confirmPassword, role } = userData;

    // Validaciones
    if (!name || !email || !phone || !password || !confirmPassword) {
      return {
        success: false,
        message: 'Por favor, complete todos los campos'
      };
    }

    if (!UserModel.validateEmail(email)) {
      return {
        success: false,
        message: 'Email inválido'
      };
    }

    if (!UserModel.validatePhone(phone)) {
      return {
        success: false,
        message: 'Teléfono inválido'
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        message: 'Las contraseñas no coinciden'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      };
    }

    // Crear nuevo usuario
    const newUser = new UserModel({
      id: Date.now(),
      name,
      email,
      phone,
      role: role || 'guest',
      memberSince: new Date().toISOString()
    });

    // Simulamos un registro exitoso
    this.currentUser = newUser;
    this.isAuthenticated = true;

    return {
      success: true,
      message: 'Registro exitoso',
      user: this.currentUser
    };
  }

  // Método para cerrar sesión
  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;

    return {
      success: true,
      message: 'Sesión cerrada exitosamente'
    };
  }

  // Método para obtener el usuario actual
  getCurrentUser() {
    return this.currentUser;
  }

  // Método para verificar si el usuario está autenticado
  checkAuth() {
    return this.isAuthenticated;
  }

  // Método para actualizar el usuario
  updateUser(userData) {
    if (!this.isAuthenticated || !this.currentUser) {
      return {
        success: false,
        message: 'Usuario no autenticado'
      };
    }

    // Actualizar datos del usuario
    Object.assign(this.currentUser, userData);

    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: this.currentUser
    };
  }

  // Método para cambiar el rol del usuario
  switchUserRole(newRole) {
    if (!this.isAuthenticated || !this.currentUser) {
      return {
        success: false,
        message: 'Usuario no autenticado'
      };
    }

    if (this.currentUser.switchRole(newRole)) {
      return {
        success: true,
        message: `Rol cambiado a ${newRole === 'host' ? 'Anfitrión' : 'Huésped'}`,
        user: this.currentUser
      };
    }

    return {
      success: false,
      message: 'Rol inválido'
    };
  }
}

// Instancia singleton del controlador de autenticación
export const authController = new AuthController();

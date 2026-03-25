// Controlador de Usuario para Gestión Administrativa - Maneja la lógica de control para usuarios

import { userService } from '../services/userService.js';

// Obtener todos los usuarios
export const fetchAllUsers = async () => {
  try {
    return await userService.getAllUsersService();
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

// Eliminar usuario
export const removeUser = async (id) => {
  console.log(`Eliminando usuario con id: ${id}`);
  try {
    await userService.deleteUserService(id);
    console.log('Usuario eliminado exitosamente');
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

// Cambiar estado del usuario
export const toggleUserStatus = async (id) => {
  console.log(`Cambiando estado de usuario con id: ${id}`);
  try {
    const updatedUser = await userService.toggleUserStatusService(id);
    console.log('Estado de usuario cambiado exitosamente');
    return updatedUser;
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    throw error;
  }
};

// Actualizar usuario
export const updateUser = async (id, payload) => {
  console.log(`Actualizando usuario con id: ${id}`, payload);
  try {
    const updatedUser = await userService.updateUserService(id, payload);
    console.log('Usuario actualizado exitosamente');
    return updatedUser;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

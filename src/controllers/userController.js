// Controlador de Usuario - Maneja la lógica relacionada con el perfil y configuración del usuario

import { mockUserBookings } from '../models/bookingModel';
import { mockFavoriteProperties } from '../models/propertyModel';

export class UserController {
  constructor() {
    this.userBookings = [...mockUserBookings];
    this.userFavorites = [...mockFavoriteProperties];
    this.userPreferences = {
      notifications: {
        specialOffers: true,
        bookingReminders: true,
        newsletter: false
      },
      language: 'es',
      currency: 'EUR'
    };
  }

  // Método para obtener las reservas del usuario
  getUserBookings(userId) {
    return this.userBookings.filter(booking => 
      !userId || booking.userId === userId
    );
  }

  // Método para obtener las propiedades favoritas
  getUserFavorites(userId) {
    return [...this.userFavorites];
  }

  // Método para agregar una propiedad a favoritos
  addToFavorites(property) {
    const exists = this.userFavorites.find(fav => fav.id === property.id);
    
    if (exists) {
      return {
        success: false,
        message: 'La propiedad ya está en favoritos'
      };
    }

    this.userFavorites.push(property);
    
    return {
      success: true,
      message: 'Propiedad agregada a favoritos',
      favorites: this.userFavorites
    };
  }

  // Método para remover una propiedad de favoritos
  removeFromFavorites(propertyId) {
    const initialLength = this.userFavorites.length;
    this.userFavorites = this.userFavorites.filter(fav => fav.id !== propertyId);
    
    if (this.userFavorites.length < initialLength) {
      return {
        success: true,
        message: 'Propiedad removida de favoritos',
        favorites: this.userFavorites
      };
    }

    return {
      success: false,
      message: 'La propiedad no está en favoritos'
    };
  }

  // Método para crear una nueva reserva
  createBooking(bookingData) {
    const newBooking = {
      id: Date.now(),
      ...bookingData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.userBookings.push(newBooking);

    return {
      success: true,
      message: 'Reserva creada exitosamente',
      booking: newBooking
    };
  }

  // Método para cancelar una reserva
  cancelBooking(bookingId) {
    const booking = this.userBookings.find(b => b.id === bookingId);
    
    if (!booking) {
      return {
        success: false,
        message: 'Reserva no encontrada'
      };
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return {
        success: false,
        message: 'La reserva no se puede cancelar'
      };
    }

    booking.status = 'cancelled';

    return {
      success: true,
      message: 'Reserva cancelada exitosamente',
      booking: booking
    };
  }

  // Método para obtener las preferencias del usuario
  getUserPreferences() {
    return { ...this.userPreferences };
  }

  // Método para actualizar las preferencias del usuario
  updateUserPreferences(preferences) {
    this.userPreferences = {
      ...this.userPreferences,
      ...preferences
    };

    return {
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      preferences: this.userPreferences
    };
  }

  // Método para actualizar las preferencias de notificaciones
  updateNotificationPreferences(notificationPrefs) {
    this.userPreferences.notifications = {
      ...this.userPreferences.notifications,
      ...notificationPrefs
    };

    return {
      success: true,
      message: 'Preferencias de notificación actualizadas',
      preferences: this.userPreferences
    };
  }

  // Método para obtener estadísticas del usuario
  getUserStats(userId) {
    const bookings = this.getUserBookings(userId);
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');

    return {
      totalBookings: bookings.length,
      completedBookings: completedBookings.length,
      activeBookings: activeBookings.length,
      favoriteCount: this.userFavorites.length
    };
  }
}

// Instancia singleton del controlador de usuario
export const userController = new UserController();

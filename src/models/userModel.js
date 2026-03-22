// Modelo de Usuario - Define la estructura y lógica de datos del usuario

export class UserModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.location = data.location || '';
    this.role = data.role || 'guest'; // 'guest' o 'host'
    this.rating = data.rating || 0;
    this.reviewCount = data.reviewCount || 0;
    this.memberSince = data.memberSince || new Date().toISOString();
    this.avatar = data.avatar || null;
  }

  // Método para obtener iniciales del usuario
  getInitials() {
    if (!this.name) return 'U';
    const names = this.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  // Método para validar email
  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Método para validar teléfono
  static validatePhone(phone) {
    const regex = /^\+?[\d\s-()]+$/;
    return regex.test(phone);
  }

  // Método para verificar si el usuario puede ser anfitrión
  canBecomeHost() {
    return this.role === 'guest' && this.email && this.phone;
  }

  // Método para cambiar rol
  switchRole(newRole) {
    if (newRole === 'guest' || newRole === 'host') {
      this.role = newRole;
      return true;
    }
    return false;
  }

  // Método para serializar el usuario
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      location: this.location,
      role: this.role,
      rating: this.rating,
      reviewCount: this.reviewCount,
      memberSince: this.memberSince,
      avatar: this.avatar
    };
  }
}

// Mock de usuario por defecto
export const mockUser = new UserModel({
  id: 1,
  name: 'Juan Pérez',
  email: 'juan.perez@email.com',
  phone: '+34 600 000 000',
  location: 'Madrid, España',
  role: 'guest',
  rating: 4.9,
  reviewCount: 12,
  memberSince: '2024-01-01'
});

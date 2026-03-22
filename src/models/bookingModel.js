// Modelo de Reserva - Define la estructura y lógica de datos de reservas

export class BookingModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.propertyId = data.propertyId || null;
    this.property = data.property || '';
    this.location = data.location || '';
    this.dates = data.dates || '';
    this.checkIn = data.checkIn || null;
    this.checkOut = data.checkOut || null;
    this.status = data.status || 'pending'; // 'pending', 'confirmed', 'cancelled', 'completed'
    this.price = data.price || 0;
    this.userId = data.userId || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  // Método para obtener estado formateado
  getStatusText() {
    const statusMap = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada'
    };
    return statusMap[this.status] || 'Desconocido';
  }

  // Método para verificar si la reserva está activa
  isActive() {
    return this.status === 'confirmed' || this.status === 'pending';
  }

  // Método para verificar si se puede cancelar
  canCancel() {
    return this.status === 'confirmed' || this.status === 'pending';
  }

  // Método para calcular duración en noches
  getDurationInNights() {
    if (!this.checkIn || !this.checkOut) return 0;
    const start = new Date(this.checkIn);
    const end = new Date(this.checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Método para obtener precio total formateado
  getFormattedTotalPrice() {
    return `$${this.price}`;
  }

  // Método para serializar la reserva
  toJSON() {
    return {
      id: this.id,
      propertyId: this.propertyId,
      property: this.property,
      location: this.location,
      dates: this.dates,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      status: this.status,
      price: this.price,
      userId: this.userId,
      createdAt: this.createdAt
    };
  }
}

// Mock de reservas del usuario
export const mockUserBookings = [
  new BookingModel({
    id: 1,
    propertyId: 1,
    property: "Apartamento Moderno en Centro",
    location: "Madrid, España",
    dates: "15 Mar - 18 Mar 2026",
    checkIn: "2026-03-15",
    checkOut: "2026-03-18",
    status: "confirmed",
    price: 255,
    userId: 1
  }),
  new BookingModel({
    id: 2,
    propertyId: 3,
    property: "Villa Frente al Mar",
    location: "Valencia, España",
    dates: "22 Abr - 25 Abr 2026",
    checkIn: "2026-04-22",
    checkOut: "2026-04-25",
    status: "pending",
    price: 600,
    userId: 1
  })
];

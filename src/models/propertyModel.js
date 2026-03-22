// Modelo de Propiedad - Define la estructura y lógica de datos de propiedades

export class PropertyModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.location = data.location || '';
    this.price = data.price || 0;
    this.rating = data.rating || 0;
    this.reviews = data.reviews || 0;
    this.image = data.image || '';
    this.description = data.description || '';
    this.amenities = data.amenities || [];
    this.hostId = data.hostId || null;
    this.available = data.available !== undefined ? data.available : true;
  }

  // Método para formatear el precio
  getFormattedPrice() {
    return `$${this.price}`;
  }

  // Método para obtener calificación con estrellas
  getRatingStars() {
    return '★'.repeat(Math.floor(this.rating)) + '☆'.repeat(5 - Math.floor(this.rating));
  }

  // Método para verificar disponibilidad
  isAvailable() {
    return this.available;
  }

  // Método para serializar la propiedad
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      location: this.location,
      price: this.price,
      rating: this.rating,
      reviews: this.reviews,
      image: this.image,
      description: this.description,
      amenities: this.amenities,
      hostId: this.hostId,
      available: this.available
    };
  }
}

// Mock de propiedades destacadas
export const mockFeaturedProperties = [
  new PropertyModel({
    id: 1,
    image: "https://images.unsplash.com/photo-1605086554166-da2bd45804da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwYXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY5MzU0NDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Apartamento Moderno en Centro",
    location: "Madrid, España",
    price: 85,
    rating: 4.8,
    reviews: 124
  }),
  new PropertyModel({
    id: 2,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDF8fHx8MTc2OTM4ODY3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Casa Contemporánea",
    location: "Barcelona, España",
    price: 150,
    rating: 4.9,
    reviews: 89
  }),
  new PropertyModel({
    id: 3,
    image: "https://images.unsplash.com/photo-1633149668746-2891c0ff7334?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHZpbGxhJTIwdHJvcGljYWx8ZW58MXx8fHwxNzY5Mzg5MTA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Villa Frente al Mar",
    location: "Valencia, España",
    price: 200,
    rating: 5.0,
    reviews: 156
  }),
  new PropertyModel({
    id: 4,
    image: "https://images.unsplash.com/photo-1627750168257-9a7d3965ef8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJpbiUyMG1vdW50YWluJTIwZm9yZXN0fGVufDF8fHx8MTc2OTM4OTEwNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Cabaña en la Montaña",
    location: "Granada, España",
    price: 120,
    rating: 4.7,
    reviews: 92
  }),
  new PropertyModel({
    id: 5,
    image: "https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzY5MzA1OTc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Suite de Lujo",
    location: "Sevilla, España",
    price: 180,
    rating: 4.9,
    reviews: 201
  }),
  new PropertyModel({
    id: 6,
    image: "https://images.unsplash.com/photo-1567002260834-61d030a974d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VudHJ5c2lkZSUyMGNvdHRhZ2UlMjBnYXJkZW58ZW58MXx8fHwxNzY5Mzg5MTA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Casa Rural con Jardín",
    location: "Toledo, España",
    price: 95,
    rating: 4.6,
    reviews: 78
  })
];

// Mock de propiedades favoritas
export const mockFavoriteProperties = [
  new PropertyModel({
    id: 2,
    title: "Casa Contemporánea",
    location: "Barcelona, España",
    price: 150
  }),
  new PropertyModel({
    id: 4,
    title: "Cabaña en la Montaña",
    location: "Granada, España",
    price: 120
  })
];

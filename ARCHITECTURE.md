# Arquitectura MVC - Guía de Desarrollo

## 📚 Introducción

Este proyecto utiliza el patrón **Modelo-Vista-Controlador (MVC)** adaptado para aplicaciones React modernas con JavaScript.

## 🏗️ Componentes de la Arquitectura

### 1. MODELO (Models)
**Ubicación**: `/src/models/`

Los modelos definen la estructura de datos y la lógica de validación.

#### UserModel (`userModel.js`)
```javascript
import { UserModel } from '@/models/userModel';

// Crear un nuevo usuario
const user = new UserModel({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  role: 'guest'
});

// Validar email
UserModel.validateEmail('test@example.com'); // true o false

// Obtener iniciales
user.getInitials(); // 'JP'
```

#### PropertyModel (`propertyModel.js`)
```javascript
import { PropertyModel, mockFeaturedProperties } from '@/models/propertyModel';

// Crear una propiedad
const property = new PropertyModel({
  title: 'Casa Moderna',
  location: 'Madrid',
  price: 100
});

// Obtener precio formateado
property.getFormattedPrice(); // '$100'

// Usar datos mock
const properties = mockFeaturedProperties;
```

#### BookingModel (`bookingModel.js`)
```javascript
import { BookingModel, mockUserBookings } from '@/models/bookingModel';

// Crear una reserva
const booking = new BookingModel({
  property: 'Casa Moderna',
  location: 'Madrid',
  status: 'confirmed',
  price: 300
});

// Obtener estado legible
booking.getStatusText(); // 'Confirmada'

// Verificar si está activa
booking.isActive(); // true o false
```

### 2. CONTROLADOR (Controllers)
**Ubicación**: `/src/controllers/`

Los controladores manejan la lógica de negocio y son singletons.

#### AuthController (`authController.js`)
```javascript
import { authController } from '@/controllers/authController';

// Iniciar sesión
const result = authController.login('email@example.com', 'password');
if (result.success) {
  console.log('Usuario autenticado:', result.user);
}

// Registrar usuario
const registerResult = authController.register({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '+34 600 000 000',
  password: 'password123',
  confirmPassword: 'password123',
  role: 'guest'
});

// Cerrar sesión
authController.logout();

// Verificar autenticación
const isAuth = authController.checkAuth();

// Obtener usuario actual
const currentUser = authController.getCurrentUser();

// Cambiar rol
authController.switchUserRole('host');
```

#### NavigationController (`navigationController.js`)
```javascript
import { navigationController } from '@/controllers/navigationController';

// Navegar a una página
navigationController.navigateTo('profile');

// Obtener página actual
const currentPage = navigationController.getCurrentPage(); // 'profile'

// Volver atrás
navigationController.goBack();

// Obtener historial
const history = navigationController.getHistory(); // ['home', 'login', 'profile']

// Agregar listener para cambios de navegación
navigationController.addListener((page) => {
  console.log('Navegó a:', page);
});

// Resetear
navigationController.reset(); // Vuelve a 'home'
```

#### UserController (`userController.js`)
```javascript
import { userController } from '@/controllers/userController';

// Obtener reservas del usuario
const bookings = userController.getUserBookings(userId);

// Obtener favoritos
const favorites = userController.getUserFavorites();

// Agregar a favoritos
userController.addToFavorites(property);

// Remover de favoritos
userController.removeFromFavorites(propertyId);

// Crear nueva reserva
userController.createBooking({
  propertyId: 1,
  property: 'Casa Moderna',
  dates: '15 Mar - 18 Mar 2026',
  price: 300
});

// Cancelar reserva
userController.cancelBooking(bookingId);

// Obtener preferencias
const prefs = userController.getUserPreferences();

// Actualizar preferencias
userController.updateUserPreferences({
  language: 'es',
  currency: 'EUR'
});

// Actualizar notificaciones
userController.updateNotificationPreferences({
  specialOffers: true,
  bookingReminders: true,
  newsletter: false
});

// Obtener estadísticas
const stats = userController.getUserStats(userId);
// { totalBookings, completedBookings, activeBookings, favoriteCount }
```

### 3. VISTA (Views)
**Ubicación**: `/src/views/`

Las vistas son componentes React puros enfocados en la presentación.

#### Estructura de Vistas

```
views/
├── pages/              # Componentes de página completa
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── ProfilePage.jsx
└── components/         # Componentes reutilizables
    ├── Header.jsx
    └── PropertyCard.jsx
```

#### Ejemplo de uso en un componente:

```javascript
// LoginPage.jsx
import { useState } from 'react';
import { authController } from '@/controllers/authController';
import { navigationController } from '@/controllers/navigationController';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Usar el controlador para la lógica
    const result = authController.login(email, password);
    
    if (result.success) {
      // Usar el controlador de navegación
      navigationController.navigateTo('profile');
    } else {
      alert(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* JSX del formulario */}
    </form>
  );
}
```

## 🔄 Flujo de Datos

```
Usuario interactúa con Vista
        ↓
Vista llama a Controlador
        ↓
Controlador manipula Modelo
        ↓
Controlador actualiza Vista
        ↓
Vista renderiza cambios
```

## 📝 Convenciones de Código

### Modelos
- Usar clases para definir modelos
- Exportar instancias mock para desarrollo
- Incluir métodos de validación y formateo
- Método `toJSON()` para serialización

### Controladores
- Exportar como singletons
- Métodos retornan objetos con `{ success, message, data }`
- No manipular el DOM directamente
- Mantener estado interno cuando sea necesario

### Vistas
- Componentes funcionales con hooks
- Importar controladores solo cuando se necesiten
- Props claras y tipadas con comentarios
- Separar lógica de presentación

## 🎯 Mejores Prácticas

1. **Separación de Responsabilidades**
   - Modelo: Solo estructura de datos y validación
   - Controlador: Solo lógica de negocio
   - Vista: Solo presentación y eventos de usuario

2. **Comunicación**
   - Vista → Controlador: Llamadas directas
   - Controlador → Modelo: Instanciación y manipulación
   - Controlador → Vista: Retorno de datos o callbacks

3. **Estado**
   - Estado de UI: En componentes React (useState, useReducer)
   - Estado de aplicación: En controladores
   - Datos persistentes: En modelos

4. **Reutilización**
   - Modelos: Reutilizar lógica de validación
   - Controladores: Métodos genéricos
   - Vistas: Componentes pequeños y enfocados

## 🔧 Extensión del Sistema

### Agregar un Nuevo Modelo

```javascript
// src/models/reviewModel.js
export class ReviewModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.propertyId = data.propertyId || null;
    this.rating = data.rating || 0;
    this.comment = data.comment || '';
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  isValid() {
    return this.rating >= 1 && this.rating <= 5 && this.comment.length > 0;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      propertyId: this.propertyId,
      rating: this.rating,
      comment: this.comment,
      createdAt: this.createdAt
    };
  }
}
```

### Agregar un Nuevo Controlador

```javascript
// src/controllers/reviewController.js
import { ReviewModel } from '@/models/reviewModel';

export class ReviewController {
  constructor() {
    this.reviews = [];
  }

  createReview(reviewData) {
    const review = new ReviewModel(reviewData);
    
    if (!review.isValid()) {
      return {
        success: false,
        message: 'Reseña inválida'
      };
    }

    this.reviews.push(review);
    
    return {
      success: true,
      message: 'Reseña creada',
      review: review.toJSON()
    };
  }

  getPropertyReviews(propertyId) {
    return this.reviews.filter(r => r.propertyId === propertyId);
  }
}

export const reviewController = new ReviewController();
```

### Agregar una Nueva Vista

```javascript
// src/views/pages/ReviewPage.jsx
import { useState } from 'react';
import { reviewController } from '@/controllers/reviewController';

export function ReviewPage({ propertyId, onNavigate }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const result = reviewController.createReview({
      propertyId,
      rating,
      comment
    });

    if (result.success) {
      alert('Reseña publicada');
      onNavigate('home');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* JSX del formulario de reseña */}
    </form>
  );
}
```

## 📖 Recursos Adicionales

- [Documentación de React](https://react.dev/)
- [Guía de Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Patrón MVC](https://es.wikipedia.org/wiki/Modelo%E2%80%93vista%E2%80%93controlador)

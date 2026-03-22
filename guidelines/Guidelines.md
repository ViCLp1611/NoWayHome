# Guidelines - NoWayHome

## Arquitectura del Proyecto

Este proyecto utiliza **arquitectura Modelo-Vista-Controlador (MVC)** con **Vite + React + JavaScript**.

### Estructura MVC

```
src/
├── models/              # Modelo - Lógica de datos
├── controllers/         # Controlador - Lógica de negocio  
├── views/              # Vista - Componentes React
│   ├── pages/          # Páginas completas
│   └── components/     # Componentes reutilizables
├── App.jsx             # Componente principal
└── main.jsx            # Entry point
```

## Reglas Generales

### Separación de Responsabilidades

- **Modelos**: Solo estructura de datos, validación y métodos utilitarios
- **Controladores**: Solo lógica de negocio, no manipular DOM
- **Vistas**: Solo presentación, llamar a controladores para lógica

### Organización de Código

- Mantener archivos pequeños y enfocados
- Un modelo/controlador/vista por archivo
- Nombres descriptivos en español para el dominio del negocio
- Usar camelCase para variables y funciones, PascalCase para componentes y clases

### Imports

```javascript
// Orden de imports:
// 1. React y hooks
import { useState, useEffect } from 'react';

// 2. Librerías externas
import { Search, MapPin } from 'lucide-react';

// 3. Controladores
import { authController } from '@/controllers/authController';

// 4. Modelos
import { UserModel } from '@/models/userModel';

// 5. Componentes
import { Button } from '@/app/components/ui/button';
import { Header } from '@/views/components/Header';
```

## Sistema de Diseño

### Paleta de Colores

Usar las variables de colores definidas del sistema "Warm Minimalism":

```javascript
// Colores principales
const colors = {
  primary: '#6B8E23',        // Verde Oliva - Botones primarios
  background: '#F2E8CF',     // Beige Arena - Cards/secciones
  accent: '#A67C52',         // Marrón Suave - Acentos/íconos
  surface: '#FAFAFA',        // Blanco Roto - Fondos
  text: '#5F5F5F'            // Gris Cálido - Texto principal
};
```

### Tipografía

- **Títulos**: `font-poppins font-semibold`
- **Texto y botones**: `font-inter` (Regular o Medium)

⚠️ **No usar** clases de Tailwind para `font-size`, `font-weight`, o `line-height` a menos que el usuario lo solicite explícitamente.

### Componentes UI

Usar los componentes base de `/src/app/components/ui/`:

```javascript
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
```

Aplicar colores personalizados directamente en el `className`:

```javascript
<Button className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e]">
  Buscar
</Button>
```

### Responsive Design

- **Mobile-first**: Diseñar primero para móvil
- Usar breakpoints de Tailwind: `md:`, `lg:`
- Grid responsivo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

## Patrones de Código

### Modelos

```javascript
export class ExampleModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
  }

  // Métodos de validación
  static validateName(name) {
    return name.length >= 3;
  }

  // Métodos de formateo
  getFormattedName() {
    return this.name.toUpperCase();
  }

  // Serialización
  toJSON() {
    return {
      id: this.id,
      name: this.name
    };
  }
}
```

### Controladores

```javascript
export class ExampleController {
  constructor() {
    this.data = [];
  }

  createItem(itemData) {
    // Validación
    if (!itemData.name) {
      return {
        success: false,
        message: 'Nombre requerido'
      };
    }

    // Lógica de negocio
    const item = new ExampleModel(itemData);
    this.data.push(item);

    // Respuesta estandarizada
    return {
      success: true,
      message: 'Item creado',
      item: item.toJSON()
    };
  }
}

// Exportar como singleton
export const exampleController = new ExampleController();
```

### Vistas (Componentes)

```javascript
import { useState } from 'react';
import { exampleController } from '@/controllers/exampleController';

export function ExamplePage({ onNavigate }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const result = exampleController.createItem({ name });
    
    if (result.success) {
      onNavigate('success');
    } else {
      alert(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* JSX aquí */}
    </form>
  );
}
```

## Roles de Usuario

La aplicación soporta múltiples roles:

- **Huésped**: Buscar y reservar alojamiento
- **Anfitrión**: Publicar y gestionar propiedades
- **Transición de rol**: Habilitada desde el perfil de usuario

### Implementación de Roles

```javascript
// En el modelo de usuario
switchRole(newRole) {
  if (newRole === 'guest' || newRole === 'host') {
    this.role = newRole;
    return true;
  }
  return false;
}

// En el controlador de autenticación
switchUserRole(newRole) {
  if (this.currentUser.switchRole(newRole)) {
    return {
      success: true,
      message: `Rol cambiado a ${newRole}`,
      user: this.currentUser
    };
  }
  return { success: false };
}
```

## Navegación

Usar el `navigationController` para la navegación:

```javascript
import { navigationController } from '@/controllers/navigationController';

// Navegar
navigationController.navigateTo('profile');

// Volver atrás
navigationController.goBack();

// Escuchar cambios
navigationController.addListener((page) => {
  console.log('Navegó a:', page);
});
```

## Estado

### Estado Local (UI)
Usar hooks de React para estado de UI:

```javascript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '', email: '' });
```

### Estado de Aplicación
Usar controladores para estado compartido:

```javascript
// En el controlador
export class AppController {
  constructor() {
    this.theme = 'light';
    this.listeners = [];
  }

  setTheme(theme) {
    this.theme = theme;
    this.notifyListeners();
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.theme));
  }
}
```

## Testing (Futuro)

Cuando se implementen tests:

- Modelos: Tests unitarios de validación
- Controladores: Tests de lógica de negocio
- Vistas: Tests de componentes con React Testing Library

## Mejores Prácticas

1. **Nunca** manipular el DOM directamente desde controladores
2. **Siempre** validar datos en modelos antes de usar
3. **Mantener** controladores sin estado UI (solo lógica)
4. **Separar** componentes grandes en componentes más pequeños
5. **Usar** destructuring para props claras
6. **Comentar** lógica compleja
7. **Evitar** duplicación de código

## Accesibilidad

- Usar etiquetas semánticas HTML5
- Incluir atributos `aria-label` donde sea necesario
- Mantener contraste de colores adecuado (ya definido en paleta)
- Hacer componentes accesibles por teclado

## Performance

- Usar `React.memo()` para componentes pesados
- Evitar re-renders innecesarios
- Lazy loading de imágenes
- Code splitting para rutas

## Recursos

- [Arquitectura MVC del Proyecto](/ARCHITECTURE.md)
- [README del Proyecto](/README.md)
- [Documentación de React](https://react.dev/)
- [Guía de Vite](https://vitejs.dev/)

# NoWayHome - Plataforma de Reservas de Alojamiento

Aplicación web responsive (mobile-first) para la plataforma de reservas "NoWayHome", enfocada en el rol de Huésped/Usuario con soporte para múltiples roles (Huésped, Anfitrión, Administrador).

## 🏗️ Arquitectura

Este proyecto utiliza **Modelo-Vista-Controlador (MVC)** con **Vite + React + JavaScript**.

### Estructura de Carpetas

```
src/
├── models/              # MODELO - Lógica de datos y esquemas
│   ├── userModel.js     # Modelo de Usuario
│   ├── propertyModel.js # Modelo de Propiedades
│   └── bookingModel.js  # Modelo de Reservas
│
├── controllers/         # CONTROLADOR - Lógica de negocio
│   ├── authController.js       # Autenticación
│   ├── navigationController.js # Navegación
│   └── userController.js       # Gestión de usuario
│
├── views/               # VISTA - Componentes React (presentación)
│   ├── pages/           # Páginas principales
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── ProfilePage.jsx
│   └── components/      # Componentes reutilizables
│       ├── Header.jsx
│       └── PropertyCard.jsx
│
├── app/
│   └── components/
│       └── ui/          # Componentes UI base (Radix UI)
│
├── styles/              # Estilos globales
│   ├── index.css
│   ├── tailwind.css
│   ├── theme.css
│   └── fonts.css
│
├── App.jsx              # Componente principal
└── main.jsx             # Punto de entrada
```

## 🎨 Diseño

**Enfoque**: Warm Minimalism / Human-Centered Design

### Paleta de Colores

- **Verde Oliva** (#6B8E23): Botones primarios
- **Beige Arena** (#F2E8CF): Cards y secciones
- **Marrón Suave** (#A67C52): Acentos e íconos
- **Blanco Roto** (#FAFAFA): Fondos principales
- **Gris Cálido** (#5F5F5F): Texto principal

### Tipografía

- **Poppins SemiBold**: Títulos
- **Inter Regular/Medium**: Texto y botones

## 📋 Características Principales

### Pantallas Implementadas

1. **Página de Inicio** (HomePage)
   - Hero section con barra de búsqueda
   - Propiedades destacadas
   - Call-to-action
   - Enlace discreto para anfitriones

2. **Inicio de Sesión** (LoginPage)
   - Formulario de autenticación
   - Texto informativo sobre acceso dual (huésped/anfitrión)
   - Opciones de login social

3. **Registro** (RegisterPage)
   - Formulario completo de registro
   - Selector de rol (Huésped/Anfitrión)
   - Aceptación de términos

4. **Perfil de Usuario** (ProfilePage)
   - Información del usuario
   - Tabs: Mis Reservas, Favoritos, Configuración
   - Sección de rol con opción de conversión a anfitrión
   - Preferencias de notificaciones
   - Configuración de seguridad

5. **Panel Administrador** (AdminLogin + AdminDashboard)
   - Login seguro para administradores (`/admin/login`)
   - Dashboard con gestión de usuarios (`/admin/dashboard`)
   - CRUD completo de usuarios (crear, leer, actualizar, eliminar)
   - Autenticación directa con tabla "administrador" en Supabase
   - Interfaz responsive con confirmaciones de seguridad

### Roles de Usuario

- **Huésped**: Buscar y reservar alojamiento
- **Anfitrión**: Publicar y gestionar propiedades
- **Administrador**: Gestionar usuarios y plataforma
- **Cambio de rol**: Disponible desde el perfil

## 🚀 Tecnologías

- **Vite**: Build tool y dev server
- **React 18**: Framework de UI
- **JavaScript (ESNext)**: Lenguaje de programación
- **Tailwind CSS v4**: Framework de estilos
- **Radix UI**: Componentes UI accesibles
- **Lucide React**: Librería de íconos

## 📦 Instalación y Uso

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Modo desarrollo
npm run dev

# Build para producción
npm run build
```

### 🔧 Configuración de Supabase

1. **Crear archivo `.env`** basado en `.env.example`
2. **Agregar credenciales reales**:
   ```bash
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima
   ```

3. **Crear tabla administrador** en Supabase SQL Editor:
   ```sql
   CREATE TABLE IF NOT EXISTS public.administrador (
       id_admin INTEGER GENERATED ALWAYS AS IDENTITY,
       nombre VARCHAR(100) NOT NULL,
       correo VARCHAR(100) NOT NULL UNIQUE,
       contrasena VARCHAR(100) NOT NULL,
       PRIMARY KEY (id_admin)
   );

   -- Insertar admin de prueba
   INSERT INTO public.administrador (nombre, correo, contrasena)
   VALUES ('Administrador Principal', 'admin@nowayhome.com', 'admin123')
   ON CONFLICT (correo) DO NOTHING;
   ```

4. **Configurar políticas RLS** (IMPORTANTE - Ejecutar después del paso 3):
   ```sql
   -- Habilitar RLS en la tabla administrador
   ALTER TABLE public.administrador ENABLE ROW LEVEL SECURITY;

   -- Crear política para permitir consultas de autenticación
   CREATE POLICY "Permitir consulta de administradores" ON public.administrador
       FOR SELECT
       TO anon
       USING (true);
   ```

5. **Verificar conexión** (opcional):
   - Abrir `http://localhost:5186/` en el navegador
   - Ejecutar en consola: `import('./diagnose-supabase.js')`

## 🏛️ Patrón MVC

### Modelos (Models)
Define la estructura y validación de datos:
- `UserModel`: Gestión de usuarios
- `PropertyModel`: Gestión de propiedades
- `BookingModel`: Gestión de reservas

### Controladores (Controllers)
Maneja la lógica de negocio:
- `authController`: Login, registro, logout
- `navigationController`: Navegación entre páginas
- `userController`: Perfil, favoritos, reservas

### Vistas (Views)
Componentes React para la presentación:
- **Páginas**: Componentes de página completa
- **Componentes**: Elementos reutilizables

## 🎯 Próximos Pasos

- Integrar API real para autenticación
- Implementar búsqueda de propiedades funcional
- Agregar sistema de reservas completo
- Panel de anfitrión para gestión de propiedades
- Sistema de mensajería entre usuarios
- Pasarela de pagos

## 📄 Licencia

Proyecto académico - NoWayHome © 2026

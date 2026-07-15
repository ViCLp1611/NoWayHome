import { API_URL } from '@/config/api'

/*
|--------------------------------------------------------------------------
| Servicio frontend de datos administrativos
|--------------------------------------------------------------------------
| Centraliza las llamadas que alimentan el dashboard admin:
| - GET /api/admin/dashboard-data
| - GET /api/admin/users-data
| - GET /api/admin/properties-data
| - GET /api/admin/bookings-data
|
| Seguridad:
| - Lee el admin guardado despues de login + 2FA.
| - Envia cabeceras x-admin-role/x-admin-email para que el backend valide
|   acceso administrativo antes de consultar Supabase.
| - No debe usarse desde vistas publicas.
*/
function getStoredAdmin() {
  const rawAdmin = sessionStorage.getItem('admin') || localStorage.getItem('admin')

  if (!rawAdmin) {
    return null
  }

  try {
    return JSON.parse(rawAdmin)
  } catch {
    return null
  }
}

async function getAdminJson(path) {
  // Todas las vistas admin pasan por este helper para compartir cabeceras
  // de rol y manejo uniforme de errores del backend.
  const admin = getStoredAdmin()
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'x-admin-role': admin?.role || '',
      'x-admin-email': admin?.correo || '',
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudieron cargar datos administrativos.')
  }

  return data
}

export function getAdminDashboardData() {
  // Dashboard.jsx espera totales/resumen desde inquilino, arrendatario,
  // propiedad y reserva.
  return getAdminJson('/api/admin/dashboard-data')
}

export function getAdminUsersData() {
  // UserManagement.jsx espera usuarios y relaciones para actividad.
  return getAdminJson('/api/admin/users-data')
}

export function getAdminPropertiesData() {
  // PropertyManagement.jsx espera propiedades, arrendatarios y reservas.
  return getAdminJson('/api/admin/properties-data')
}

export function getAdminBookingsData() {
  // BookingManagement.jsx espera reservas con propiedad, inquilino y
  // arrendatario relacionado.
  return getAdminJson('/api/admin/bookings-data')
}

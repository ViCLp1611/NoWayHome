const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
  return getAdminJson('/api/admin/dashboard-data')
}

export function getAdminUsersData() {
  return getAdminJson('/api/admin/users-data')
}

export function getAdminPropertiesData() {
  return getAdminJson('/api/admin/properties-data')
}

export function getAdminBookingsData() {
  return getAdminJson('/api/admin/bookings-data')
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function getLandlordProfile(idArrendatario) {
  const response = await fetch(`${API_URL}/api/arrendatario/profile/${idArrendatario}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo cargar tu informacion.')
  }

  return data.profile
}

export async function updateLandlordProfile(idArrendatario, profileData) {
  const response = await fetch(`${API_URL}/api/arrendatario/profile/${idArrendatario}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo actualizar tu informacion. Intenta nuevamente.')
  }

  return data.profile
}

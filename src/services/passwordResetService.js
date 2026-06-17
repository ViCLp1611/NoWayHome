const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function postJson(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo completar la solicitud.')
  }

  return data
}

export function requestPasswordReset(correo) {
  return postJson('/api/auth/forgot-password', { correo })
}

export function resetPassword(token, nuevaContrasena) {
  return postJson('/api/auth/reset-password', { token, nuevaContrasena })
}

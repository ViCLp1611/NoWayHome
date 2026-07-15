import { API_URL } from '@/config/api'

/*
|--------------------------------------------------------------------------
| Servicio frontend de recuperacion de contrasena
|--------------------------------------------------------------------------
| Centraliza llamadas HTTP para el flujo propio de recuperacion.
| No usa Supabase Auth ni OAuth.
|
| Seguridad:
| - No guarda tokens en storage.
| - Solo envia el token recibido por URL al backend.
| - Los mensajes genericos se mantienen en la vista para no revelar correos.
*/
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
  // POST /api/auth/forgot-password
  // Envia: { correo }
  // Devuelve: mensaje generico aunque el correo no exista.
  return postJson('/api/auth/forgot-password', { correo })
}

export function resetPassword(token, nuevaContrasena) {
  // POST /api/auth/reset-password
  // Envia: { token, nuevaContrasena }
  // Devuelve: mensaje de resultado; el backend valida hash, expiracion y uso.
  return postJson('/api/auth/reset-password', { token, nuevaContrasena })
}

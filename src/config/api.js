const configuredApiUrl = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '')

if (!configuredApiUrl && import.meta.env.PROD) {
  throw new Error('Falta configurar VITE_API_URL para conectar con NoWayHome API.')
}

export const API_URL = configuredApiUrl || 'http://localhost:3000'

const configuredApiUrl = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '')

const isLocalOrLanHostname = hostname =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '[::1]' ||
  hostname.endsWith('.local') ||
  /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)

function resolveApiUrl() {
  if (configuredApiUrl) {
    return configuredApiUrl
  }

  if (typeof window !== 'undefined' && isLocalOrLanHostname(window.location.hostname)) {
    const apiPort = String(import.meta.env.VITE_API_PORT || '3001').trim()
    return `${window.location.protocol}//${window.location.hostname}:${apiPort}`
  }

  if (import.meta.env.PROD) {
    throw new Error('Falta configurar VITE_API_URL para conectar con NoWayHome API.')
  }

  return 'http://localhost:3001'
}

export const API_URL = resolveApiUrl()

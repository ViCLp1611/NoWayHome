import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootEnvPath = path.resolve(__dirname, '../../.env')

dotenv.config()
dotenv.config({ path: rootEnvPath })

/*
|--------------------------------------------------------------------------
| Variables de entorno del backend
|--------------------------------------------------------------------------
| Centraliza la configuracion sensible usada por Express, Supabase y correo.
|
| Seguridad:
| - SUPABASE_SERVICE_ROLE_KEY, EMAIL_PASS, SMTP_PASS y RESEND_API_KEY nunca
|   deben exponerse en frontend ni imprimirse en consola.
| - FRONTEND_URL define el origen permitido por CORS y la base de enlaces
|   para recuperacion de contrasena.
*/
const cleanEnv = value => String(value ?? '').trim()

const normalizeOriginUrl = value =>
  String(value || '')
    .trim()
    .replace(/\/+$/, '')

const parsedSmtpPort = Number(process.env.SMTP_PORT || 587)

export const NODE_ENV = cleanEnv(process.env.NODE_ENV) || 'development'
export const PORT = Number(process.env.PORT || 3001)
export const FRONTEND_URL = normalizeOriginUrl(
  process.env.FRONTEND_URL || (NODE_ENV === 'production' ? '' : `http://localhost:${PORT}`)
)
export const FRONTEND_URL_PREVIEW = normalizeOriginUrl(process.env.FRONTEND_URL_PREVIEW || '')
export const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(normalizeOriginUrl)
  .filter(Boolean)
export const SUPABASE_URL = cleanEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)
export const SUPABASE_SERVICE_ROLE_KEY = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
export const SMTP_SERVICE = cleanEnv(process.env.SMTP_SERVICE)
export const SMTP_HOST = cleanEnv(process.env.SMTP_HOST)
export const SMTP_PORT = Number.isFinite(parsedSmtpPort) && parsedSmtpPort > 0 ? parsedSmtpPort : 587
export const EMAIL_USER = cleanEnv(process.env.SMTP_USER || process.env.EMAIL_USER)
export const EMAIL_PASS = cleanEnv(process.env.SMTP_PASS || process.env.EMAIL_PASS).replace(/\s/g, '')
export const SMTP_SECURE = cleanEnv(process.env.SMTP_SECURE).toLowerCase() === 'true'
export const RESEND_API_KEY = cleanEnv(process.env.RESEND_API_KEY)
export const RESEND_FROM = cleanEnv(process.env.RESEND_FROM)
export const EMAIL_PROVIDER = cleanEnv(process.env.EMAIL_PROVIDER).toLowerCase()
export const MAIL_FROM = cleanEnv(
  process.env.EMAIL_FROM || process.env.MAIL_FROM || process.env.RESEND_FROM || EMAIL_USER
)
export const TWO_FACTOR_PEPPER = cleanEnv(process.env.TWO_FACTOR_PEPPER)
export const GEOAPIFY_API_KEY = cleanEnv(process.env.GEOAPIFY_API_KEY)
export const PAYPAL_CLIENT_ID = cleanEnv(process.env.PAYPAL_CLIENT_ID)
export const PAYPAL_CLIENT_SECRET = cleanEnv(
  process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET_KEY
)
function normalizePayPalApiUrl(rawUrl) {
  const cleaned = cleanEnv(rawUrl).replace(/\/+$/, '')
  if (!cleaned) return 'https://api-m.sandbox.paypal.com'
  if (/^https?:\/\/(www\.)?sandbox\.paypal\.com$/i.test(cleaned)) {
    return 'https://api-m.sandbox.paypal.com'
  }
  if (/^https?:\/\/(www\.)?paypal\.com$/i.test(cleaned)) {
    return 'https://api-m.paypal.com'
  }
  return cleaned
}

export const PAYPAL_BASE_URL = normalizePayPalApiUrl(
  process.env.PAYPAL_BASE_URL || process.env.PAYPAL_API_URL
)

const missingEnv = [
  NODE_ENV === 'production' && !FRONTEND_URL && 'FRONTEND_URL',
  !SUPABASE_URL && 'SUPABASE_URL',
  !SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
].filter(Boolean)

if (missingEnv.length > 0) {
  /*
   * Aviso operativo: no muestra valores secretos, solo nombres faltantes.
   * Mantenerlo asi para evitar fugas de credenciales.
   */
  console.warn(`Backend iniciado sin variables requeridas: ${missingEnv.join(', ')}`)
}

const hasSmtpConfig = Boolean((SMTP_HOST || SMTP_SERVICE) && EMAIL_USER && EMAIL_PASS)
const hasResendConfig = Boolean(RESEND_API_KEY)

if (!hasSmtpConfig && !hasResendConfig) {
  console.warn(
    'Backend iniciado sin credenciales completas de correo (SMTP_HOST/SMTP_USER/SMTP_PASS o RESEND_API_KEY).'
  )
}

if (!MAIL_FROM && !RESEND_FROM) {
  console.warn(
    'Backend iniciado sin remitente de correo configurado (EMAIL_FROM, MAIL_FROM o SMTP_USER).'
  )
}

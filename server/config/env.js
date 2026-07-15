import 'dotenv/config'

/*
|--------------------------------------------------------------------------
| Variables de entorno del backend
|--------------------------------------------------------------------------
| Centraliza la configuracion sensible usada por Express, Supabase y correo.
|
| Seguridad:
| - SUPABASE_SERVICE_ROLE_KEY, EMAIL_PASS y SMTP_PASS nunca deben exponerse
|   en frontend ni imprimirse en consola.
| - FRONTEND_URL define el origen permitido por CORS y la base de enlaces
|   para recuperacion de contrasena.
*/
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const PORT = Number(process.env.PORT || 3000)
export const FRONTEND_URL =
  process.env.FRONTEND_URL || (NODE_ENV === 'production' ? '' : 'http://localhost:5173')
export const FRONTEND_URL_PREVIEW = process.env.FRONTEND_URL_PREVIEW || ''
export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
export const SMTP_HOST = process.env.SMTP_HOST
export const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
export const EMAIL_USER = process.env.SMTP_USER || process.env.EMAIL_USER
export const EMAIL_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS
export const SMTP_SECURE = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true'
export const MAIL_FROM = process.env.EMAIL_FROM || process.env.MAIL_FROM || EMAIL_USER
export const TWO_FACTOR_PEPPER = process.env.TWO_FACTOR_PEPPER || ''
export const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || ''
export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
export const PAYPAL_CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET_KEY || ''
export const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL ||
  process.env.PAYPAL_API_URL ||
  'https://api-m.sandbox.paypal.com'

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

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
export const PORT = process.env.PORT || 3001
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
export const SMTP_HOST = process.env.SMTP_HOST
export const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
export const EMAIL_USER = process.env.EMAIL_USER || process.env.SMTP_USER
export const EMAIL_PASS = process.env.EMAIL_PASS || process.env.SMTP_PASS
export const MAIL_FROM = process.env.MAIL_FROM || EMAIL_USER
export const TWO_FACTOR_PEPPER = process.env.TWO_FACTOR_PEPPER || ''
export const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || ''

const missingEnv = [
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

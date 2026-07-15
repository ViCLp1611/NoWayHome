import { createClient } from '@supabase/supabase-js'
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './env.js'

/*
|--------------------------------------------------------------------------
| Cliente Supabase con Service Role Key
|--------------------------------------------------------------------------
| Este cliente se usa solo en backend para consultar y modificar tablas
| protegidas de Supabase PostgreSQL.
|
| Tablas sensibles:
| - administrador
| - inquilino
| - arrendatario
| - two_factor_codes
| - password_reset_tokens
| - propiedad
| - reserva
|
| ADVERTENCIA:
| No mover esta clave ni este cliente al frontend React.
*/
export const supabase = createClient(
  SUPABASE_URL.trim(),
  SUPABASE_SERVICE_ROLE_KEY.trim(),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

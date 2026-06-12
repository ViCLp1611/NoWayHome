import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// Utilizamos SERVICE_ROLE_KEY para que el servidor tenga permisos administrativos
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

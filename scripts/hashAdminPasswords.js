import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: faltan variables de entorno. Define VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
})

const ADMIN_TABLE = 'administrador'
const HASH_PREFIXES = ['\$2a\$', '\$2b\$', '\$2y\$']

function isBcryptHash(value) {
  return typeof value === 'string' && HASH_PREFIXES.some((prefix) => value.startsWith(prefix))
}

async function hashAdminPasswords() {
  console.log('Iniciando hash de contraseñas de administradores...')

  const { data: admins, error: fetchError } = await supabase
    .from(ADMIN_TABLE)
    .select('id_admin,correo,contrasena')

  if (fetchError) {
    console.error('Error al leer administradores:', fetchError.message)
    process.exit(1)
  }

  if (!Array.isArray(admins)) {
    console.error('Error inesperado: la consulta no devolvió una lista de administradores.')
    process.exit(1)
  }

  for (const admin of admins) {
    const adminId = admin.id_admin
    const correo = String(admin.correo || '').trim()
    const contrasena = admin.contrasena

    if (!adminId || !correo) {
      console.warn('Registro de administrador inválido, omitiendo:', admin)
      continue
    }

    if (isBcryptHash(contrasena)) {
      console.log(`Ya estaba hasheada: ${correo}`)
      continue
    }

    try {
      const hashedPassword = await bcrypt.hash(String(contrasena), 10)
      const { error: updateError } = await supabase
        .from(ADMIN_TABLE)
        .update({ contrasena: hashedPassword })
        .eq('id_admin', adminId)

      if (updateError) {
        console.error(`Error al actualizar contraseña de ${correo}: ${updateError.message}`)
      } else {
        console.log(`Contraseña actualizada correctamente: ${correo}`)
      }
    } catch (hashError) {
      console.error(`Error al procesar contraseña de ${correo}: ${hashError.message}`)
    }
  }

  console.log('Proceso finalizado.')
}

hashAdminPasswords()

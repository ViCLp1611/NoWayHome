import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const GENERIC_RESET_MESSAGE =
  'Si el correo esta registrado, recibiras instrucciones para restablecer tu contrasena.'

const missingEnv = [
  !SUPABASE_URL && 'SUPABASE_URL',
  !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
].filter(Boolean)

if (missingEnv.length > 0) {
  console.warn(`Backend iniciado sin variables requeridas: ${missingEnv.join(', ')}`)
}

const supabase = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

const app = express()

app.use(
  cors({
    origin: FRONTEND_URL,
  })
)
app.use(express.json())

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function normalizeEmail(correo) {
  return typeof correo === 'string' ? correo.trim().toLowerCase() : ''
}

function getTransporter() {
  const smtpPort = Number(process.env.SMTP_PORT || 587)

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

async function findAccountByEmail(correo) {
  const lookups = [
    { table: 'administrador', role: 'administrador' },
    { table: 'inquilino', role: 'inquilino' },
    { table: 'arrendatario', role: 'arrendatario' },
  ]

  for (const lookup of lookups) {
    const { data, error } = await supabase
      .from(lookup.table)
      .select('correo')
      .eq('correo', correo)
      .maybeSingle()

    if (error) {
      throw new Error(`No se pudo consultar ${lookup.table}: ${error.message}`)
    }

    if (data) {
      return lookup
    }
  }

  return null
}

async function sendResetEmail(correo, token) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`
  const transporter = getTransporter()

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: correo,
    subject: 'Restablece tu contrasena de NoWayHome',
    text: `Usa este enlace para restablecer tu contrasena. Expira en 15 minutos:\n\n${resetUrl}`,
    html: `
      <p>Usa este enlace para restablecer tu contrasena. Expira en 15 minutos:</p>
      <p><a href="${resetUrl}">Restablecer contrasena</a></p>
    `,
  })
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/forgot-password', async (req, res) => {
  const correo = normalizeEmail(req.body?.correo)

  if (!correo) {
    return res.status(400).json({ message: 'El correo es requerido.' })
  }

  try {
    const account = await findAccountByEmail(correo)

    if (account) {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = hashToken(token)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

      const { error: insertError } = await supabase.from('password_reset_tokens').insert({
        correo,
        rol: account.role,
        token_hash: tokenHash,
        expires_at: expiresAt,
        used: false,
      })

      if (insertError) {
        throw new Error(`No se pudo guardar el token de recuperacion: ${insertError.message}`)
      }

      await sendResetEmail(correo, token)
    }

    return res.json({ message: GENERIC_RESET_MESSAGE })
  } catch (error) {
    console.error('Error en forgot-password:', error.message)
    return res.status(500).json({ message: GENERIC_RESET_MESSAGE })
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : ''
  const nuevaContrasena =
    typeof req.body?.nuevaContrasena === 'string' ? req.body.nuevaContrasena : ''

  if (!token || !nuevaContrasena) {
    return res.status(400).json({ message: 'Token y nueva contrasena son requeridos.' })
  }

  if (nuevaContrasena.length < 8) {
    return res.status(400).json({ message: 'La contrasena debe tener minimo 8 caracteres.' })
  }

  try {
    const tokenHash = hashToken(token)
    const now = new Date().toISOString()

    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, correo, rol')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .gt('expires_at', now)
      .maybeSingle()

    if (tokenError) {
      throw new Error(`No se pudo validar el token: ${tokenError.message}`)
    }

    if (!resetToken) {
      return res.status(400).json({ message: 'El enlace no es valido o ha expirado.' })
    }

    const tableByRole = {
      administrador: 'administrador',
      inquilino: 'inquilino',
      arrendatario: 'arrendatario',
    }
    const table = tableByRole[resetToken.rol]

    if (!table) {
      return res.status(400).json({ message: 'El enlace no es valido o ha expirado.' })
    }

    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10)

    const { error: updateError } = await supabase
      .from(table)
      .update({ contrasena: hashedPassword })
      .eq('correo', resetToken.correo)

    if (updateError) {
      throw new Error(`No se pudo actualizar la contrasena: ${updateError.message}`)
    }

    const { error: usedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id)

    if (usedError) {
      throw new Error(`No se pudo marcar el token como usado: ${usedError.message}`)
    }

    return res.json({ message: 'Contrasena actualizada correctamente.' })
  } catch (error) {
    console.error('Error en reset-password:', error.message)
    return res.status(500).json({ message: 'El enlace no es valido o ha expirado.' })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor NoWayHome escuchando en http://localhost:${PORT}`)
})

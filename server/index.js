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
const GENERIC_LOGIN_MESSAGE = 'Credenciales incorrectas. Verifica tu correo y contrasena.'
const TWO_FACTOR_EXPIRATION_MINUTES = 5
const TWO_FACTOR_MAX_ATTEMPTS = 5

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

function hash2faCode(correo, code) {
  return crypto
    .createHash('sha256')
    .update(`${normalizeEmail(correo)}:${code}:${process.env.TWO_FACTOR_PEPPER || ''}`)
    .digest('hex')
}

function normalizeEmail(correo) {
  return typeof correo === 'string' ? correo.trim().toLowerCase() : ''
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
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

async function findAccountWithPasswordByEmail(correo) {
  const lookups = [
    { table: 'administrador', role: 'administrador', idField: 'id_admin' },
    { table: 'inquilino', role: 'inquilino', idField: 'id_inquilino' },
    { table: 'arrendatario', role: 'arrendatario', idField: 'id_arrendatario' },
  ]

  for (const lookup of lookups) {
    const { data, error } = await supabase
      .from(lookup.table)
      .select('*')
      .eq('correo', correo)
      .maybeSingle()

    if (error) {
      throw new Error(`No se pudo consultar ${lookup.table}: ${error.message}`)
    }

    if (data) {
      return { ...lookup, data }
    }
  }

  return null
}

async function validatePassword(plainPassword, storedPassword) {
  if (!storedPassword || typeof storedPassword !== 'string') {
    return false
  }

  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword)
  }

  return plainPassword === storedPassword
}

function toSafeAccount(account) {
  const id = account.data[account.idField]

  return {
    id,
    [account.idField]: id,
    nombre: account.data.nombre,
    correo: account.data.correo,
    telefono: account.data.telefono,
    role: account.role,
  }
}

function isAdminRequest(req) {
  return req.get('x-admin-role') === 'administrador'
}

function getSupabaseErrorMessage(results) {
  return results
    .map((result) => result.error)
    .filter(Boolean)
    .map((error) => error.message)
    .join(' | ')
}

function sendAdminDataResponse(res, results, payload) {
  const errorMessage = getSupabaseErrorMessage(results)

  if (errorMessage) {
    return res.status(500).json({
      success: false,
      message: `No se pudieron cargar datos administrativos. ${errorMessage}`,
    })
  }

  return res.json({ success: true, ...payload })
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

async function send2faEmail(correo, code) {
  const transporter = getTransporter()

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: correo,
    subject: 'Tu codigo de verificacion de NoWayHome',
    text: `Tu codigo de verificacion es ${code}. Expira en ${TWO_FACTOR_EXPIRATION_MINUTES} minutos.`,
    html: `
      <p>Tu codigo de verificacion es:</p>
      <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${code}</p>
      <p>Expira en ${TWO_FACTOR_EXPIRATION_MINUTES} minutos. No lo compartas con nadie.</p>
    `,
  })
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/login', async (req, res) => {
  const correo = normalizeEmail(req.body?.correo)
  const contrasena = typeof req.body?.contrasena === 'string' ? req.body.contrasena : ''

  if (!correo || !contrasena) {
    return res.status(400).json({ success: false, message: 'Correo y contrasena son requeridos.' })
  }

  try {
    const account = await findAccountWithPasswordByEmail(correo)

    if (!account) {
      return res.status(401).json({ success: false, message: GENERIC_LOGIN_MESSAGE })
    }

    const passwordMatches = await validatePassword(contrasena, account.data.contrasena)

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: GENERIC_LOGIN_MESSAGE })
    }

    const code = crypto.randomInt(100000, 1000000).toString()
    const codeHash = hash2faCode(correo, code)
    const expiresAt = new Date(Date.now() + TWO_FACTOR_EXPIRATION_MINUTES * 60 * 1000).toISOString()

    const { error: insertError } = await supabase.from('two_factor_codes').insert({
      correo,
      rol: account.role,
      code_hash: codeHash,
      expires_at: expiresAt,
      used: false,
      attempts: 0,
    })

    if (insertError) {
      throw new Error(`No se pudo guardar el codigo 2FA: ${insertError.message}`)
    }

    await send2faEmail(correo, code)

    return res.json({
      success: true,
      requires2FA: true,
      role: account.role,
      message: 'Codigo de verificacion enviado.',
    })
  } catch (error) {
    console.error('Error en login 2FA:', error.message)
    return res.status(500).json({ success: false, message: 'No se pudo iniciar sesion.' })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const nombre = normalizeText(req.body?.name)
  const correo = normalizeEmail(req.body?.email)
  const telefono = normalizeText(req.body?.phone).replace(/\D/g, '')
  const contrasena = typeof req.body?.password === 'string' ? req.body.password : ''
  const role = req.body?.role === 'host' ? 'arrendatario' : 'inquilino'
  const table = role
  const idField = role === 'inquilino' ? 'id_inquilino' : 'id_arrendatario'

  if (!nombre || !correo || !telefono || !contrasena) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ success: false, message: 'Ingresa un correo electronico valido.' })
  }

  if (telefono.length !== 10) {
    return res.status(400).json({ success: false, message: 'El telefono debe contener exactamente 10 numeros.' })
  }

  if (contrasena.length < 6) {
    return res.status(400).json({ success: false, message: 'La contrasena debe tener al menos 6 caracteres.' })
  }

  try {
    const existingAccount = await findAccountByEmail(correo)

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: 'Este correo ya se encuentra registrado en la plataforma.',
      })
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10)
    const { data, error } = await supabase
      .from(table)
      .insert({
        nombre,
        correo,
        telefono,
        contrasena: hashedPassword,
      })
      .select(`${idField}, nombre, correo, telefono`)
      .single()

    if (error) {
      throw new Error(`No se pudo crear la cuenta: ${error.message}`)
    }

    return res.status(201).json({
      success: true,
      user: {
        id: data[idField],
        [idField]: data[idField],
        nombre: data.nombre,
        correo: data.correo,
        telefono: data.telefono,
        role,
      },
      message: 'Registro exitoso.',
    })
  } catch (error) {
    console.error('Error en register:', error.message)
    return res.status(500).json({ success: false, message: 'No se pudo crear la cuenta.' })
  }
})

app.post('/api/auth/verify-2fa', async (req, res) => {
  const correo = normalizeEmail(req.body?.correo)
  const code = typeof req.body?.codigo === 'string' ? req.body.codigo.trim() : ''
  const role = typeof req.body?.role === 'string' ? req.body.role.trim() : ''

  if (!correo || !/^\d{6}$/.test(code) || !role) {
    return res.status(400).json({ success: false, message: 'Codigo de verificacion invalido.' })
  }

  try {
    const now = new Date().toISOString()
    const { data: twoFactorCode, error } = await supabase
      .from('two_factor_codes')
      .select('id, correo, rol, code_hash, attempts')
      .eq('correo', correo)
      .eq('rol', role)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new Error(`No se pudo validar el codigo 2FA: ${error.message}`)
    }

    if (!twoFactorCode) {
      return res.status(400).json({ success: false, message: 'Codigo invalido o expirado.' })
    }

    if ((twoFactorCode.attempts || 0) >= TWO_FACTOR_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Demasiados intentos. Solicita un codigo nuevo.' })
    }

    const codeMatches = twoFactorCode.code_hash === hash2faCode(correo, code)

    if (!codeMatches) {
      await supabase
        .from('two_factor_codes')
        .update({ attempts: (twoFactorCode.attempts || 0) + 1 })
        .eq('id', twoFactorCode.id)

      return res.status(400).json({ success: false, message: 'Codigo invalido o expirado.' })
    }

    const { error: usedError } = await supabase
      .from('two_factor_codes')
      .update({ used: true })
      .eq('id', twoFactorCode.id)

    if (usedError) {
      throw new Error(`No se pudo marcar el codigo 2FA como usado: ${usedError.message}`)
    }

    const account = await findAccountWithPasswordByEmail(correo)

    if (!account || account.role !== role) {
      return res.status(400).json({ success: false, message: 'Codigo invalido o expirado.' })
    }

    return res.json({
      success: true,
      user: toSafeAccount(account),
      message: 'Inicio de sesion exitoso.',
    })
  } catch (error) {
    console.error('Error en verify-2fa:', error.message)
    return res.status(500).json({ success: false, message: 'No se pudo verificar el codigo.' })
  }
})

app.get('/api/admin/dashboard-data', async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ success: false, message: 'Sesion de administrador requerida.' })
  }

  try {
    const [tenantsResult, landlordsResult, propertiesResult, bookingsResult] = await Promise.all([
      supabase.from('inquilino').select('id_inquilino,nombre'),
      supabase.from('arrendatario').select('id_arrendatario,nombre'),
      supabase.from('propiedad').select('id_propiedad,estado,descripcion'),
      supabase
        .from('reserva')
        .select('id_propiedad,id_inquilino,fecha_inicio,fecha_fin,estado,pago,propiedad:propiedad(descripcion),inquilino:inquilino(nombre)'),
    ])

    return sendAdminDataResponse(
      res,
      [tenantsResult, landlordsResult, propertiesResult, bookingsResult],
      {
        tenants: tenantsResult.data || [],
        landlords: landlordsResult.data || [],
        properties: propertiesResult.data || [],
        bookings: bookingsResult.data || [],
      }
    )
  } catch (error) {
    console.error('Error en admin dashboard-data:', error.message)
    return res.status(500).json({ success: false, message: 'No se pudieron cargar datos administrativos.' })
  }
})

app.get('/api/admin/users-data', async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ success: false, message: 'Sesion de administrador requerida.' })
  }

  try {
    const [inquilinosResult, arrendatariosResult, propertiesResult, bookingsResult] = await Promise.all([
      supabase.from('inquilino').select('id_inquilino,nombre,correo,telefono'),
      supabase.from('arrendatario').select('id_arrendatario,nombre,correo,telefono'),
      supabase.from('propiedad').select('id_propiedad,id_arrendatario'),
      supabase.from('reserva').select('id_propiedad,id_inquilino,fecha_inicio'),
    ])

    return sendAdminDataResponse(
      res,
      [inquilinosResult, arrendatariosResult, propertiesResult, bookingsResult],
      {
        inquilinos: inquilinosResult.data || [],
        arrendatarios: arrendatariosResult.data || [],
        properties: propertiesResult.data || [],
        bookings: bookingsResult.data || [],
      }
    )
  } catch (error) {
    console.error('Error en admin users-data:', error.message)
    return res.status(500).json({ success: false, message: 'No se pudieron cargar usuarios.' })
  }
})

app.get('/api/admin/properties-data', async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ success: false, message: 'Sesion de administrador requerida.' })
  }

  try {
    const [propertiesResult, bookingsResult] = await Promise.all([
      supabase
        .from('propiedad')
        .select('id_propiedad,descripcion,direccion,precio,estado,resena,id_arrendatario,arrendatario:arrendatario(nombre)'),
      supabase.from('reserva').select('id_propiedad'),
    ])

    return sendAdminDataResponse(res, [propertiesResult, bookingsResult], {
      properties: propertiesResult.data || [],
      bookings: bookingsResult.data || [],
    })
  } catch (error) {
    console.error('Error en admin properties-data:', error.message)
    return res.status(500).json({ success: false, message: 'No se pudieron cargar propiedades.' })
  }
})

app.get('/api/admin/bookings-data', async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ success: false, message: 'Sesion de administrador requerida.' })
  }

  try {
    const bookingsResult = await supabase
      .from('reserva')
      .select('id_propiedad,id_inquilino,fecha_inicio,fecha_fin,estado,pago,propiedad:propiedad(descripcion,id_arrendatario,arrendatario:arrendatario(nombre)),inquilino:inquilino(nombre)')

    return sendAdminDataResponse(res, [bookingsResult], {
      bookings: bookingsResult.data || [],
    })
  } catch (error) {
    console.error('Error en admin bookings-data:', error.message)
    return res.status(500).json({ success: false, message: 'No se pudieron cargar reservas.' })
  }
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

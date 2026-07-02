import express from 'express'
import cors from 'cors'
import { FRONTEND_URL, MAIL_FROM, PORT } from './config/env.js'
import { getTransporter } from './config/mailer.js'
import { supabase } from './config/supabase.js'
import landlordProfileRoutes from './routes/landlordProfileRoutes.js'
import landlordBookingRoutes from './routes/landlordBookingRoutes.js'
import propertyRoutes from './routes/propertyRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import tenantRoutes from './routes/tenantRoutes.js'
import geocodeRoutes from './routes/geocodeRoutes.js'
import {
  generate2faCode,
  generateSecureToken,
  hash2faCode,
  hashPassword,
  hashToken,
  validatePassword,
} from './utils/crypto.js'
import { passwordResetEmailTemplate } from './utils/emailTemplates.js'

/*
|--------------------------------------------------------------------------
| Mensajes genericos y limites de autenticacion
|--------------------------------------------------------------------------
| Estos valores se usan en login, 2FA y recuperacion de contrasena.
| El mensaje de recuperacion debe seguir siendo generico para no revelar
| si un correo existe en administrador, inquilino o arrendatario.
|
| ADVERTENCIA:
| No reemplazar estos textos por respuestas que confirmen existencia de
| usuarios, codigos, tokens o contrasenas.
*/
const GENERIC_RESET_MESSAGE =
  'Si el correo esta registrado, recibiras instrucciones para restablecer tu contrasena.'
const GENERIC_LOGIN_MESSAGE = 'Credenciales incorrectas. Verifica tu correo y contrasena.'
const TWO_FACTOR_EXPIRATION_MINUTES = 5
const TWO_FACTOR_MAX_ATTEMPTS = 5

const app = express()

/*
|--------------------------------------------------------------------------
| Configuracion inicial del servidor Express
|--------------------------------------------------------------------------
| Configura CORS y middlewares globales para que el frontend React/Vite
| pueda consumir el backend Express.
|
| Frontend:
| - Vistas y servicios bajo src/ consumen los endpoints /api/*
|
| Seguridad:
| - CORS se limita a FRONTEND_URL.
| - Este bloque no contiene logica de negocio ni debe almacenar secretos.
*/
app.use(
  cors({
    origin: FRONTEND_URL,
  })
)
app.use(express.json())
app.use('/api/arrendatario/profile', landlordProfileRoutes)
app.use('/api/arrendatario/reservas', landlordBookingRoutes)
app.use('/api/arrendatario/properties', propertyRoutes)
app.use('/api/inquilino', tenantRoutes)
app.use('/api/geocode', geocodeRoutes)
app.use('/api/payments', paymentRoutes)

/*
|--------------------------------------------------------------------------
| Normalizacion de entrada
|--------------------------------------------------------------------------
| Estas funciones preparan correos y texto antes de consultar Supabase.
| Sirven para evitar diferencias por espacios o mayusculas.
|
| ADVERTENCIA:
| No usar estas funciones para imprimir valores sensibles en consola.
*/
function normalizeEmail(correo) {
  return typeof correo === 'string' ? correo.trim().toLowerCase() : ''
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

async function findAccountByEmail(correo) {
  /*
   * Busca el correo en las tablas de identidades permitidas.
   * Se usa en registro y recuperacion de contrasena.
   *
   * Tablas consultadas:
   * - administrador
   * - inquilino
   * - arrendatario
   *
   * Seguridad:
   * - Esta funcion solo devuelve informacion de tabla/rol.
   * - Los endpoints que la usan deben mantener respuestas genericas
   *   cuando sea necesario evitar enumeracion de usuarios.
   */
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
  /*
   * Busca una cuenta con su contrasena almacenada para el login unificado.
   *
   * Frontend:
   * - LoginPage.jsx -> authController -> authService.loginUser()
   *
   * Tablas consultadas:
   * - administrador
   * - inquilino
   * - arrendatario
   *
   * Seguridad:
   * - La contrasena no se devuelve al frontend.
   * - La comparacion se hace en backend con validatePassword().
   */
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

function toSafeAccount(account) {
  /*
   * Construye el objeto seguro que se entrega al frontend despues de 2FA.
   * No incluye contrasena, hashes, tokens ni codigos temporales.
   */
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
  /*
   * Validacion ligera para endpoints admin.
   * El frontend envia x-admin-role desde adminDataService.js.
   *
   * ADVERTENCIA:
   * No usar esta cabecera como autorizacion fuerte para datos sensibles
   * sin revisar el modelo de sesiones/autenticacion completo.
   */
  return req.get('x-admin-role') === 'administrador'
}

function getSupabaseErrorMessage(results) {
  return results
    .map(result => result.error)
    .filter(Boolean)
    .map(error => error.message)
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
  /*
   * Envia el correo de recuperacion de contrasena.
   *
   * Frontend:
   * - ForgotPassword.jsx solicita el correo.
   * - ResetPassword.jsx abre el enlace /reset-password?token=...
   *
   * Seguridad:
   * - Recibe el token en texto plano solo para construir el enlace.
   * - En Supabase se guarda unicamente hashToken(token).
   * - No imprimir resetUrl ni token en consola.
   */
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`
  const transporter = getTransporter()
  const resetEmail = passwordResetEmailTemplate(resetUrl)

  await transporter.sendMail({
    from: MAIL_FROM,
    to: correo,
    subject: resetEmail.subject,
    text: resetEmail.text,
    html: resetEmail.html,
  })
}

async function send2faEmail(correo, code) {
  /*
   * Envia el codigo 2FA al correo de la cuenta autenticada.
   *
   * Frontend:
   * - LoginPage.jsx muestra el paso de verificacion.
   *
   * Tabla relacionada:
   * - two_factor_codes guarda el hash del codigo, expiracion y reintentos.
   *
   * ADVERTENCIA:
   * No imprimir el codigo 2FA ni su hash en consola.
   */
  const transporter = getTransporter()

  await transporter.sendMail({
    from: MAIL_FROM,
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

/*
|--------------------------------------------------------------------------
| POST /api/auth/login
|--------------------------------------------------------------------------
| Funcion:
| Login unificado para administrador, inquilino y arrendatario. Valida
| correo/contrasena y, si son correctos, genera un codigo 2FA.
|
| Frontend que lo consume:
| - src/views/pages/LoginPage.jsx
| - src/services/authService.js
| - src/controllers/authController.js
|
| Tablas consultadas:
| - administrador
| - inquilino
| - arrendatario
|
| Tabla modificada:
| - two_factor_codes
|
| Recibe:
| - correo
| - contrasena
|
| Devuelve:
| - success
| - requires2FA
| - role
| - message
|
| Seguridad:
| - No devuelve datos de usuario hasta completar 2FA.
| - Usa mensaje generico para credenciales invalidas.
| - Guarda el codigo 2FA hasheado, con expiracion e intentos.
*/
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

    const code = generate2faCode()
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
  /*
   * Registro de usuarios publicos.
   *
   * Frontend:
   * - Registro envia name, email, phone, password y role.
   *
   * Tablas modificadas:
   * - inquilino cuando role != host
   * - arrendatario cuando role === host
   *
   * Seguridad:
   * - Valida formato basico de correo, telefono y longitud de contrasena.
   * - Revisa que el correo no exista en ninguna tabla de identidad.
   * - Guarda la contrasena con bcrypt por medio de hashPassword().
   *
   * ADVERTENCIA:
   * No guardar contrasenas en texto plano ni devolver hashes al frontend.
   */
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
    return res
      .status(400)
      .json({ success: false, message: 'Ingresa un correo electronico valido.' })
  }

  if (telefono.length !== 10) {
    return res
      .status(400)
      .json({ success: false, message: 'El telefono debe contener exactamente 10 numeros.' })
  }

  if (contrasena.length < 6) {
    return res
      .status(400)
      .json({ success: false, message: 'La contrasena debe tener al menos 6 caracteres.' })
  }

  try {
    const existingAccount = await findAccountByEmail(correo)

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: 'Este correo ya se encuentra registrado en la plataforma.',
      })
    }

    const hashedPassword = await hashPassword(contrasena)
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
  /*
   * Verificacion del segundo factor.
   *
   * Frontend:
   * - LoginPage.jsx envia el codigo ingresado por el usuario.
   * - authService.verify2FA() llama este endpoint.
   *
   * Tabla consultada/modificada:
   * - two_factor_codes
   *
   * Recibe:
   * - correo
   * - codigo
   * - role
   *
   * Devuelve:
   * - user seguro sin contrasena si el codigo es valido.
   *
   * Seguridad:
   * - Solo acepta codigos de 6 digitos.
   * - Compara contra hash2faCode().
   * - Rechaza codigos usados, expirados o con demasiados intentos.
   * - Marca el codigo como usado despues de verificarlo.
   */
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
      return res
        .status(429)
        .json({ success: false, message: 'Demasiados intentos. Solicita un codigo nuevo.' })
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
  /*
   * Dashboard general de administrador.
   *
   * Frontend:
   * - src/views/admin/components/Dashboard.jsx
   * - src/services/adminDataService.js
   *
   * Tablas consultadas:
   * - inquilino
   * - arrendatario
   * - propiedad
   * - reserva
   *
   * Seguridad:
   * - Requiere cabecera x-admin-role con valor administrador.
   * - No debe exponerse sin validar rol/sesion admin.
   */
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
        .select(
          'id_propiedad,id_inquilino,fecha_inicio,fecha_fin,estado,pago,propiedad:propiedad(descripcion),inquilino:inquilino(nombre)'
        ),
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
    return res
      .status(500)
      .json({ success: false, message: 'No se pudieron cargar datos administrativos.' })
  }
})

app.get('/api/admin/users-data', async (req, res) => {
  /*
   * Datos de usuarios para administracion.
   *
   * Frontend:
   * - src/views/admin/components/UserManagement.jsx
   * - src/services/adminDataService.js
   *
   * Tablas consultadas:
   * - inquilino
   * - arrendatario
   * - propiedad
   * - reserva
   *
   * Devuelve:
   * - listas de usuarios y relaciones necesarias para actividad.
   */
  if (!isAdminRequest(req)) {
    return res.status(401).json({ success: false, message: 'Sesion de administrador requerida.' })
  }

  try {
    const [inquilinosResult, arrendatariosResult, propertiesResult, bookingsResult] =
      await Promise.all([
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
  /*
   * Datos de propiedades para administracion.
   *
   * Frontend:
   * - src/views/admin/components/PropertyManagement.jsx
   * - src/services/adminDataService.js
   *
   * Tablas consultadas:
   * - propiedad
   * - reserva
   * - arrendatario mediante relacion de propiedad
   */
  if (!isAdminRequest(req)) {
    return res.status(401).json({ success: false, message: 'Sesion de administrador requerida.' })
  }

  try {
    const [propertiesResult, bookingsResult] = await Promise.all([
      supabase
        .from('propiedad')
        .select(
          'id_propiedad,descripcion,direccion,precio,estado,resena,id_arrendatario,arrendatario:arrendatario(nombre)'
        ),
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
  /*
   * Datos de reservas para administracion.
   *
   * Frontend:
   * - src/views/admin/components/BookingManagement.jsx
   * - src/services/adminDataService.js
   *
   * Tablas consultadas:
   * - reserva
   * - propiedad
   * - inquilino
   * - arrendatario mediante propiedad
   */
  if (!isAdminRequest(req)) {
    return res.status(401).json({ success: false, message: 'Sesion de administrador requerida.' })
  }

  try {
    const bookingsResult = await supabase
      .from('reserva')
      .select(
        'id_propiedad,id_inquilino,fecha_inicio,fecha_fin,estado,pago,propiedad:propiedad(descripcion,id_arrendatario,arrendatario:arrendatario(nombre)),inquilino:inquilino(nombre)'
      )

    return sendAdminDataResponse(res, [bookingsResult], {
      bookings: bookingsResult.data || [],
    })
  } catch (error) {
    console.error('Error en admin bookings-data:', error.message)
    return res.status(500).json({ success: false, message: 'No se pudieron cargar reservas.' })
  }
})

app.post('/api/auth/forgot-password', async (req, res) => {
  /*
  |--------------------------------------------------------------------------
  | POST /api/auth/forgot-password
  |--------------------------------------------------------------------------
  | Funcion:
  | Recibe un correo y, si existe en una tabla de identidad, genera un
  | token seguro para restablecer contrasena.
  |
  | Frontend que lo consume:
  | - src/views/pages/ForgotPassword.jsx
  | - src/services/passwordResetService.js
  |
  | Tablas consultadas:
  | - administrador
  | - inquilino
  | - arrendatario
  |
  | Tabla modificada:
  | - password_reset_tokens
  |
  | Seguridad:
  | - No revela si el correo existe.
  | - Guarda solo el hash del token.
  | - El token expira.
  | - El token solo puede utilizarse una vez.
  |
  | ADVERTENCIA:
  | No cambiar la respuesta por una que confirme correo encontrado/no encontrado.
  */
  const correo = normalizeEmail(req.body?.correo)

  if (!correo) {
    return res.status(400).json({ message: 'El correo es requerido.' })
  }

  try {
    const account = await findAccountByEmail(correo)

    if (account) {
      const token = generateSecureToken()
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
  /*
  |--------------------------------------------------------------------------
  | POST /api/auth/reset-password
  |--------------------------------------------------------------------------
  | Funcion:
  | Recibe el token del enlace y la nueva contrasena. Valida que el token
  | exista, no este usado y no haya expirado; luego actualiza la contrasena.
  |
  | Frontend que lo consume:
  | - src/views/pages/ResetPassword.jsx
  | - src/services/passwordResetService.js
  |
  | Tabla consultada/modificada:
  | - password_reset_tokens
  |
  | Tablas modificadas segun rol:
  | - administrador
  | - inquilino
  | - arrendatario
  |
  | Seguridad:
  | - El token se compara usando hashToken().
  | - La nueva contrasena se guarda con bcrypt.
  | - El token se marca como usado al terminar.
  */
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

    const hashedPassword = await hashPassword(nuevaContrasena)

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
  /*
   * Punto de arranque del backend Express.
   * No colocar aqui logica de negocio ni valores sensibles.
   */
  console.log(`Servidor NoWayHome escuchando en http://localhost:${PORT}`)
})

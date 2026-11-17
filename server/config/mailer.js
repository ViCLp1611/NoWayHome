import nodemailer from 'nodemailer'
import {
  EMAIL_PASS,
  EMAIL_PROVIDER,
  EMAIL_USER,
  MAIL_FROM,
  RESEND_API_KEY,
  RESEND_FROM,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_SERVICE,
} from './env.js'

/*
|--------------------------------------------------------------------------
| Configuracion de Nodemailer / Resend / SMTP
|--------------------------------------------------------------------------
| Crea el transporter SMTP usado por el backend para:
| - Enviar codigos de verificacion 2FA.
| - Enviar enlaces de recuperacion de contrasena.
| - Enviar correos transaccionales de registro y reservas.
|
| Seguridad:
| - No imprimir credenciales SMTP ni API keys.
| - No imprimir codigos 2FA, tokens ni enlaces de recuperacion.
*/
let transporter

function extractEmailAddress(value) {
  const text = String(value || '').trim()
  const bracketMatch = text.match(/<([^>]+)>/)
  return (bracketMatch ? bracketMatch[1] : text).trim().toLowerCase()
}

function getRecipientDomain(to) {
  const email = extractEmailAddress(Array.isArray(to) ? to[0] : to)
  const atIndex = email.indexOf('@')
  return atIndex >= 0 ? email.slice(atIndex + 1) : ''
}

export function hasSmtpCredentials() {
  return Boolean((SMTP_HOST || SMTP_SERVICE) && EMAIL_USER && EMAIL_PASS)
}

export function hasResendCredentials() {
  return Boolean(RESEND_API_KEY)
}

function classifyMailError(error) {
  const code = String(error?.code || '').toUpperCase()
  const responseCode = Number(error?.responseCode || error?.statusCode || 0)
  const text = `${error?.message || ''} ${error?.response || ''}`.toLowerCase()

  if (code === 'EAUTH' || responseCode === 535 || /invalid login|username and password not accepted|badcredentials/i.test(text)) {
    return 'Autenticacion SMTP rechazada: verifica SMTP_USER y App Password (SMTP_PASS).'
  }
  if (
    responseCode === 550 ||
    responseCode === 553 ||
    responseCode === 554 ||
    /spam|blocked|policy|spf|dkim|dmarc|blacklist|rejected|relay|unauthenticated|domain is not verified/i.test(text)
  ) {
    return 'Mensaje rechazado o bloqueado por filtro anti-spam / politica del servidor receptor (revisa remitente FROM, SPF/DKIM/DMARC o dominio verificado).'
  }
  if (responseCode === 421 || responseCode === 429 || responseCode === 450 || responseCode === 451 || responseCode === 452 || /rate|quota|limit|too many/i.test(text)) {
    return 'Limite temporal de envios o throttling del proveedor de correo.'
  }
  if (['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'ESOCKET', 'EHOSTUNREACH', 'ECONNRESET'].includes(code)) {
    return 'Fallo de red o puerto SMTP bloqueado (verifica SMTP_HOST/SMTP_PORT o usa RESEND_API_KEY si el hosting bloquea puertos SMTP).'
  }
  return 'Revisa credenciales, remitente FROM y respuesta del proveedor de correo.'
}

export function diagnoseMailError(error) {
  return {
    message: error?.message || 'Error desconocido al enviar correo',
    code: error?.code || null,
    errno: error?.errno || null,
    syscall: error?.syscall || null,
    command: error?.command || null,
    responseCode: error?.responseCode || error?.statusCode || null,
    response: error?.response || null,
    rejected: Array.isArray(error?.rejected) ? error.rejected : undefined,
    rejectedErrors: Array.isArray(error?.rejectedErrors)
      ? error.rejectedErrors.map(entry => ({
          message: entry?.message || null,
          code: entry?.code || null,
          responseCode: entry?.responseCode || null,
          response: entry?.response || null,
        }))
      : undefined,
    possibleCause: classifyMailError(error),
  }
}

export function getTransporter() {
  if (transporter) return transporter

  if (!hasSmtpCredentials()) {
    throw new Error(
      'Configuracion SMTP incompleta: faltan SMTP_HOST/SMTP_SERVICE, SMTP_USER o SMTP_PASS.'
    )
  }

  const transportOptions = {
    ...(SMTP_SERVICE ? { service: SMTP_SERVICE } : { host: SMTP_HOST, port: SMTP_PORT }),
    secure: SMTP_SECURE || SMTP_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  }

  transporter = nodemailer.createTransport(transportOptions)
  return transporter
}

async function sendViaResend({ from, to, subject, text, html, replyTo, context }) {
  if (!RESEND_API_KEY) {
    throw new Error('Falta RESEND_API_KEY para enviar correo por Resend.')
  }
  const effectiveFrom = from || RESEND_FROM || MAIL_FROM
  if (!effectiveFrom || !effectiveFrom.includes('@')) {
    throw new Error('Falta un remitente valido (EMAIL_FROM / RESEND_FROM) para enviar por Resend.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: effectiveFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const resendError = new Error(payload?.message || `Error Resend HTTP ${response.status}`)
    resendError.statusCode = response.status
    resendError.responseCode = response.status
    resendError.response = JSON.stringify(payload)
    throw resendError
  }

  console.info('[mailer] Correo enviado via Resend:', {
    context,
    subject,
    from: extractEmailAddress(effectiveFrom),
    recipientDomain: getRecipientDomain(to),
    id: payload?.id || null,
  })

  return {
    provider: 'resend',
    messageId: payload?.id || null,
    accepted: Array.isArray(to) ? to : [to],
    rejected: [],
  }
}

export async function sendMail({
  from,
  to,
  subject,
  text,
  html,
  replyTo,
  context = 'general',
}) {
  if (!to) {
    throw new Error(`[mailer] Destinatario ausente al intentar enviar "${subject}" (${context}).`)
  }

  const effectiveFrom = String(from || MAIL_FROM || EMAIL_USER || '').trim()
  if (!effectiveFrom || !effectiveFrom.includes('@')) {
    throw new Error(
      `[mailer] Remitente (EMAIL_FROM / MAIL_FROM / SMTP_USER) ausente o invalido al intentar enviar "${subject}".`
    )
  }

  const useResendPrimary =
    EMAIL_PROVIDER === 'resend' || (!hasSmtpCredentials() && hasResendCredentials())

  if (useResendPrimary) {
    try {
      return await sendViaResend({
        from: from || RESEND_FROM || effectiveFrom,
        to,
        subject,
        text,
        html,
        replyTo: replyTo || extractEmailAddress(effectiveFrom),
        context,
      })
    } catch (error) {
      console.error(`[mailer] Fallo envio Resend (${context}):`, {
        subject,
        from: extractEmailAddress(from || RESEND_FROM || effectiveFrom),
        recipientDomain: getRecipientDomain(to),
        ...diagnoseMailError(error),
      })
      throw error
    }
  }

  if (
    SMTP_HOST.toLowerCase().includes('gmail.com') &&
    EMAIL_USER &&
    extractEmailAddress(effectiveFrom) !== extractEmailAddress(EMAIL_USER)
  ) {
    console.warn('[mailer] El remitente FROM difiere de SMTP_USER en Gmail; puede ser reescrito o rechazado por anti-spam.', {
      from: extractEmailAddress(effectiveFrom),
      smtpUser: extractEmailAddress(EMAIL_USER),
    })
  }

  try {
    const info = await getTransporter().sendMail({
      from: effectiveFrom,
      to,
      subject,
      text,
      html,
      replyTo: replyTo || extractEmailAddress(effectiveFrom),
    })

    if (Array.isArray(info?.rejected) && info.rejected.length > 0) {
      const rejectErr = new Error(
        `El servidor SMTP rechazo al destinatario: ${info.rejected.join(', ')}`
      )
      rejectErr.rejected = info.rejected
      rejectErr.response = info.response
      rejectErr.responseCode = 550
      throw rejectErr
    }

    console.info('[mailer] Correo aceptado por SMTP:', {
      context,
      subject,
      from: extractEmailAddress(effectiveFrom),
      recipientDomain: getRecipientDomain(to),
      messageId: info?.messageId || null,
      acceptedCount: Array.isArray(info?.accepted) ? info.accepted.length : 0,
      response: info?.response || null,
    })

    return {
      provider: 'smtp',
      messageId: info?.messageId || null,
      accepted: info?.accepted || [],
      rejected: info?.rejected || [],
      response: info?.response || null,
    }
  } catch (error) {
    const diagnostics = diagnoseMailError(error)
    console.error(`[mailer] Fallo envio SMTP (${context}):`, {
      subject,
      host: SMTP_HOST || SMTP_SERVICE || null,
      port: SMTP_PORT,
      secure: SMTP_SECURE || SMTP_PORT === 465,
      from: extractEmailAddress(effectiveFrom),
      recipientDomain: getRecipientDomain(to),
      ...diagnostics,
    })

    const isNetworkBlock = ['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'ESOCKET', 'EHOSTUNREACH'].includes(
      String(error?.code || '').toUpperCase()
    )

    if (isNetworkBlock && hasResendCredentials()) {
      console.warn(`[mailer] Reintentando envio (${context}) via Resend como respaldo ante bloqueo de red SMTP.`)
      return sendViaResend({
        from: RESEND_FROM || effectiveFrom,
        to,
        subject,
        text,
        html,
        replyTo: replyTo || extractEmailAddress(effectiveFrom),
        context: `${context}-resend-fallback`,
      })
    }

    throw error
  }
}

export async function verifyEmailConfiguration() {
  const fromAddress = extractEmailAddress(MAIL_FROM || RESEND_FROM || EMAIL_USER)
  if (!fromAddress) {
    console.warn('[mailer] Verificacion: falta configurar EMAIL_FROM / MAIL_FROM.')
  }

  if (EMAIL_PROVIDER === 'resend' || (!hasSmtpCredentials() && hasResendCredentials())) {
    console.info('[mailer] Proveedor de correo activo: Resend API', {
      from: extractEmailAddress(RESEND_FROM || MAIL_FROM),
    })
    return { ok: true, provider: 'resend' }
  }

  if (!hasSmtpCredentials()) {
    console.warn('[mailer] Verificacion: faltan credenciales SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS).')
    return { ok: false, provider: 'none', reason: 'missing_credentials' }
  }

  try {
    await getTransporter().verify()
    console.info('[mailer] Transporte SMTP verificado y listo:', {
      host: SMTP_HOST || SMTP_SERVICE,
      port: SMTP_PORT,
      secure: SMTP_SECURE || SMTP_PORT === 465,
      from: fromAddress,
    })
    return { ok: true, provider: 'smtp' }
  } catch (error) {
    console.error('[mailer] Fallo verificacion SMTP al iniciar:', {
      host: SMTP_HOST || SMTP_SERVICE,
      port: SMTP_PORT,
      from: fromAddress,
      ...diagnoseMailError(error),
    })
    return { ok: false, provider: 'smtp', error: error?.message }
  }
}

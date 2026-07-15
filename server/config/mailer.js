import nodemailer from 'nodemailer'
import { EMAIL_PASS, EMAIL_USER, SMTP_HOST, SMTP_PORT, SMTP_SECURE } from './env.js'

/*
|--------------------------------------------------------------------------
| Configuracion de Nodemailer
|--------------------------------------------------------------------------
| Crea el transporter SMTP usado por el backend para:
| - Enviar codigos de verificacion 2FA.
| - Enviar enlaces de recuperacion de contrasena.
|
| Seguridad:
| - No imprimir credenciales SMTP.
| - No imprimir codigos 2FA, tokens ni enlaces de recuperacion.
*/
let transporter

export function getTransporter() {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE || SMTP_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  })
  return transporter
}

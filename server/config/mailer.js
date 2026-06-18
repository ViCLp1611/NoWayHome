import nodemailer from 'nodemailer'
import { EMAIL_PASS, EMAIL_USER, SMTP_HOST, SMTP_PORT } from './env.js'

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
export function getTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  })
}

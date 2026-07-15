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
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE,
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  })

  const sendMail = transporter.sendMail.bind(transporter)
  transporter.sendMail = async message => {
    console.info('Conexion SMTP iniciada')

    try {
      const result = await sendMail(message)
      console.info('Correo enviado')
      return result
    } catch (error) {
      const isTimeout =
        ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ENETUNREACH'].includes(error?.code) ||
        /timeout/i.test(error?.message || '')
      const isAuthError = error?.code === 'EAUTH' || Number(error?.responseCode) === 535

      if (isTimeout) {
        console.error('Timeout SMTP:', error?.message || 'Tiempo de conexion agotado')
      } else if (isAuthError) {
        console.error('Error de autenticacion SMTP:', error?.message || 'Autenticacion rechazada')
      } else {
        console.error('Error SMTP:', error?.message || 'No se pudo enviar el correo')
      }

      throw error
    }
  }

  return transporter
}

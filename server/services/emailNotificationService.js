import { getTransporter } from '../config/mailer.js'
import { MAIL_FROM } from '../config/env.js'
import {
  reservationEmailTemplate,
  reservationReceiptEmailTemplate,
} from '../templates/reservationEmailTemplates.js'
import { registrationConfirmationEmailTemplate } from '../utils/emailTemplates.js'

async function sendEmail(email, data = {}) {
  if (!data?.to) {
    console.error(
      `[emailNotificationService] No se envió "${email.subject}": destinatario ausente.`
    )
    return false
  }

  try {
    await getTransporter().sendMail({ from: MAIL_FROM, to: data.to, ...email })
    return true
  } catch (error) {
    console.error(
      `[emailNotificationService] Falló el envío de "${email.subject}": ${error?.message || 'Error SMTP'}`
    )
    return false
  }
}

function sendNotification(event, data = {}) {
  return sendEmail(reservationEmailTemplate(event, data), data)
}

export function sendReservationCreatedEmail(data) {
  return sendNotification('created', data)
}

export function sendReservationConfirmedEmail(data) {
  return sendNotification('confirmed', data)
}

export function sendReservationRejectedEmail(data) {
  return sendNotification('rejected', data)
}

export function sendReservationCancelledEmail(data) {
  return sendNotification('cancelled', data)
}

export function sendPaymentConfirmedEmail(data) {
  return sendNotification('payment', data)
}

export function sendReservationReceiptEmail(data = {}) {
  return sendEmail(reservationReceiptEmailTemplate(data), data)
}

export function sendRegistrationConfirmationEmail({ email, nombre, rol }) {
  return sendEmail(registrationConfirmationEmailTemplate(nombre, rol), { to: email })
}

import { diagnoseMailError, sendMail } from '../config/mailer.js'
import { MAIL_FROM } from '../config/env.js'
import {
  reservationEmailTemplate,
  reservationReceiptEmailTemplate,
} from '../templates/reservationEmailTemplates.js'
import { propertyEmailTemplate } from '../templates/propertyEmailTemplates.js'
import { registrationConfirmationEmailTemplate } from '../utils/emailTemplates.js'

export function resolvePropertyTitle(property) {
  const firstDescriptionLine = String(property?.descripcion ?? '')
    .trim()
    .split('\n')
    .map(part => part.trim())
    .find(Boolean)

  return (
    String(property?.titulo ?? '').trim() ||
    String(property?.titulo_propiedad ?? '').trim() ||
    String(property?.nombre_propiedad ?? '').trim() ||
    String(property?.nombre ?? '').trim() ||
    firstDescriptionLine ||
    'tu propiedad'
  )
}

async function sendEmail(email, data = {}, context = 'notification') {
  if (!data?.to) {
    console.error(
      `[emailNotificationService] No se envió "${email.subject}": destinatario ausente.`
    )
    return false
  }

  try {
    await sendMail({
      from: MAIL_FROM,
      to: data.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      context,
    })
    return true
  } catch (error) {
    console.error(
      `[emailNotificationService] Falló el envío de "${email.subject}" (${context}):`,
      diagnoseMailError(error)
    )
    return false
  }
}

function sendNotification(event, data = {}) {
  return sendEmail(reservationEmailTemplate(event, data), data, `reservation-${event}`)
}

export function sendReservationCreatedEmail(data) {
  return sendNotification('created', data)
}

export function sendTenantReservationPendingEmail(data) {
  return sendNotification('created_tenant', data)
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
  return sendEmail(reservationReceiptEmailTemplate(data), data, 'payment-receipt')
}

export function sendPropertyCreatedEmail(data = {}) {
  return sendEmail(propertyEmailTemplate('created', data), data, 'property-created')
}

export function sendPropertyStatusChangedEmail(data = {}) {
  return sendEmail(propertyEmailTemplate('status_changed', data), data, 'property-status-changed')
}

export function sendPropertyUpdatedEmail(data = {}) {
  return sendEmail(propertyEmailTemplate('updated', data), data, 'property-updated')
}

export function sendRegistrationConfirmationEmail({ email, nombre, rol }) {
  return sendEmail(
    registrationConfirmationEmailTemplate(nombre, rol),
    { to: email },
    'registration-confirmation'
  )
}

import { emailBaseTemplate, escapeEmailHtml } from './emailBaseTemplate.js'

const EVENT_CONTENT = {
  created: {
    subject: 'Nueva solicitud de reserva',
    title: 'Nueva solicitud de reserva',
    message: 'Tienes una nueva solicitud de reserva para una de tus propiedades.',
    status: 'Pendiente',
  },
  confirmed: {
    subject: 'Tu reserva fue confirmada',
    title: 'Tu reserva fue confirmada',
    message:
      'El arrendatario confirmó tu reserva. Ya puedes continuar con el proceso correspondiente.',
    status: 'Confirmada',
  },
  rejected: {
    subject: 'Tu solicitud de reserva fue rechazada',
    title: 'Tu solicitud de reserva fue rechazada',
    message: 'El arrendatario rechazó tu solicitud de reserva.',
    status: 'Rechazada',
    showReason: true,
  },
  cancelled: {
    subject: 'Reserva cancelada',
    title: 'Reserva cancelada',
    message: 'Una reserva fue cancelada.',
    status: 'Cancelada',
    showReason: true,
  },
  payment: {
    subject: 'Pago confirmado',
    title: 'Pago confirmado',
    message: 'El pago de la reserva fue confirmado correctamente.',
    status: 'Pago confirmado',
  },
}

const formatDate = value => {
  if (!value) return 'No disponible'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('es-MX')
}

const formatTotal = value =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value) || 0)

export function reservationEmailTemplate(event, data = {}) {
  const config = EVENT_CONTENT[event]
  if (!config) throw new Error(`Evento de correo no soportado: ${event}`)

  const reason = data.reason || 'No se especificó un motivo.'
  const paymentNotice =
    event === 'cancelled' && data.hasPayment
      ? '<p style="margin:18px 0 0;padding:14px;border-left:4px solid #A67C52;background:#FAFAFA;font-size:14px;line-height:1.6;color:#5F5F5F;">Si existía un pago asociado, el reembolso se gestionará en una fase posterior.</p>'
      : ''
  const reasonRow = config.showReason
    ? `<tr><td style="padding:8px 0;color:#A67C52;font-weight:700;vertical-align:top;">Motivo</td><td style="padding:8px 0;text-align:right;color:#5F5F5F;">${escapeEmailHtml(reason)}</td></tr>`
    : ''

  const content = `
    <p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:#5F5F5F;">Hola ${escapeEmailHtml(data.name || 'usuario')},</p>
    <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#5F5F5F;">${escapeEmailHtml(config.message)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-top:1px solid rgba(166,124,82,0.35);border-bottom:1px solid rgba(166,124,82,0.35);">
      <tr><td style="padding:14px 0 8px;color:#A67C52;font-weight:700;">Propiedad</td><td style="padding:14px 0 8px;text-align:right;color:#5F5F5F;">${escapeEmailHtml(data.propertyTitle || 'No disponible')}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Fechas</td><td style="padding:8px 0;text-align:right;color:#5F5F5F;">${escapeEmailHtml(formatDate(data.startDate))} – ${escapeEmailHtml(formatDate(data.endDate))}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Total</td><td style="padding:8px 0;text-align:right;color:#5F5F5F;">${escapeEmailHtml(formatTotal(data.total))}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Estado</td><td style="padding:8px 0;text-align:right;color:#6B8E23;font-weight:700;">${escapeEmailHtml(data.status || config.status)}</td></tr>
      ${reasonRow}
    </table>
    ${paymentNotice}`

  const textLines = [
    config.title,
    `Hola ${data.name || 'usuario'},`,
    config.message,
    `Propiedad: ${data.propertyTitle || 'No disponible'}`,
    `Fechas: ${formatDate(data.startDate)} – ${formatDate(data.endDate)}`,
    `Total: ${formatTotal(data.total)}`,
    `Estado: ${data.status || config.status}`,
  ]
  if (config.showReason) textLines.push(`Motivo: ${reason}`)
  if (event === 'cancelled' && data.hasPayment) {
    textLines.push(
      'Si existía un pago asociado, el reembolso se gestionará en una fase posterior.'
    )
  }

  return {
    subject: config.subject,
    text: textLines.join('\n\n'),
    html: emailBaseTemplate({ title: config.title, content }),
  }
}

export function reservationReceiptEmailTemplate(data = {}) {
  const value = (input, fallback = 'No disponible') => escapeEmailHtml(input || fallback)
  const content = `
    <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#5F5F5F;">
      Tu reserva fue confirmada y el pago fue procesado correctamente. A continuación se muestra la constancia de la reserva.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-top:1px solid rgba(166,124,82,0.35);border-bottom:1px solid rgba(166,124,82,0.35);">
      <tr><td style="padding:14px 0 8px;color:#A67C52;font-weight:700;">Folio</td><td style="padding:14px 0 8px;text-align:right;">${value(data.reservationId)}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Propiedad</td><td style="padding:8px 0;text-align:right;">${value(data.propertyTitle)}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Ubicación</td><td style="padding:8px 0;text-align:right;">${value(data.propertyAddress)}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Inquilino</td><td style="padding:8px 0;text-align:right;">${value(data.tenantName)}<br>${value(data.tenantEmail)}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Arrendatario</td><td style="padding:8px 0;text-align:right;">${value(data.landlordName)}<br>${value(data.landlordEmail)}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Estancia</td><td style="padding:8px 0;text-align:right;">${value(formatDate(data.startDate))} – ${value(formatDate(data.endDate))}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Total</td><td style="padding:8px 0;text-align:right;">${value(formatTotal(data.total))}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Reserva</td><td style="padding:8px 0;text-align:right;color:#6B8E23;font-weight:700;">Confirmada</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Pago</td><td style="padding:8px 0;text-align:right;color:#6B8E23;font-weight:700;">${value(data.paymentStatus, 'Completado')}</td></tr>
      <tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Fecha de pago</td><td style="padding:8px 0;text-align:right;">${value(formatDate(data.paymentDate))}</td></tr>
      <tr><td style="padding:8px 0 14px;color:#A67C52;font-weight:700;">Fecha de emisión</td><td style="padding:8px 0 14px;text-align:right;">${value(formatDate(data.issuedAt))}</td></tr>
    </table>
    <p style="margin:20px 0 0;padding:14px;border-left:4px solid #A67C52;background:#FAFAFA;font-size:14px;line-height:1.6;color:#5F5F5F;">
      Este documento fue generado automáticamente por NoWayHome como evidencia de una reserva confirmada y pagada.
    </p>`

  const text = [
    'Constancia de reserva NoWayHome',
    'Tu reserva fue confirmada y el pago fue procesado correctamente.',
    `Folio: ${data.reservationId || 'No disponible'}`,
    `Propiedad: ${data.propertyTitle || 'No disponible'}`,
    `Ubicación: ${data.propertyAddress || 'No disponible'}`,
    `Inquilino: ${data.tenantName || 'No disponible'} (${data.tenantEmail || 'No disponible'})`,
    `Arrendatario: ${data.landlordName || 'No disponible'} (${data.landlordEmail || 'No disponible'})`,
    `Estancia: ${formatDate(data.startDate)} – ${formatDate(data.endDate)}`,
    `Total: ${formatTotal(data.total)}`,
    `Estado de reserva: Confirmada`,
    `Estado de pago: ${data.paymentStatus || 'Completado'}`,
    `Fecha de pago: ${formatDate(data.paymentDate)}`,
    `Fecha de emisión: ${formatDate(data.issuedAt)}`,
    'Este documento fue generado automáticamente por NoWayHome como evidencia de una reserva confirmada y pagada.',
  ].join('\n\n')

  return {
    subject: 'Constancia de reserva confirmada - NoWayHome',
    text,
    html: emailBaseTemplate({ title: 'Constancia de reserva NoWayHome', content }),
  }
}

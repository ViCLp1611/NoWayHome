import { emailBaseTemplate, escapeEmailHtml } from './emailBaseTemplate.js'

const formatTotal = value =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value) || 0)

export function propertyEmailTemplate(event, data = {}) {
  const propertyTitle = data.propertyTitle || 'Tu propiedad'
  const status = data.status || 'activa'
  const previousStatus = data.previousStatus || null

  const configMap = {
    created: {
      subject: `Propiedad registrada: ${propertyTitle}`,
      title: 'Propiedad dada de alta',
      message: 'Tu alojamiento fue publicado correctamente en NoWayHome.',
    },
    status_changed: {
      subject: `Estado actualizado: ${propertyTitle}`,
      title: 'Cambio de estado de propiedad',
      message: previousStatus
        ? `El estado de tu propiedad cambió de "${previousStatus}" a "${status}".`
        : `El estado actual de tu propiedad ahora es "${status}".`,
    },
    updated: {
      subject: `Propiedad actualizada: ${propertyTitle}`,
      title: 'Propiedad editada',
      message: 'Los cambios realizados en tu propiedad se guardaron correctamente.',
    },
  }

  const config = configMap[event]
  if (!config) {
    throw new Error(`Evento de correo de propiedad no soportado: ${event}`)
  }

  const location = [data.city, data.country].filter(Boolean).join(', ')
  const priceText =
    Number(data.price) > 0
      ? `${formatTotal(data.price)} (${data.priceType === 'mensual' ? 'mensual' : 'por noche'})`
      : null

  const rows = [
    `<tr><td style="padding:14px 0 8px;color:#A67C52;font-weight:700;">Propiedad</td><td style="padding:14px 0 8px;text-align:right;color:#5F5F5F;">${escapeEmailHtml(propertyTitle)}</td></tr>`,
    location
      ? `<tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Ubicación</td><td style="padding:8px 0;text-align:right;color:#5F5F5F;">${escapeEmailHtml(location)}</td></tr>`
      : '',
    priceText
      ? `<tr><td style="padding:8px 0;color:#A67C52;font-weight:700;">Precio</td><td style="padding:8px 0;text-align:right;color:#5F5F5F;">${escapeEmailHtml(priceText)}</td></tr>`
      : '',
    `<tr><td style="padding:8px 0 14px;color:#A67C52;font-weight:700;">Estado actual</td><td style="padding:8px 0 14px;text-align:right;color:#6B8E23;font-weight:700;text-transform:capitalize;">${escapeEmailHtml(status)}</td></tr>`,
  ]
    .filter(Boolean)
    .join('')

  const content = `
    <p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:#5F5F5F;">Hola ${escapeEmailHtml(data.name || 'anfitrión')},</p>
    <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#5F5F5F;">${escapeEmailHtml(config.message)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-top:1px solid rgba(166,124,82,0.35);border-bottom:1px solid rgba(166,124,82,0.35);">
      ${rows}
    </table>`

  const textLines = [
    config.title,
    `Hola ${data.name || 'anfitrión'},`,
    config.message,
    `Propiedad: ${propertyTitle}`,
    location ? `Ubicación: ${location}` : null,
    priceText ? `Precio: ${priceText}` : null,
    `Estado actual: ${status}`,
  ].filter(Boolean)

  return {
    subject: config.subject,
    text: textLines.join('\n\n'),
    html: emailBaseTemplate({ title: config.title, content }),
  }
}

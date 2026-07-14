import { emailBaseTemplate, escapeEmailHtml } from '../templates/emailBaseTemplate.js'

/*
|--------------------------------------------------------------------------
| Plantillas de correo transaccional
|--------------------------------------------------------------------------
| La recuperación conserva su contenido y usa el layout compartido.
| resetUrl contiene un token temporal: no debe imprimirse en consola.
*/
export function passwordResetEmailTemplate(resetUrl) {
  const safeResetUrl = escapeEmailHtml(resetUrl)

  return {
    subject: 'Restablece tu contraseña - NoWayHome',
    text: `Recibimos una solicitud para restablecer la contraseña de tu cuenta NoWayHome.

Para crear una nueva contraseña, abre el siguiente enlace:
${resetUrl}

Este enlace es válido por tiempo limitado y solo puede utilizarse una vez.

Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.

NoWayHome`,
    html: emailBaseTemplate({
      title: 'Restablece tu contraseña',
      content: `
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#5F5F5F;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta.
        </p>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#5F5F5F;">
          Este enlace es válido por tiempo limitado y solo puede utilizarse una vez.
        </p>
        <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#5F5F5F;">
          Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.
        </p>
        <div style="border-top:1px solid rgba(166,124,82,0.35);padding-top:18px;">
          <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#5F5F5F;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:
          </p>
          <a href="${safeResetUrl}" style="font-size:13px;line-height:1.5;color:#A67C52;text-decoration:underline;word-break:break-all;">
            ${safeResetUrl}
          </a>
        </div>`,
      buttonText: 'Crear nueva contraseña',
      buttonUrl: resetUrl,
      footerText: '© NoWayHome. Este es un mensaje automático, por favor no respondas a este correo.',
    }),
  }
}

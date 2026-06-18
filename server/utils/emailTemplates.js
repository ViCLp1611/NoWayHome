/*
|--------------------------------------------------------------------------
| Plantillas de correo transaccional
|--------------------------------------------------------------------------
| Devuelven subject, text y html para Nodemailer.
| La plantilla de recuperacion se usa desde server/index.js en sendResetEmail.
|
| Seguridad:
| - resetUrl contiene un token temporal en la URL.
| - No imprimir resetUrl en consola.
| - Mantener version text como respaldo para clientes de correo.
*/
export function passwordResetEmailTemplate(resetUrl) {
  return {
    subject: 'Restablece tu contraseña - NoWayHome',
    text: `Recibimos una solicitud para restablecer la contraseña de tu cuenta NoWayHome.

Para crear una nueva contraseña, abre el siguiente enlace:
${resetUrl}

Este enlace es válido por tiempo limitado y solo puede utilizarse una vez.

Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.

NoWayHome`,
    html: `
      <div style="margin:0;padding:0;background:#FAFAFA;font-family:Arial,Helvetica,sans-serif;color:#5F5F5F;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#FAFAFA;margin:0;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;margin:0 auto;">
                <tr>
                  <td style="padding:0 0 16px;text-align:center;">
                    <div style="font-size:28px;line-height:1.2;font-weight:700;color:#6B8E23;letter-spacing:0;">
                      NoWayHome
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#F2E8CF;border-radius:16px;padding:32px 28px;border:1px solid rgba(107,142,35,0.18);">
                    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;font-weight:700;color:#5F5F5F;">
                      Restablece tu contraseña
                    </h1>
                    <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#5F5F5F;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                    </p>
                    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#5F5F5F;">
                      Haz clic en el siguiente botón para crear una nueva contraseña:
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                      <tr>
                        <td style="border-radius:8px;background:#6B8E23;">
                          <a href="${resetUrl}" style="display:inline-block;padding:14px 22px;border-radius:8px;background:#6B8E23;color:#FFFFFF;font-size:16px;line-height:1.2;font-weight:700;text-decoration:none;">
                            Crear nueva contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#5F5F5F;">
                      Este enlace es válido por tiempo limitado y solo puede utilizarse una vez.
                    </p>
                    <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#5F5F5F;">
                      Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.
                    </p>
                    <div style="border-top:1px solid rgba(166,124,82,0.35);padding-top:18px;">
                      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#5F5F5F;">
                        Si el botón no funciona, copia y pega este enlace en tu navegador:
                      </p>
                      <a href="${resetUrl}" style="font-size:13px;line-height:1.5;color:#A67C52;text-decoration:underline;word-break:break-all;">
                        ${resetUrl}
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 8px 0;text-align:center;">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:#5F5F5F;">
                      © NoWayHome. Este es un mensaje automático, por favor no respondas a este correo.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  }
}

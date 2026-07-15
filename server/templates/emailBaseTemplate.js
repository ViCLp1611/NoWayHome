export const escapeEmailHtml = value =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

export function emailBaseTemplate({
  title,
  subtitle,
  content = '',
  buttonText,
  buttonUrl,
  footerText = 'Este correo fue enviado automáticamente por NoWayHome.',
}) {
  const button =
    buttonText && buttonUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 0;">
          <tr>
            <td style="border-radius:8px;background:#6B8E23;">
              <a href="${escapeEmailHtml(buttonUrl)}" style="display:inline-block;padding:14px 22px;border-radius:8px;background:#6B8E23;color:#FFFFFF;font-size:16px;line-height:1.2;font-weight:700;text-decoration:none;">
                ${escapeEmailHtml(buttonText)}
              </a>
            </td>
          </tr>
        </table>`
      : ''

  return `
    <div style="margin:0;padding:0;background:#FAFAFA;font-family:Arial,Helvetica,sans-serif;color:#5F5F5F;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#FAFAFA;margin:0;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;margin:0 auto;">
              <tr>
                <td style="padding:0 0 16px;text-align:center;">
                  <div style="font-size:28px;line-height:1.2;font-weight:700;color:#6B8E23;">NoWayHome</div>
                </td>
              </tr>
              <tr>
                <td style="background:#F2E8CF;border-radius:16px;padding:32px 28px;border:1px solid rgba(107,142,35,0.18);">
                  <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;font-weight:700;color:#5F5F5F;">
                    ${escapeEmailHtml(title)}
                  </h1>
                  ${
                    subtitle
                      ? `<p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#A67C52;">${escapeEmailHtml(subtitle)}</p>`
                      : ''
                  }
                  ${content}
                  ${button}
                </td>
              </tr>
              <tr>
                <td style="padding:18px 8px 0;text-align:center;">
                  <p style="margin:0;font-size:12px;line-height:1.5;color:#5F5F5F;">
                    ${escapeEmailHtml(footerText)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`
}

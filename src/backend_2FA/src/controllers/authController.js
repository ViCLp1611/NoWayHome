import { supabaseAdmin } from '../config/supabase.js'
import { transporter } from '../config/mailer.js'
import dotenv from 'dotenv'
dotenv.config()

export const solicitarLogin = async (req, res) => {
  const { correo, contrasena } = req.body

  try {
    // 1. Validar credenciales
    let { data: user } = await supabaseAdmin
      .from('inquilino')
      .select('*')
      .eq('correo', correo)
      .eq('contrasena', contrasena)
      .maybeSingle()
    let role = 'guest'

    if (!user) {
      const { data: host } = await supabaseAdmin
        .from('arrendatario')
        .select('*')
        .eq('correo', correo)
        .eq('contrasena', contrasena)
        .maybeSingle()
      if (!host) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
        })
      }
      user = host
      role = 'host'
    }

    // 2. Generar OTP de 6 dígitos
    const codigoOTP = Math.floor(100000 + Math.random() * 900000).toString()
    const expiraEn = new Date(Date.now() + 5 * 60000).toISOString() // 5 minutos de validez

    // 3. Guardar en la tabla aislada codigos_2fa
    const { error: insertError } = await supabaseAdmin.from('codigos_2fa').insert([
      {
        correo,
        codigo: codigoOTP,
        expira_en: expiraEn,
      },
    ])

    if (insertError) throw insertError

    // 4. Enviar correo usando Nodemailer
    await transporter.sendMail({
      from: `"Seguridad No Way Home" <${process.env.SMTP_USER}>`,
      to: correo,
      subject: 'Tu código de acceso temporal (2FA) - No Way Home',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #5F5F5F;">
          <h2>Código de Verificación</h2>
          <p>Usa el siguiente código de 6 dígitos para iniciar sesión:</p>
          <h1 style="letter-spacing: 5px; color: #6B8E23; background: #FAFAFA; padding: 10px; border-radius: 8px;">${codigoOTP}</h1>
          <p>Este código caducará en 5 minutos. No lo compartas con nadie.</p>
        </div>
      `,
    })

    res.json({ success: true, message: 'Código enviado', role })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const verificarOTP = async (req, res) => {
  const { correo, codigo, role } = req.body

  try {
    // 1. Validar código en Supabase
    const { data: codigoData, error } = await supabaseAdmin
      .from('codigos_2fa')
      .select('*')
      .eq('correo', correo)
      .eq('codigo', codigo)
      .eq('utilizado', false)
      .gte('expira_en', new Date().toISOString())
      .maybeSingle()

    if (!codigoData || error) {
      return res.status(400).json({ success: false, message: 'Código inválido o expirado' })
    }

    // 2. Marcar como utilizado
    await supabaseAdmin.from('codigos_2fa').update({ utilizado: true }).eq('id', codigoData.id)

    // 3. Obtener datos finales del usuario
    const tabla = role === 'guest' ? 'inquilino' : 'arrendatario'
    const { data: user } = await supabaseAdmin.from(tabla).select('*').eq('correo', correo).single()

    const userData = {
      id: role === 'guest' ? user.id_inquilino : user.id_arrendatario,
      nombre: user.nombre,
      correo: user.correo,
      telefono: user.telefono,
      role: role,
    }

    res.json({ success: true, user: userData, message: 'Inicio de sesión exitoso' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al verificar el código' })
  }
}

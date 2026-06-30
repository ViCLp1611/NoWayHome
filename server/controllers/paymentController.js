// server/controllers/paymentController.js
import { supabase } from '../config/supabase.js' // ⚠️ IMPORTANTE: Ajusta esta ruta a donde tengas tu archivo de conexión a Supabase en el backend

const { PAYPAL_CLIENT_ID, PAYPAL_SECRET_KEY, PAYPAL_API_URL } = process.env

// Función interna para obtener el Token de Autorización de PayPal
const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
      throw new Error('Faltan las credenciales de PayPal en el archivo .env')
    }
    const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_SECRET_KEY).toString('base64')
    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error al generar el token de PayPal:', error)
    throw error
  }
}

export const paymentController = {
  // 1. Crear la Orden de Pago (Se llama antes de que el usuario pague)
  crearOrden: async (req, res) => {
    try {
      const { total } = req.body // El monto total a cobrar que viene del frontend
      const accessToken = await generateAccessToken()
      const url = `${PAYPAL_API_URL}/v2/checkout/orders`

      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'MXN', // Cambia a "USD" si tu plataforma cobra en dólares
              value: total,
            },
          },
        ],
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      // Retornamos el ID de la orden al Frontend para que abra la ventana de PayPal
      res.status(200).json({ id: data.id })
    } catch (error) {
      console.error('Error creando la orden:', error)
      res.status(500).json({ error: 'No se pudo crear la orden de pago.' })
    }
  },

  // 2. Capturar el Pago (Se llama cuando el usuario acepta el cobro en la ventana de PayPal)
  capturarOrden: async (req, res) => {
    try {
      // Recibimos el ID de la orden de PayPal y el id_reserva de tu base de datos
      const { orderID, idReserva } = req.body

      if (!orderID || !idReserva) {
        return res.status(400).json({
          success: false,
          error: 'Faltan datos esenciales (orderID o idReserva) para capturar el pago.',
        })
      }
      const accessToken = await generateAccessToken()
      const url = `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      // Si PayPal nos confirma que el dinero ya se cobró con éxito
      if (data.status === 'COMPLETED') {
        // 1. Extraemos el monto real cobrado de la respuesta de PayPal
        const montoCobrado = parseFloat(data.purchase_units[0].payments.captures[0].amount.value)

        // 2. Insertamos el recibo en tu tabla 'pago' en Supabase
        const { error: errorPago } = await supabase.from('pago').insert([
          {
            id_reserva: idReserva,
            monto: montoCobrado, // Se asegura que el tipo de dato sea numérico
            metodo_pago: 'PayPal',
            estado_pago: 'Completado',
            id_transaccion_paypal: orderID, // Guardamos el ID de la transacción de PayPal
          },
        ])

        if (errorPago) {
          console.error('Error al insertar el pago en Supabase:', errorPago)
          throw errorPago
        }

        // 3. Actualizamos la reserva a "Confirmada" en Supabase
        const { error: errorReserva } = await supabase
          .from('reserva')
          .update({ estado: 'confirmed' }) // Corregido para coincidir con el modelo ('pending', 'confirmed', etc.)
          .eq('id_reserva', idReserva)

        if (errorReserva) {
          console.error('Error al actualizar la reserva en Supabase:', errorReserva)
          throw errorReserva
        }

        res.status(200).json({ success: true, data })
      } else {
        res.status(400).json({ success: false, error: 'El pago no se completó.' })
      }
    } catch (error) {
      console.error('Error capturando el pago:', error)
      res.status(500).json({
        success: false,
        error: 'Fallo al procesar el pago o actualizar la base de datos.',
      })
    }
  },
}

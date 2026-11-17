// server/controllers/paymentController.js
import { supabase } from '../config/supabase.js' // ⚠️ IMPORTANTE: Ajusta esta ruta a donde tengas tu archivo de conexión a Supabase en el backend
import {
  resolvePropertyTitle,
  sendReservationReceiptEmail,
} from '../services/emailNotificationService.js'
import {
  PAYPAL_BASE_URL,
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
} from '../config/env.js'

const COMPLETED_PAYMENT_STATUSES = ['COMPLETADO', 'COMPLETED', 'CONFIRMADO', 'CONFIRMED', 'PAGADO', 'PAID']

const parseReservationId = value => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const getPayableReservation = async idReserva => {
  const { data: reservation, error } = await supabase
    .from('reserva')
    .select('id_reserva,estado,id_propiedad,id_inquilino,fecha_inicio,fecha_fin,pago')
    .eq('id_reserva', idReserva)
    .maybeSingle()

  if (error || !reservation) return { error: 'La reserva no existe.' }
  if (String(reservation.estado || '').toUpperCase() !== 'CONFIRMADA') {
    return { error: 'La reserva no está aprobada para recibir pagos.' }
  }
  const expectedAmount = Number(reservation.pago)
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    return { error: 'La reserva no tiene un monto válido.' }
  }
  const { data: payments, error: paymentsError } = await supabase
    .from('pago')
    .select('estado_pago')
    .eq('id_reserva', idReserva)
  if (paymentsError) return { error: 'No se pudo validar el estado de pago.' }
  if ((payments || []).some(payment => COMPLETED_PAYMENT_STATUSES.includes(String(payment.estado_pago || '').toUpperCase()))) {
    return { error: 'La reserva ya tiene un pago confirmado.', status: 409 }
  }
  return { reservation, expectedAmount }
}

const parsePayPalResponse = async (response, operationLabel) => {
  const rawText = await response.text()
  if (!rawText || !rawText.trim()) {
    return {}
  }
  try {
    return JSON.parse(rawText)
  } catch {
    throw new Error(`${operationLabel} devolvió una respuesta inválida (HTTP ${response.status}).`)
  }
}

// Función interna para obtener el Token de Autorización de PayPal
const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('Faltan las credenciales de PayPal en el archivo .env')
    }
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
    })

    const data = await parsePayPalResponse(response, 'PayPal OAuth')
    if (!response.ok || !data?.access_token) {
      throw new Error(
        data?.error_description ||
          data?.error ||
          `PayPal OAuth rechazó la solicitud (HTTP ${response.status}).`
      )
    }
    return data.access_token
  } catch (error) {
    console.error('Error al generar el token de PayPal:', error?.message || 'Error externo')
    throw error
  }
}

export const paymentController = {
  // 1. Crear la Orden de Pago (Se llama antes de que el usuario pague)
  crearOrden: async (req, res) => {
    try {
      const idReserva = parseReservationId(req.body?.idReserva ?? req.body?.id_reserva)
      if (!idReserva) return res.status(400).json({ success: false, error: 'idReserva no es válido.' })
      const payable = await getPayableReservation(idReserva)
      if (payable.error) return res.status(payable.status || 400).json({ success: false, error: payable.error })
      const accessToken = await generateAccessToken()
      const url = `${PAYPAL_BASE_URL}/v2/checkout/orders`

      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'MXN', // Cambia a "USD" si tu plataforma cobra en dólares
              value: payable.expectedAmount.toFixed(2),
            },
          },
        ],
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await parsePayPalResponse(response, 'PayPal crear orden')

      // Retornamos el ID de la orden al Frontend para que abra la ventana de PayPal
      if (!response.ok || !data?.id) {
        console.error('PayPal rechazó creación de orden:', {
          status: response.status,
          name: data?.name || null,
          message: data?.message || null,
          details: data?.details || null,
        })
        return res.status(502).json({
          success: false,
          error: data?.message || 'PayPal no pudo crear la orden.',
        })
      }
      res.status(200).json({
        id: data.id,
        status: data.status,
        links: Array.isArray(data.links) ? data.links : [],
      })
    } catch (error) {
      console.error('Error creando la orden:', error?.message || 'Error externo')
      res.status(500).json({ error: 'No se pudo crear la orden de pago.' })
    }
  },

  // 2. Capturar el Pago (Se llama cuando el usuario acepta el cobro en la ventana de PayPal)
  capturarOrden: async (req, res) => {
    try {
      // Recibimos el ID de la orden de PayPal y el id_reserva de tu base de datos
      const rawOrderId = req.body?.orderID ?? req.body?.orderId ?? req.body?.id_orden ?? ''
      const orderID = typeof rawOrderId === 'string' ? rawOrderId.trim() : ''
      const idReserva = parseReservationId(req.body?.idReserva ?? req.body?.id_reserva)

      if (!/^[A-Z0-9-]{8,40}$/i.test(orderID) || !idReserva) {
        return res.status(400).json({
          success: false,
          error: 'Faltan datos esenciales (orderID o idReserva) para capturar el pago.',
        })
      }
      const payable = await getPayableReservation(idReserva)
      if (payable.error) return res.status(payable.status || 400).json({ success: false, error: payable.error })
      const accessToken = await generateAccessToken()
      const url = `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await parsePayPalResponse(response, 'PayPal capturar orden')

      if (!response.ok) {
        const issue = data?.details?.[0]?.issue || data?.name || ''
        return res.status(response.status === 422 ? 422 : 400).json({
          success: false,
          error: issue || data?.message || 'No se pudo capturar la orden en PayPal.',
          message: data?.message || issue || 'El pago no se completó en PayPal.',
        })
      }

      // Si PayPal nos confirma que el dinero ya se cobró con éxito
      if (data.status === 'COMPLETED') {
        // --- VERIFICACIÓN DE SEGURIDAD ---
        // Antes de registrar el pago, nos aseguramos que la reserva está en el estado correcto ('CONFIRMADA' por el anfitrión)
        const { data: reservaParaPagar, error: findError } = await supabase
          .from('reserva')
          .select('estado, id_propiedad, id_inquilino, fecha_inicio, fecha_fin, pago')
          .eq('id_reserva', idReserva)
          .single()

        if (findError || !reservaParaPagar) {
          // Este es un caso grave. El pago se hizo pero la reserva no existe.
          // Se debe registrar para un reembolso manual.
          console.error(
            `[PAYMENT-CRITICAL] Pago capturado para reserva inexistente ID: ${idReserva}. ORDEN PAYPAL: ${orderID}. REQUIERE REEMBOLSO MANUAL.`
          )
          return res
            .status(404)
            .json({ success: false, error: 'La reserva asociada al pago no fue encontrada.' })
        }

        if (String(reservaParaPagar.estado || '').toUpperCase() !== 'CONFIRMADA') {
          // Otro caso grave. Se intentó pagar una reserva no aprobada.
          console.error(
            `[PAYMENT-CRITICAL] Pago capturado para reserva no aprobada. ID: ${idReserva}. Estado: ${reservaParaPagar.estado}. ORDEN PAYPAL: ${orderID}. REQUIERE REEMBOLSO MANUAL.`
          )
          return res
            .status(400)
            .json({ success: false, error: 'La reserva no está aprobada para recibir pagos.' })
        }

        const montoCobrado = parseFloat(
          data?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value
        )
        if (!Number.isFinite(montoCobrado) || Math.abs(montoCobrado - payable.expectedAmount) > 0.01) {
          console.error(`[PAYMENT-CRITICAL] Monto PayPal distinto al esperado para reserva ${idReserva}.`)
          return res.status(409).json({
            success: false,
            error: 'El monto capturado no coincide con la reserva.',
          })
        }

        // --- PASO 1: Registrar el pago en la tabla 'pago' ---
        // Nota: El estado de la reserva no se actualiza aquí a 'CONFIRMADA' porque la lógica
        // de negocio actual requiere que ya esté en ese estado para poder proceder al pago.
        // Si el flujo cambiara (ej. PENDIENTE -> PAGO -> CONFIRMADA), aquí iría el update.

        const { error: errorPago } = await supabase.from('pago').insert([
          {
            id_reserva: idReserva,
            monto: montoCobrado,
            metodo_pago: 'PayPal',
            estado_pago: 'Completado',
            id_transaccion_paypal: orderID,
          },
        ])

        if (errorPago) {
          console.error(
            'Error al insertar el registro del pago en Supabase:',
            errorPago?.message || 'Error de persistencia'
          )
          // Aunque el pago en PayPal fue exitoso, falló el registro en nuestra BD.
          // Es crucial loguear esto para una revisión manual.
          // No continuamos para no generar un contrato sin un pago registrado.
          throw new Error('El pago se completó, pero no se pudo registrar en la base de datos.')
        }

        try {
          const [propertyResult, tenantResult] = await Promise.all([
            supabase
              .from('propiedad')
              .select('*')
              .eq('id_propiedad', reservaParaPagar.id_propiedad)
              .maybeSingle(),
            supabase
              .from('inquilino')
              .select('id_inquilino,nombre,correo')
              .eq('id_inquilino', reservaParaPagar.id_inquilino)
              .maybeSingle(),
          ])
          const property = propertyResult.data || null
          const propertyTitle = resolvePropertyTitle(property)
          let landlord = null
          if (property?.id_arrendatario) {
            const landlordResult = await supabase
              .from('arrendatario')
              .select('id_arrendatario,nombre,correo')
              .eq('id_arrendatario', property.id_arrendatario)
              .maybeSingle()
            landlord = landlordResult.data || null
          }
          const capture = data?.purchase_units?.[0]?.payments?.captures?.[0]
          const commonReceiptData = {
            reservationId: idReserva,
            propertyTitle,
            propertyAddress: property?.direccion || property?.ubicacion || property?.ciudad,
            startDate: reservaParaPagar?.fecha_inicio,
            endDate: reservaParaPagar?.fecha_fin,
            total: montoCobrado,
            tenantName: tenantResult.data?.nombre,
            tenantEmail: tenantResult.data?.correo,
            landlordName: landlord?.nombre,
            landlordEmail: landlord?.correo,
            paymentStatus: capture?.status || data.status,
            paymentDate: capture?.create_time || capture?.update_time || new Date().toISOString(),
            issuedAt: new Date().toISOString(),
          }
          await Promise.all([
            sendReservationReceiptEmail({
              ...commonReceiptData,
              to: tenantResult.data?.correo,
              name: tenantResult.data?.nombre,
              role: 'inquilino',
            }),
            sendReservationReceiptEmail({
              ...commonReceiptData,
              to: landlord?.correo,
              name: landlord?.nombre,
              role: 'arrendatario',
            }),
          ])
        } catch (notifyError) {
          console.error(
            '[paymentController] Pago guardado, pero falló preparación de notificaciones:',
            notifyError?.message || notifyError
          )
        }

        res.status(200).json({ success: true, data })
      } else {
        res.status(400).json({ success: false, error: 'El pago no se completó.' })
      }
    } catch (error) {
      console.error('Error capturando el pago:', error?.message || 'Error externo')
      res.status(500).json({
        success: false,
        error: 'Fallo al procesar el pago o actualizar la base de datos.',
      })
    }
  },
}

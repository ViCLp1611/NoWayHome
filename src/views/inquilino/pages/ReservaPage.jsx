import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Mail, Phone, MapPin } from 'lucide-react'
import { PayPalButtons } from '@paypal/react-paypal-js'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { reservaController } from '@/controllers/reservaController.js'
import { formatDateLong } from '@/utils/dateUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function ReservaPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [userData, setUserData] = useState(null)
  const [propiedad, setPropiedad] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [costos, setCostos] = useState(null)
  const [idReservaPendiente, setIdReservaPendiente] = useState(null)
  const [message, setMessage] = useState({ type: '', title: '', text: '' })
  const today = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0]

  useEffect(() => {
    const fetchDatos = async () => {
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
      if (!storedUser) {
        navigate('/')
        return
      }
      setUserData(JSON.parse(storedUser))

      const result = await reservaController.cargarDetallesPropiedad(id)
      if (result.success) {
        setPropiedad(result.data)
      } else {
        setMessage({
          type: 'error',
          title: 'No pudimos cargar la propiedad',
          text: result.error || 'Intenta nuevamente desde el catalogo.',
        })
      }
      setIsLoading(false)
    }
    fetchDatos()
  }, [id, navigate])

  useEffect(() => {
    if (fechaInicio && fechaFin && propiedad) {
      const precioBase = propiedad.precio_noche || propiedad.precio || 0
      const calculo = reservaController.calcularCostos(precioBase, fechaInicio, fechaFin)

      if (!calculo.error) {
        setCostos(calculo)
      } else {
        setCostos(null)
      }
    } else {
      setCostos(null)
    }
  }, [fechaInicio, fechaFin, propiedad])

  const handleIniciarReserva = async () => {
    if (!costos || !propiedad || !fechaInicio || !fechaFin) {
      setMessage({
        type: 'error',
        title: 'Datos incompletos',
        text: 'Por favor completa todas las fechas antes de continuar.',
      })
      return
    }
    setIsLoading(true)
    setMessage({ type: '', title: '', text: '' })

    const nuevaReserva = {
      id_inquilino: userData.id_inquilino || userData.id,
      id_propiedad: propiedad.id_propiedad || propiedad.id,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      pago: costos.total,
      estado: 'pendiente',
    }

    const result = await reservaController.iniciarReserva(nuevaReserva)
    if (result.success) {
      // --- Robustez Adicional ---
      // Nos aseguramos de guardar solo el ID numérico de la reserva,
      // independientemente de si el controlador devuelve un objeto o un array.
      const reservaData = Array.isArray(result.data) ? result.data[0] : result.data
      const reservaId = reservaData?.id_reserva

      if (reservaId) {
        setIdReservaPendiente(reservaId)
        setStep(2)
      } else {
        setMessage({
          type: 'error',
          title: 'Error de Comunicación',
          text: 'No se pudo obtener un ID de reserva válido del servidor.',
        })
      }
    } else {
      setMessage({
        type: 'error',
        title: 'No se pudo crear la reserva',
        text: result.error || 'Verifica las fechas e intenta nuevamente.',
      })
    }
    setIsLoading(false)
  }

  // --- Lógica de PayPal ---

  // Llama al backend para crear una orden en PayPal
  const createOrder = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payments/crear-orden`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: costos.total.toString() }),
      })
      const order = await response.json()
      if (order.id) {
        return order.id
      }
      throw new Error(order.error || 'No se pudo obtener el ID de la orden de PayPal.')
    } catch (err) {
      setMessage({ type: 'error', title: 'Error de Pago', text: err.message })
      return null
    }
  }

  // Llama al backend para capturar el pago cuando el usuario aprueba en PayPal
  const onApprove = async data => {
    setIsLoading(true)
    setMessage({ type: '', title: '', text: '' })
    try {
      const response = await fetch(`${API_URL}/api/payments/capturar-orden`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderID: data.orderID,
          idReserva: idReservaPendiente,
        }),
      })
      const result = await response.json()

      if (result.success) {
        setStep(3) // Muestra el diálogo de éxito final
      } else {
        throw new Error(result.error || 'El pago no se completó en el servidor.')
      }
    } catch (err) {
      setMessage({
        type: 'error',
        title: 'Error al confirmar el pago',
        text: err.message,
      })
    }
    setIsLoading(false)
  }

  const formatPrice = price => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)
  }

  const formatDate = dateString => formatDateLong(dateString, 'es-MX')

  if (isLoading && !propiedad) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <LoadingState message="Preparando tu reserva..." className="min-h-screen" />
      </div>
    )
  }

  return (
    <>
      <InquilinoNavbar />
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-8 sm:py-12">
        <div className="container mx-auto max-w-7xl">
          <button
            onClick={() => (step === 1 ? navigate('/inquilino/propiedad/' + id) : setStep(1))}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-[#5F5F5F] transition-colors hover:text-[#6B8E23]"
          >
            <ArrowLeft className="h-5 w-5" /> Volver a la propiedad
          </button>

          {message.text && step === 1 && (
            <AlertMessage
              type={message.type}
              title={message.title}
              message={message.text}
              className="mb-6"
            />
          )}

          <div className="mx-auto max-w-4xl">
            {/* Encabezado de la Propiedad */}
            <div className="mb-8">
              <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#F2E8CF] sm:aspect-[2/1] lg:aspect-[2.5/1]">
                <img
                  src={propiedad.imagen_principal || 'https://via.placeholder.com/800x400'}
                  alt={propiedad.titulo || propiedad.descripcion || 'Propiedad'}
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="font-poppins text-3xl font-semibold text-[#5F5F5F] sm:text-4xl">
                {propiedad.titulo || propiedad.descripcion || 'Propiedad'}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-base text-[#5F5F5F]/80">
                <MapPin className="h-5 w-5 shrink-0 text-[#A67C52]" />
                <span>{propiedad.ubicacion || propiedad.direccion || 'No especificada'}</span>
              </p>
            </div>

            {/* Formulario de Reserva */}
            <Card className="rounded-2xl border border-[#6B8E23]/10 p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 font-poppins text-2xl font-semibold text-[#5F5F5F]">
                Completa los datos de tu reserva
              </h2>

              {/* Card Fechas */}
              <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#5F5F5F]/80">Entrada</label>
                  <Input
                    type="date"
                    min={today}
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                    className="mt-2 rounded-xl border-[#6B8E23]/20 bg-white text-[#5F5F5F] focus:border-[#6B8E23] focus:ring-2 focus:ring-[#6B8E23]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#5F5F5F]/80">Salida</label>
                  <Input
                    type="date"
                    min={fechaInicio || today}
                    value={fechaFin}
                    onChange={e => setFechaFin(e.target.value)}
                    disabled={!fechaInicio}
                    className="mt-2 rounded-xl border-[#6B8E23]/20 bg-white text-[#5F5F5F] focus:border-[#6B8E23] focus:ring-2 focus:ring-[#6B8E23]/50 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Resumen de Costos */}
              {costos && (
                <div className="mb-8 space-y-4 rounded-xl bg-[#FAFAFA] p-5">
                  <h3 className="font-poppins font-semibold text-[#5F5F5F]">Resumen de precios</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-[#5F5F5F]">
                      <span>
                        {formatPrice(propiedad.precio_noche || propiedad.precio || 0)} x{' '}
                        {costos.dias} noche(s)
                      </span>
                      <span>{formatPrice(costos.total)}</span>
                    </div>
                    <div className="flex justify-between text-[#5F5F5F]">
                      <span>Tarifa de servicio</span>
                      <span>{formatPrice(0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#6B8E23]/20 pt-4 font-semibold">
                    <span className="text-base text-[#5F5F5F]">Total (MXN)</span>
                    <span className="text-xl text-[#6B8E23]">{formatPrice(costos.total)}</span>
                  </div>
                </div>
              )}

              {/* Card Acción de Pago */}
              <p className="mb-4 text-center text-sm text-[#5F5F5F]/80">
                Tu reserva quedará registrada como "pendiente" hasta la confirmación final.
              </p>
              <Button
                onClick={handleIniciarReserva}
                disabled={!costos || !fechaInicio || !fechaFin || isLoading}
                className="h-14 w-full rounded-xl bg-[#6B8E23] text-base font-semibold text-white shadow-sm transition-all hover:bg-[#5a7a1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B8E23] focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {isLoading ? 'Procesando...' : 'Confirmar y continuar'}
              </Button>
            </Card>
          </div>

          {/* Modal para Step 2: Confirmación de Reserva Pendiente */}
          {/* Asegúrate de tener PayPalScriptProvider envolviendo tu App */}
          <Dialog
            open={step === 2}
            onOpenChange={isOpen => {
              if (!isOpen && !isLoading) setStep(1)
            }}
          >
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader className="text-center items-center pt-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#6B8E23]/10">
                  <CheckCircle className="h-8 w-8 text-[#6B8E23]" />
                </div>
                <DialogTitle className="font-poppins text-2xl font-bold text-[#5F5F5F]">
                  Finaliza tu pago
                </DialogTitle>
                <DialogDescription className="text-sm text-[#5F5F5F]/80 pt-2">
                  Tu reserva ha sido creada. Completa el pago de forma segura con PayPal para
                  confirmarla.
                </DialogDescription>
              </DialogHeader>

              {isLoading ? (
                <LoadingState message="Procesando pago..." />
              ) : message.text ? (
                <AlertMessage type={message.type} title={message.title} message={message.text} />
              ) : (
                <div className="px-6 pt-4">
                  <PayPalButtons
                    style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={err =>
                      setMessage({ type: 'error', title: 'Error de PayPal', text: err.message })
                    }
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal para Step 3: Reserva Confirmada */}
          <Dialog
            open={step === 3}
            onOpenChange={isOpen => !isOpen && navigate('/inquilino/perfil')}
          >
            <DialogContent className="sm:max-w-md rounded-2xl">
              <div className="p-6 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#6B8E23]/10">
                  <CheckCircle className="h-10 w-10 text-[#6B8E23]" />
                </div>
                <h2 className="font-poppins text-3xl font-bold text-[#5F5F5F]">
                  ¡Reserva confirmada!
                </h2>
                <p className="mt-2 mb-8 text-base text-[#5F5F5F]/80">
                  Tu reserva ha sido creada correctamente. Puedes consultarla desde tu perfil.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/inquilino/perfil')}
                    className="h-12 w-full rounded-xl bg-[#6B8E23] font-semibold text-white shadow-sm transition-colors hover:bg-[#5a7a1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B8E23] focus-visible:ring-offset-2"
                  >
                    Ver mis reservas
                  </Button>
                  <Button
                    onClick={() => navigate('/inquilino/explorar')}
                    variant="outline"
                    className="h-12 w-full rounded-xl border-2 border-[#6B8E23] font-semibold text-[#6B8E23] shadow-none transition-colors hover:bg-[#F2E8CF] hover:text-[#6B8E23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B8E23] focus-visible:ring-offset-2"
                  >
                    Explorar más propiedades
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}

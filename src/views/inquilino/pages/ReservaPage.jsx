import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { toast } from 'sonner'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { reservaController } from '@/controllers/reservaController.js'
import { formatDateLong } from '@/utils/dateUtils'
import { API_URL } from '@/config/api'

export function ReservaPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [userData, setUserData] = useState(null)
  const [propiedad, setPropiedad] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [costos, setCostos] = useState(null)
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
      const start = new Date(fechaInicio)
      const end = new Date(fechaFin)

      if (end <= start) {
        setCostos(null)
        return
      }

      const diffTime = Math.abs(end.getTime() - start.getTime())
      const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (dias > 0) {
        const precioNoche = propiedad.precio_noche || propiedad.precio || 0
        const subtotal = precioNoche * dias
        const comision = subtotal * 0.1 // 10% de comisión
        const totalFinal = subtotal + comision

        setCostos({
          dias,
          subtotal,
          comision,
          total: totalFinal,
        })
      } else {
        setCostos(null)
      }
    } else {
      setCostos(null)
    }
  }, [fechaInicio, fechaFin, propiedad])

  const handleSolicitarReserva = async () => {
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

    const reservationData = {
      id_inquilino: userData.id_inquilino || userData.id,
      id_propiedad: propiedad.id_propiedad || propiedad.id,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      pago: costos.total,
    }

    try {
      const response = await fetch(`${API_URL}/api/inquilino/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Ocurrió un error en el servidor.')
      }

      toast.success('Reserva creada correctamente.', {
        description: 'El anfitrión ha sido notificado. Recibirás una actualización pronto.',
      })

      setTimeout(() => {
        navigate(`/inquilino/reserva-detalle/${result.reservation.id_reserva}`)
      }, 2000)
    } catch (err) {
      setMessage({
        type: 'error',
        title: 'Error en la solicitud',
        text: err.message,
      })
      setIsLoading(false)
    }
  }

  const formatPrice = price => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)
  }

  const formatDate = dateString => formatDateLong(dateString, 'es-MX')

  if (isLoading || !propiedad) {
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
            onClick={() => navigate('/inquilino/propiedad/' + id)}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-[#5F5F5F] transition-colors hover:text-[#6B8E23]"
          >
            <ArrowLeft className="h-5 w-5" /> Volver a la propiedad
          </button>

          {message.text && (
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
                {propiedad?.titulo || propiedad?.descripcion || 'Propiedad'}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-base text-[#5F5F5F]/80">
                <MapPin className="h-5 w-5 shrink-0 text-[#A67C52]" />
                <span>{propiedad?.ubicacion || propiedad?.direccion || 'No especificada'}</span>
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
                      <span>{formatPrice(costos.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#5F5F5F]">
                      <span>Comisión y otros</span>
                      <span>{formatPrice(costos.comision)}</span>
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
                Al hacer clic en "Solicitar Reserva", tu solicitud será enviada al anfitrión para su
                aprobación. No se te cobrará nada en este momento.
              </p>
              <Button
                onClick={handleSolicitarReserva}
                disabled={!costos || !fechaInicio || !fechaFin || isLoading}
                className="h-14 w-full rounded-xl bg-[#6B8E23] text-base font-semibold text-white shadow-sm transition-all hover:bg-[#5a7a1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B8E23] focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {isLoading ? 'Enviando Solicitud...' : 'Solicitar Reserva'}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

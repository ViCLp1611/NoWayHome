import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, Mail, Phone } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { landlordBookingService } from '@/services/landlordBookingService'

const ESTADO_STYLES = {
  pendiente: { bg: 'bg-amber-50', text: 'text-amber-800', badge: 'bg-amber-200 text-amber-900' },
  confirmada: { bg: 'bg-green-50', text: 'text-green-800', badge: 'bg-green-200 text-green-900' },
  rechazada: { bg: 'bg-gray-50', text: 'text-gray-800', badge: 'bg-gray-200 text-gray-900' },
  cancelada: { bg: 'bg-orange-50', text: 'text-orange-800', badge: 'bg-orange-200 text-orange-900' },
}

export function ReservasArrendatario() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState({ type: '', title: '', text: '' })
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    const fetchReservas = async () => {
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
      if (!storedUser) {
        navigate('/login')
        return
      }

      let user
      try {
        user = JSON.parse(storedUser)
      } catch {
        setError('Tu sesion es invalida. Inicia sesion nuevamente.')
        setIsLoading(false)
        return
      }

      const idArrendatario = user.id_arrendatario || user.id

      if (!idArrendatario) {
        setError('No se pudo identificar tu cuenta de arrendatario.')
        setIsLoading(false)
        return
      }

      try {
        setError('')
        const result = await landlordBookingService.obtenerReservasRecibidas(idArrendatario)
        setReservas(result)
      } catch (err) {
        setError('No se pudieron cargar las reservas. Intenta nuevamente.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReservas()
  }, [navigate])

  const handleEstadoChange = async (idReserva, nuevoEstado) => {
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
    if (!storedUser) return

    let user
    try {
      user = JSON.parse(storedUser)
    } catch {
      setMessage({
        type: 'error',
        title: 'Sesion invalida',
        text: 'Inicia sesion nuevamente para actualizar reservas.',
      })
      return
    }

    const idArrendatario = user.id_arrendatario || user.id

    if (!idArrendatario) {
      setMessage({
        type: 'error',
        title: 'Datos incompletos',
        text: 'No se pudo identificar tu cuenta de arrendatario.',
      })
      return
    }

    setProcessingId(idReserva)
    setMessage({ type: '', title: '', text: '' })

    try {
      await landlordBookingService.cambiarEstadoReserva(idReserva, idArrendatario, nuevoEstado)
      
      // Actualizar lista local
      setReservas(prev =>
        prev.map(r =>
          r.id_reserva === idReserva ? { ...r, estado: nuevoEstado } : r
        )
      )

      const mensajes = {
        confirmada: 'Reserva confirmada correctamente.',
        rechazada: 'Reserva rechazada correctamente.',
        cancelada: 'Reserva cancelada correctamente.',
      }

      setMessage({
        type: 'success',
        title: 'Éxito',
        text: mensajes[nuevoEstado] || 'Estado actualizado correctamente.',
      })
    } catch (err) {
      setMessage({
        type: 'error',
        title: 'Error',
        text: err.message || 'No se pudo actualizar la reserva.',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const formatPrice = price => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)
  }

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const calculateNights = (inicio, fin) => {
    const start = new Date(inicio)
    const end = new Date(fin)
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <LoadingState message="Cargando reservas..." className="min-h-screen" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-8">
      <div className="container mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/arrendatario/perfil')}
          className="mb-8 flex items-center gap-2 font-medium text-[#5F5F5F] transition-colors hover:text-black"
        >
          <ArrowLeft className="h-5 w-5" /> Volver al perfil
        </button>

        <div className="mb-8">
          <h1 className="font-poppins text-3xl font-bold text-[#5F5F5F]">Reservas recibidas</h1>
          <p className="mt-1 text-[#5F5F5F]/70">
            Administra las reservas realizadas sobre tus propiedades
          </p>
        </div>

        {message.text && (
          <AlertMessage
            type={message.type}
            title={message.title}
            message={message.text}
            className="mb-6"
          />
        )}

        {error && (
          <AlertMessage
            type="error"
            title="Error al cargar reservas"
            message={error}
            className="mb-6"
          />
        )}

        {reservas.length === 0 ? (
          <EmptyState
            title="Aún no tienes reservas"
            message="No hay reservas registradas en tus propiedades por el momento."
          />
        ) : (
          <div className="space-y-6">
            {reservas.map(reserva => {
              const nights = calculateNights(reserva.fecha_inicio, reserva.fecha_fin)
              const styles = ESTADO_STYLES[reserva.estado] || ESTADO_STYLES.pendiente
              const inquilino = reserva.inquilino || {}
              const propiedad = reserva.propiedad || {}
              const tituloPropiedad = reserva.titulo_propiedad || propiedad.titulo || propiedad.descripcion || 'Propiedad'
              const imagenPrincipal = reserva.imagen_principal || propiedad.imagen_principal || null
              const nombreInquilino = reserva.nombre_inquilino || inquilino.nombre || 'No disponible'
              const correoInquilino = reserva.correo_inquilino || inquilino.correo || 'No disponible'
              const telefonoInquilino = reserva.telefono_inquilino || inquilino.telefono || null
              const totalReserva = reserva.total ?? reserva.pago ?? 0

              return (
                <Card
                  key={reserva.id_reserva}
                  className={`overflow-hidden rounded-3xl border border-[#6B8E23]/10 shadow-sm ${styles.bg}`}
                >
                  <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
                    {/* Imagen y detalles propiedad */}
                    <div className="lg:col-span-1">
                      {imagenPrincipal && (
                        <img
                          src={imagenPrincipal}
                          alt={tituloPropiedad}
                          className="mb-4 h-40 w-full rounded-2xl object-cover"
                        />
                      )}
                      <div>
                        <p className="text-xs font-medium text-[#5F5F5F]/70">Propiedad</p>
                        <h3 className="font-semibold text-[#5F5F5F] line-clamp-2">
                          {tituloPropiedad}
                        </h3>
                      </div>
                    </div>

                    {/* Detalles de la reserva */}
                    <div className="lg:col-span-1 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-[#5F5F5F]/70">Inquilino</p>
                        <p className="font-semibold text-[#5F5F5F]">{nombreInquilino}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-[#5F5F5F]/70 text-xs font-medium mb-1">
                          <Mail className="h-3 w-3" />
                          Correo
                        </div>
                        <p className="text-sm text-[#5F5F5F]">{correoInquilino}</p>
                      </div>

                      {telefonoInquilino && (
                        <div>
                          <div className="flex items-center gap-1 text-[#5F5F5F]/70 text-xs font-medium mb-1">
                            <Phone className="h-3 w-3" />
                            Teléfono
                          </div>
                          <p className="text-sm text-[#5F5F5F]">{telefonoInquilino}</p>
                        </div>
                      )}
                    </div>

                    {/* Fechas y estado */}
                    <div className="lg:col-span-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-1 text-[#5F5F5F]/70 text-xs font-medium mb-1">
                          <Calendar className="h-3 w-3" />
                          Fechas
                        </div>
                        <p className="text-sm text-[#5F5F5F]">
                          {formatDate(reserva.fecha_inicio)} - {formatDate(reserva.fecha_fin)}
                        </p>
                        <p className="text-xs text-[#5F5F5F]/60">{nights} noche(s)</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-[#5F5F5F]/70 text-xs font-medium mb-1">
                          <DollarSign className="h-3 w-3" />
                          Total
                        </div>
                        <p className="text-lg font-bold text-[#6B8E23]">
                          {formatPrice(totalReserva)}
                        </p>
                        {/* TODO: El contrato se generará después del flujo de pago. */}
                        <p className="text-xs text-[#5F5F5F]/60">El contrato se generará después del flujo de pago.</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-[#5F5F5F]/70 mb-1">Estado</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${styles.badge}`}>
                          {reserva.estado}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="border-t border-[#6B8E23]/10 px-6 py-4 flex flex-wrap gap-2">
                    {reserva.estado === 'pendiente' && (
                      <>
                        <Button
                          onClick={() => handleEstadoChange(reserva.id_reserva, 'confirmada')}
                          disabled={processingId === reserva.id_reserva}
                          className="flex items-center gap-2 rounded-xl bg-green-600 text-white shadow-none hover:bg-green-700 text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {processingId === reserva.id_reserva ? 'Procesando...' : 'Confirmar'}
                        </Button>
                        <Button
                          onClick={() => handleEstadoChange(reserva.id_reserva, 'rechazada')}
                          disabled={processingId === reserva.id_reserva}
                          className="flex items-center gap-2 rounded-xl bg-red-600 text-white shadow-none hover:bg-red-700 text-sm"
                        >
                          <XCircle className="h-4 w-4" />
                          Rechazar
                        </Button>
                      </>
                    )}

                    {reserva.estado === 'confirmada' && (
                      <Button
                        onClick={() => handleEstadoChange(reserva.id_reserva, 'cancelada')}
                        disabled={processingId === reserva.id_reserva}
                        className="flex items-center gap-2 rounded-xl bg-orange-600 text-white shadow-none hover:bg-orange-700 text-sm"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {processingId === reserva.id_reserva ? 'Procesando...' : 'Cancelar'}
                      </Button>
                    )}

                    {(reserva.estado === 'rechazada' || reserva.estado === 'cancelada') && (
                      <div className="text-xs text-[#5F5F5F]/60 italic">
                        Esta reserva no puede modificarse
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

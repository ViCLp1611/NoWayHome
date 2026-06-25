import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { reservaController } from '@/controllers/reservaController.js'

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
      setIdReservaPendiente(result.data)
      setStep(2)
      setMessage({
        type: 'success',
        title: 'Reserva creada',
        text: 'Revisa el resumen y confirma para completar tu reserva.',
      })
    } else {
      setMessage({
        type: 'error',
        title: 'No se pudo crear la reserva',
        text: result.error || 'Verifica las fechas e intenta nuevamente.',
      })
    }
    setIsLoading(false)
  }

  const handleConfirmarPago = async () => {
    setIsLoading(true)
    setMessage({ type: '', title: '', text: '' })
    const result = await reservaController.confirmarReserva(idReservaPendiente)
    if (result.success) {
      setStep(3)
      setMessage({
        type: 'success',
        title: 'Reserva confirmada',
        text: 'Tu reserva ha sido creada correctamente. Puedes consultarla desde tu perfil.',
      })
    } else {
      setMessage({
        type: 'error',
        title: 'No se pudo confirmar la reserva',
        text: result.error || 'Intenta nuevamente en unos momentos.',
      })
    }
    setIsLoading(false)
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
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <button
            onClick={() => navigate('/inquilino/propiedad/' + id)}
            className="mb-8 flex items-center gap-2 font-medium text-[#5F5F5F] transition-colors hover:text-black"
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

          {step === 1 && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Columna izquierda: Fechas y datos */}
              <div className="space-y-6">
                {/* Card Fechas */}
                <Card className="rounded-3xl border border-[#6B8E23]/10 p-6 shadow-sm">
                  <h2 className="mb-4 text-2xl font-semibold text-[#5F5F5F]">Fechas de reserva</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#5F5F5F]/70">Fecha de entrada</label>
                      <Input
                        type="date"
                        value={fechaInicio}
                        onChange={e => setFechaInicio(e.target.value)}
                        className="mt-2 rounded-xl border-[#6B8E23]/20 text-[#5F5F5F]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#5F5F5F]/70">Fecha de salida</label>
                      <Input
                        type="date"
                        value={fechaFin}
                        onChange={e => setFechaFin(e.target.value)}
                        className="mt-2 rounded-xl border-[#6B8E23]/20 text-[#5F5F5F]"
                      />
                    </div>

                    {costos && (
                      <div className="space-y-3 rounded-2xl bg-[#F2E8CF] p-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-[#5F5F5F]/70">Duración</span>
                          <span className="font-semibold text-[#5F5F5F]">{costos.dias} noche(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-[#5F5F5F]/70">Precio por noche</span>
                          <span className="font-semibold text-[#5F5F5F]">
                            {formatPrice(propiedad.precio_noche || propiedad.precio || 0)}
                          </span>
                        </div>
                        <div className="border-t border-[#6B8E23]/20 pt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-[#5F5F5F]">Total estimado</span>
                            <span className="text-2xl font-bold text-[#6B8E23]">
                              {formatPrice(costos.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Card Datos del huésped */}
                <Card className="rounded-3xl border border-[#6B8E23]/10 p-6 shadow-sm">
                  <h2 className="mb-4 text-2xl font-semibold text-[#5F5F5F]">Datos de la reserva</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-[#5F5F5F]/70 mb-1">Reservado a nombre de</p>
                      <p className="font-semibold text-[#5F5F5F]">
                        {userData?.nombre || userData?.name || 'Usuario'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#A67C52]" />
                      <div>
                        <p className="text-xs text-[#5F5F5F]/70">Correo electrónico</p>
                        <p className="text-sm font-medium text-[#5F5F5F]">{userData?.correo || userData?.email || 'No disponible'}</p>
                      </div>
                    </div>
                    {userData?.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#A67C52]" />
                        <div>
                          <p className="text-xs text-[#5F5F5F]/70">Teléfono</p>
                          <p className="text-sm font-medium text-[#5F5F5F]">{userData.telefono}</p>
                        </div>
                      </div>
                    )}
                    {!userData?.telefono && (
                      <div className="rounded-lg bg-[#F2E8CF]/50 p-3 text-xs text-[#5F5F5F]/80">
                        💡 Agrega tu teléfono desde tu perfil para facilitar el contacto con el anfitrión.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Columna derecha: Resumen de propiedad */}
              <div>
                <Card className="sticky top-8 rounded-3xl border border-[#6B8E23]/10 p-6 shadow-sm">
                  <h2 className="mb-4 text-2xl font-semibold text-[#5F5F5F]">Resumen de la reserva</h2>

                  <div className="mb-6 rounded-2xl overflow-hidden bg-gray-200">
                    <img
                      src={propiedad.imagen_principal || 'https://via.placeholder.com/400x250'}
                      alt={propiedad.titulo}
                      className="h-40 w-full object-cover"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-[#5F5F5F]/70">Propiedad</p>
                      <h3 className="text-lg font-semibold text-[#5F5F5F] line-clamp-2">
                        {propiedad.titulo || propiedad.descripcion || 'Propiedad'}
                      </h3>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[#A67C52] mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-[#5F5F5F]/70">Ubicación</p>
                        <p className="text-sm text-[#5F5F5F]">
                          {propiedad.ubicacion || propiedad.direccion || 'No especificada'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[#6B8E23]/10 pt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-[#5F5F5F]/70">Entrada</span>
                        <span className="font-semibold text-[#5F5F5F]">
                          {fechaInicio ? formatDate(fechaInicio) : '–'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[#5F5F5F]/70">Salida</span>
                        <span className="font-semibold text-[#5F5F5F]">
                          {fechaFin ? formatDate(fechaFin) : '–'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[#5F5F5F]/70">Duración</span>
                        <span className="font-semibold text-[#5F5F5F]">
                          {costos ? `${costos.dias} noche(s)` : '–'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[#6B8E23]/10 pt-4 space-y-2 rounded-lg bg-[#F2E8CF] p-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-[#5F5F5F]/70">Precio unitario</span>
                        <span className="font-semibold text-[#5F5F5F]">
                          {formatPrice(propiedad.precio_noche || propiedad.precio || 0)} por noche
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-[#5F5F5F]">Total</span>
                        <span className="text-[#6B8E23]">{costos ? formatPrice(costos.total) : '$0'}</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#F2E8CF]/50 p-3 text-xs text-[#5F5F5F]/80">
                      <p className="font-semibold mb-1">Estado: Pendiente</p>
                      <p>Tu reserva será confirmada después de hacer clic en "Confirmar reserva".</p>
                    </div>

                    <Button
                      onClick={handleIniciarReserva}
                      disabled={!costos || !fechaInicio || !fechaFin || isLoading}
                      className="h-12 w-full rounded-xl bg-[#6B8E23] text-white shadow-none hover:bg-[#5a7a1e] font-semibold"
                    >
                      {isLoading ? 'Procesando...' : 'Confirmar reserva'}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div />
              <Card className="rounded-3xl border-2 border-[#6B8E23] p-8 shadow-lg">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-[#6B8E23]/10 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-[#6B8E23]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#5F5F5F]">Reserva creada correctamente</h2>
                  <p className="text-[#5F5F5F]/80">
                    Tu reserva está pendiente de confirmación. Haz clic en el botón para completar el proceso.
                  </p>
                  <Button
                    onClick={handleConfirmarPago}
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl bg-[#6B8E23] text-white shadow-none hover:bg-[#5a7a1e] font-semibold"
                  >
                    {isLoading ? 'Procesando...' : 'Confirmar reserva'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div />
              <Card className="rounded-3xl border border-[#6B8E23]/10 p-8 text-center shadow-sm">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-[#5F5F5F] mb-2">¡Reserva confirmada!</h2>
                <p className="text-[#5F5F5F]/80 mb-8">
                  Tu reserva ha sido creada correctamente. Puedes consultarla desde tu perfil.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/inquilino/perfil')}
                    className="h-12 w-full rounded-xl bg-[#6B8E23] text-white shadow-none hover:bg-[#5a7a1e]"
                  >
                    Ver mis reservas
                  </Button>
                  <Button
                    onClick={() => navigate('/inquilino/explorar')}
                    variant="outline"
                    className="h-12 w-full rounded-xl border-2 border-[#6B8E23] text-[#6B8E23] shadow-none hover:bg-[#F2E8CF]"
                  >
                    Volver a explorar
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  CircleDollarSign,
  Clock3,
  Mail,
  Phone,
  UserRound,
  XCircle,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { landlordBookingService } from '@/services/landlordBookingService'
import { PLACEHOLDER_PROPERTY_IMAGE } from '@/views/inquilino/constants.js'

const ESTADO_STYLES = {
  pendiente: {
    card: 'bg-[#F2E8CF] border-[#A67C52]/20',
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
    label: 'Pendiente',
  },
  confirmada: {
    card: 'bg-white border-[#6B8E23]/15',
    badge: 'bg-green-100 text-green-800 border-green-200',
    label: 'Confirmada',
  },
  rechazada: {
    card: 'bg-white border-red-100',
    badge: 'bg-red-50 text-red-700 border-red-100',
    label: 'Rechazada',
  },
  cancelada: {
    card: 'bg-white border-[#5F5F5F]/10',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    label: 'Cancelada',
  },
}

const FILTERS = [
  { value: 'todas', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'cancelada', label: 'Canceladas' },
]

const ESTADO_ORDER = {
  pendiente: 1,
  confirmada: 2,
  rechazada: 3,
  cancelada: 4,
}

const normalizeStatus = estado => String(estado || '').toLowerCase()

const getReservaTotal = reserva => {
  const total = Number(
    reserva.total ?? reserva.pago ?? reserva.precio_total ?? reserva.total_pagado ?? 0
  )
  return Number.isFinite(total) ? total : 0
}

export function ReservasArrendatario() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState({ type: '', title: '', text: '' })
  const [processingId, setProcessingId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('todas')
  const [pendingAction, setPendingAction] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

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
        setError('Tu sesión es inválida. Inicia sesión nuevamente.')
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

  const closeActionModal = () => {
    if (processingId) return
    setPendingAction(null)
    setRejectReason('')
  }

  const openActionModal = (reserva, nuevoEstado) => {
    const parsedIdReserva = Number(reserva.id_reserva)
    if (!Number.isInteger(parsedIdReserva) || parsedIdReserva <= 0) {
      setMessage({
        type: 'error',
        title: 'Reserva invalida',
        text: 'No se puede actualizar esta reserva porque no tiene id_reserva valido.',
      })
      return false
    }

    setMessage({ type: '', title: '', text: '' })
    setPendingAction({ reserva, nuevoEstado, idReserva: parsedIdReserva })
    setRejectReason('')
  }

  const handleEstadoChange = async (idReserva, nuevoEstado) => {
    const parsedIdReserva = Number(idReserva)
    if (!Number.isInteger(parsedIdReserva) || parsedIdReserva <= 0) {
      setMessage({
        type: 'error',
        title: 'Reserva inválida',
        text: 'No se puede actualizar esta reserva porque no tiene id_reserva válido.',
      })
      return false
    }

    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
    if (!storedUser) return false

    let user
    try {
      user = JSON.parse(storedUser)
    } catch {
      setMessage({
        type: 'error',
        title: 'Sesión inválida',
        text: 'Inicia sesión nuevamente para actualizar reservas.',
      })
      return false
    }

    const idArrendatario = user.id_arrendatario || user.id

    if (!idArrendatario) {
      setMessage({
        type: 'error',
        title: 'Datos incompletos',
        text: 'No se pudo identificar tu cuenta de arrendatario.',
      })
      return false
    }

    setProcessingId(parsedIdReserva)
    setMessage({ type: '', title: '', text: '' })

    try {
      await landlordBookingService.cambiarEstadoReserva(parsedIdReserva, idArrendatario, nuevoEstado)

      setReservas(prev =>
        prev.map(reserva =>
          Number(reserva.id_reserva) === parsedIdReserva
            ? { ...reserva, estado: nuevoEstado }
            : reserva
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
      return true
    } catch (err) {
      setMessage({
        type: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la reserva. Intenta nuevamente.',
      })
      return false
    } finally {
      setProcessingId(null)
    }
  }

  const confirmPendingAction = async () => {
    if (!pendingAction) return

    const wasUpdated = await handleEstadoChange(pendingAction.idReserva, pendingAction.nuevoEstado)
    if (wasUpdated) {
      setPendingAction(null)
      setRejectReason('')
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

  const reservationSummary = useMemo(() => {
    return reservas.reduce(
      (acc, reserva) => {
        const estado = normalizeStatus(reserva.estado)
        const total = getReservaTotal(reserva)

        if (estado === 'pendiente') acc.pendientes += 1
        if (estado === 'confirmada') acc.confirmadas += 1
        if (estado === 'rechazada' || estado === 'cancelada') acc.finalizadas += 1
        if (estado === 'confirmada' || estado === 'pendiente') acc.totalEstimado += total

        return acc
      },
      { pendientes: 0, confirmadas: 0, finalizadas: 0, totalEstimado: 0 }
    )
  }, [reservas])

  const visibleReservas = useMemo(() => {
    return [...reservas]
      .filter(reserva => activeFilter === 'todas' || normalizeStatus(reserva.estado) === activeFilter)
      .sort((a, b) => {
        const aOrder = ESTADO_ORDER[normalizeStatus(a.estado)] || 99
        const bOrder = ESTADO_ORDER[normalizeStatus(b.estado)] || 99
        if (aOrder !== bOrder) return aOrder - bOrder
        return new Date(b.fecha_inicio || 0) - new Date(a.fecha_inicio || 0)
      })
  }, [activeFilter, reservas])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <LoadingState message="Cargando reservas..." className="min-h-screen" />
      </div>
    )
  }

  const isConfirmingAction = pendingAction?.nuevoEstado === 'confirmada'
  const isRejectingAction = pendingAction?.nuevoEstado === 'rechazada'
  const modalTitle = isConfirmingAction ? 'Confirmar reserva' : 'Rechazar reserva'
  const modalMessage = isConfirmingAction
    ? '¿Deseas confirmar esta reserva? El inquilino podrá continuar con el proceso correspondiente.'
    : '¿Deseas rechazar esta reserva? El inquilino no podrá continuar con esta solicitud.'
  const modalConfirmLabel = processingId
    ? isConfirmingAction
      ? 'Confirmando...'
      : 'Rechazando...'
    : isConfirmingAction
      ? 'Sí, confirmar'
      : 'Sí, rechazar'

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

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-none">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#5F5F5F]/65">
                  Pendientes
                </p>
                <p className="mt-1 font-poppins text-2xl font-semibold text-[#5F5F5F]">
                  {reservationSummary.pendientes}
                </p>
              </div>
              <Clock3 className="h-6 w-6 text-[#A67C52]" />
            </div>
          </Card>

          <Card className="rounded-xl border border-[#6B8E23]/15 bg-white p-4 shadow-none">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#5F5F5F]/65">
                  Confirmadas
                </p>
                <p className="mt-1 font-poppins text-2xl font-semibold text-[#5F5F5F]">
                  {reservationSummary.confirmadas}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-[#6B8E23]" />
            </div>
          </Card>

          <Card className="rounded-xl border border-[#5F5F5F]/10 bg-white p-4 shadow-none">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#5F5F5F]/65">
                  Rechazadas/Canceladas
                </p>
                <p className="mt-1 font-poppins text-2xl font-semibold text-[#5F5F5F]">
                  {reservationSummary.finalizadas}
                </p>
              </div>
              <XCircle className="h-6 w-6 text-[#A67C52]" />
            </div>
          </Card>

          <Card className="rounded-xl border border-[#6B8E23]/15 bg-[#F2E8CF] p-4 shadow-none">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#5F5F5F]/65">
                  Total estimado
                </p>
                <p className="mt-1 font-poppins text-xl font-semibold text-[#6B8E23]">
                  {formatPrice(reservationSummary.totalEstimado)}
                </p>
              </div>
              <CircleDollarSign className="h-6 w-6 text-[#6B8E23]" />
            </div>
          </Card>
        </div>

        {reservas.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-[#6B8E23]/10 bg-white p-2">
            {FILTERS.map(filter => {
              const isActive = activeFilter === filter.value

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#6B8E23] text-white'
                      : 'text-[#5F5F5F] hover:bg-[#F2E8CF]'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        )}

        {reservas.length === 0 ? (
          <EmptyState
            title="Aún no tienes reservas"
            message="No hay reservas registradas en tus propiedades por el momento."
          />
        ) : visibleReservas.length === 0 ? (
          <EmptyState
            title="Sin reservas en este filtro"
            message="Prueba con otro estado para revisar el resto de tus reservas recibidas."
          />
        ) : (
          <div className="space-y-4">
            {visibleReservas.map((reserva, index) => {
              const parsedReservaId = Number(reserva.id_reserva)
              const hasValidReservationId = Number.isInteger(parsedReservaId) && parsedReservaId > 0
              const nights = calculateNights(reserva.fecha_inicio, reserva.fecha_fin)
              const estado = normalizeStatus(reserva.estado)
              const styles = ESTADO_STYLES[estado] || ESTADO_STYLES.pendiente
              const inquilino = reserva.inquilino || {}
              const propiedad = reserva.propiedad || {}
              const tituloPropiedad =
                reserva.titulo_propiedad || propiedad.titulo || propiedad.descripcion || 'Propiedad'
              const imagenPrincipal =
                reserva.imagen_principal || propiedad.imagen_principal || PLACEHOLDER_PROPERTY_IMAGE
              const nombreInquilino = reserva.nombre_inquilino || inquilino.nombre || 'No disponible'
              const correoInquilino = reserva.correo_inquilino || inquilino.correo || 'No disponible'
              const telefonoInquilino = reserva.telefono_inquilino || inquilino.telefono || null
              const totalReserva = getReservaTotal(reserva)
              const estadoPago =
                reserva.estado_pago || reserva.estadoPago || reserva.pago_estado || reserva.payment_status

              return (
                <Card
                  key={hasValidReservationId ? `reserva-${parsedReservaId}` : `reserva-sin-id-${index}`}
                  className={`overflow-hidden rounded-xl border shadow-sm ${styles.card}`}
                >
                  <div className="grid grid-cols-1 gap-5 p-5 md:p-6 lg:grid-cols-[1.2fr_1fr_1fr]">
                    <div className="min-w-0">
                      <img
                        src={imagenPrincipal}
                        alt={tituloPropiedad}
                        className="h-36 w-full rounded-xl object-cover sm:h-40 lg:h-32"
                      />
                      <div className="mt-3">
                        <p className="text-xs font-medium text-[#5F5F5F]/70">Propiedad</p>
                        <h3 className="mt-1 line-clamp-2 font-poppins text-lg font-semibold text-[#5F5F5F]">
                          {tituloPropiedad}
                        </h3>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-3 rounded-xl bg-white/55 p-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#5F5F5F]/70">
                          <UserRound className="h-4 w-4 text-[#A67C52]" />
                          Inquilino
                        </div>
                        <p className="font-semibold text-[#5F5F5F]">{nombreInquilino}</p>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#5F5F5F]/70">
                          <Mail className="h-4 w-4 text-[#A67C52]" />
                          Correo
                        </div>
                        <p className="break-words text-sm text-[#5F5F5F]">{correoInquilino}</p>
                      </div>

                      {telefonoInquilino && (
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#5F5F5F]/70">
                            <Phone className="h-4 w-4 text-[#A67C52]" />
                            Teléfono
                          </div>
                          <p className="text-sm text-[#5F5F5F]">{telefonoInquilino}</p>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#5F5F5F]/70">
                            <Calendar className="h-4 w-4 text-[#A67C52]" />
                            Fechas
                          </div>
                          <p className="text-sm font-medium text-[#5F5F5F]">
                            {formatDate(reserva.fecha_inicio)} - {formatDate(reserva.fecha_fin)}
                          </p>
                          <p className="text-xs text-[#5F5F5F]/60">{nights} noche(s)</p>
                        </div>

                        <div>
                          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#5F5F5F]/70">
                            <CircleDollarSign className="h-4 w-4 text-[#A67C52]" />
                            Total
                          </div>
                          <p className="text-lg font-bold text-[#6B8E23]">
                            {formatPrice(totalReserva)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}
                        >
                          {styles.label || reserva.estado}
                        </span>
                        {estadoPago && (
                          <span className="inline-flex rounded-full border border-[#A67C52]/20 bg-white px-3 py-1 text-xs font-semibold text-[#5F5F5F]">
                            Pago: {estadoPago}
                          </span>
                        )}
                      </div>

                      <p className="rounded-lg bg-white/60 px-3 py-2 text-xs leading-5 text-[#5F5F5F]/70">
                        El contrato se generará después del flujo de pago.
                      </p>

                      {!hasValidReservationId && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                          Esta reserva no tiene id_reserva válido. No se pueden ejecutar acciones.
                        </div>
                      )}

                      {(estado === 'pendiente' || estado === 'confirmada') && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                          {estado === 'pendiente' && (
                            <>
                              <Button
                                onClick={() => openActionModal(reserva, 'confirmada')}
                                disabled={!hasValidReservationId || processingId === parsedReservaId}
                                className="h-10 min-w-0 rounded-xl bg-[#6B8E23] px-3 text-white shadow-none hover:bg-[#5a7a1e]"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Confirmar
                              </Button>
                              <Button
                                onClick={() => openActionModal(reserva, 'rechazada')}
                                disabled={!hasValidReservationId || processingId === parsedReservaId}
                                className="h-10 min-w-0 rounded-xl bg-red-600 px-3 text-white shadow-none hover:bg-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                                Rechazar
                              </Button>
                            </>
                          )}

                          {estado === 'confirmada' && (
                            <Button
                              onClick={() => handleEstadoChange(parsedReservaId, 'cancelada')}
                              disabled={!hasValidReservationId || processingId === parsedReservaId}
                              className="h-10 min-w-0 rounded-xl bg-[#A67C52] px-3 text-white shadow-none hover:bg-[#8f6844] xl:col-span-2"
                            >
                              <AlertCircle className="h-4 w-4" />
                              {processingId === parsedReservaId ? 'Procesando...' : 'Cancelar reserva'}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reservation-action-title"
        >
          <div className="w-full max-w-md rounded-xl border border-[#A67C52]/20 bg-[#F2E8CF] p-6 shadow-xl">
            <div className="mb-5">
              <h2
                id="reservation-action-title"
                className="font-poppins text-xl font-semibold text-[#5F5F5F]"
              >
                {modalTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5F5F5F]/80">{modalMessage}</p>
            </div>

            {isRejectingAction && (
              <div className="mb-5">
                <label
                  htmlFor="reject-reason"
                  className="text-sm font-medium text-[#5F5F5F]"
                >
                  Motivo del rechazo (opcional)
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={event => setRejectReason(event.target.value)}
                  disabled={Boolean(processingId)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-[#A67C52]/25 bg-white px-3 py-2 text-sm text-[#5F5F5F] outline-none transition focus:border-[#6B8E23] focus:ring-2 focus:ring-[#6B8E23]/20 disabled:opacity-70"
                  placeholder="Escribe un motivo breve si deseas conservarlo para seguimiento interno."
                />
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeActionModal}
                disabled={Boolean(processingId)}
                className="h-10 rounded-xl border-2 border-[#6B8E23] bg-white text-[#6B8E23] shadow-none hover:bg-[#FAFAFA] hover:text-[#5F5F5F]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={confirmPendingAction}
                disabled={Boolean(processingId)}
                className={`h-10 rounded-xl px-4 text-white shadow-none ${
                  isConfirmingAction
                    ? 'bg-[#6B8E23] hover:bg-[#5a7a1e]'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isConfirmingAction ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {modalConfirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

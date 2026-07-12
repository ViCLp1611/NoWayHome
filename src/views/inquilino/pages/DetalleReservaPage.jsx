import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { ActionMenu } from '@/app/components/ActionMenu'
import { Card } from '@/app/components/ui/card'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { PLACEHOLDER_PROPERTY_IMAGE } from '@/views/inquilino/constants.js'
import { formatDateShort } from '@/utils/dateUtils'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { BookingContract } from '../components/BookingContract'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID

const MOTIVOS_CANCELACION = [
  'Cambio de planes / Ya no realizaré el viaje',
  'Encontré un mejor alojamiento en la plataforma',
  'Error al seleccionar las fechas de reserva',
  'Emergencia personal / Motivos de salud',
  'Otro (Especificar)',
]

async function requestJson(path) {
  const res = await fetch(`${API_URL}${path}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'No se pudo cargar la reserva.')
  return data
}

const calculateNights = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function DetalleReservaPage() {
  const { idReserva } = useParams()
  const navigate = useNavigate()
  const [reserva, setReserva] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCanceling, setIsCanceling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('')
  const [motivoAbierto, setMotivoAbierto] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [view, setView] = useState('details') // 'details' o 'contract'
  const [imagenActual, setImagenActual] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!idReserva) {
      setError('ID de reserva no especificado')
      setLoading(false)
      return
    }

    const fetchReserva = async () => {
      try {
        setError('')
        const normalizedReservaId = decodeURIComponent(idReserva)
        // La consulta ahora pide al backend que popule las relaciones.
        const data = await requestJson(
          `/api/inquilino/reservas/${encodeURIComponent(
            normalizedReservaId
          )}?populate=propiedad,arrendatario,inquilino`
        )
        // El backend ahora devuelve un objeto 'reservation' con todos los datos ya anidados.
        const reservaCompleta = data.reservation || data.reserva || null
        if (!reservaCompleta) {
          throw new Error('La respuesta del servidor no contiene los datos de la reserva.')
        }
        setReserva(reservaCompleta)
      } catch (err) {
        setError(err.message || 'No se pudo cargar la reserva.')
      } finally {
        setLoading(false)
      }
    }

    fetchReserva()
  }, [idReserva])

  // --- Lógica de PayPal ---
  const createOrder = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payments/crear-orden`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: totalFinal.toString() }),
      })
      const order = await response.json()
      if (order.id) {
        return order.id
      }
      throw new Error(order.error || 'No se pudo obtener el ID de la orden de PayPal.')
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  const onApprove = async data => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/payments/capturar-orden`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderID: data.orderID,
          idReserva: reserva.id_reserva,
        }),
      })
      const result = await response.json()

      if (result.success) {
        // Actualizamos el estado local y cambiamos la vista al contrato
        setReserva(prev => ({
          ...prev,
          estado: 'CONFIRMADA',
          // Agregamos un objeto de pago simulado para que `isPaid` se vuelva `true`
          pagos: [
            ...(prev.pagos || []),
            { id_transaccion_paypal: data.orderID, monto: totalFinal },
          ],
          // Agregamos también un contrato simulado para que la UI se actualice al instante
          contrato: [
            ...(prev.contrato || []),
            {
              id_propiedad: prev.id_propiedad,
              id_inquilino: prev.id_inquilino,
              fecha_inicio: prev.fecha_inicio,
              fecha_contrato: new Date().toISOString().split('T')[0],
              estado: 'FIRMADO',
            },
          ],
        }))
        setShowPaymentModal(false)
        setView('contract')
      } else {
        throw new Error(result.error || 'El pago no se completó en el servidor.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!PAYPAL_CLIENT_ID) {
    return <div>Error: La clave de cliente de PayPal no está configurada.</div>
  }

  const handleCancelarReserva = async () => {
    // Usar el idReserva de los parámetros de la URL, que puede ser compuesto.
    if (!idReserva || !reserva?.id_inquilino) return

    setIsCanceling(true)
    setCancelError('')

    const motivoFinal =
      motivoSeleccionado === 'Otro (Especificar)' ? motivoAbierto.trim() : motivoSeleccionado

    try {
      const response = await fetch(
        `${API_URL}/api/inquilino/reservas/${encodeURIComponent(idReserva)}/cancel`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_inquilino: reserva.id_inquilino,
            motivo_cancelacion: motivoFinal,
          }),
        }
      )

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || 'No se pudo cancelar la reserva.')
      }

      // Se actualiza el estado local con los datos frescos de la reserva cancelada desde el servidor.
      // Esto asegura que el estado y cualquier otro campo relevante se reflejen correctamente.
      setReserva(prev => ({
        ...prev,
        ...result.reserva,
      }))
      setShowCancelConfirm(false)
      setMotivoSeleccionado('')
      setMotivoAbierto('')
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setIsCanceling(false)
    }
  }

  const handleDeleteReservation = async () => {
    if (!reserva?.id_reserva || !reserva?.id_inquilino) return

    setIsDeleting(true)
    setDeleteError('')

    try {
      const response = await fetch(`${API_URL}/api/inquilino/reservas/${reserva.id_reserva}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_inquilino: reserva.id_inquilino,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || 'No se pudo eliminar la reserva del historial.')
      }

      navigate('/inquilino/perfil')
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatPrice = price =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)

  const formatDate = value => formatDateShort(value)

  const estado = String(reserva?.estado || '').toUpperCase()
  const isPaid = reserva?.pagos && reserva.pagos.length > 0
  const hasContract = reserva?.contrato && reserva.contrato.length > 0

  // Una reserva se puede eliminar del historial si está CANCELADA o RECHAZADA.
  const canDeleteFromHistory = ['CANCELADA', 'RECHAZADA'].includes(estado)

  const getStatusInfo = status => {
    switch (status) {
      case 'CONFIRMADA':
        return {
          label: 'Confirmada',
          className: 'bg-[#6B8E23]/10 text-[#6B8E23] border-[#6B8E23]/20',
        }
      case 'PENDIENTE':
        return {
          label: 'Pendiente de Aprobación',
          className: 'bg-[#A67C52]/10 text-[#A67C52] border-[#A67C52]/20',
        }
      case 'CANCELADA':
        return {
          label: 'Cancelada',
          className: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
        }
      case 'RECHAZADA':
        return { label: 'Rechazada', className: 'bg-red-500/10 text-red-700 border-red-500/20' }
      default:
        return { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' }
    }
  }
  const statusInfo = getStatusInfo(estado)
  const badgeClass = `inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${statusInfo.className}`

  // Una reserva se puede cancelar si está PENDIENTE o CONFIRMADA.
  const canCancel = ['PENDIENTE', 'CONFIRMADA'].includes(estado)

  const isCancelDisabled =
    isCanceling ||
    !motivoSeleccionado ||
    (motivoSeleccionado === 'Otro (Especificar)' && !motivoAbierto.trim())

  const getText = value => (typeof value === 'string' ? value.trim() : '')
  const getTitleFromDescription = description =>
    getText(description)
      .split('\n')
      .map(part => part.trim())
      .find(Boolean) || ''

  // Acceso seguro a propiedades anidadas para evitar renderizar objetos JSON.
  const propertyTitle =
    reserva?.propiedad?.titulo ||
    reserva?.propiedad?.nombre ||
    getTitleFromDescription(reserva?.propiedad?.descripcion) ||
    reserva?.titulo_propiedad || // Fallback a campos en la raíz de la reserva
    'Alojamiento No Way Home'
  const propertyLocation =
    reserva?.propiedad?.direccion ||
    reserva?.propiedad?.ubicacion ||
    reserva?.propiedad?.ciudad ||
    reserva?.ubicacion_propiedad || // Fallback
    'Ubicación no disponible'
  const propertyImage =
    reserva?.propiedad?.imagen || // Clave de imagen corregida según diagnóstico
    reserva?.propiedad?.imagen_principal || // Fallback al campo original
    reserva?.imagen_principal || // Fallback en la raíz del objeto
    PLACEHOLDER_PROPERTY_IMAGE

  const imagenes = reserva?.propiedad?.imagenes || []
  const handlePrevImage = () => {
    setImagenActual(prev => (prev === 0 ? (imagenes.length || 1) - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setImagenActual(prev => (prev === (imagenes.length || 1) - 1 ? 0 : prev + 1))
  }

  const noches = calculateNights(reserva?.fecha_inicio, reserva?.fecha_fin)
  const precioPorNoche =
    reserva?.propiedad?.precio_noche ||
    reserva?.propiedad?.precio ||
    reserva?.precio_noche || // Fallback a la raíz
    reserva?.precio || // Fallback a la raíz
    0
  const precioBaseTotal = reserva?.precio_base ?? precioPorNoche * noches

  // --- NUEVA OPERACIÓN PARA COMISIÓN ---
  // Si la comisión viene del backend y es mayor a cero, la usamos.
  // Si no, la calculamos como el 10% del precio base.
  const comisionExistente =
    reserva?.comision_y_otros ?? reserva?.tarifa_servicio ?? reserva?.tarifa ?? 0
  const comisionYOtros = comisionExistente > 0 ? comisionExistente : precioBaseTotal * 0.1

  // El total es la suma del precio base y la comisión para que el recibo sea consistente.
  const totalCalculado = precioBaseTotal + comisionYOtros
  const totalFinal =
    totalCalculado > 0
      ? totalCalculado
      : reserva?.pago || reserva?.total_pagado || reserva?.total || 0

  const detailItems = [
    {
      icon: CalendarDays,
      label: 'Entrada',
      value: formatDate(reserva?.fecha_inicio),
    },
    {
      icon: CalendarDays,
      label: 'Salida',
      value: formatDate(reserva?.fecha_fin),
    },
    {
      icon: Users,
      label: 'Huéspedes',
      value: reserva?.huespedes ?? reserva?.huéspedes ?? 1,
    },
    {
      icon: ReceiptText,
      label: 'Reserva ID',
      value: reserva?.id_reserva || reserva?.id || '—',
    },
  ]

  if (loading) {
    return <LoadingState message="Cargando detalles de la reserva..." className="min-h-screen" />
  }

  return (
    <>
      <InquilinoNavbar />
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Card className="overflow-hidden rounded-[28px] border border-[#6B8E23]/10 bg-white shadow-[0_10px_30px_rgba(95,95,95,0.08)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#F2E8CF] px-5 py-4 sm:px-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (view === 'contract') setView('details')
                  else navigate('/inquilino/perfil')
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#5F5F5F] hover:bg-[#F2E8CF] hover:text-[#6B8E23]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="text-center">
                <p className="font-poppins text-sm font-semibold uppercase tracking-[0.2em] text-[#A67C52]">
                  Tu estadía
                </p>
                <h2 className="font-poppins text-lg font-semibold text-[#5F5F5F] sm:text-xl">
                  {view === 'contract' ? 'Contrato de Reserva' : 'Detalles de tu Solicitud'}
                </h2>
              </div>

              <div className="w-10">
                {canDeleteFromHistory && (
                  <ActionMenu
                    label="Opciones de reserva"
                    actions={[
                      {
                        label: 'Eliminar del historial',
                        variant: 'danger',
                        onClick: () => setShowDeleteConfirm(true),
                      },
                    ]}
                  />
                )}
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
              {view === 'contract' ? (
                <div className="lg:col-span-2">
                  <BookingContract reserva={reserva} />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-[24px] bg-[#F2E8CF]">
                      <img
                        src={
                          (imagenes.length > 0
                            ? imagenes[imagenActual]?.url || imagenes[imagenActual]?.imagen
                            : propertyImage) || PLACEHOLDER_PROPERTY_IMAGE
                        }
                        alt={propertyTitle}
                        className="h-56 w-full object-cover transition-transform duration-500 ease-in-out sm:h-64"
                      />
                      {imagenes.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 text-[#5F5F5F] shadow-md transition hover:bg-white"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 text-[#5F5F5F] shadow-md transition hover:bg-white"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </Button>
                          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 p-1.5 backdrop-blur-sm">
                            {imagenes.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setImagenActual(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  idx === imagenActual ? 'w-5 bg-[#6B8E23]' : 'w-2 bg-white/70'
                                }`}
                                aria-label={`Ver imagen ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="rounded-[24px] border border-[#F2E8CF] bg-[#FAFAFA] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-poppins text-xl font-semibold text-[#5F5F5F]">
                            {propertyTitle}
                          </h3>
                          <p className="mt-2 flex items-center gap-2 text-sm text-[#5F5F5F]/80">
                            <MapPin className="h-4 w-4 text-[#A67C52]" />
                            {propertyLocation || 'Ubicación no disponible'}
                          </p>
                        </div>
                        <span className={badgeClass}>{statusInfo.label}</span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {detailItems.map(item => {
                          const Icon = item.icon
                          return (
                            <div key={item.label} className="rounded-2xl bg-white p-3 shadow-sm">
                              <div className="flex items-center gap-2 text-[#A67C52]">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{item.label}</span>
                              </div>
                              <p className="mt-2 text-sm text-[#5F5F5F]">{item.value}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[24px] bg-[#F2E8CF] p-5">
                      <div className="flex items-center gap-2 text-[#A67C52]">
                        <ReceiptText className="h-5 w-5" />
                        <h3 className="font-poppins text-lg font-semibold text-[#5F5F5F]">
                          Resumen de pago
                        </h3>
                      </div>

                      <div className="mt-4 space-y-3 text-sm text-[#5F5F5F]">
                        <div className="flex justify-between items-center">
                          <span className="text-[#5F5F5F]/80">
                            {formatPrice(precioPorNoche)} x {noches}{' '}
                            {noches === 1 ? 'noche' : 'noches'}
                          </span>
                          <span className="font-medium">{formatPrice(precioBaseTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#5F5F5F]/80">Comisión y otros</span>
                          <span className="font-medium">{formatPrice(comisionYOtros)}</span>
                        </div>

                        <div className="border-t border-[#A67C52]/20 my-2"></div>

                        <div className="flex justify-between items-center text-base">
                          <span className="font-semibold">Total pagado</span>
                          <span className="font-semibold text-[#6B8E23]">
                            {formatPrice(totalFinal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* --- SECCIÓN DE ACCIONES DINÁMICAS --- */}
                    {estado === 'PENDIENTE' && (
                      <div className="rounded-[24px] border border-yellow-500/20 bg-yellow-50/50 p-5 text-center">
                        <Clock className="mx-auto h-12 w-12 text-yellow-500" />
                        <h3 className="mt-4 font-poppins text-lg font-semibold text-yellow-800">
                          Pendiente de Aprobación
                        </h3>
                        <p className="mt-2 text-sm text-yellow-700/80">
                          Tu solicitud ha sido enviada al anfitrión. Recibirás una notificación
                          cuando tu reserva sea aceptada.
                        </p>
                      </div>
                    )}

                    {estado === 'CONFIRMADA' && !isPaid && (
                      <div className="rounded-[24px] border border-green-500/20 bg-green-50/50 p-5 text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h3 className="mt-4 font-poppins text-lg font-semibold text-green-800">
                          ¡Tu reserva fue aprobada!
                        </h3>
                        <p className="mt-2 text-sm text-green-700/80">
                          El anfitrión ha confirmado tu solicitud. Completa el pago para finalizar
                          tu reserva.
                        </p>
                        <Button
                          className="mt-4 w-full bg-[#6B8E23] hover:bg-[#5a7a1e] text-white"
                          onClick={() => setShowPaymentModal(true)}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pagar y Finalizar Reserva
                        </Button>
                      </div>
                    )}

                    {estado === 'RECHAZADA' && (
                      <div className="rounded-[24px] border border-red-500/20 bg-red-50/50 p-5">
                        <XCircle className="mx-auto h-12 w-12 text-red-500" />
                        <h3 className="mt-4 font-poppins text-lg font-semibold text-red-800">
                          Solicitud Rechazada
                        </h3>
                        <p className="mt-2 text-sm text-red-700/80">
                          <strong>Motivo del anfitrión:</strong>{' '}
                          {reserva.motivo_rechazo || 'No se especificó un motivo.'}
                        </p>
                      </div>
                    )}

                    {estado === 'CONFIRMADA' && isPaid && (
                      <div className="rounded-[24px] border border-green-500/20 bg-green-50/50 p-5">
                        <h3 className="font-poppins text-lg font-semibold text-green-800">
                          ¡Todo listo para tu viaje!
                        </h3>
                        <p className="mt-2 text-sm text-green-700/80">
                          Tu reserva está confirmada y el pago ha sido procesado. Puedes ver y
                          descargar tu contrato.
                        </p>
                        {hasContract && (
                          <Button
                            variant="outline"
                            className="mt-4 w-full bg-white border-green-600 text-green-700 hover:bg-green-50"
                            onClick={() => setView('contract')}
                          >
                            Ver Contrato de Reserva
                          </Button>
                        )}
                      </div>
                    )}

                    {canCancel && (
                      <div className="rounded-[24px] border border-red-500/20 bg-red-50/50 p-5">
                        <h3 className="font-poppins text-lg font-semibold text-red-800">
                          ¿Necesitas cancelar?
                        </h3>
                        <p className="mt-2 text-sm text-red-700/80">
                          Puedes cancelar tu reserva si tus planes han cambiado. Ten en cuenta las
                          políticas de cancelación.
                        </p>
                        <Button
                          variant="destructive"
                          className="mt-4 w-full bg-red-600 text-white hover:bg-red-700"
                          onClick={() => {
                            setCancelError('')
                            setMotivoSeleccionado('')
                            setMotivoAbierto('')
                            setShowCancelConfirm(true)
                          }}
                        >
                          Cancelar Reserva
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* MODAL DE CANCELACIÓN */}
          {showCancelConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md p-6">
                <h3 className="font-poppins text-lg font-semibold text-[#5F5F5F]">
                  Confirmar Cancelación
                </h3>
                <p className="mt-2 text-sm text-[#5F5F5F]/80">
                  ¿Estás seguro de que quieres cancelar esta reserva?
                </p>
                <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                  <strong>Importante:</strong> La cancelación no implica un reembolso automático.
                </div>
                <div className="mt-4 space-y-2">
                  <label
                    htmlFor="motivo-cancelacion"
                    className="text-sm font-medium text-[#5F5F5F]"
                  >
                    Motivo de cancelación *
                  </label>
                  <select
                    id="motivo-cancelacion"
                    value={motivoSeleccionado}
                    onChange={e => setMotivoSeleccionado(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-[#6B8E23]/20 bg-white px-3 py-2 text-sm text-[#5F5F5F] ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6B8E23]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>
                      -- Selecciona un motivo --
                    </option>
                    {MOTIVOS_CANCELACION.map(motivo => (
                      <option key={motivo} value={motivo}>
                        {motivo}
                      </option>
                    ))}
                  </select>
                  {motivoSeleccionado === 'Otro (Especificar)' && (
                    <textarea
                      value={motivoAbierto}
                      onChange={e => setMotivoAbierto(e.target.value)}
                      placeholder="Por favor, especifica el motivo de tu cancelación..."
                      className="mt-2 min-h-[80px] w-full rounded-md border border-[#6B8E23]/20 bg-white p-2 text-sm text-[#5F5F5F] focus:border-[#6B8E23] focus:ring-2 focus:ring-[#6B8E23]/50"
                    />
                  )}
                </div>
                {cancelError && <div className="mt-4 text-sm text-red-600">{cancelError}</div>}
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={isCanceling}
                  >
                    Volver
                  </Button>
                  <Button
                    variant="destructive"
                    className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    onClick={handleCancelarReserva}
                    disabled={isCancelDisabled}
                  >
                    {isCanceling ? 'Cancelando...' : 'Sí, cancelar'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* MODAL DE ELIMINACIÓN */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md p-6">
                <h3 className="font-poppins text-lg font-semibold text-[#5F5F5F]">
                  Eliminar del Historial
                </h3>
                <p className="mt-2 text-sm text-[#5F5F5F]/80">
                  ¿Estás seguro de que quieres eliminar esta reserva de tu historial? Esta acción no
                  se puede deshacer.
                </p>
                {deleteError && <div className="mt-4 text-sm text-red-600">{deleteError}</div>}
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    onClick={handleDeleteReservation}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* MODAL DE PAGO CON PAYPAL */}
          {showPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <Card className="w-full max-w-md p-6 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={loading}
                >
                  <XCircle />
                </Button>
                <h3 className="font-poppins text-xl font-semibold text-[#5F5F5F] mb-4">
                  Completa tu pago
                </h3>
                <PayPalScriptProvider options={{ 'client-id': PAYPAL_CLIENT_ID, currency: 'MXN' }}>
                  <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    forceReRender={[totalFinal]}
                  />
                </PayPalScriptProvider>
              </Card>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin, ReceiptText, Users } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { PLACEHOLDER_PROPERTY_IMAGE } from '@/views/inquilino/constants.js'
import { formatDateShort } from '@/utils/dateUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function requestJson(path) {
  const res = await fetch(`${API_URL}${path}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'No se pudo cargar la reserva.')
  return data
}

const MOTIVOS_CANCELACION = [
  'Cambio de planes / Ya no realizaré el viaje',
  'Encontré un mejor alojamiento en la plataforma',
  'Error al seleccionar las fechas de reserva',
  'Emergencia personal / Motivos de salud',
  'Otro (Especificar)',
]

export default function DetalleReservaPage() {
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
        const data = await requestJson(
          `/api/inquilino/reservas/${encodeURIComponent(normalizedReservaId)}`
        )
        const r = data.reservation || data.reserva || data || null
        setReserva(r)
      } catch (err) {
        setError(err.message || 'No se pudo cargar la reserva.')
      } finally {
        setLoading(false)
      }
    }

    fetchReserva()
  }, [idReserva])

  const handleCancelarReserva = async () => {
    if (!reserva?.id_reserva || !reserva?.id_inquilino) return

    setIsCanceling(true)
    setCancelError('')

    const motivoFinal =
      motivoSeleccionado === 'Otro (Especificar)' ? motivoAbierto.trim() : motivoSeleccionado

    try {
      const response = await fetch(
        `${API_URL}/api/inquilino/reservas/${encodeURIComponent(reserva.id_reserva)}/cancel`,
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

      setReserva(prev => ({
        ...prev,
        estado: 'cancelada',
        estado_reserva: 'cancelada',
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

  const formatPrice = price =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)

  const formatDate = value => formatDateShort(value)

  const estado = String(reserva?.estado_reserva || reserva?.estado || '').toLowerCase()
  let estadoNormalizado = estado
  if (estado === 'confirmed') estadoNormalizado = 'confirmada'
  if (estado === 'pending') estadoNormalizado = 'pendiente'
  if (estado === 'cancelled') estadoNormalizado = 'cancelada'

  const badgeClass =
    estadoNormalizado === 'cancelada'
      ? 'inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-700'
      : estadoNormalizado === 'confirmada'
        ? 'inline-flex items-center rounded-full border border-[#6B8E23]/20 bg-[#6B8E23]/10 px-3 py-1 text-sm font-medium text-[#6B8E23]'
        : 'inline-flex items-center rounded-full border border-[#A67C52]/20 bg-[#A67C52]/10 px-3 py-1 text-sm font-medium text-[#A67C52]'

  const canCancel = estadoNormalizado === 'pendiente' || estadoNormalizado === 'confirmada'
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

  const propertyTitle =
    reserva?.titulo_propiedad ||
    reserva?.titulo ||
    reserva?.propiedad?.titulo ||
    reserva?.propiedad?.title ||
    reserva?.propiedad?.nombre ||
    reserva?.nombre_propiedad ||
    reserva?.title ||
    getTitleFromDescription(reserva?.propiedad?.descripcion) ||
    'Alojamiento No Way Home'
  const propertyLocation =
    reserva?.ubicacion ||
    reserva?.ubicacion_propiedad ||
    reserva?.direccion ||
    reserva?.propiedad?.direccion ||
    reserva?.propiedad?.ubicacion ||
    reserva?.propiedad?.ciudad ||
    'Ubicación no disponible'
  const propertyImage =
    reserva?.imagen_portada ||
    reserva?.imagen_principal ||
    reserva?.propiedad?.imagen_principal ||
    reserva?.propiedad?.imagen ||
    PLACEHOLDER_PROPERTY_IMAGE

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="rounded-2xl border border-[#6B8E23]/10 bg-white px-6 py-4 text-[#5F5F5F] shadow-sm">
          Cargando detalles de la reserva...
        </div>
      </div>
    )
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
                onClick={() => navigate('/inquilino/perfil')}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#5F5F5F] hover:bg-[#F2E8CF] hover:text-[#6B8E23]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="text-center">
                <p className="font-poppins text-sm font-semibold uppercase tracking-[0.2em] text-[#A67C52]">
                  Tu estadía
                </p>
                <h2 className="font-poppins text-lg font-semibold text-[#5F5F5F] sm:text-xl">
                  Confirmación de reserva
                </h2>
              </div>

              <div className="w-10" />
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[24px] bg-[#F2E8CF]">
                  <img
                    src={propertyImage}
                    alt={propertyTitle}
                    className="h-56 w-full object-cover sm:h-64"
                  />
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
                    <span className={badgeClass}>
                      {estadoNormalizado.charAt(0).toUpperCase() + estadoNormalizado.slice(1)}
                    </span>
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
                    <div className="flex items-center justify-between">
                      <span>Precio base</span>
                      <span>
                        {formatPrice(
                          reserva?.precio_base ?? (reserva?.precio || reserva?.precio_noche || 0)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Comisión / Otros</span>
                      <span>
                        {formatPrice(
                          reserva?.comision_y_otros ??
                            reserva?.tarifa_servicio ??
                            reserva?.tarifa ??
                            0
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#A67C52]/20 pt-3">
                      <span className="font-semibold text-[#5F5F5F]">Total pagado</span>
                      <span className="font-semibold text-[#5F5F5F]">
                        {formatPrice(
                          reserva?.total_pagado ??
                            reserva?.precio_total ??
                            reserva?.pago ??
                            reserva?.total
                        )}
                      </span>
                    </div>
                  </div>
                </div>

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
                        <strong>Importante:</strong> La cancelación no implica un reembolso
                        automático.
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
                      {cancelError && (
                        <div className="mt-4 text-sm text-red-600">{cancelError}</div>
                      )}
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

                <div className="rounded-[24px] border border-[#6B8E23]/10 bg-[#FAFAFA] p-5">
                  <h3 className="font-poppins text-lg font-semibold text-[#5F5F5F]">
                    Detalles de la estancia
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#5F5F5F]/80">
                    Tu reserva está lista para disfrutar. Revisa las fechas, huéspedes y el resumen
                    de pago para tener todo listo antes de llegar.
                  </p>
                  <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-[#5F5F5F] shadow-sm">
                    <p className="font-medium">Próximo paso</p>
                    <p className="mt-1">
                      Guarda este comprobante y confirma los datos con el anfitrión si necesitas
                      ajustar algún detalle.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

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

import React from 'react'
import { Calendar, CreditCard, FileText, Home, User, UserRound } from 'lucide-react'

const CONFIRMED_PAYMENT_STATUSES = [
  'COMPLETADO',
  'COMPLETED',
  'CONFIRMADO',
  'CONFIRMED',
  'PAGADO',
  'PAID',
]

const formatDate = value => {
  if (!value) return 'No disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No disponible'
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatPrice = value =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Number(value) || 0
  )

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border border-[#6B8E23]/15 bg-[#FAFAFA] p-4">
      <h3 className="mb-3 flex items-center font-semibold text-[#6B8E23]">
        <Icon className="mr-2 h-5 w-5" />
        {title}
      </h3>
      <div className="space-y-2 text-sm text-[#5F5F5F]">{children}</div>
    </section>
  )
}

export function BookingContract({ reserva }) {
  const reservationStatus = String(reserva?.estado || '').toUpperCase()
  const payments = Array.isArray(reserva?.pagos) ? reserva.pagos : []
  const directPaymentStatus = String(
    reserva?.estado_pago || reserva?.pago?.estado_pago || ''
  ).toUpperCase()
  const confirmedPayment = payments.find(payment =>
    CONFIRMED_PAYMENT_STATUSES.includes(String(payment?.estado_pago || '').toUpperCase())
  )
  const paymentStatus = confirmedPayment?.estado_pago || directPaymentStatus
  const canShowReceipt =
    ['CONFIRMADA', 'CONFIRMED'].includes(reservationStatus) &&
    (Boolean(confirmedPayment) || CONFIRMED_PAYMENT_STATUSES.includes(directPaymentStatus))

  if (!canShowReceipt) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-lg sm:p-8">
        <p className="text-[#5F5F5F]">
          El contrato estará disponible cuando la reserva y el pago estén confirmados.
        </p>
      </div>
    )
  }

  const property = reserva?.propiedad || {}
  const tenant = reserva?.inquilino || {}
  const landlord = property?.arrendatario || reserva?.arrendatario || {}
  const total =
    confirmedPayment?.monto ??
    reserva?.total_pagado ??
    reserva?.total ??
    (typeof reserva?.pago === 'number' ? reserva.pago : 0)
  const paymentDate =
    confirmedPayment?.fecha_pago ||
    confirmedPayment?.created_at ||
    confirmedPayment?.fecha_creacion ||
    reserva?.fecha_pago

  return (
    <article className="printable-area rounded-2xl bg-white p-6 shadow-lg sm:p-8">
      <header className="mb-8 border-b border-[#A67C52]/25 pb-5">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#A67C52]">
          Evidencia de reservación
        </p>
        <h2 className="font-poppins text-2xl font-bold text-[#5F5F5F]">
          Constancia de reserva NoWayHome
        </h2>
        <p className="mt-2 text-sm text-[#5F5F5F]/70">
          Folio: {reserva?.id_reserva || reserva?.id || 'No disponible'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section icon={FileText} title="Datos de la reserva">
          <p><strong>Estado:</strong> Confirmada</p>
          <p><strong>Fecha de emisión:</strong> {formatDate(new Date().toISOString())}</p>
        </Section>

        <Section icon={Home} title="Datos de la propiedad">
          <p><strong>Propiedad:</strong> {property?.titulo || reserva?.titulo_propiedad || 'No disponible'}</p>
          <p><strong>Ubicación:</strong> {property?.direccion || property?.ubicacion || property?.ciudad || 'No disponible'}</p>
        </Section>

        <Section icon={User} title="Datos del inquilino">
          <p><strong>Nombre:</strong> {tenant?.nombre || 'No disponible'}</p>
          <p><strong>Correo:</strong> {tenant?.correo || 'No disponible'}</p>
        </Section>

        <Section icon={UserRound} title="Datos del arrendatario">
          <p><strong>Nombre:</strong> {landlord?.nombre || 'No disponible'}</p>
          <p><strong>Correo:</strong> {landlord?.correo || 'No disponible'}</p>
        </Section>

        <Section icon={Calendar} title="Fechas de estancia">
          <p><strong>Entrada:</strong> {formatDate(reserva?.fecha_inicio)}</p>
          <p><strong>Salida:</strong> {formatDate(reserva?.fecha_fin)}</p>
        </Section>

        <Section icon={CreditCard} title="Pago confirmado">
          <p><strong>Total:</strong> {formatPrice(total)}</p>
          <p><strong>Estado:</strong> {paymentStatus || 'Completado'}</p>
          <p><strong>Fecha de pago:</strong> {formatDate(paymentDate)}</p>
        </Section>
      </div>

      <div className="mt-6 rounded-xl border-l-4 border-[#A67C52] bg-[#F2E8CF]/60 p-4 text-sm leading-6 text-[#5F5F5F]">
        Este documento fue generado automáticamente por NoWayHome como evidencia de una reserva
        confirmada y pagada.
      </div>
      <p className="mt-4 text-center text-sm text-[#5F5F5F]/70">
        Se enviará una copia por correo al inquilino y al arrendatario.
      </p>
    </article>
  )
}

import { useEffect, useId, useState } from 'react'
import { Button } from '@/app/components/ui/button'

const CANCELLATION_REASONS = [
  'Cambio de planes',
  'Problema con las fechas',
  'Problema con la propiedad',
  'Solicitud del inquilino',
  'Solicitud del arrendatario',
  'Problema con el pago',
  'Emergencia o imprevisto',
  'Otro motivo',
]

export function CancelBookingModal({ open, onClose, onConfirm, isLoading = false, error = '' }) {
  const [reason, setReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const titleId = useId()
  const reasonId = useId()
  const otherReasonId = useId()

  useEffect(() => {
    if (open) {
      setReason('')
      setOtherReason('')
    }
  }, [open])

  if (!open) return null

  const finalReason = reason === 'Otro motivo' ? otherReason.trim() : reason

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="w-full max-w-md rounded-xl border border-border bg-secondary p-6 text-foreground shadow-xl">
        <h2 id={titleId}>Cancelar reserva</h2>
        <p className="mt-2 text-sm leading-6">¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.</p>
        <div className="mt-5">
          <label htmlFor={reasonId} className="text-sm font-medium">Motivo de cancelación *</label>
          <select id={reasonId} value={reason} onChange={event => { setReason(event.target.value); if (event.target.value !== 'Otro motivo') setOtherReason('') }} disabled={isLoading} required className="mt-2 h-10 w-full rounded-lg border border-control-border bg-white px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring disabled:opacity-70">
            <option value="">Selecciona un motivo</option>
            {CANCELLATION_REASONS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        {reason === 'Otro motivo' && (
          <div className="mt-4">
            <label htmlFor={otherReasonId} className="text-sm font-medium">Describe el motivo *</label>
            <textarea id={otherReasonId} value={otherReason} onChange={event => setOtherReason(event.target.value)} disabled={isLoading} required rows={4} placeholder="Escribe el motivo de la cancelación" className="mt-2 w-full resize-none rounded-lg border border-control-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring disabled:opacity-70" />
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-10 rounded-xl border-2 border-primary-ink bg-transparent text-primary-ink shadow-none hover:bg-white/60 hover:text-foreground">Volver</Button>
          <Button type="button" onClick={() => onConfirm(finalReason)} disabled={!finalReason || isLoading} className="h-10 rounded-xl bg-red-600 px-4 text-white shadow-none hover:bg-red-700 disabled:opacity-50">{isLoading ? 'Cancelando...' : 'Sí, cancelar reserva'}</Button>
        </div>
      </div>
    </div>
  )
}

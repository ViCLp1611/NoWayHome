import React, { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/app/components/ui/dialog'
import { AlertCircle } from 'lucide-react'

export function RejectReasonModal({ open, onClose, onConfirm, isLoading }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Por favor, escribe un motivo para el rechazo.')
      return
    }
    setError('')
    onConfirm(reason)
  }

  const handleClose = () => {
    if (isLoading) return
    setReason('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Motivo del Rechazo</DialogTitle>
          <DialogDescription>
            Explica al inquilino por qué no puedes aceptar su solicitud de reserva. Este motivo será
            visible para él.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Ej: Las fechas seleccionadas no están disponibles por mantenimiento..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="min-h-[100px]"
            disabled={isLoading}
          />
          {error && (
            <p className="text-sm text-red-600 mt-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? 'Rechazando...' : 'Confirmar Rechazo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

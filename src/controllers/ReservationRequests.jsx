import React, { useState, useEffect } from 'react'
import { landlordBookingController } from '@/controllers/landlordBookingController'

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { useToast } from '@/app/components/ui/toast'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { ConfirmActionModal } from '@/views/admin/components/ConfirmActionModal' // Reutilizando el modal de admin
import { RejectReasonModal } from './RejectReasonModal'

// Iconos
import { Check, X, User, Calendar, DollarSign, Inbox } from 'lucide-react'

// Simulación de un hook de autenticación para obtener el arrendatario logueado
const useAuth = () => ({
  user: JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user')),
})

export function ReservationRequests() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionState, setActionState] = useState({
    isActing: false,
    reservationId: null,
    actionType: null, // 'approve' or 'reject'
  })

  // Estado para los modales
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.id_arrendatario) {
        setError(
          'No se pudo identificar al arrendatario. Asegúrate de haber iniciado sesión como anfitrión.'
        )
        setIsLoading(false)
        return
      }

      try {
        const response = await landlordBookingController.getReservations(user.id_arrendatario)
        const pending = (response.reservations || []).filter(
          res => res.estado === 'pendiente_aprobacion'
        )
        setRequests(pending)
      } catch (err) {
        setError(err.message || 'No se pudieron cargar las solicitudes.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRequests()
  }, [user])

  const handleApproveClick = reservationId => {
    setActionState({ isActing: false, reservationId, actionType: 'approve' })
    setApproveModalOpen(true)
  }

  const handleRejectClick = reservationId => {
    setActionState({ isActing: false, reservationId, actionType: 'reject' })
    setRejectModalOpen(true)
  }

  const executeApprove = async () => {
    if (actionState.actionType !== 'approve' || !actionState.reservationId) return

    setActionState(prev => ({ ...prev, isActing: true }))
    try {
      await landlordBookingController.approveReservation(
        actionState.reservationId,
        user.id_arrendatario
      )

      setRequests(prev => prev.filter(req => req.id_reserva !== actionState.reservationId))
      toast({
        title: 'Solicitud Aprobada',
        description: 'El inquilino ha sido notificado para proceder con el pago.',
        className: 'bg-green-100 border-green-300 text-green-800',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setActionState({ isActing: false, reservationId: null, actionType: null })
      setApproveModalOpen(false)
    }
  }

  const executeReject = async reason => {
    if (actionState.actionType !== 'reject' || !actionState.reservationId) return

    setActionState(prev => ({ ...prev, isActing: true }))
    try {
      await landlordBookingController.rejectReservation(
        actionState.reservationId,
        user.id_arrendatario,
        reason
      )

      setRequests(prev => prev.filter(req => req.id_reserva !== actionState.reservationId))
      toast({
        title: 'Solicitud Rechazada',
        description: 'La reserva ha sido rechazada y el inquilino notificado.',
        variant: 'destructive',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setActionState({ isActing: false, reservationId: null, actionType: null })
      setRejectModalOpen(false)
    }
  }

  if (isLoading) {
    return <LoadingState message="Cargando solicitudes de reserva..." />
  }

  if (error) {
    return <AlertMessage type="error" title="Error" message={error} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Inbox className="mr-2 h-6 w-6 text-[#A67C52]" />
          Solicitudes de Reserva Pendientes
        </CardTitle>
        <CardDescription>
          Tienes {requests.length} solicitud(es) esperando tu aprobación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No tienes solicitudes de reserva pendientes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div
                key={req.id_reserva}
                className="border p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex-grow space-y-2">
                  <h4 className="font-semibold">
                    {req.propiedad?.titulo || `Propiedad #${req.id_propiedad}`}
                  </h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />{' '}
                      {req.inquilino?.nombre || `Inquilino #${req.id_inquilino}`}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />{' '}
                      {new Date(req.fecha_inicio).toLocaleDateString()} -{' '}
                      {new Date(req.fecha_fin).toLocaleDateString()}
                    </span>
                    <span className="flex items-center font-medium">
                      <DollarSign className="h-4 w-4 mr-1" /> ${req.pago.toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 w-full md:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 w-1/2 md:w-auto"
                    onClick={() => handleRejectClick(req.id_reserva)}
                  >
                    <X className="h-4 w-4 mr-1" /> Rechazar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#6B8E23] hover:bg-[#5a7a1e] text-white w-1/2 md:w-auto"
                    onClick={() => handleApproveClick(req.id_reserva)}
                  >
                    <Check className="h-4 w-4 mr-1" /> Aceptar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modales de Confirmación */}
      <ConfirmActionModal
        open={approveModalOpen}
        title="Confirmar Aprobación"
        description="¿Estás seguro de que quieres aprobar esta solicitud de reserva? El inquilino será notificado para que proceda con el pago."
        confirmLabel={actionState.isActing ? 'Aprobando...' : 'Sí, aprobar'}
        onConfirm={executeApprove}
        onCancel={() => setApproveModalOpen(false)}
        disableConfirm={actionState.isActing}
        disableCancel={actionState.isActing}
        confirmVariant="adminPrimary"
      />

      <RejectReasonModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={executeReject}
        isLoading={actionState.isActing}
      />
    </Card>
  )
}

import React from 'react'
import { Button } from '@/app/components/ui/button'
import { Printer, User, Home, Calendar, Hash, FileText } from 'lucide-react'

export function BookingContract({ reserva, onBack }) {
  const handlePrint = () => {
    window.print()
  }

  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = price =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg printable-area">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="font-poppins text-2xl font-bold text-[#5F5F5F]">Contrato de Reserva</h2>
          <p className="text-sm text-[#A67C52]">ID de Reserva: {reserva?.id_reserva || 'N/A'}</p>
        </div>
        <div className="print-hide">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Detalles de la Propiedad */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-[#6B8E23] flex items-center">
            <Home className="h-5 w-5 mr-2" />
            Propiedad Reservada
          </h3>
          <p>
            <strong>Propiedad:</strong> {reserva?.propiedad?.titulo || 'No disponible'}
          </p>
          <p>
            <strong>Ubicación:</strong> {reserva?.propiedad?.direccion || 'No disponible'}
          </p>
          <p>
            <strong>Anfitrión:</strong>{' '}
            {reserva?.propiedad?.arrendatario?.nombre || 'No disponible'}
          </p>
        </div>

        {/* Detalles del Inquilino */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-[#6B8E23] flex items-center">
            <User className="h-5 w-5 mr-2" />
            Información del Inquilino
          </h3>
          <p>
            <strong>Nombre:</strong> {reserva?.inquilino?.nombre || 'No disponible'}
          </p>
          <p>
            <strong>Correo:</strong> {reserva?.inquilino?.correo || 'No disponible'}
          </p>
        </div>
      </div>

      {/* Detalles de la Reserva */}
      <div className="mt-8 space-y-4">
        <h3 className="font-semibold text-lg text-[#6B8E23] flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Detalles de la Estancia
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border p-4 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha de Entrada</p>
            <p className="font-semibold">{formatDate(reserva?.fecha_inicio)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha de Salida</p>
            <p className="font-semibold">{formatDate(reserva?.fecha_fin)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Pagado</p>
            <p className="font-semibold">{formatPrice(reserva?.pago)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Estado</p>
            <p className="font-semibold text-green-600">Confirmada</p>
          </div>
        </div>
      </div>

      {/* Términos y Condiciones */}
      <div className="mt-8">
        <h3 className="font-semibold text-lg text-[#6B8E23] flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Términos y Condiciones
        </h3>
        <div className="prose prose-sm max-w-none mt-4 text-gray-600 border-t pt-4">
          <p>
            Este documento confirma la reserva de la propiedad mencionada para las fechas
            especificadas. El pago ha sido procesado y la reserva está confirmada.
          </p>
          <p>
            El inquilino se compromete a seguir las normas de la propiedad establecidas por el
            anfitrión. La cancelación de esta reserva está sujeta a las políticas de cancelación
            visibles en el perfil de la propiedad.
          </p>
          <p className="font-semibold">NoWayHome S.A. de C.V. - {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}

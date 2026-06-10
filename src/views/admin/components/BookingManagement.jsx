// ================= IMPORTACIONES =================
import React, { useEffect, useMemo, useState } from 'react';

// Componentes UI reutilizables los sacamos desde la carpeta app/components/ui
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { ActionMenu } from '@/app/components/ActionMenu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

// Iconos para los estados y acciones 
import {
  Search,
  Filter,
  CheckCircle,
  Calendar,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

// Cliente de Supabase para poder interactuar con la base de datos  
import { supabase } from '@/lib/supabaseClient';

// Modal de confirmación para las acciones (confirmar, cancelar, rechazar, finalizar, eliminar)
import { ConfirmActionModal } from './ConfirmActionModal';

// Utilidad para registrar actividad del admin (logs) por si queremos mostrar un historial de acciones realizadas en el futuro
import { recordAdminActivity } from '@/views/admin/utils/adminActivity';

// ================= COMPONENTE PRINCIPAL =================
export function BookingManagement({ onNavigate }) {

  // Estados finales (no se pueden modificar después)para que las reservas ya no cambien de estado si ya están canceladas, rechazadas o finalizadas.
  const FINAL_STATUSES = ['cancelada', 'rechazada', 'finalizada'];

    // ================= ESTADOS =================
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Control de confirmación para los estados
  const [confirmAction, setConfirmAction] = useState({ open: false, bookingId: '', actionId: '' });
  const [isApplyingAction, setIsApplyingAction] = useState(false);

  // Obtiene reservas y relaciones (propiedad/inquilino) para mostrar datos completos.
  const loadBookings = async () => {
    setLoading(true);
    setErrorMessage('');
    setActionMessage({ type: '', text: '' });

    try {
      const { data, error } = await supabase
        .from('reserva')
        .select('id_propiedad,id_inquilino,fecha_inicio,fecha_fin,estado,pago,propiedad:propiedad(descripcion,id_arrendatario,arrendatario:arrendatario(nombre)),inquilino:inquilino(nombre)');

      if (error) {
        setErrorMessage(`No se pudieron cargar las reservas. ${error.message}`);
        setBookings([]);
        return;
      }

      // Normalización de datos porque la tabla reserva tiene claves compuestas y necesitamos una clave única para cada fila, además de extraer datos relacionados para mostrar información completa en la tabla.
      const normalized = (data || []).map((item) => ({
        key: `${item.id_propiedad}-${item.id_inquilino}-${item.fecha_inicio}`,
        id_propiedad: item.id_propiedad,
        id_inquilino: item.id_inquilino,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        estado: item.estado || 'pendiente',
        pago: Number(item.pago || 0),


        // Datos derivados para mostrar en la tabla, con mensaje de error por si no hay datos relacionados (aunque deberían existir por las relaciones definidas)
        propiedad: item.propiedad?.descripcion || `Propiedad #${item.id_propiedad}`,
        inquilino: item.inquilino?.nombre || `Inquilino #${item.id_inquilino}`,
        arrendatario:
          item.propiedad?.arrendatario?.nombre ||
          (item.propiedad?.id_arrendatario ? `Arrendatario #${item.propiedad.id_arrendatario}` : 'Sin arrendatario'),
      }));

      setBookings(normalized);
    } catch (error) {
      setErrorMessage(error.message || 'No se pudieron cargar las reservas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Filtra reservas por texto libre y estado.
  const filteredBookings = useMemo(() => bookings.filter((booking) => {

     // Búsqueda por texto se puede buscar por numero de reserva, propiedad, inquilino o arrendatario.
    const matchesSearch =
      booking.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.propiedad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.inquilino.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.arrendatario.toLowerCase().includes(searchTerm.toLowerCase());
   
   // Filtro por estado se puede filtrar por estado de reserva
      const matchesStatus =
      filterStatus === 'all' || booking.estado.toLowerCase().includes(filterStatus.toLowerCase());
    return matchesSearch && matchesStatus;
  }), [bookings, searchTerm, filterStatus]);

  // Determina colores de estado según el valor (cancelada, confirmada, pendiente, rechazada, finalizada).
  const getStatusBadgeColor = (status) => {
    if (status.toLowerCase().includes('confirm')) return 'bg-[#6B8E23] text-white';
    if (status.toLowerCase().includes('pend')) return 'bg-yellow-100 text-yellow-700';
    if (status.toLowerCase().includes('cancel')) return 'bg-red-100 text-red-700';
    if (status.toLowerCase().includes('complet')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Retorna el estado tal cual para mantener coherencia con la base de datos.
  const getStatusLabel = (status) => {
    return status;
  };

  // Calcula cantidad de noches entre fecha de inicio y fecha de fin.
  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  // Normalizar estado para comparaciones para evitar errores por espacios o mayúsculas.
  const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

// muestra el mensaje de acción después de realizar una operación
  const showActionMessage = (type, text) => {
    setActionMessage({ type, text });
  };
 // Encuentra una reserva por su clave compuesta (id_propiedad-id_inquilino-fecha_inicio) para poder realizar acciones sobre ella.
  const findBookingById = (id) => bookings.find((item) => item.key === id);

// confirma la acción que se va a realizar  mostrando un modal de confirmación para evitar errores por clicks accidentales. Solo se puede confirmar una acción a la vez y mientras se aplica la acción el modal no se puede cerrar para evitar inconsistencias.
  const openActionConfirmation = (bookingId, actionId) => {
    setConfirmAction({ open: true, bookingId, actionId });
  };

// cierra el modal de confirmación y resetea su estado.
  const closeActionConfirmation = () => {
    if (isApplyingAction) return;
    setConfirmAction({ open: false, bookingId: '', actionId: '' });
  };
 // verifica el estado de la reserva para determinar si se pueden realizar acciones adicionales o si ya está en un estado final y ya no se realizan mas cambios
  const isFinalStatus = (status) => FINAL_STATUSES.includes(normalizeStatus(status));

  // Devuelve las acciones permitidas según el estado actual de la reserva.
  const getAccionesPorEstado = (estado) => {
    const currentStatus = normalizeStatus(estado);

    if (isFinalStatus(currentStatus)) return [];
    if (currentStatus.includes('confirm')) {
      return [
        { id: 'finalizar', label: 'Finalizar', variant: 'blue' },
        { id: 'cancelar', label: 'Cancelar', variant: 'red' },
      ];
    }

    return [
      { id: 'confirmar', label: 'Confirmar', variant: 'green' },
      { id: 'cancelar', label: 'Cancelar', variant: 'red' },
      { id: 'rechazar', label: 'Rechazar', variant: 'slate' },
    ];
  };
// Devuelve la clase CSS para el botón de acción según su color.
  const getActionMenuVariant = (variant) => {
    if (variant === 'green') return 'primary';
    if (variant === 'red') return 'danger';
    if (variant === 'blue' || variant === 'slate') return 'neutral';
    return 'view';
  };

  // Actualiza el estado de una reserva usando su clave compuesta.
  const updateBookingStatus = async (booking, nextStatus) => {
    const normalizedCurrent = normalizeStatus(booking.estado);
    const normalizedNext = normalizeStatus(nextStatus);

    if (isFinalStatus(normalizedCurrent)) {
      showActionMessage('error', `Acción inválida: la reserva ya está ${booking.estado}.`);
      return false;
    }

    if (normalizedCurrent === normalizedNext) {
      showActionMessage('error', `La reserva ya está en estado ${booking.estado}.`);
      return false;
    }

// Actualiza el estado de la reserva en la base de datos usando su clave compuesta
    const { data: updatedRows, error } = await supabase
      .from('reserva')
      .update({ estado: nextStatus })
      .eq('id_propiedad', booking.id_propiedad)
      .eq('id_inquilino', booking.id_inquilino)
      .eq('fecha_inicio', booking.fecha_inicio)
      .select('id_propiedad,id_inquilino,fecha_inicio,estado');

    if (error) {
      setErrorMessage(`No se pudo actualizar la reserva. ${error.message}`);
      return false;
    }

    if (!updatedRows || updatedRows.length === 0) {
      showActionMessage('error', 'No se actualizó la reserva en la base de datos. Revisa permisos RLS de UPDATE en tabla reserva.');
      return false;
    }

    setBookings((prev) =>
      prev.map((item) =>
        item.key === booking.key ? { ...item, estado: nextStatus } : item
      )
    );

    return true;
  };

// Funciones para cada acción de reserva que actualizan el estado y registran la actividad del admin usando la función recordAdminActivity para mantener un historial de acciones realizadas. Cada función verifica que la reserva exista antes de intentar actualizarla y muestra mensajes de éxito o error según corresponda.
  const confirmarReserva = async (id) => {
    const booking = findBookingById(id);
    if (!booking) {
      showActionMessage('error', 'No se encontró la reserva seleccionada.');
      return;
    }

// Actualiza el estado de la reserva a confirmada y registra la actividad del admin.
    const updated = await updateBookingStatus(booking, 'confirmada');
    if (updated) {
      showActionMessage('success', 'Reserva confirmada correctamente.');
      recordAdminActivity({
        type: 'Reserva confirmada',
        user: `RSV-${booking.id_propiedad}-${booking.id_inquilino} · ${booking.propiedad}`,
        status: 'success',
        source: 'reservas',
      });
    }
  };

// Función para cancelar una reserva, actualiza el estado a cancelada y registra la actividad del admin.
  const cancelarReserva = async (id) => {
    const booking = findBookingById(id);
    if (!booking) {
      showActionMessage('error', 'No se encontró la reserva seleccionada.');
      return;
    }
// Actualiza el estado de la reserva a cancelada y registra la actividad del admin.
    const updated = await updateBookingStatus(booking, 'cancelada');
    if (updated) {
      showActionMessage('success', 'Reserva cancelada correctamente.');
      recordAdminActivity({
        type: 'Reserva cancelada',
        user: `RSV-${booking.id_propiedad}-${booking.id_inquilino} · ${booking.propiedad}`,
        status: 'warning',
        source: 'reservas',
      });
    }
  };

  // Función para rechazar una reserva, actualiza el estado a rechazada y registra la actividad del admin.
  const rechazarReserva = async (id) => {
    const booking = findBookingById(id);
    if (!booking) {
      showActionMessage('error', 'No se encontró la reserva seleccionada.');
      return;
    }
// Actualiza el estado de la reserva a rechazada y registra la actividad del admin.
    const updated = await updateBookingStatus(booking, 'rechazada');
    if (updated) {
      showActionMessage('success', 'Reserva rechazada correctamente.');
      recordAdminActivity({
        type: 'Reserva rechazada',
        user: `RSV-${booking.id_propiedad}-${booking.id_inquilino} · ${booking.propiedad}`,
        status: 'warning',
        source: 'reservas',
      });
    }
  };
// Función para finalizar una reserva, actualiza el estado a finalizada y registra la actividad del admin.
  const finalizarReserva = async (id) => {
    const booking = findBookingById(id);
    if (!booking) {
      showActionMessage('error', 'No se encontró la reserva seleccionada.');
      return;
    }
// Actualiza el estado de la reserva a finalizada y registra la actividad del admin.
    const updated = await updateBookingStatus(booking, 'finalizada');
    if (updated) {
      showActionMessage('success', 'Reserva finalizada correctamente.');
      recordAdminActivity({
        type: 'Reserva finalizada',
        user: `RSV-${booking.id_propiedad}-${booking.id_inquilino} · ${booking.propiedad}`,
        status: 'success',
        source: 'reservas',
      });
    }
  };
// Función para eliminar una reserva, elimina la reserva de la base de datos usando su clave compuesta y registra la actividad del admin. Esta acción es irreversible y se muestra un mensaje de confirmación antes de ejecutarla.
  const eliminarReserva = async (id) => {
    const booking = findBookingById(id);
    if (!booking) {
      showActionMessage('error', 'No se encontró la reserva seleccionada.');
      return;
    }
// Elimina la reserva de la base de datos usando su clave compuesta
    const { error } = await supabase
      .from('reserva')
      .delete()
      .eq('id_propiedad', booking.id_propiedad)
      .eq('id_inquilino', booking.id_inquilino)
      .eq('fecha_inicio', booking.fecha_inicio);

    if (error) {
      setErrorMessage(`No se pudo eliminar la reserva. ${error.message}`);
      return;
    }
// Actualiza el estado local eliminando la reserva
    setBookings((prev) => prev.filter((item) => item.key !== booking.key));
    showActionMessage('success', 'Reserva eliminada correctamente.');
    recordAdminActivity({
      type: 'Reserva eliminada',
      user: `RSV-${booking.id_propiedad}-${booking.id_inquilino} · ${booking.propiedad}`,
      status: 'warning',
      source: 'reservas',
    });
  };
// Mapeo de acciones a sus respectivos handlers para facilitar la ejecución de la acción seleccionada en el modal de confirmación.
  const actionHandlers = {
    confirmar: confirmarReserva,
    cancelar: cancelarReserva,
    rechazar: rechazarReserva,
    finalizar: finalizarReserva,
    eliminar: eliminarReserva,
  };
// Configuración del modal de confirmación según la acción que se va a realizar, muestra un mensaje específico para cada tipo de acción (confirmar, cancelar, rechazar, finalizar, eliminar) y utiliza los datos de la reserva para mostrar información relevante en el mensaje.
  const getActionModalConfig = () => {
    const booking = findBookingById(confirmAction.bookingId);
    const bookingLabel = booking
      ? `RSV-${booking.id_propiedad}-${booking.id_inquilino}`
      : 'esta reserva';
// Configuración específica para cada tipo de acción con mensajes personalizados y estilos de botón.
    if (confirmAction.actionId === 'eliminar') {
      return {
        title: 'Confirmar eliminación',
        description: (
          <p>
            ¿Seguro quieres eliminar la reserva <strong>{bookingLabel}</strong>? Esta acción no se puede deshacer.
          </p>
        ),
        confirmLabel: 'Eliminar',
        confirmVariant: 'adminDanger',
      };
    }
// Configuración para la acción de cancelar reserva con mensaje específico y estilo de botón rojo.
    if (confirmAction.actionId === 'cancelar') {
      return {
        title: 'Confirmar cancelación',
        description: (
          <p>
            ¿Seguro quieres cancelar la reserva <strong>{bookingLabel}</strong>?
          </p>
        ),
        confirmLabel: 'Cancelar reserva',
        confirmVariant: 'adminDanger',
      };
    }
// Configuración para la acción de rechazar reserva con mensaje específico y estilo de botón gris oscuro.
    if (confirmAction.actionId === 'rechazar') {
      return {
        title: 'Confirmar rechazo',
        description: (
          <p>
            ¿Seguro quieres rechazar la reserva <strong>{bookingLabel}</strong>?
          </p>
        ),
        confirmLabel: 'Rechazar reserva',
        confirmVariant: 'adminNeutral',
      };
    }
// Configuración para la acción de finalizar reserva con mensaje específico y estilo de botón azul.
    if (confirmAction.actionId === 'finalizar') {
      return {
        title: 'Confirmar finalización',
        description: (
          <p>
            ¿Seguro quieres finalizar la reserva <strong>{bookingLabel}</strong>?
          </p>
        ),
        confirmLabel: 'Finalizar reserva',
        confirmVariant: 'adminNeutral',
      };
    }
// Configuración para la acción de confirmar reserva con mensaje específico y estilo de botón verde.
    return {
      title: 'Confirmar reserva',
      description: (
        <p>
          ¿Seguro quieres confirmar la reserva <strong>{bookingLabel}</strong>?
        </p>
      ),
      confirmLabel: 'Confirmar reserva',
      confirmVariant: 'adminPrimary',
    };
  };
// Función que se ejecuta al confirmar la acción en el modal, llama al handler correspondiente según la acción seleccionada y muestra mensajes de éxito o error según corresponda.
  const confirmAndExecuteAction = async () => {
    const handler = actionHandlers[confirmAction.actionId];
    if (!handler) {
      showActionMessage('error', 'Acción no disponible.');
      closeActionConfirmation();
      return;
    }

    setIsApplyingAction(true);
    await handler(confirmAction.bookingId);
    setIsApplyingAction(false);
    setConfirmAction({ open: false, bookingId: '', actionId: '' });
  };
// Obtiene la configuración del modal de confirmación para la acción que se va a realizar, esta configuración se utiliza para mostrar el título, descripción y estilo del botón de confirmación en el modal.
  const actionModalConfig = getActionModalConfig();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-2">
          Gestión de Reservas
        </h1>
        <p className="text-[#5F5F5F]/70">
          Administra la tabla reserva con datos reales
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={loadBookings} variant="adminSecondary" size="admin" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {/* Tarjetas con resumen de reservas e ingresos. */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#F2E8CF] border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5F5F5F]/70">Total</p>
                <p className="text-2xl font-['Poppins'] font-semibold text-[#5F5F5F]">
                  {bookings.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-[#A67C52]" />
            </div>
          </CardContent>
        </Card>
          {/* Tarjeta de reservas confirmadas. */}
        <Card className="bg-[#F2E8CF] border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5F5F5F]/70">Confirmadas</p>
                <p className="text-2xl font-['Poppins'] font-semibold text-[#5F5F5F]">
                  {bookings.filter((b) => b.estado.toLowerCase().includes('confirm')).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-[#6B8E23]" />
            </div>
          </CardContent>
        </Card>
          {/* Tarjeta de reservas pendientes. */}
        <Card className="bg-[#F2E8CF] border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5F5F5F]/70">Pendientes</p>
                <p className="text-2xl font-['Poppins'] font-semibold text-[#5F5F5F]">
                  {bookings.filter((b) => b.estado.toLowerCase().includes('pend')).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
          {/* Tarjeta de ingresos totales. */}
        <Card className="bg-[#F2E8CF] border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5F5F5F]/70">Ingresos</p>
                <p className="text-2xl font-['Poppins'] font-semibold text-[#5F5F5F]">
                  ${bookings.reduce((sum, b) => sum + b.pago, 0).toLocaleString('es-MX')}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#A67C52]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      {/* Sección de búsqueda y filtros por estado. */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5F5F5F]/40" />
              <Input
                placeholder="Buscar por número, propiedad, huésped o anfitrión..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#FAFAFA] border-gray-200"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'adminPrimary' : 'adminSecondary'}
                size="admin"
                onClick={() => setFilterStatus('all')}
              >
                <Filter className="w-4 h-4 mr-2" />
                Todos
              </Button>
              <Button
                variant={filterStatus === 'confirmada' ? 'adminPrimary' : 'adminSecondary'}
                size="admin"
                onClick={() => setFilterStatus('confirmada')}
              >
                Confirmadas
              </Button>
              <Button
                variant={filterStatus === 'pendiente' ? 'adminPrimary' : 'adminSecondary'}
                size="admin"
                onClick={() => setFilterStatus('pendiente')}
              >
                Pendientes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      {/* Tabla detallada de reservas y acciones disponibles. */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="font-['Poppins'] text-[#5F5F5F]">
            Lista de Reservas ({filteredBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F2E8CF]/30">
                  <TableHead className="text-[#5F5F5F]">Número</TableHead>
                  <TableHead className="text-[#5F5F5F]">Propiedad</TableHead>
                  <TableHead className="text-[#5F5F5F]">Huésped</TableHead>
                  <TableHead className="text-[#5F5F5F]">Fechas</TableHead>
                  <TableHead className="text-[#5F5F5F]">Noches</TableHead>
                  <TableHead className="text-[#5F5F5F]">Estado</TableHead>
                  <TableHead className="text-[#5F5F5F]">Total</TableHead>
                  <TableHead className="text-[#5F5F5F]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              {/* Filas generadas desde las reservas filtradas. */}
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.key} className="hover:bg-[#F2E8CF]/20">
                    <TableCell>
                      <p className="text-[#5F5F5F] font-medium">RSV-{booking.id_propiedad}-{booking.id_inquilino}</p>
                      <p className="text-xs text-[#5F5F5F]/60">Inicio: {booking.fecha_inicio}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-[#5F5F5F]">{booking.propiedad}</p>
                      <p className="text-sm text-[#5F5F5F]/60">Arrendatario: {booking.arrendatario}</p>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">{booking.inquilino}</TableCell>
                    <TableCell>
                      <p className="text-[#5F5F5F] text-sm">
                        {new Date(booking.fecha_inicio).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-[#5F5F5F] text-sm">
                        {new Date(booking.fecha_fin).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">
                      {calculateNights(booking.fecha_inicio, booking.fecha_fin)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(booking.estado)}>
                        {getStatusLabel(booking.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F] font-medium">
                      ${booking.pago.toLocaleString('es-MX')}
                    </TableCell>
                    <TableCell>
                      <ActionMenu
                        label={`Acciones de la reserva RSV-${booking.id_propiedad}-${booking.id_inquilino}`}
                        actions={[
                          ...getAccionesPorEstado(booking.estado).map((action) => ({
                            label: action.label,
                            variant: getActionMenuVariant(action.variant),
                            onClick: () => openActionConfirmation(booking.key, action.id),
                          })),
                          {
                            label: 'Eliminar',
                            variant: 'danger',
                            onClick: () => openActionConfirmation(booking.key, 'eliminar'),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Modal de confirmación para ejecutar acciones sobre una reserva. */}
      <ConfirmActionModal
        open={confirmAction.open}
        title={actionModalConfig.title}
        description={actionModalConfig.description}
        cancelLabel="Cancelar"
        confirmLabel={isApplyingAction ? 'Procesando...' : actionModalConfig.confirmLabel}
        confirmVariant={actionModalConfig.confirmVariant}
        onCancel={closeActionConfirmation}
        onConfirm={confirmAndExecuteAction}
        disableCancel={isApplyingAction}
        disableConfirm={isApplyingAction}
      />

      <ConfirmActionModal
        open={Boolean(errorMessage)}
        type="error"
        title="Error"
        description={errorMessage}
        confirmLabel="Entendido"
        onConfirm={() => setErrorMessage('')}
      />

      <ConfirmActionModal
        open={Boolean(actionMessage.text)}
        type={actionMessage.type === 'success' ? 'success' : 'error'}
        title={actionMessage.type === 'success' ? 'Accion completada' : 'Error'}
        description={actionMessage.text}
        confirmLabel="Entendido"
        onConfirm={() => setActionMessage({ type: '', text: '' })}
      />

      {/* Quick Navigation */}
      {/* Navegación rápida a otras vistas del panel. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer text-center"
        >
          <div className="text-xl mb-2">📊</div>
          <h3 className="font-['Poppins'] font-semibold text-[#5F5F5F] text-sm">Dashboard</h3>
        </button>
        <button
          onClick={() => onNavigate('users')}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer text-center"
        >
          <div className="text-xl mb-2">👥</div>
          <h3 className="font-['Poppins'] font-semibold text-[#5F5F5F] text-sm">Usuarios</h3>
        </button>
        <button
          onClick={() => onNavigate('properties')}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer text-center"
        >
          <div className="text-xl mb-2">🏠</div>
          <h3 className="font-['Poppins'] font-semibold text-[#5F5F5F] text-sm">Propiedades</h3>
        </button>
      </div>
    </div>
  );
}

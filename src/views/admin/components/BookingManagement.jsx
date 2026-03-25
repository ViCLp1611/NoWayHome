import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Search,
  Filter,
  CheckCircle,
  Calendar,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ConfirmActionModal } from './ConfirmActionModal';
import { recordAdminActivity } from '@/views/admin/utils/adminActivity';

export function BookingManagement({ onNavigate }) {
  const FINAL_STATUSES = ['cancelada', 'rechazada', 'finalizada'];
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
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

      const normalized = (data || []).map((item) => ({
        key: `${item.id_propiedad}-${item.id_inquilino}-${item.fecha_inicio}`,
        id_propiedad: item.id_propiedad,
        id_inquilino: item.id_inquilino,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        estado: item.estado || 'pendiente',
        pago: Number(item.pago || 0),
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
    const matchesSearch =
      booking.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.propiedad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.inquilino.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.arrendatario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || booking.estado.toLowerCase().includes(filterStatus.toLowerCase());
    return matchesSearch && matchesStatus;
  }), [bookings, searchTerm, filterStatus]);

  // Determina colores del badge de estado según el valor textual.
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

  const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

  const showActionMessage = (type, text) => {
    setActionMessage({ type, text });
  };

  const findBookingById = (id) => bookings.find((item) => item.key === id);

  const openActionConfirmation = (bookingId, actionId) => {
    setConfirmAction({ open: true, bookingId, actionId });
  };

  const closeActionConfirmation = () => {
    if (isApplyingAction) return;
    setConfirmAction({ open: false, bookingId: '', actionId: '' });
  };

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

  const getActionClassName = (variant) => {
    const baseClassName = 'h-8 w-full rounded-md px-2';

    if (variant === 'green') return `${baseClassName} bg-[#6B8E23] hover:bg-[#5a7a1d] text-white`;
    if (variant === 'red') return `${baseClassName} bg-red-600 hover:bg-red-700 text-white`;
    if (variant === 'blue') return `${baseClassName} bg-blue-600 hover:bg-blue-700 text-white`;
    if (variant === 'slate') return `${baseClassName} bg-slate-600 hover:bg-slate-700 text-white`;
    return `${baseClassName} bg-gray-200 text-[#5F5F5F]`;
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

  const confirmarReserva = async (id) => {
    const booking = findBookingById(id);
    if (!booking) {
      showActionMessage('error', 'No se encontró la reserva seleccionada.');
      return;
    }

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

  const cancelarReserva = async (id) => {
    const booking = findBookingById(id);
    if (!booking) {
      showActionMessage('error', 'No se encontró la reserva seleccionada.');
      return;
    }

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

  const rechazarReserva = async (id) => {
    const booking = findBookingById(id);
    if (!booking) {
      showActionMessage('error', 'No se encontró la reserva seleccionada.');
      return;
    }

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

  const finalizarReserva = async (id) => {
    const booking = findBookingById(id);
    if (!booking) {
      showActionMessage('error', 'No se encontró la reserva seleccionada.');
      return;
    }

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

  const eliminarReserva = async (id) => {
    const booking = findBookingById(id);
    if (!booking) {
      showActionMessage('error', 'No se encontró la reserva seleccionada.');
      return;
    }

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

    setBookings((prev) => prev.filter((item) => item.key !== booking.key));
    showActionMessage('success', 'Reserva eliminada correctamente.');
    recordAdminActivity({
      type: 'Reserva eliminada',
      user: `RSV-${booking.id_propiedad}-${booking.id_inquilino} · ${booking.propiedad}`,
      status: 'warning',
      source: 'reservas',
    });
  };

  const actionHandlers = {
    confirmar: confirmarReserva,
    cancelar: cancelarReserva,
    rechazar: rechazarReserva,
    finalizar: finalizarReserva,
    eliminar: eliminarReserva,
  };

  const getActionModalConfig = () => {
    const booking = findBookingById(confirmAction.bookingId);
    const bookingLabel = booking
      ? `RSV-${booking.id_propiedad}-${booking.id_inquilino}`
      : 'esta reserva';

    if (confirmAction.actionId === 'eliminar') {
      return {
        title: 'Confirmar eliminación',
        description: (
          <p>
            ¿Seguro quieres eliminar la reserva <strong>{bookingLabel}</strong>? Esta acción no se puede deshacer.
          </p>
        ),
        confirmLabel: 'Eliminar',
        confirmButtonClassName: 'bg-red-600 hover:bg-red-700 text-white',
      };
    }

    if (confirmAction.actionId === 'cancelar') {
      return {
        title: 'Confirmar cancelación',
        description: (
          <p>
            ¿Seguro quieres cancelar la reserva <strong>{bookingLabel}</strong>?
          </p>
        ),
        confirmLabel: 'Cancelar reserva',
        confirmButtonClassName: 'bg-red-600 hover:bg-red-700 text-white',
      };
    }

    if (confirmAction.actionId === 'rechazar') {
      return {
        title: 'Confirmar rechazo',
        description: (
          <p>
            ¿Seguro quieres rechazar la reserva <strong>{bookingLabel}</strong>?
          </p>
        ),
        confirmLabel: 'Rechazar reserva',
        confirmButtonClassName: 'bg-slate-600 hover:bg-slate-700 text-white',
      };
    }

    if (confirmAction.actionId === 'finalizar') {
      return {
        title: 'Confirmar finalización',
        description: (
          <p>
            ¿Seguro quieres finalizar la reserva <strong>{bookingLabel}</strong>?
          </p>
        ),
        confirmLabel: 'Finalizar reserva',
        confirmButtonClassName: 'bg-blue-600 hover:bg-blue-700 text-white',
      };
    }

    return {
      title: 'Confirmar reserva',
      description: (
        <p>
          ¿Seguro quieres confirmar la reserva <strong>{bookingLabel}</strong>?
        </p>
      ),
      confirmLabel: 'Confirmar reserva',
      confirmButtonClassName: 'bg-[#6B8E23] hover:bg-[#5a7a1d] text-white',
    };
  };

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
        <Button onClick={loadBookings} variant="outline" className="border-gray-200" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {errorMessage && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-sm text-yellow-800">{errorMessage}</CardContent>
        </Card>
      )}

      {actionMessage.text && (
        <Card className={actionMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <CardContent className={actionMessage.type === 'success' ? 'p-4 text-sm text-green-800' : 'p-4 text-sm text-red-800'}>
            {actionMessage.text}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
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
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                className={filterStatus === 'all' ? 'bg-[#6B8E23] text-white' : 'border-gray-200'}
                onClick={() => setFilterStatus('all')}
              >
                <Filter className="w-4 h-4 mr-2" />
                Todos
              </Button>
              <Button
                variant={filterStatus === 'confirmada' ? 'default' : 'outline'}
                className={filterStatus === 'confirmada' ? 'bg-[#6B8E23] text-white' : 'border-gray-200'}
                onClick={() => setFilterStatus('confirmada')}
              >
                Confirmadas
              </Button>
              <Button
                variant={filterStatus === 'pendiente' ? 'default' : 'outline'}
                className={filterStatus === 'pendiente' ? 'bg-[#6B8E23] text-white' : 'border-gray-200'}
                onClick={() => setFilterStatus('pendiente')}
              >
                Pendientes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
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
                  <TableHead className="text-[#5F5F5F] w-[260px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
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
                    <TableCell className="w-[260px]">
                      <div className="grid grid-cols-2 gap-2">
                        {getAccionesPorEstado(booking.estado).map((action) => (
                          <Button
                            key={`${booking.key}-${action.id}`}
                            size="sm"
                            className={getActionClassName(action.variant)}
                            onClick={() => openActionConfirmation(booking.key, action.id)}
                          >
                            {action.label}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          className="col-span-2 h-8 w-full rounded-md border-gray-300 px-2 text-[#5F5F5F] hover:bg-[#F2E8CF]/30"
                          onClick={() => openActionConfirmation(booking.key, 'eliminar')}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmActionModal
        open={confirmAction.open}
        title={actionModalConfig.title}
        description={actionModalConfig.description}
        cancelLabel="Cancelar"
        confirmLabel={isApplyingAction ? 'Procesando...' : actionModalConfig.confirmLabel}
        confirmButtonClassName={actionModalConfig.confirmButtonClassName}
        onCancel={closeActionConfirmation}
        onConfirm={confirmAndExecuteAction}
        disableCancel={isApplyingAction}
        disableConfirm={isApplyingAction}
      />

      {/* Quick Navigation */}
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

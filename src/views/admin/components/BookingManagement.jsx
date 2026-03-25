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
  XCircle,
  Calendar,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function BookingManagement({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Obtiene reservas y relaciones (propiedad/inquilino) para mostrar datos completos.
  const loadBookings = async () => {
    setLoading(true);
    setErrorMessage('');

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

  // Actualiza el estado de una reserva usando su clave compuesta.
  const updateBookingStatus = async (booking, nextStatus) => {
    const { error } = await supabase
      .from('reserva')
      .update({ estado: nextStatus })
      .eq('id_propiedad', booking.id_propiedad)
      .eq('id_inquilino', booking.id_inquilino)
      .eq('fecha_inicio', booking.fecha_inicio);

    if (error) {
      setErrorMessage(`No se pudo actualizar la reserva. ${error.message}`);
      return;
    }

    setBookings((prev) =>
      prev.map((item) =>
        item.key === booking.key ? { ...item, estado: nextStatus } : item
      )
    );
  };

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
                  <TableHead className="text-[#5F5F5F]">Acciones</TableHead>
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
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-[#6B8E23] hover:bg-[#5a7a1d] text-white"
                          onClick={() => updateBookingStatus(booking, 'confirmada')}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => updateBookingStatus(booking, 'cancelada')}
                        >
                          Cancelar
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

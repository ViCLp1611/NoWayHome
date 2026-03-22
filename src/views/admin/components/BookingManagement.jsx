import React, { useState } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
} from 'lucide-react';

const mockBookings = [
  {
    id: '1',
    bookingNumber: 'BK-2024-001',
    property: 'Casa moderna en la playa',
    guest: 'Carlos Ruiz',
    host: 'María González',
    checkIn: '2024-04-15',
    checkOut: '2024-04-20',
    status: 'confirmed',
    totalAmount: 1250,
    paymentStatus: 'paid',
    createdDate: '2024-03-10',
  },
  {
    id: '2',
    bookingNumber: 'BK-2024-002',
    property: 'Apartamento céntrico',
    guest: 'Laura Torres',
    host: 'Ana Martínez',
    checkIn: '2024-03-28',
    checkOut: '2024-04-02',
    status: 'completed',
    totalAmount: 600,
    paymentStatus: 'paid',
    createdDate: '2024-02-20',
  },
  {
    id: '3',
    bookingNumber: 'BK-2024-003',
    property: 'Villa con vista al mar',
    guest: 'Carlos Ruiz',
    host: 'Roberto Díaz',
    checkIn: '2024-05-10',
    checkOut: '2024-05-15',
    status: 'pending',
    totalAmount: 2250,
    paymentStatus: 'pending',
    createdDate: '2024-03-18',
  },
  {
    id: '4',
    bookingNumber: 'BK-2024-004',
    property: 'Casa colonial restaurada',
    guest: 'Luis Pérez',
    host: 'Ana Martínez',
    checkIn: '2024-04-05',
    checkOut: '2024-04-08',
    status: 'cancelled',
    totalAmount: 540,
    paymentStatus: 'refunded',
    createdDate: '2024-03-01',
  },
  {
    id: '5',
    bookingNumber: 'BK-2024-005',
    property: 'Villa de lujo',
    guest: 'Laura Torres',
    host: 'Roberto Díaz',
    checkIn: '2024-06-01',
    checkOut: '2024-06-07',
    status: 'confirmed',
    totalAmount: 4080,
    paymentStatus: 'paid',
    createdDate: '2024-03-20',
  },
  {
    id: '6',
    bookingNumber: 'BK-2024-006',
    property: 'Casa con alberca',
    guest: 'Carlos Ruiz',
    host: 'María González',
    checkIn: '2024-04-22',
    checkOut: '2024-04-25',
    status: 'confirmed',
    totalAmount: 960,
    paymentStatus: 'paid',
    createdDate: '2024-03-15',
  },
  {
    id: '7',
    bookingNumber: 'BK-2024-007',
    property: 'Apartamento céntrico',
    guest: 'Sofia López',
    host: 'Ana Martínez',
    checkIn: '2024-05-20',
    checkOut: '2024-05-23',
    status: 'pending',
    totalAmount: 360,
    paymentStatus: 'pending',
    createdDate: '2024-03-22',
  },
  {
    id: '8',
    bookingNumber: 'BK-2024-008',
    property: 'Casa moderna en la playa',
    guest: 'Luis Pérez',
    host: 'María González',
    checkIn: '2024-03-15',
    checkOut: '2024-03-18',
    status: 'completed',
    totalAmount: 750,
    paymentStatus: 'paid',
    createdDate: '2024-02-28',
  },
];

export function BookingManagement({ onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const filteredBookings = mockBookings.filter((booking) => {
    const matchesSearch =
      booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.host.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const matchesPayment =
      filterPayment === 'all' || booking.paymentStatus === filterPayment;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#6B8E23] text-white';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentBadgeColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'refunded':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const getPaymentLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-2">
          Gestión de Reservas
        </h1>
        <p className="text-[#5F5F5F]/70">
          Administra todas las reservas de la plataforma
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#F2E8CF] border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5F5F5F]/70">Total</p>
                <p className="text-2xl font-['Poppins'] font-semibold text-[#5F5F5F]">
                  {mockBookings.length}
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
                  {mockBookings.filter((b) => b.status === 'confirmed').length}
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
                  {mockBookings.filter((b) => b.status === 'pending').length}
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
                  ${mockBookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-200">
                    <Filter className="w-4 h-4 mr-2" />
                    Estado: {filterStatus === 'all' ? 'Todos' : getStatusLabel(filterStatus)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('confirmed')}>
                    Confirmada
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('pending')}>
                    Pendiente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('completed')}>
                    Completada
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('cancelled')}>
                    Cancelada
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-200">
                    <Filter className="w-4 h-4 mr-2" />
                    Pago: {filterPayment === 'all' ? 'Todos' : getPaymentLabel(filterPayment)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterPayment('all')}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPayment('paid')}>
                    Pagado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPayment('pending')}>
                    Pendiente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPayment('refunded')}>
                    Reembolsado
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <TableHead className="text-[#5F5F5F]">Pago</TableHead>
                  <TableHead className="text-[#5F5F5F]">Total</TableHead>
                  <TableHead className="text-[#5F5F5F]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-[#F2E8CF]/20">
                    <TableCell>
                      <p className="text-[#5F5F5F] font-medium">{booking.bookingNumber}</p>
                      <p className="text-xs text-[#5F5F5F]/60">
                        {new Date(booking.createdDate).toLocaleDateString('es-ES')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-[#5F5F5F]">{booking.property}</p>
                      <p className="text-sm text-[#5F5F5F]/60">Anfitrión: {booking.host}</p>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">{booking.guest}</TableCell>
                    <TableCell>
                      <p className="text-[#5F5F5F] text-sm">
                        {new Date(booking.checkIn).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-[#5F5F5F] text-sm">
                        {new Date(booking.checkOut).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">
                      {calculateNights(booking.checkIn, booking.checkOut)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentBadgeColor(booking.paymentStatus)}>
                        {getPaymentLabel(booking.paymentStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F] font-medium">
                      ${booking.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar reserva
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar reserva
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

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
import { Search, Filter, MoreVertical, Mail, Shield, Ban, UserCheck } from 'lucide-react';

const mockUsers = [
  {
    id: '1',
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    role: 'host',
    status: 'active',
    registeredDate: '2024-01-15',
    properties: 3,
    bookings: 42,
  },
  {
    id: '2',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@email.com',
    role: 'guest',
    status: 'active',
    registeredDate: '2024-02-20',
    properties: 0,
    bookings: 8,
  },
  {
    id: '3',
    name: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    role: 'host',
    status: 'active',
    registeredDate: '2023-11-10',
    properties: 5,
    bookings: 67,
  },
  {
    id: '4',
    name: 'Luis Pérez',
    email: 'luis.perez@email.com',
    role: 'guest',
    status: 'pending',
    registeredDate: '2024-03-05',
    properties: 0,
    bookings: 2,
  },
  {
    id: '5',
    name: 'Sofia López',
    email: 'sofia.lopez@email.com',
    role: 'host',
    status: 'suspended',
    registeredDate: '2024-01-28',
    properties: 2,
    bookings: 15,
  },
  {
    id: '6',
    name: 'Diego Fernández',
    email: 'diego.fernandez@email.com',
    role: 'admin',
    status: 'active',
    registeredDate: '2023-06-01',
    properties: 0,
    bookings: 0,
  },
  {
    id: '7',
    name: 'Laura Torres',
    email: 'laura.torres@email.com',
    role: 'guest',
    status: 'active',
    registeredDate: '2024-02-14',
    properties: 0,
    bookings: 12,
  },
  {
    id: '8',
    name: 'Roberto Díaz',
    email: 'roberto.diaz@email.com',
    role: 'host',
    status: 'active',
    registeredDate: '2023-09-22',
    properties: 7,
    bookings: 89,
  },
];

export function UserManagement({ onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-[#A67C52] text-white';
      case 'host':
        return 'bg-[#6B8E23] text-white';
      case 'guest':
        return 'bg-gray-200 text-[#5F5F5F]';
      default:
        return 'bg-gray-200 text-[#5F5F5F]';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'suspended':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'host':
        return 'Anfitrión';
      case 'guest':
        return 'Huésped';
      default:
        return role;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'suspended':
        return 'Suspendido';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-[#5F5F5F]/70">
          Administra todos los usuarios de la plataforma
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5F5F5F]/40" />
              <Input
                placeholder="Buscar por nombre o email..."
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
                    Rol: {filterRole === 'all' ? 'Todos' : getRoleLabel(filterRole)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterRole('all')}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('guest')}>
                    Huésped
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('host')}>
                    Anfitrión
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('admin')}>
                    Administrador
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                  <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                    Activo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('pending')}>
                    Pendiente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('suspended')}>
                    Suspendido
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="font-['Poppins'] text-[#5F5F5F]">
            Lista de Usuarios ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F2E8CF]/30">
                  <TableHead className="text-[#5F5F5F]">Usuario</TableHead>
                  <TableHead className="text-[#5F5F5F]">Rol</TableHead>
                  <TableHead className="text-[#5F5F5F]">Estado</TableHead>
                  <TableHead className="text-[#5F5F5F]">Propiedades</TableHead>
                  <TableHead className="text-[#5F5F5F]">Reservas</TableHead>
                  <TableHead className="text-[#5F5F5F]">Registro</TableHead>
                  <TableHead className="text-[#5F5F5F]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-[#F2E8CF]/20">
                    <TableCell>
                      <div>
                        <p className="text-[#5F5F5F]">{user.name}</p>
                        <p className="text-sm text-[#5F5F5F]/60">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(user.status)}>
                        {getStatusLabel(user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">{user.properties}</TableCell>
                    <TableCell className="text-[#5F5F5F]">{user.bookings}</TableCell>
                    <TableCell className="text-[#5F5F5F]">
                      {new Date(user.registeredDate).toLocaleDateString('es-ES')}
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
                            <UserCheck className="w-4 h-4 mr-2" />
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar mensaje
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="w-4 h-4 mr-2" />
                            Cambiar rol
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Ban className="w-4 h-4 mr-2" />
                            Suspender usuario
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
          onClick={() => onNavigate('properties')}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer text-center"
        >
          <div className="text-xl mb-2">🏠</div>
          <h3 className="font-['Poppins'] font-semibold text-[#5F5F5F] text-sm">Propiedades</h3>
        </button>
        <button
          onClick={() => onNavigate('bookings')}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer text-center"
        >
          <div className="text-xl mb-2">📅</div>
          <h3 className="font-['Poppins'] font-semibold text-[#5F5F5F] text-sm">Reservas</h3>
        </button>
      </div>
    </div>
  );
}

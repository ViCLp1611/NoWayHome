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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { PropertyForm } from './PropertyForm';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Star,
} from 'lucide-react';

const mockProperties = [
  {
    id: '1',
    title: 'Casa moderna en la playa',
    type: 'house',
    location: 'Cancún, México',
    owner: 'María González',
    status: 'active',
    price: 250,
    rating: 4.8,
    reviews: 42,
    bookings: 38,
    publishedDate: '2024-01-15',
  },
  {
    id: '2',
    title: 'Apartamento céntrico',
    type: 'apartment',
    location: 'Ciudad de México',
    owner: 'Ana Martínez',
    status: 'active',
    price: 120,
    rating: 4.5,
    reviews: 67,
    bookings: 89,
    publishedDate: '2023-11-10',
  },
  {
    id: '3',
    title: 'Villa con vista al mar',
    type: 'villa',
    location: 'Acapulco, México',
    owner: 'Roberto Díaz',
    status: 'active',
    price: 450,
    rating: 4.9,
    reviews: 28,
    bookings: 24,
    publishedDate: '2023-09-22',
  },
  {
    id: '4',
    title: 'Apartamento moderno',
    type: 'apartment',
    location: 'Guadalajara, México',
    owner: 'María González',
    status: 'pending',
    price: 95,
    rating: 0,
    reviews: 0,
    bookings: 0,
    publishedDate: '2024-03-18',
  },
  {
    id: '5',
    title: 'Casa colonial restaurada',
    type: 'house',
    location: 'San Miguel de Allende',
    owner: 'Ana Martínez',
    status: 'active',
    price: 180,
    rating: 4.7,
    reviews: 53,
    bookings: 61,
    publishedDate: '2023-07-05',
  },
  {
    id: '6',
    title: 'Apartamento en zona turística',
    type: 'apartment',
    location: 'Playa del Carmen',
    owner: 'Sofia López',
    status: 'inactive',
    price: 140,
    rating: 4.3,
    reviews: 18,
    bookings: 12,
    publishedDate: '2024-01-28',
  },
  {
    id: '7',
    title: 'Villa de lujo',
    type: 'villa',
    location: 'Los Cabos, México',
    owner: 'Roberto Díaz',
    status: 'active',
    price: 680,
    rating: 5.0,
    reviews: 15,
    bookings: 22,
    publishedDate: '2023-10-12',
  },
  {
    id: '8',
    title: 'Casa con alberca',
    type: 'house',
    location: 'Tulum, México',
    owner: 'María González',
    status: 'active',
    price: 320,
    rating: 4.6,
    reviews: 31,
    bookings: 29,
    publishedDate: '2024-02-08',
  },
];

export function PropertyManagement({ onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredProperties = mockProperties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || property.type === filterType;
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'house':
        return 'bg-[#6B8E23] text-white';
      case 'apartment':
        return 'bg-[#A67C52] text-white';
      case 'villa':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-200 text-[#5F5F5F]';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-200 text-gray-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'house':
        return 'Casa';
      case 'apartment':
        return 'Apartamento';
      case 'villa':
        return 'Villa';
      default:
        return type;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'inactive':
        return 'Inactiva';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-2">
            Gestión de Propiedades
          </h1>
          <p className="text-[#5F5F5F]/70">
            Administra todas las propiedades de la plataforma
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#6B8E23] hover:bg-[#5a7a1d] text-white">
              + Nueva Propiedad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle></DialogTitle>
            </DialogHeader>
            <PropertyForm
              onClose={() => setIsCreateModalOpen(false)}
              onSubmit={(property) => {
                // Aquí se podría agregar la propiedad a la lista mock
                console.log('Propiedad agregada:', property);
                setIsCreateModalOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5F5F5F]/40" />
              <Input
                placeholder="Buscar por título, ubicación o propietario..."
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
                    Tipo: {filterType === 'all' ? 'Todos' : getTypeLabel(filterType)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterType('all')}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('house')}>
                    Casa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('apartment')}>
                    Apartamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('villa')}>
                    Villa
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
                    Activa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('pending')}>
                    Pendiente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('inactive')}>
                    Inactiva
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="font-['Poppins'] text-[#5F5F5F]">
            Lista de Propiedades ({filteredProperties.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F2E8CF]/30">
                  <TableHead className="text-[#5F5F5F]">Propiedad</TableHead>
                  <TableHead className="text-[#5F5F5F]">Tipo</TableHead>
                  <TableHead className="text-[#5F5F5F]">Propietario</TableHead>
                  <TableHead className="text-[#5F5F5F]">Estado</TableHead>
                  <TableHead className="text-[#5F5F5F]">Precio/noche</TableHead>
                  <TableHead className="text-[#5F5F5F]">Valoración</TableHead>
                  <TableHead className="text-[#5F5F5F]">Reservas</TableHead>
                  <TableHead className="text-[#5F5F5F]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id} className="hover:bg-[#F2E8CF]/20">
                    <TableCell>
                      <div>
                        <p className="text-[#5F5F5F]">{property.title}</p>
                        <p className="text-sm text-[#5F5F5F]/60 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.location}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(property.type)}>
                        {getTypeLabel(property.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">{property.owner}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(property.status)}>
                        {getStatusLabel(property.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">
                      ${property.price}
                    </TableCell>
                    <TableCell>
                      {property.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-[#5F5F5F]">
                            {property.rating} ({property.reviews})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#5F5F5F]/60">Sin valoraciones</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">{property.bookings}</TableCell>
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
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
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

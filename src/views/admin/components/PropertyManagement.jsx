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
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function PropertyManagement({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [properties, setProperties] = useState([]);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // Carga propiedades y total de reservas por propiedad para construir la vista.
  const loadProperties = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const [propertiesResult, bookingsResult] = await Promise.all([
        supabase
          .from('propiedad')
          .select('id_propiedad,descripcion,direccion,precio,estado,resena,id_arrendatario,arrendatario:arrendatario(nombre)'),
        supabase.from('reserva').select('id_propiedad'),
      ]);

      if (propertiesResult.error || bookingsResult.error) {
        const messages = [propertiesResult.error, bookingsResult.error]
          .filter(Boolean)
          .map((item) => item.message)
          .join(' | ');
        setErrorMessage(`Carga parcial de propiedades. ${messages}`);
      }

      const bookingCountMap = (bookingsResult.data || []).reduce((acc, booking) => {
        const key = String(booking.id_propiedad);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const normalizedProperties = (propertiesResult.data || []).map((item) => ({
        id: item.id_propiedad,
        descripcion: item.descripcion,
        direccion: item.direccion,
        precio: Number(item.precio || 0),
        estado: item.estado || 'sin_estado',
        resena: item.resena || 'Sin reseña',
        arrendatario: item.arrendatario?.nombre || `Arrendatario #${item.id_arrendatario}`,
        reservas: bookingCountMap[String(item.id_propiedad)] || 0,
      }));

      setProperties(normalizedProperties);
    } catch (error) {
      setErrorMessage(error.message || 'No se pudieron cargar las propiedades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // Filtra propiedades por texto y por estado seleccionado en la UI.
  const filteredProperties = useMemo(() => properties.filter((property) => {
    const matchesSearch =
      property.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.arrendatario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || property.estado.toLowerCase().includes(filterStatus.toLowerCase());
    return matchesSearch && matchesStatus;
  }), [properties, searchTerm, filterStatus]);

  // Asigna el color del badge según el estado de la propiedad.
  const getStatusBadgeColor = (status) => {
    if (status.toLowerCase().includes('disponible')) return 'bg-green-100 text-green-700';
    if (status.toLowerCase().includes('ocup')) return 'bg-yellow-100 text-yellow-700';
    if (status.toLowerCase().includes('inact')) return 'bg-gray-200 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Elimina la propiedad seleccionada y actualiza el listado local.
  const deleteProperty = async () => {
    if (!deleteCandidate) return;
    const { error } = await supabase
      .from('propiedad')
      .delete()
      .eq('id_propiedad', deleteCandidate.id);

    if (error) {
      setErrorMessage(`No se pudo eliminar la propiedad. ${error.message}`);
      setDeleteCandidate(null);
      return;
    }

    setProperties((prev) => prev.filter((item) => item.id !== deleteCandidate.id));
    setDeleteCandidate(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-2">
            Gestión de Propiedades
          </h1>
          <p className="text-[#5F5F5F]/70">
            Propiedades reales desde la tabla propiedad
          </p>
        </div>
        <Button onClick={loadProperties} variant="outline" className="border-gray-200" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {errorMessage && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-sm text-yellow-800">{errorMessage}</CardContent>
        </Card>
      )}

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
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                className={filterStatus === 'all' ? 'bg-[#6B8E23] text-white' : 'border-gray-200'}
                onClick={() => setFilterStatus('all')}
              >
                <Filter className="w-4 h-4 mr-2" />
                Todos
              </Button>
              <Button
                variant={filterStatus === 'disponible' ? 'default' : 'outline'}
                className={filterStatus === 'disponible' ? 'bg-[#6B8E23] text-white' : 'border-gray-200'}
                onClick={() => setFilterStatus('disponible')}
              >
                Disponible
              </Button>
              <Button
                variant={filterStatus === 'ocupada' ? 'default' : 'outline'}
                className={filterStatus === 'ocupada' ? 'bg-[#6B8E23] text-white' : 'border-gray-200'}
                onClick={() => setFilterStatus('ocupada')}
              >
                Ocupada
              </Button>
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
                  <TableHead className="text-[#5F5F5F]">Arrendatario</TableHead>
                  <TableHead className="text-[#5F5F5F]">Estado</TableHead>
                  <TableHead className="text-[#5F5F5F]">Precio</TableHead>
                  <TableHead className="text-[#5F5F5F]">Reservas</TableHead>
                  <TableHead className="text-[#5F5F5F]">Reseña</TableHead>
                  <TableHead className="text-[#5F5F5F]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id} className="hover:bg-[#F2E8CF]/20">
                    <TableCell>
                      <div>
                        <p className="text-[#5F5F5F]">{property.descripcion}</p>
                        <p className="text-sm text-[#5F5F5F]/60 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.direccion}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">{property.arrendatario}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(property.estado)}>
                        {property.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">
                      ${property.precio.toLocaleString('es-MX')}
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">{property.reservas}</TableCell>
                    <TableCell className="text-[#5F5F5F]">{property.resena}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => setDeleteCandidate(property)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#333]">Confirmar eliminación</h2>
            <p className="mt-3 text-sm text-[#555]">
              ¿Seguro quieres eliminar la propiedad <strong>{deleteCandidate.descripcion}</strong>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteCandidate(null)}>
                Cancelar
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={deleteProperty}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

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

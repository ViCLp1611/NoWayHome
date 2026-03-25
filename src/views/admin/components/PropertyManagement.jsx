import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
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
  Pencil,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { recordAdminActivity } from '@/views/admin/utils/adminActivity';

const DEFAULT_STATUS_OPTIONS = ['Disponible', 'Ocupado', 'Mantenimiento', 'Inactiva'];

const normalizeStatusValue = (status) => {
  const trimmedStatus = String(status || '').trim().toLowerCase();

  if (trimmedStatus === 'disponible') return 'Disponible';
  if (trimmedStatus === 'ocupado' || trimmedStatus === 'ocupada') return 'Ocupado';
  if (trimmedStatus === 'mantenimiento') return 'Mantenimiento';
  if (trimmedStatus === 'inactiva' || trimmedStatus === 'inactivo') return 'Inactiva';

  return trimmedStatus;
};

export function PropertyManagement({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [properties, setProperties] = useState([]);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [editCandidate, setEditCandidate] = useState(null);
  const [editForm, setEditForm] = useState({ descripcion: '', direccion: '', estado: '' });
  const [editErrors, setEditErrors] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
      filterStatus === 'all'
      || normalizeStatusValue(property.estado).toLowerCase() === normalizeStatusValue(filterStatus).toLowerCase();
    return matchesSearch && matchesStatus;
  }), [properties, searchTerm, filterStatus]);

  const statusOptions = useMemo(() => {
    const allStatuses = [
      ...DEFAULT_STATUS_OPTIONS,
      ...properties.map((property) => normalizeStatusValue(property.estado)),
    ].filter(Boolean);

    return allStatuses.reduce((acc, status) => {
      const normalizedStatus = normalizeStatusValue(status);

      if (!acc.some((item) => normalizeStatusValue(item) === normalizedStatus)) {
        acc.push(normalizedStatus);
      }

      return acc;
    }, []);
  }, [properties]);

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
    const propertyToDelete = deleteCandidate;

    const { error } = await supabase
      .from('propiedad')
      .delete()
      .eq('id_propiedad', propertyToDelete.id);

    if (error) {
      setErrorMessage(`No se pudo eliminar la propiedad. ${error.message}`);
      setDeleteCandidate(null);
      return;
    }

    setProperties((prev) => prev.filter((item) => item.id !== propertyToDelete.id));
    recordAdminActivity({
      type: 'Propiedad eliminada',
      user: `${propertyToDelete.descripcion} · ${propertyToDelete.direccion}`,
      status: 'warning',
      source: 'propiedades',
    });
    setDeleteCandidate(null);
  };

  const openEditModal = (property) => {
    setEditCandidate(property);
    setEditForm({
      descripcion: property.descripcion || '',
      direccion: property.direccion || '',
      estado: property.estado || '',
    });
    setEditErrors({});
  };

  const closeEditModal = (force = false) => {
    if (isSavingEdit && !force) return;
    setEditCandidate(null);
    setEditErrors({});
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (editErrors[field] || editErrors.form) {
      setEditErrors((prev) => ({
        ...prev,
        [field]: '',
        form: '',
      }));
    }
  };

  const validateEditForm = () => {
    const nextErrors = {};

    if (!editForm.descripcion.trim()) {
      nextErrors.descripcion = 'La descripción es obligatoria.';
    }

    if (!editForm.direccion.trim()) {
      nextErrors.direccion = 'La dirección es obligatoria.';
    }

    if (!editForm.estado.trim()) {
      nextErrors.estado = 'Seleccione un estado.';
    }

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const savePropertyChanges = async () => {
    if (!editCandidate || !validateEditForm()) return;

    const propertyId = editCandidate.id;
    const payload = {
      descripcion: editForm.descripcion.trim(),
      direccion: editForm.direccion.trim(),
      estado: normalizeStatusValue(editForm.estado),
    };

    setIsSavingEdit(true);

    const { data: updatedRows, error } = await supabase
      .from('propiedad')
      .update(payload)
      .eq('id_propiedad', propertyId)
      .select('id_propiedad,descripcion,direccion,estado');

    if (error) {
      setEditErrors((prev) => ({
        ...prev,
        form: `No se pudo actualizar la propiedad. ${error.message}`,
      }));
      setIsSavingEdit(false);
      return;
    }

    if (!updatedRows || updatedRows.length === 0) {
      const { data: existingProperty, error: checkError } = await supabase
        .from('propiedad')
        .select('id_propiedad')
        .eq('id_propiedad', propertyId)
        .maybeSingle();

      const saveErrorMessage = checkError
        ? `No se guardaron cambios en la base de datos. ${checkError.message}`
        : existingProperty
          ? 'No se guardaron cambios porque tu rol no tiene permiso UPDATE en RLS para la tabla propiedad.'
          : 'No se guardaron cambios porque la propiedad no existe o cambió su identificador.';

      setEditErrors((prev) => ({
        ...prev,
        form: saveErrorMessage,
      }));
      setIsSavingEdit(false);
      return;
    }

    const updatedProperty = updatedRows[0];

    setProperties((prev) => prev.map((item) => (
      item.id === propertyId
        ? {
          ...item,
          descripcion: updatedProperty.descripcion,
          direccion: updatedProperty.direccion,
          estado: updatedProperty.estado,
        }
        : item
    )));

    recordAdminActivity({
      type: 'Propiedad actualizada',
      user: `${updatedProperty.descripcion} · ${updatedProperty.direccion}`,
      status: 'success',
      source: 'propiedades',
    });

    await loadProperties();
    setIsSavingEdit(false);
    closeEditModal(true);
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
                variant={filterStatus === 'ocupado' ? 'default' : 'outline'}
                className={filterStatus === 'ocupado' ? 'bg-[#6B8E23] text-white' : 'border-gray-200'}
                onClick={() => setFilterStatus('ocupado')}
              >
                Ocupado
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
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-200"
                          onClick={() => openEditModal(property)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => setDeleteCandidate(property)}
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

      {editCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#333]">Editar propiedad</h2>
            <p className="mt-2 text-sm text-[#555]">
              Solo se pueden modificar la descripción, la dirección y el estado.
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#5F5F5F]" htmlFor="property-description">
                  Descripción
                </label>
                <Textarea
                  id="property-description"
                  value={editForm.descripcion}
                  onChange={(event) => handleEditChange('descripcion', event.target.value)}
                  className="min-h-[120px] bg-[#FAFAFA] border-gray-200"
                  placeholder="Describe la propiedad"
                  disabled={isSavingEdit}
                />
                {editErrors.descripcion && (
                  <p className="text-sm text-red-600">{editErrors.descripcion}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#5F5F5F]" htmlFor="property-address">
                  Dirección
                </label>
                <Input
                  id="property-address"
                  value={editForm.direccion}
                  onChange={(event) => handleEditChange('direccion', event.target.value)}
                  className="bg-[#FAFAFA] border-gray-200"
                  placeholder="Dirección completa"
                  disabled={isSavingEdit}
                />
                {editErrors.direccion && (
                  <p className="text-sm text-red-600">{editErrors.direccion}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#5F5F5F]" htmlFor="property-status">
                  Estado
                </label>
                <select
                  id="property-status"
                  value={editForm.estado}
                  onChange={(event) => handleEditChange('estado', event.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-[#FAFAFA] px-3 py-2 text-sm text-[#5F5F5F]"
                  disabled={isSavingEdit}
                >
                  <option value="">Seleccione un estado</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {editErrors.estado && (
                  <p className="text-sm text-red-600">{editErrors.estado}</p>
                )}
              </div>

              {editErrors.form && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editErrors.form}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={closeEditModal} disabled={isSavingEdit}>
                Cancelar
              </Button>
              <Button className="bg-[#6B8E23] hover:bg-[#5a7a1d]" onClick={savePropertyChanges} disabled={isSavingEdit}>
                {isSavingEdit ? 'Guardando...' : 'Guardar cambios'}
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

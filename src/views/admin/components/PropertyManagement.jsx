// Este componente es la vista principal para la gestión de propiedades en el panel de administración.
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { ActionMenu } from '@/app/components/ActionMenu';
// Componentes de tabla reutilizables para mostrar la lista de propiedades.
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
// Iconos para la interfaz de usuario.
import {
  Search,
  Filter,
  MapPin,
  RefreshCw,
} from 'lucide-react';
// Utilidades para interactuar con Supabase y registrar actividad administrativa.
import { supabase } from '@/lib/supabaseClient';
import { recordAdminActivity } from '@/views/admin/utils/adminActivity';
import { ConfirmActionModal } from './ConfirmActionModal';
import { getAdminPropertiesData } from '@/services/adminDataService';

/*
|--------------------------------------------------------------------------
| Gestion de propiedades admin
|--------------------------------------------------------------------------
| Consume GET /api/admin/properties-data mediante adminDataService.
| Espera propiedades, reservas por propiedad y datos del arrendatario.
|
| Seguridad:
| - El backend debe validar rol administrador antes de consultar Supabase.
| - Las operaciones directas de edicion/eliminacion deben respetar RLS.
*/

// Componente principal de la gestión de propiedades, que incluye funcionalidades para listar, buscar, filtrar, editar y eliminar propiedades.
const DEFAULT_STATUS_OPTIONS = ['Disponible', 'Ocupado', 'Mantenimiento', 'Inactiva'];

// Función para normalizar los valores de estado, asegurando que diferentes variantes de texto se muestren de manera consistente en la interfaz.
const normalizeStatusValue = (status) => {
  const trimmedStatus = String(status || '').trim().toLowerCase();

  if (trimmedStatus === 'disponible') return 'Disponible';
  if (trimmedStatus === 'ocupado' || trimmedStatus === 'ocupada') return 'Ocupado';
  if (trimmedStatus === 'mantenimiento') return 'Mantenimiento';
  if (trimmedStatus === 'inactiva' || trimmedStatus === 'inactivo') return 'Inactiva';

  return trimmedStatus;
};

const getPropertyTitle = (description) => {
  const lines = String(description || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines[0] || 'Propiedad sin título';
};
// Componente principal de la gestión de propiedades, que incluye funcionalidades para listar, buscar, filtrar, editar y eliminar propiedades.
export function PropertyManagement({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

// Realizamos dos consultas paralelas: una para obtener las propiedades con su información relacionada y otra para contar las reservas por propiedad,
//  luego combinamos los resultados para mostrar la información completa en la tabla.
    try {
      const propertiesData = await getAdminPropertiesData();
      const propertiesResult = { error: null };
      const bookingsResult = { error: null };

  // Si alguna de las consultas tiene error, mostramos un mensaje de error pero intentamos mostrar los datos que sí se pudieron cargar.
      if (propertiesResult.error || bookingsResult.error) {
        const messages = [propertiesResult.error, bookingsResult.error]
          .filter(Boolean)
          .map((item) => item.message)
          .join(' | ');
        setErrorMessage(`Carga parcial de propiedades. ${messages}`);
      }
// Construimos un mapa de conteo de reservas por propiedad para luego agregar esa información a cada propiedad en la lista.
      const bookingCountMap = (propertiesData.bookings || []).reduce((acc, booking) => {
        const key = String(booking.id_propiedad);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

// Normalizamos los datos de propiedades para asegurarnos de que tengan un formato consistente, incluyendo el nombre del arrendatario y el conteo de reservas.
      const normalizedProperties = (propertiesData.properties || []).map((item) => ({
        id: item.id_propiedad,
        descripcion: item.descripcion,
        direccion: item.direccion,
        precio: Number(item.precio || 0),
        estado: item.estado || 'sin_estado',
        resena: item.resena || 'Sin reseña',
        arrendatario: item.arrendatario?.nombre || `Arrendatario #${item.id_arrendatario}`,
        reservas: bookingCountMap[String(item.id_propiedad)] || 0,
      }));

// Ordenamos las propiedades por fecha de creación para mostrar las más recientes primero.
      setProperties(normalizedProperties);
    } catch (error) {
      setErrorMessage(error.message || 'No se pudieron cargar las propiedades.');
    } finally {
      setLoading(false);
    }
  };
// Cargamos las propiedades al montar el componente y también configuramos un listener para recargar los datos cuando se actualice la actividad administrativa desde otras vistas.
  useEffect(() => {
    loadProperties();
  }, []);

  // Filtra propiedades por texto y por estado seleccionado en la UI.
  const filteredProperties = useMemo(() => properties.filter((property) => {
    const matchesSearch =
      property.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.arrendatario.toLowerCase().includes(searchTerm.toLowerCase());

  // Para el filtro de estado, normalizamos tanto el valor del estado de la propiedad como el valor del filtro para evitar problemas de mayúsculas, minúsculas o espacios adicionales.  
      const matchesStatus =
      filterStatus === 'all'
      || normalizeStatusValue(property.estado).toLowerCase() === normalizeStatusValue(filterStatus).toLowerCase();
    return matchesSearch && matchesStatus;
  }), [properties, searchTerm, filterStatus]);

// Construimos una lista de opciones de estado para el filtro, combinando los estados por defecto con los estados únicos encontrados en las propiedades cargadas, asegurándonos de normalizarlos para evitar duplicados visuales.
  const statusOptions = useMemo(() => {
    const allStatuses = [
      ...DEFAULT_STATUS_OPTIONS,
      ...properties.map((property) => normalizeStatusValue(property.estado)),
    ].filter(Boolean);

// Reducimos la lista de estados a un conjunto único de opciones normalizadas para mostrar en el filtro, evitando que variantes del mismo estado aparezcan como opciones separadas.
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
// Actualizamos la lista de propiedades localmente para reflejar la eliminación sin necesidad de recargar toda la lista desde el backend, y registramos la actividad administrativa.
    setProperties((prev) => prev.filter((item) => item.id !== propertyToDelete.id));
    setSuccessMessage('Propiedad eliminada correctamente.');
    recordAdminActivity({
      type: 'Propiedad eliminada',
      user: `${propertyToDelete.descripcion} · ${propertyToDelete.direccion}`,
      status: 'warning',
      source: 'propiedades',
    });
    setDeleteCandidate(null);
  };
// Abre el modal de edición y carga la información de la propiedad seleccionada para editar.
  const openEditModal = (property) => {
    setEditCandidate(property);
    setSuccessMessage('');
    setEditForm({
      descripcion: property.descripcion || '',
      direccion: property.direccion || '',
      estado: property.estado || '',
    });
    setEditErrors({});
  };
// Cierra el modal de edición, con una opción para forzar el cierre incluso si se está guardando la información.
  const closeEditModal = (force = false) => {
    if (isSavingEdit && !force) return;
    setEditCandidate(null);
    setEditErrors({});
  };

// Maneja los cambios en el formulario de edición, actualizando el estado local y limpiando errores relacionados con el campo modificado.
  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));

// Si hay errores relacionados con el campo que se está modificando, los limpiamos para dar feedback al usuario de que el error se está resolviendo.
    if (editErrors[field] || editErrors.form) {
      setEditErrors((prev) => ({
        ...prev,
        [field]: '',
        form: '',
      }));
    }
  };

  // Función de validación del formulario de edición que verifica que los campos obligatorios estén completos antes de permitir guardar los cambios.
  const validateEditForm = () => {
    const nextErrors = {};

    // Validamos que la descripción, dirección y estado no estén vacíos, mostrando mensajes de error específicos para cada campo si es necesario.
    if (!editForm.descripcion.trim()) {
      nextErrors.descripcion = 'La descripción es obligatoria.';
    }

    // Validamos que la dirección no esté vacía, mostrando un mensaje de error si es necesario.
    if (!editForm.direccion.trim()) {
      nextErrors.direccion = 'La dirección es obligatoria.';
    }

// Validamos que el estado no esté vacío, mostrando un mensaje de error si es necesario.
    if (!editForm.estado.trim()) {
      nextErrors.estado = 'Seleccione un estado.';
    }

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

// Función para guardar los cambios realizados en la propiedad editada, que incluye validación, actualización en el backend y manejo de errores específicos relacionados con permisos o existencia de la propiedad.
  const savePropertyChanges = async () => {
    if (!editCandidate || !validateEditForm()) return;

    // Preparamos el payload con los datos editados, normalizando el estado para asegurar consistencia en la base de datos.
    const propertyId = editCandidate.id;
    const payload = {
      descripcion: editForm.descripcion.trim(),
      direccion: editForm.direccion.trim(),
      estado: normalizeStatusValue(editForm.estado),
    };

    setIsSavingEdit(true);
// Intentamos actualizar la propiedad en el backend, manejando errores específicos para mostrar mensajes claros al usuario en caso de que la actualización falle por permisos, existencia de la propiedad o problemas de conexión.
    const { data: updatedRows, error } = await supabase
      .from('propiedad')
      .update(payload)
      .eq('id_propiedad', propertyId)
      .select('id_propiedad,descripcion,direccion,estado');

// Si hay un error en la actualización, mostramos un mensaje de error específico y no cerramos el modal para que el usuario pueda intentar corregirlo o reintentar guardar.
    if (error) {
      setEditErrors((prev) => ({
        ...prev,
        form: `No se pudo actualizar la propiedad. ${error.message}`,
      }));
      setIsSavingEdit(false);
      return;
    }
// Si no se actualizó ninguna fila, es posible que la propiedad haya sido eliminada o que el usuario no tenga permisos UPDATE en RLS, por lo que mostramos un mensaje de error específico para esa situación.
    if (!updatedRows || updatedRows.length === 0) {
      const { data: existingProperty, error: checkError } = await supabase
        .from('propiedad')
        .select('id_propiedad')
        .eq('id_propiedad', propertyId)
        .maybeSingle();
// Construimos un mensaje de error específico dependiendo de si la propiedad existe pero no se pudo actualizar por permisos, o si la propiedad no existe en absoluto, para dar feedback claro al usuario sobre lo que ocurrió.
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
// Si la actualización fue exitosa, actualizamos la lista de propiedades localmente para reflejar los cambios sin necesidad de recargar toda la lista desde el backend, y registramos la actividad administrativa.
    const updatedProperty = updatedRows[0];

// Actualizamos la propiedad editada en la lista localmente para reflejar los cambios sin necesidad de recargar toda la lista desde el backend, y registramos la actividad administrativa.
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
// Registramos la actividad administrativa de actualización de propiedad, incluyendo el nombre y dirección de la propiedad para dar contexto sobre qué propiedad fue editada.
    recordAdminActivity({
      type: 'Propiedad actualizada',
      user: `${updatedProperty.descripcion} · ${updatedProperty.direccion}`,
      status: 'success',
      source: 'propiedades',
    });

    await loadProperties();
    setIsSavingEdit(false);
    closeEditModal(true);
    setSuccessMessage('Propiedad actualizada correctamente.');
  };
  // Renderiza la vista de gestión de propiedades.
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
        <Button onClick={loadProperties} variant="adminSecondary" size="admin" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
      {/* Mensaje de error cuando falla la carga o una operación. */}
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
                variant={filterStatus === 'all' ? 'adminPrimary' : 'adminSecondary'}
                size="admin"
                onClick={() => setFilterStatus('all')}
              >
                <Filter className="w-4 h-4 mr-2" />
                Todos
              </Button>
              <Button
                variant={filterStatus === 'disponible' ? 'adminPrimary' : 'adminSecondary'}
                size="admin"
                onClick={() => setFilterStatus('disponible')}
              >
                Disponible
              </Button>
              <Button
                variant={filterStatus === 'ocupado' ? 'adminPrimary' : 'adminSecondary'}
                size="admin"
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
                {filteredProperties.map((property) => {
                  const propertyTitle = getPropertyTitle(property.descripcion);
                  const propertyLocation = property.direccion || 'Ubicación no disponible';

                  return (
                  <TableRow key={property.id} className="hover:bg-[#F2E8CF]/20">
                    <TableCell>
                      <div className="max-w-[340px]">
                        <p className="truncate font-medium text-[#5F5F5F]" title={propertyTitle}>
                          {propertyTitle}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-sm text-[#5F5F5F]/60">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate" title={propertyLocation}>{propertyLocation}</span>
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
                      <ActionMenu
                        label={`Acciones de ${propertyTitle}`}
                        actions={[
                          {
                            label: 'Editar',
                            variant: 'edit',
                            onClick: () => openEditModal(property),
                          },
                          {
                            label: 'Eliminar',
                            variant: 'danger',
                            onClick: () => setDeleteCandidate(property),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmActionModal
        open={Boolean(deleteCandidate)}
        title="Eliminar propiedad"
        description={(
          <p>
            Â¿Seguro quieres eliminar la propiedad <strong>{deleteCandidate?.descripcion}</strong>?
          </p>
        )}
        cancelLabel="Cancelar"
        confirmLabel="Eliminar"
        confirmVariant="adminDanger"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={deleteProperty}
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
        open={Boolean(successMessage)}
        type="success"
        title="Accion completada"
        description={successMessage}
        confirmLabel="Entendido"
        onConfirm={() => setSuccessMessage('')}
      />

      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#333]">Confirmar eliminación</h2>
            <p className="mt-3 text-sm text-[#555]">
              ¿Seguro quieres eliminar la propiedad <strong>{deleteCandidate.descripcion}</strong>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="adminSecondary" size="admin" onClick={() => setDeleteCandidate(null)}>
                Cancelar
              </Button>
              <Button variant="adminDanger" size="admin" onClick={deleteProperty}>
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
              <Button variant="adminSecondary" size="admin" onClick={closeEditModal} disabled={isSavingEdit}>
                Cancelar
              </Button>
              <Button variant="adminPrimary" size="admin" onClick={savePropertyChanges} disabled={isSavingEdit}>
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

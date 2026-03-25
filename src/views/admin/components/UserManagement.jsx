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
import { Search, RefreshCw, Users, Home, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function UserManagement({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState({ nombre: '', correo: '', telefono: '' });
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // Detecta mensajes de permisos para mostrar una ayuda rápida de RLS.
  const getRlsHint = (message) => {
    const text = String(message || '').toLowerCase();
    if (
      text.includes('permission denied') ||
      text.includes('row-level security') ||
      text.includes('rls')
    ) {
      return 'Parece un problema de permisos RLS. Ejecuta setup-users-rls.sql en Supabase SQL Editor y recarga esta vista.';
    }
    return '';
  };

  const getDeleteHint = (message) => {
    const text = String(message || '').toLowerCase();

    if (
      text.includes('violates foreign key constraint') ||
      text.includes('foreign key') ||
      text.includes('is still referenced')
    ) {
      return 'Este usuario tiene relaciones activas (mensajes, contratos, propiedades o reservas). Se deben eliminar primero para completar el borrado.';
    }

    return getRlsHint(message);
  };

  // Carga usuarios y actividad relacionada desde Supabase, unificando fuentes en una lista.
  const loadUsers = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const [
        inquilinosResult,
        arrendatariosResult,
        propertiesResult,
        bookingsResult,
      ] = await Promise.all([
        supabase.from('inquilino').select('id_inquilino,nombre,correo,telefono'),
        supabase.from('arrendatario').select('id_arrendatario,nombre,correo,telefono'),
        supabase.from('propiedad').select('id_propiedad,id_arrendatario'),
        supabase.from('reserva').select('id_propiedad,id_inquilino,fecha_inicio'),
      ]);

      const hardErrors = [
        inquilinosResult.error,
        arrendatariosResult.error,
        propertiesResult.error,
        bookingsResult.error,
      ].some(Boolean);

      if (hardErrors) {
        const messages = [
          inquilinosResult.error,
          arrendatariosResult.error,
          propertiesResult.error,
          bookingsResult.error,
        ]
          .filter(Boolean)
          .map((item) => item.message)
          .join(' | ');
        const rlsHint = getRlsHint(messages);
        setErrorMessage(
          `Carga parcial de usuarios. ${messages}${rlsHint ? ` | ${rlsHint}` : ''}`
        );
      }

      const propertyCountMap = (propertiesResult.data || []).reduce((acc, property) => {
        const key = String(property.id_arrendatario);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const bookingCountMap = (bookingsResult.data || []).reduce((acc, booking) => {
        const key = String(booking.id_inquilino);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const inquilinos = (inquilinosResult.data || []).map((item) => ({
        key: `inquilino-${item.id_inquilino}`,
        entityType: 'inquilino',
        entityId: item.id_inquilino,
        nombre: item.nombre,
        correo: item.correo,
        telefono: item.telefono,
        rol: 'guest',
        actividad: bookingCountMap[String(item.id_inquilino)] || 0,
        source: 'inquilino',
      }));

      const arrendatarios = (arrendatariosResult.data || []).map((item) => ({
        key: `arrendatario-${item.id_arrendatario}`,
        entityType: 'arrendatario',
        entityId: item.id_arrendatario,
        nombre: item.nombre,
        correo: item.correo,
        telefono: item.telefono,
        rol: 'host',
        actividad: propertyCountMap[String(item.id_arrendatario)] || 0,
        source: 'arrendatario',
      }));

      setUsers([...arrendatarios, ...inquilinos]);
    } catch (error) {
      setErrorMessage(error.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Aplica búsqueda por texto y filtro de rol sobre la lista cargada.
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const text = searchTerm.toLowerCase();
      const matchesSearch =
        String(user.nombre || '').toLowerCase().includes(text) ||
        String(user.correo || '').toLowerCase().includes(text) ||
        String(user.telefono || '').toLowerCase().includes(text);
      const matchesRole = filterRole === 'all' || user.rol === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  // Calcula las métricas que se muestran en las tarjetas superiores.
  const stats = useMemo(() => {
    const totalUsuarios = users.length;
    const totalArrendatarios = users.filter((user) => user.rol === 'host').length;
    const totalInquilinos = users.filter((user) => user.rol === 'guest').length;
    const actividadTotal = users.reduce((acc, user) => acc + Number(user.actividad || 0), 0);

    return {
      totalUsuarios,
      totalArrendatarios,
      totalInquilinos,
      actividadTotal,
    };
  }, [users]);

  // Convierte el rol técnico a una etiqueta legible para UI.
  const getRoleLabel = (role) => {
    if (role === 'host') return 'Arrendatario';
    return 'Inquilino';
  };

  // Define el color del badge según el tipo de usuario.
  const getRoleBadgeColor = (role) =>
    role === 'host' ? 'bg-[#6B8E23] text-white' : 'bg-[#A67C52] text-white';

  // Inicia modo edición precargando los datos del usuario seleccionado.
  const startEdit = (user) => {
    setEditingId(user.key);
    setEditForm({
      nombre: user.nombre || '',
      correo: user.correo || '',
      telefono: user.telefono || '',
    });
  };

  // Cancela la edición y limpia el formulario temporal.
  const cancelEdit = () => {
    setEditingId('');
    setEditForm({ nombre: '', correo: '', telefono: '' });
  };

  // Guarda cambios del usuario en la tabla correspondiente según su origen.
  const saveEdit = async (user) => {
    const table = user.entityType;
    const idField =
      user.entityType === 'arrendatario'
        ? 'id_arrendatario'
        : 'id_inquilino';

    const payload = {
      nombre: editForm.nombre,
      correo: editForm.correo,
      telefono: editForm.telefono,
    };

    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq(idField, user.entityId);

    if (error) {
      setErrorMessage(`No se pudo actualizar el usuario. ${error.message}`);
      return;
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.key === user.key
          ? {
              ...item,
              nombre: editForm.nombre,
              correo: editForm.correo,
              telefono: editForm.telefono,
            }
          : item
      )
    );
    cancelEdit();
  };

  // Elimina el usuario confirmado desde la tabla correspondiente.
  const confirmDelete = async () => {
    if (!deleteCandidate) return;

    setErrorMessage('');

    try {
      if (deleteCandidate.entityType === 'inquilino') {
        const { error: deleteMessagesError } = await supabase
          .from('mensaje')
          .delete()
          .eq('id_inquilino', deleteCandidate.entityId);

        if (deleteMessagesError) {
          throw deleteMessagesError;
        }

        const { error: deleteContractsError } = await supabase
          .from('contrato')
          .delete()
          .eq('id_inquilino', deleteCandidate.entityId);

        if (deleteContractsError) {
          throw deleteContractsError;
        }

        const { error: deleteBookingsError } = await supabase
          .from('reserva')
          .delete()
          .eq('id_inquilino', deleteCandidate.entityId);

        if (deleteBookingsError) {
          throw deleteBookingsError;
        }

        const { error: deleteTenantError } = await supabase
          .from('inquilino')
          .delete()
          .eq('id_inquilino', deleteCandidate.entityId);

        if (deleteTenantError) {
          throw deleteTenantError;
        }
      } else if (deleteCandidate.entityType === 'arrendatario') {
        const { data: ownedProperties, error: ownedPropertiesError } = await supabase
          .from('propiedad')
          .select('id_propiedad')
          .eq('id_arrendatario', deleteCandidate.entityId);

        if (ownedPropertiesError) {
          throw ownedPropertiesError;
        }

        const propertyIds = (ownedProperties || []).map((item) => item.id_propiedad);

        if (propertyIds.length > 0) {
          const { error: deleteRelatedMessagesError } = await supabase
            .from('mensaje')
            .delete()
            .in('id_propiedad', propertyIds);

          if (deleteRelatedMessagesError) {
            throw deleteRelatedMessagesError;
          }

          const { error: deleteRelatedContractsError } = await supabase
            .from('contrato')
            .delete()
            .in('id_propiedad', propertyIds);

          if (deleteRelatedContractsError) {
            throw deleteRelatedContractsError;
          }

          const { error: deleteRelatedBookingsError } = await supabase
            .from('reserva')
            .delete()
            .in('id_propiedad', propertyIds);

          if (deleteRelatedBookingsError) {
            throw deleteRelatedBookingsError;
          }
        }

        const { error: deletePropertiesError } = await supabase
          .from('propiedad')
          .delete()
          .eq('id_arrendatario', deleteCandidate.entityId);

        if (deletePropertiesError) {
          throw deletePropertiesError;
        }

        const { error: deleteHostError } = await supabase
          .from('arrendatario')
          .delete()
          .eq('id_arrendatario', deleteCandidate.entityId);

        if (deleteHostError) {
          throw deleteHostError;
        }
      } else {
        throw new Error('Tipo de usuario no soportado para eliminación.');
      }

      setUsers((prev) => prev.filter((user) => user.key !== deleteCandidate.key));
      setDeleteCandidate(null);
    } catch (error) {
      const hint = getDeleteHint(error?.message);
      setErrorMessage(`No se pudo eliminar el usuario. ${error?.message || 'Error desconocido.'}${hint ? ` | ${hint}` : ''}`);
      setDeleteCandidate(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-2">Gestión de Usuarios</h1>
          <p className="text-[#5F5F5F]/70">Inquilinos y arrendatarios cargados desde la base de datos</p>
        </div>
        <Button onClick={loadUsers} variant="outline" className="border-gray-200" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {errorMessage && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-sm text-yellow-800">{errorMessage}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#F2E8CF] border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5F5F5F]/70">Total usuarios</p>
                <p className="text-2xl font-['Poppins'] font-semibold text-[#5F5F5F]">
                  {stats.totalUsuarios}
                </p>
              </div>
              <Users className="w-8 h-8 text-[#A67C52]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F2E8CF] border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5F5F5F]/70">Arrendatarios</p>
                <p className="text-2xl font-['Poppins'] font-semibold text-[#5F5F5F]">
                  {stats.totalArrendatarios}
                </p>
              </div>
              <Home className="w-8 h-8 text-[#6B8E23]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F2E8CF] border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5F5F5F]/70">Inquilinos</p>
                <p className="text-2xl font-['Poppins'] font-semibold text-[#5F5F5F]">
                  {stats.totalInquilinos}
                </p>
              </div>
              <Users className="w-8 h-8 text-[#5F5F5F]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F2E8CF] border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5F5F5F]/70">Actividad total</p>
                <p className="text-2xl font-['Poppins'] font-semibold text-[#5F5F5F]">
                  {stats.actividadTotal}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-[#A67C52]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5F5F5F]/40" />
              <Input
                placeholder="Buscar por nombre, correo o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#FAFAFA] border-gray-200"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterRole === 'all' ? 'default' : 'outline'}
                className={filterRole === 'all' ? 'bg-[#6B8E23] text-white' : 'border-gray-200'}
                onClick={() => setFilterRole('all')}
              >
                Todos
              </Button>
              <Button
                variant={filterRole === 'host' ? 'default' : 'outline'}
                className={filterRole === 'host' ? 'bg-[#6B8E23] text-white' : 'border-gray-200'}
                onClick={() => setFilterRole('host')}
              >
                Arrendatarios
              </Button>
              <Button
                variant={filterRole === 'guest' ? 'default' : 'outline'}
                className={filterRole === 'guest' ? 'bg-[#6B8E23] text-white' : 'border-gray-200'}
                onClick={() => setFilterRole('guest')}
              >
                Inquilinos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="font-['Poppins'] text-[#5F5F5F]">Lista de Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F2E8CF]/30">
                  <TableHead className="text-[#5F5F5F]">Usuario</TableHead>
                  <TableHead className="text-[#5F5F5F]">Rol</TableHead>
                  <TableHead className="text-[#5F5F5F]">Teléfono</TableHead>
                  <TableHead className="text-[#5F5F5F]">Actividad</TableHead>
                  <TableHead className="text-[#5F5F5F]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.key} className="hover:bg-[#F2E8CF]/20">
                    <TableCell>
                      {editingId === user.key ? (
                        <div className="space-y-2">
                          <Input
                            value={editForm.nombre}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, nombre: e.target.value }))}
                          />
                          <Input
                            value={editForm.correo}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, correo: e.target.value }))}
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="text-[#5F5F5F]">{user.nombre}</p>
                          <p className="text-sm text-[#5F5F5F]/60">{user.correo}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.rol)}>{getRoleLabel(user.rol)}</Badge>
                    </TableCell>
                    <TableCell>
                      {editingId === user.key ? (
                        <Input
                          value={editForm.telefono}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, telefono: e.target.value }))}
                        />
                      ) : (
                        <span className="text-[#5F5F5F]">{user.telefono}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">
                      {user.rol === 'host'
                        ? `${user.actividad} propiedades`
                        : user.rol === 'guest'
                        ? `${user.actividad} reservas`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {editingId === user.key ? (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => saveEdit(user)}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(user)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => setDeleteCandidate(user)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
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
              ¿Seguro quieres eliminar a <strong>{deleteCandidate.nombre}</strong>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteCandidate(null)}>
                Cancelar
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

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

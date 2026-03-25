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
import { Search, RefreshCw, Users, Home, Calendar, UserPlus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ConfirmActionModal } from './ConfirmActionModal';
import { recordAdminActivity } from '@/views/admin/utils/adminActivity';

const initialCreateForm = {
  tipo: 'inquilino',
  nombre: '',
  correo: '',
  telefono: '',
  contrasena: '',
  confirmarContrasena: '',
};

const initialCreateErrors = {
  tipo: '',
  nombre: '',
  correo: '',
  telefono: '',
  contrasena: '',
  confirmarContrasena: '',
};

const initialEditErrors = {
  nombre: '',
  correo: '',
  telefono: '',
};

export function UserManagement({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState({ nombre: '', correo: '', telefono: '' });
  const [editErrors, setEditErrors] = useState(initialEditErrors);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateConfirmModal, setShowCreateConfirmModal] = useState(false);
  const [editConfirmCandidate, setEditConfirmCandidate] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createErrors, setCreateErrors] = useState(initialCreateErrors);

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
    setSuccessMessage('');

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
    setEditConfirmCandidate(null);
    setErrorMessage('');
    setSuccessMessage('');
    setEditErrors(initialEditErrors);
    setEditForm({
      nombre: user.nombre || '',
      correo: user.correo || '',
      telefono: user.telefono || '',
    });
  };

  // Cancela la edición y limpia el formulario temporal.
  const cancelEdit = () => {
    setEditingId('');
    setEditConfirmCandidate(null);
    setEditErrors(initialEditErrors);
    setEditForm({ nombre: '', correo: '', telefono: '' });
  };

  const validatePersonalData = ({ nombre, correo, telefono }) => {
    const errors = {
      nombre: '',
      correo: '',
      telefono: '',
    };

    const safeNombre = String(nombre || '').trim();
    const safeCorreo = String(correo || '').trim();
    const safeTelefono = String(telefono || '').trim();

    if (!safeNombre) {
      errors.nombre = 'El nombre es obligatorio.';
    } else if (safeNombre.length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (!safeCorreo) {
      errors.correo = 'El correo es obligatorio.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(safeCorreo)) {
        errors.correo = 'El formato del correo no es valido.';
      }
    }

    if (safeTelefono) {
      const phoneRegex = /^\+?[\d\s()\-]{7,20}$/;
      if (!phoneRegex.test(safeTelefono)) {
        errors.telefono = 'Ingresa un telefono valido (7-20 digitos).';
      }
    }

    return errors;
  };

  const hasErrors = (errors) => Object.values(errors).some(Boolean);

  // Guarda cambios del usuario en la tabla correspondiente según su origen.
  const saveEdit = async (user) => {
    const nextValues = {
      nombre: editForm.nombre.trim(),
      correo: editForm.correo.trim(),
      telefono: editForm.telefono.trim(),
    };

    const validationErrors = validatePersonalData(nextValues);
    if (hasErrors(validationErrors)) {
      setEditErrors(validationErrors);
      setErrorMessage('Revisa los campos marcados antes de guardar.');
      setSuccessMessage('');
      return;
    }

    const table = user.entityType;
    const idField =
      user.entityType === 'arrendatario'
        ? 'id_arrendatario'
        : 'id_inquilino';

    const payload = {
      nombre: nextValues.nombre,
      correo: nextValues.correo,
      telefono: nextValues.telefono,
    };

    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq(idField, user.entityId);

    if (error) {
      setErrorMessage(`No se pudo actualizar el usuario. ${error.message}`);
      setSuccessMessage('');
      return;
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.key === user.key
          ? {
              ...item,
              nombre: nextValues.nombre,
              correo: nextValues.correo,
              telefono: nextValues.telefono || '-',
            }
          : item
      )
    );
    setErrorMessage('');
    setSuccessMessage('Usuario actualizado correctamente.');
    recordAdminActivity({
      type: 'Usuario actualizado',
      user: `${nextValues.nombre} · ${nextValues.correo}`,
      status: 'success',
      source: 'usuarios',
    });
    cancelEdit();
    setEditConfirmCandidate(null);
  };

  const requestEditConfirmation = (user) => {
    const nextValues = {
      nombre: editForm.nombre.trim(),
      correo: editForm.correo.trim(),
      telefono: editForm.telefono.trim(),
    };

    const validationErrors = validatePersonalData(nextValues);
    if (hasErrors(validationErrors)) {
      setEditErrors(validationErrors);
      setErrorMessage('Revisa los campos marcados antes de guardar.');
      setSuccessMessage('');
      return;
    }

    setErrorMessage('');
    setEditConfirmCandidate(user);
  };

  // Elimina el usuario confirmado desde la tabla correspondiente.
  const confirmDelete = async () => {
    if (!deleteCandidate) return;

    const deletedUser = deleteCandidate;

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

      setUsers((prev) => prev.filter((user) => user.key !== deletedUser.key));
      recordAdminActivity({
        type: 'Usuario eliminado',
        user: `${deletedUser.nombre} · ${deletedUser.correo}`,
        status: 'warning',
        source: 'usuarios',
      });
      setDeleteCandidate(null);
    } catch (error) {
      const hint = getDeleteHint(error?.message);
      setErrorMessage(`No se pudo eliminar el usuario. ${error?.message || 'Error desconocido.'}${hint ? ` | ${hint}` : ''}`);
      setDeleteCandidate(null);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setShowCreateConfirmModal(false);
    setCreateForm(initialCreateForm);
    setCreateErrors(initialCreateErrors);
  };

  const validateCreateForm = (form) => {
    const errors = { ...initialCreateErrors };
    const nombre = form.nombre.trim();
    const correo = form.correo.trim();
    const telefono = form.telefono.trim();

    if (form.tipo !== 'inquilino' && form.tipo !== 'arrendatario') {
      errors.tipo = 'Selecciona un tipo de usuario valido.';
    }

    if (!nombre) {
      errors.nombre = 'El nombre es obligatorio.';
    } else if (nombre.length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (!correo) {
      errors.correo = 'El correo es obligatorio.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        errors.correo = 'El formato del correo no es valido.';
      }
    }

    if (telefono) {
      const phoneRegex = /^\+?[\d\s()\-]{7,20}$/;
      if (!phoneRegex.test(telefono)) {
        errors.telefono = 'Ingresa un telefono valido (7-20 digitos).';
      }
    }

    if (!form.contrasena) {
      errors.contrasena = 'La contrasena es obligatoria.';
    } else if (form.contrasena.length < 6) {
      errors.contrasena = 'La contrasena debe tener al menos 6 caracteres.';
    }

    if (!form.confirmarContrasena) {
      errors.confirmarContrasena = 'Confirma la contrasena.';
    } else if (form.contrasena !== form.confirmarContrasena) {
      errors.confirmarContrasena = 'Las contrasenas no coinciden.';
    }

    return errors;
  };

  const handleCreateFieldChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setCreateErrors((prev) => ({ ...prev, [field]: '' }));
    setShowCreateConfirmModal(false);
  };

  const requestCreateConfirmation = () => {
    const validationErrors = validateCreateForm(createForm);
    const hasValidationErrors = Object.values(validationErrors).some(Boolean);
    if (hasValidationErrors) {
      setCreateErrors(validationErrors);
      setErrorMessage('Revisa los campos marcados en el formulario.');
      setSuccessMessage('');
      return;
    }

    setErrorMessage('');
    setShowCreateConfirmModal(true);
  };

  // Crea un usuario en inquilino o arrendatario sin datos de actividad relacionados.
  const createUser = async () => {
    const nombre = createForm.nombre.trim();
    const correo = createForm.correo.trim();
    const telefono = createForm.telefono.trim();
    const contrasena = createForm.contrasena;

    const table = createForm.tipo === 'arrendatario' ? 'arrendatario' : 'inquilino';
    const idField = table === 'arrendatario' ? 'id_arrendatario' : 'id_inquilino';

    setCreating(true);
    setErrorMessage('');

    const { data, error } = await supabase
      .from(table)
      .insert({ nombre, correo, telefono: telefono || null, contrasena })
      .select(idField)
      .single();

    setCreating(false);

    if (error) {
      const rlsHint = getRlsHint(error.message);
      setErrorMessage(
        `No se pudo crear el usuario. ${error.message}${rlsHint ? ` | ${rlsHint}` : ''}`
      );
      setSuccessMessage('');
      setShowCreateConfirmModal(false);
      return;
    }

    const entityId = data?.[idField];
    const isHost = table === 'arrendatario';

    setUsers((prev) => [
      {
        key: `${table}-${entityId}`,
        entityType: table,
        entityId,
        nombre,
        correo,
        telefono: telefono || '-',
        rol: isHost ? 'host' : 'guest',
        actividad: 0,
        source: table,
      },
      ...prev,
    ]);

    closeCreateModal();
    setErrorMessage('');
    setSuccessMessage('Usuario agregado correctamente.');
    recordAdminActivity({
      type: 'Usuario agregado',
      user: `${nombre} · ${correo}`,
      status: 'success',
      source: 'usuarios',
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-2">Gestión de Usuarios</h1>
          <p className="text-[#5F5F5F]/70">Inquilinos y arrendatarios cargados desde la base de datos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)} className="bg-[#6B8E23] hover:bg-[#5a7a1d] text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar usuario
          </Button>
          <Button onClick={loadUsers} variant="outline" className="border-gray-200" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-sm text-yellow-800">{errorMessage}</CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-sm text-green-800">{successMessage}</CardContent>
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
                            className={editErrors.nombre ? 'border-red-400 focus-visible:ring-red-300' : ''}
                            value={editForm.nombre}
                            onChange={(e) => {
                              setEditForm((prev) => ({ ...prev, nombre: e.target.value }));
                              setEditErrors((prev) => ({ ...prev, nombre: '' }));
                            }}
                          />
                          {editErrors.nombre && (
                            <p className="text-xs text-red-600">{editErrors.nombre}</p>
                          )}
                          <Input
                            className={editErrors.correo ? 'border-red-400 focus-visible:ring-red-300' : ''}
                            value={editForm.correo}
                            onChange={(e) => {
                              setEditForm((prev) => ({ ...prev, correo: e.target.value }));
                              setEditErrors((prev) => ({ ...prev, correo: '' }));
                            }}
                          />
                          {editErrors.correo && (
                            <p className="text-xs text-red-600">{editErrors.correo}</p>
                          )}
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
                          className={editErrors.telefono ? 'border-red-400 focus-visible:ring-red-300' : ''}
                          value={editForm.telefono}
                          onChange={(e) => {
                            setEditForm((prev) => ({ ...prev, telefono: e.target.value }));
                            setEditErrors((prev) => ({ ...prev, telefono: '' }));
                          }}
                        />
                      ) : (
                        <span className="text-[#5F5F5F]">{user.telefono}</span>
                      )}
                      {editingId === user.key && editErrors.telefono && (
                        <p className="mt-1 text-xs text-red-600">{editErrors.telefono}</p>
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
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => requestEditConfirmation(user)}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-gray-200" onClick={() => startEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
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

      <ConfirmActionModal
        open={Boolean(deleteCandidate)}
        title="Confirmar eliminación"
        description={(
          <p>
            ¿Seguro quieres eliminar a <strong>{deleteCandidate?.nombre}</strong>?
          </p>
        )}
        cancelLabel="Cancelar"
        confirmLabel="Eliminar"
        confirmButtonClassName="bg-red-600 hover:bg-red-700"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmActionModal
        open={Boolean(editConfirmCandidate)}
        title="Confirmar cambios"
        description={(
          <p>
            ¿Seguro quieres guardar los cambios de <strong>{editConfirmCandidate?.nombre}</strong>?
          </p>
        )}
        cancelLabel="Cancelar"
        confirmLabel="Confirmar"
        confirmButtonClassName="bg-[#6B8E23] hover:bg-[#5a7a1d]"
        onCancel={() => setEditConfirmCandidate(null)}
        onConfirm={() => saveEdit(editConfirmCandidate)}
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#333]">Agregar usuario</h2>
            <p className="mt-2 text-sm text-[#555]">
              Crea un inquilino o arrendatario con datos personales (sin reservas ni propiedades).
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm text-[#5F5F5F]">Tipo de usuario</label>
                <select
                  className={`w-full rounded-md border bg-[#FAFAFA] px-3 py-2 text-sm text-[#5F5F5F] ${createErrors.tipo ? 'border-red-400' : 'border-gray-200'}`}
                  value={createForm.tipo}
                  onChange={(e) => handleCreateFieldChange('tipo', e.target.value)}
                >
                  <option value="inquilino">Inquilino</option>
                  <option value="arrendatario">Arrendatario</option>
                </select>
                {createErrors.tipo && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.tipo}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#5F5F5F]">Nombre</label>
                <Input
                  className={createErrors.nombre ? 'border-red-400 focus-visible:ring-red-300' : ''}
                  value={createForm.nombre}
                  onChange={(e) => handleCreateFieldChange('nombre', e.target.value)}
                  placeholder="Nombre completo"
                />
                {createErrors.nombre && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.nombre}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#5F5F5F]">Correo</label>
                <Input
                  type="email"
                  className={createErrors.correo ? 'border-red-400 focus-visible:ring-red-300' : ''}
                  value={createForm.correo}
                  onChange={(e) => handleCreateFieldChange('correo', e.target.value)}
                  placeholder="correo@dominio.com"
                />
                {createErrors.correo && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.correo}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#5F5F5F]">Telefono</label>
                <Input
                  className={createErrors.telefono ? 'border-red-400 focus-visible:ring-red-300' : ''}
                  value={createForm.telefono}
                  onChange={(e) => handleCreateFieldChange('telefono', e.target.value)}
                  placeholder="Opcional"
                />
                {createErrors.telefono && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.telefono}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#5F5F5F]">Contrasena</label>
                <Input
                  type="password"
                  className={createErrors.contrasena ? 'border-red-400 focus-visible:ring-red-300' : ''}
                  value={createForm.contrasena}
                  onChange={(e) => handleCreateFieldChange('contrasena', e.target.value)}
                  placeholder="Minimo 6 caracteres"
                />
                {createErrors.contrasena && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.contrasena}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#5F5F5F]">Confirmar contrasena</label>
                <Input
                  type="password"
                  className={createErrors.confirmarContrasena ? 'border-red-400 focus-visible:ring-red-300' : ''}
                  value={createForm.confirmarContrasena}
                  onChange={(e) => handleCreateFieldChange('confirmarContrasena', e.target.value)}
                  placeholder="Repite la contrasena"
                />
                {createErrors.confirmarContrasena && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.confirmarContrasena}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeCreateModal} disabled={creating}>
                Cancelar
              </Button>
              <Button className="bg-[#6B8E23] hover:bg-[#5a7a1d] text-white" onClick={requestCreateConfirmation} disabled={creating}>
                {creating ? 'Guardando...' : 'Crear usuario'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionModal
        open={showCreateConfirmModal}
        title="Confirmar alta de usuario"
        description={(
          <p>
            ¿Seguro quieres agregar a <strong>{createForm.nombre.trim() || 'este usuario'}</strong> como{' '}
            <strong>{createForm.tipo === 'arrendatario' ? 'arrendatario' : 'inquilino'}</strong>?
          </p>
        )}
        cancelLabel="Cancelar"
        confirmLabel={creating ? 'Guardando...' : 'Confirmar'}
        confirmButtonClassName="bg-[#6B8E23] hover:bg-[#5a7a1d] text-white"
        disableCancel={creating}
        disableConfirm={creating}
        onCancel={() => setShowCreateConfirmModal(false)}
        onConfirm={createUser}
      />

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

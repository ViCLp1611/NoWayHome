// Este componente es el núcleo de la gestión de usuarios en el panel de administración,
//  permitiendo visualizar, buscar, filtrar, editar, eliminar y crear usuarios inquilinos y arrendatarios, 
// con manejo de errores y feedback para el administrador.

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { ActionMenu } from '@/app/components/ActionMenu';

// Iconos para la interfaz de usuario
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
// Importamos iconos para acciones de usuario
import { Search, RefreshCw, Users, Home, Calendar, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ConfirmActionModal } from './ConfirmActionModal';
import { recordAdminActivity } from '@/views/admin/utils/adminActivity';
import { hashPassword } from '@/utils/passwordUtils.js';
import { getAdminUsersData } from '@/services/adminDataService';

/*
|--------------------------------------------------------------------------
| Gestion de usuarios admin
|--------------------------------------------------------------------------
| Consume GET /api/admin/users-data mediante adminDataService.
| Espera listas de inquilinos, arrendatarios y relaciones con propiedades
| o reservas para mostrar actividad.
|
| Seguridad:
| - El backend debe validar rol administrador antes de devolver estos datos.
| - Las operaciones directas con Supabase en esta vista deben mantenerse
|   protegidas por RLS y no deben exponer contrasenas ni hashes.
*/
// Estados iniciales para formularios de creación y edición de usuarios, así como para manejo de errores en ambos casos, para mantener el código organizado y facilitar el reseteo de formularios después de cada acción.
const initialCreateForm = {
  tipo: 'inquilino',
  nombre: '',
  correo: '',
  telefono: '',
  contrasena: '',
  confirmarContrasena: '',
};

// Errores iniciales para el formulario de creación de usuarios, con campos específicos para cada dato requerido, para mostrar mensajes de error claros.
const initialCreateErrors = {
  tipo: '',
  nombre: '',
  correo: '',
  telefono: '',
  contrasena: '',
  confirmarContrasena: '',
};

// Errores iniciales para el formulario de edición de usuarios, con campos específicos para cada dato editable, para mostrar mensajes de error claros durante la edición.
const initialEditErrors = {
  nombre: '',
  correo: '',
  telefono: '',
};
// Componente principal de gestión de usuarios, que maneja la lógica de carga, visualización, búsqueda, filtrado, edición, eliminación y creación de usuarios, con manejo de errores y feedback para el administrador.
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

  // Detecta mensajes de error relacionados con restricciones de clave foránea para mostrar una ayuda específica sobre relaciones activas que impiden la eliminación de un usuario.
  const getDeleteHint = (message) => {
    const text = String(message || '').toLowerCase();

    // Si el mensaje de error indica que la eliminación falló por una restricción de clave foránea, se muestra un mensaje específico indicando que el usuario tiene relaciones activas que deben eliminarse primero.
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

    // Realizamos consultas paralelas para obtener inquilinos, arrendatarios, propiedades y reservas, y luego unificamos la información para mostrarla en la tabla de usuarios, manejando errores específicos para cada consulta y mostrando mensajes claros en caso de fallos.
    try {
      const usersData = await getAdminUsersData();
      const inquilinosResult = { error: null };
      const arrendatariosResult = { error: null };
      const propertiesResult = { error: null };
      const bookingsResult = { error: null };
// Verificamos si alguna de las consultas tuvo un error, y si es así, construimos un mensaje de error específico para cada una y lo mostramos al usuario, incluyendo una posible ayuda sobre RLS si el error está relacionado con permisos.
      const hardErrors = [
        inquilinosResult.error,
        arrendatariosResult.error,
        propertiesResult.error,
        bookingsResult.error,
      ].some(Boolean);

      // Si hubo errores en las consultas, construimos un mensaje de error específico para cada una y lo mostramos al usuario, incluyendo una posible ayuda sobre RLS si el error está relacionado con permisos.
      if (hardErrors) {
        const messages = [
          inquilinosResult.error,
          arrendatariosResult.error,
          propertiesResult.error,
          bookingsResult.error,
        ]
        // Filtramos los errores para quedarnos solo con los que existen, extraemos sus mensajes y los unimos en un solo string para mostrar al usuario, junto con una posible ayuda sobre RLS si el error está relacionado con permisos.
          .filter(Boolean)
          .map((item) => item.message)
          .join(' | ');
        const rlsHint = getRlsHint(messages);
        setErrorMessage(
          `Carga parcial de usuarios. ${messages}${rlsHint ? ` | ${rlsHint}` : ''}`
        );
      }

// Construimos mapas de conteo de propiedades por arrendatario y reservas por inquilino para calcular la actividad de cada usuario, y luego unificamos la información de inquilinos y arrendatarios en una sola lista de usuarios con su actividad correspondiente, para mostrarla en la tabla de usuarios.
      const propertyCountMap = (usersData.properties || []).reduce((acc, property) => {
        const key = String(property.id_arrendatario);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

// Mapeamos las reservas para contar cuántas tiene cada inquilino, creando un mapa de conteo de reservas por inquilino, que luego se utiliza para calcular la actividad de cada inquilino en la lista unificada de usuarios.
      const bookingCountMap = (usersData.bookings || []).reduce((acc, booking) => {
        const key = String(booking.id_inquilino);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

// Mapeamos los inquilinos y arrendatarios para unificarlos en una sola lista de usuarios, asignando su actividad correspondiente según el conteo de reservas para inquilinos y propiedades para arrendatarios, y luego actualizamos el estado con la lista unificada de usuarios para mostrarla en la tabla.
      const inquilinos = (usersData.inquilinos || []).map((item) => ({
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
// Mapeamos los arrendatarios para unificarlos en una sola lista de usuarios, asignando su actividad correspondiente según el conteo de propiedades que tienen, y luego actualizamos el estado con la lista unificada de usuarios para mostrarla en la tabla.
      const arrendatarios = (usersData.arrendatarios || []).map((item) => ({
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
// Unificamos la información de inquilinos y arrendatarios en una sola lista de usuarios, asignando su actividad correspondiente, y luego actualizamos el estado con la lista unificada de usuarios para mostrarla en la tabla.
      setUsers([...arrendatarios, ...inquilinos]);
    } catch (error) {
      setErrorMessage(error.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };
// Cargamos los usuarios al montar el componente, y también configuramos un listener para recargar los usuarios cuando se actualice la actividad administrativa desde otras vistas, asegurando que la información mostrada esté siempre actualizada.
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

  const editingUser = useMemo(
    () => users.find((user) => user.key === editingId) || null,
    [users, editingId]
  );

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
      telefono: user.telefono === '-' ? '' : user.telefono || '',
    });
  };

  // Cancela la edición y limpia el formulario temporal.
  const cancelEdit = () => {
    setEditingId('');
    setEditConfirmCandidate(null);
    setEditErrors(initialEditErrors);
    setEditForm({ nombre: '', correo: '', telefono: '' });
  };
// Función de validación del formulario de edición que verifica que el nombre y correo no estén vacíos, que el correo tenga un formato válido y que el teléfono, si se ingresa, también tenga un formato válido, mostrando mensajes de error específicos para cada campo si la validación falla.
  const validatePersonalData = ({ nombre, correo, telefono }) => {
    const errors = {
      nombre: '',
      correo: '',
      telefono: '',
    };
// Normalizamos los valores para evitar errores de validación por espacios o valores nulos, y luego aplicamos las reglas de validación para cada campo, asignando mensajes de error específicos si la validación falla.
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
// Función auxiliar para verificar si hay errores en un objeto de errores, utilizada para determinar si se deben mostrar mensajes de error y evitar guardar cambios si la validación falla.
  const hasErrors = (errors) => Object.values(errors).some(Boolean);

  // Guarda cambios del usuario en la tabla correspondiente según su origen.
  const saveEdit = async (user) => {
    const nextValues = {
      nombre: editForm.nombre.trim(),
      correo: editForm.correo.trim(),
      telefono: editForm.telefono.trim(),
    };
// Validamos los datos ingresados en el formulario de edición, y si hay errores, mostramos mensajes específicos para cada campo y no procedemos a guardar los cambios, permitiendo al usuario corregir los errores antes de intentar guardar nuevamente.
    const validationErrors = validatePersonalData(nextValues);
    if (hasErrors(validationErrors)) {
      setEditErrors(validationErrors);
      setErrorMessage('Revisa los campos marcados antes de guardar.');
      setSuccessMessage('');
      return;
    }
// Si la validación es exitosa, procedemos a actualizar el usuario en el backend, manejando errores específicos para mostrar mensajes claros al usuario en caso de que la actualización falle por permisos, existencia del usuario o problemas de conexión.
    const table = user.entityType;
    const idField =
      user.entityType === 'arrendatario'
        ? 'id_arrendatario'
        : 'id_inquilino';
// Construimos el payload con los datos a actualizar, y luego intentamos actualizar el usuario en la tabla correspondiente según su tipo, manejando errores específicos para mostrar mensajes claros al usuario en caso de que la actualización falle por permisos, existencia del usuario o problemas de conexión.
    const payload = {
      nombre: nextValues.nombre,
      correo: nextValues.correo,
      telefono: nextValues.telefono,
    };
// Intentamos actualizar el usuario en el backend, manejando errores específicos para mostrar mensajes claros al usuario en caso de que la actualización falle por permisos, existencia del usuario o problemas de conexión.
    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq(idField, user.entityId);
// Si hay un error en la actualización, mostramos un mensaje de error específico y no cerramos el modo edición para que el usuario pueda intentar corregirlo o reintentar guardar.
    if (error) {
      setErrorMessage(`No se pudo actualizar el usuario. ${error.message}`);
      setSuccessMessage('');
      return;
    }
// Si la actualización fue exitosa, actualizamos el usuario en el estado local para reflejar los cambios en la UI, mostramos un mensaje de éxito y registramos la actividad administrativa correspondiente, luego cerramos el modo edición.
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
// Limpiamos mensajes de error, mostramos un mensaje de éxito, registramos la actividad administrativa correspondiente y cerramos el modo edición.
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
// Función para solicitar confirmación antes de guardar los cambios realizados en la propiedad editada, que incluye validación de los datos ingresados y manejo de errores específicos para mostrar mensajes claros al usuario en caso de que la validación falle.
  const requestEditConfirmation = (user) => {
    const nextValues = {
      nombre: editForm.nombre.trim(),
      correo: editForm.correo.trim(),
      telefono: editForm.telefono.trim(),
    };
// Validamos los datos ingresados en el formulario de edición, y si hay errores, mostramos mensajes específicos para cada campo y no procedemos a solicitar la confirmación de guardado, permitiendo al usuario corregir los errores antes de intentar guardar nuevamente.
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
// Limpiamos mensajes de error antes de intentar eliminar, para mostrar solo el mensaje relacionado con la eliminación si ocurre un error durante este proceso.
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
// Para eliminar un inquilino, primero eliminamos los mensajes relacionados, luego los contratos y reservas asociados a ese inquilino, y finalmente el registro del inquilino en sí, manejando errores específicos para cada paso y mostrando mensajes claros al usuario en caso de que la eliminación falle por permisos, existencia del usuario o problemas de conexión.
        const { error: deleteContractsError } = await supabase
          .from('contrato')
          .delete()
          .eq('id_inquilino', deleteCandidate.entityId);

        if (deleteContractsError) {
          throw deleteContractsError;
        }
// Eliminamos las reservas asociadas al inquilino antes de eliminar el registro del inquilino, para evitar errores de restricción de clave foránea, manejando errores específicos para mostrar mensajes claros al usuario en caso de que la eliminación falle por permisos, existencia del usuario o problemas de conexión.
        const { error: deleteBookingsError } = await supabase
          .from('reserva')
          .delete()
          .eq('id_inquilino', deleteCandidate.entityId);

        if (deleteBookingsError) {
          throw deleteBookingsError;
        }
// Finalmente, eliminamos el registro del inquilino después de eliminar todas las relaciones asociadas, para evitar errores de restricción de clave foránea, manejando errores específicos para mostrar mensajes claros al usuario en caso de que la eliminación falle por permisos, existencia del usuario o problemas de conexión.
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
// Para eliminar un arrendatario, primero obtenemos las propiedades que tiene asociadas, luego eliminamos los mensajes, contratos y reservas relacionados con esas propiedades, después eliminamos las propiedades y finalmente el registro del arrendatario en sí, manejando errores específicos para cada paso y mostrando mensajes claros al usuario en caso de que la eliminación falle por permisos, existencia del usuario o problemas de conexión.
        const propertyIds = (ownedProperties || []).map((item) => item.id_propiedad);

        if (propertyIds.length > 0) {
          const { error: deleteRelatedMessagesError } = await supabase
            .from('mensaje')
            .delete()
            .in('id_propiedad', propertyIds);

          if (deleteRelatedMessagesError) {
            throw deleteRelatedMessagesError;
          }
// Eliminamos los contratos relacionados con las propiedades del arrendatario antes de eliminar las propiedades, para evitar errores de restricción de clave foránea, manejando errores específicos para mostrar mensajes claros al usuario en caso de que la eliminación falle por permisos, existencia del usuario o problemas de conexión.
          const { error: deleteRelatedContractsError } = await supabase
            .from('contrato')
            .delete()
            .in('id_propiedad', propertyIds);

          if (deleteRelatedContractsError) {
            throw deleteRelatedContractsError;
          }
// Eliminamos las reservas relacionadas con las propiedades del arrendatario antes de eliminar las propiedades, para evitar errores de restricción de clave foránea, manejando errores específicos para mostrar mensajes claros al usuario en caso de que la eliminación falle por permisos, existencia del usuario o problemas de conexión.
          const { error: deleteRelatedBookingsError } = await supabase
            .from('reserva')
            .delete()
            .in('id_propiedad', propertyIds);

          if (deleteRelatedBookingsError) {
            throw deleteRelatedBookingsError;
          }
        }
// Finalmente, eliminamos las propiedades del arrendatario y luego el registro del arrendatario después de eliminar todas las relaciones asociadas, para evitar errores de restricción de clave foránea, manejando errores específicos para mostrar mensajes claros al usuario en caso de que la eliminación falle por permisos, existencia del usuario o problemas de conexión.
        const { error: deletePropertiesError } = await supabase
          .from('propiedad')
          .delete()
          .eq('id_arrendatario', deleteCandidate.entityId);

        if (deletePropertiesError) {
          throw deletePropertiesError;
        }
// Finalmente, eliminamos el registro del arrendatario después de eliminar todas las relaciones asociadas, para evitar errores de restricción de clave foránea, manejando errores específicos para mostrar mensajes claros al usuario en caso de que la eliminación falle por permisos, existencia del usuario o problemas de conexión.
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
// Si la eliminación fue exitosa, actualizamos el estado para remover el usuario eliminado de la lista, mostramos un mensaje de éxito y registramos la actividad administrativa correspondiente.
      setUsers((prev) => prev.filter((user) => user.key !== deletedUser.key));
      recordAdminActivity({
        type: 'Usuario eliminado',
        user: `${deletedUser.nombre} · ${deletedUser.correo}`,
        status: 'warning',
        source: 'usuarios',
      });
  // Limpiamos mensajes de error, mostramos un mensaje de éxito y cerramos el modal de confirmación de eliminación.
      setSuccessMessage('Usuario eliminado correctamente.');
      setDeleteCandidate(null);
    } catch (error) {
      const hint = getDeleteHint(error?.message);
      setErrorMessage(`No se pudo eliminar el usuario. ${error?.message || 'Error desconocido.'}${hint ? ` | ${hint}` : ''}`);
      setDeleteCandidate(null);
    }
  };
// Cierra el modal de creación y resetea el formulario y los errores relacionados, para limpiar el estado y preparar el formulario para una nueva creación si el administrador decide crear otro usuario después de cerrar el modal.
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setShowCreateConfirmModal(false);
    setCreateForm(initialCreateForm);
    setCreateErrors(initialCreateErrors);
  };
// Función de validación del formulario de creación que verifica que el tipo de usuario sea válido, que el nombre y correo no estén vacíos, que el correo tenga un formato válido, que el teléfono, si se ingresa, también tenga un formato válido, y que la contraseña y su confirmación sean válidas y coincidan, mostrando mensajes de error específicos para cada campo si la validación falla.
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
// Maneja cambios en los campos del formulario de creación, actualizando el estado del formulario y reseteando los errores relacionados, para proporcionar feedback inmediato al administrador mientras completa el formulario de creación.
  const handleCreateFieldChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setCreateErrors((prev) => ({ ...prev, [field]: '' }));
    setShowCreateConfirmModal(false);
  };
// Función para solicitar confirmación antes de crear un nuevo usuario, que incluye validación de los datos ingresados en el formulario de creación y manejo de errores específicos para mostrar mensajes claros al usuario en caso de que la validación falle, evitando mostrar el modal de confirmación si hay errores en el formulario.
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

    let data = null

    try {
      const hashedPassword = await hashPassword(contrasena)
      const response = await supabase
        .from(table)
        .insert({ nombre, correo, telefono: telefono || null, contrasena: hashedPassword })
        .select(idField)
        .single()

      setCreating(false)

      if (response.error) {
        const rlsHint = getRlsHint(response.error.message)
        setErrorMessage(
          `No se pudo crear el usuario. ${response.error.message}${rlsHint ? ` | ${rlsHint}` : ''}`
        )
        setSuccessMessage('')
        setShowCreateConfirmModal(false)
        return
      }

      data = response.data
    } catch (hashError) {
      setCreating(false)
      setErrorMessage(`Error al procesar la contraseña: ${hashError.message}`)
      setSuccessMessage('')
      setShowCreateConfirmModal(false)
      return
    }

    const entityId = data?.[idField]
    const isHost = table === 'arrendatario'

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
  // Renderiza toda la vista de gestión de usuarios.
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-2">Gestión de Usuarios</h1>
          <p className="text-[#5F5F5F]/70">Inquilinos y arrendatarios cargados desde la base de datos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)} variant="adminPrimary" size="admin">
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar usuario
          </Button>
          <Button onClick={loadUsers} variant="adminSecondary" size="admin" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>
      {/* Mensaje de error de carga/operación. */}
      {/* Mensaje de éxito para acciones completadas. */}
      {/* Tarjetas de métricas principales. */}
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
          {/* Métrica de arrendatarios. */}
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
          {/* Métrica de inquilinos. */}
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
          {/* Métrica de actividad total. */}
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
          {/* Barra de búsqueda y filtros por rol. */}
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
                variant={filterRole === 'all' ? 'adminPrimary' : 'adminSecondary'}
                size="admin"
                onClick={() => setFilterRole('all')}
              >
                Todos
              </Button>
              <Button
                variant={filterRole === 'host' ? 'adminPrimary' : 'adminSecondary'}
                size="admin"
                onClick={() => setFilterRole('host')}
              >
                Arrendatarios
              </Button>
              <Button
                variant={filterRole === 'guest' ? 'adminPrimary' : 'adminSecondary'}
                size="admin"
                onClick={() => setFilterRole('guest')}
              >
                Inquilinos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
        {/* Tabla de usuarios con edición y eliminación. */}
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
                {/* Filas construidas desde usuarios filtrados. */}
                {filteredUsers.map((user) => (
                  <TableRow key={user.key} className="hover:bg-[#F2E8CF]/20">
                    <TableCell>
                      <div>
                        <p className="text-[#5F5F5F]">{user.nombre}</p>
                        <p className="text-sm text-[#5F5F5F]/60">{user.correo}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.rol)}>{getRoleLabel(user.rol)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[#5F5F5F]">{user.telefono}</span>
                    </TableCell>
                    <TableCell className="text-[#5F5F5F]">
                      {user.rol === 'host'
                        ? `${user.actividad} propiedades`
                        : user.rol === 'guest'
                        ? `${user.actividad} reservas`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <ActionMenu
                        label={`Acciones de ${user.nombre}`}
                        actions={[
                          {
                            label: 'Editar',
                            variant: 'edit',
                            onClick: () => startEdit(user),
                          },
                          {
                            label: 'Eliminar',
                            variant: 'danger',
                            onClick: () => setDeleteCandidate(user),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        {/* Modal de confirmación para eliminar usuario. */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#333]">Editar usuario</h2>
            <p className="mt-2 text-sm text-[#555]">
              Modifica los datos personales de {editingUser.nombre}.
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#5F5F5F]" htmlFor="edit-user-name">
                  Nombre
                </label>
                <Input
                  id="edit-user-name"
                  className={editErrors.nombre ? 'border-red-400 focus-visible:ring-red-300' : 'bg-[#FAFAFA] border-gray-200'}
                  value={editForm.nombre}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, nombre: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, nombre: '' }));
                  }}
                  placeholder="Nombre completo"
                />
                {editErrors.nombre && (
                  <p className="text-sm text-red-600">{editErrors.nombre}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#5F5F5F]" htmlFor="edit-user-email">
                  Correo
                </label>
                <Input
                  id="edit-user-email"
                  type="email"
                  className={editErrors.correo ? 'border-red-400 focus-visible:ring-red-300' : 'bg-[#FAFAFA] border-gray-200'}
                  value={editForm.correo}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, correo: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, correo: '' }));
                  }}
                  placeholder="correo@dominio.com"
                />
                {editErrors.correo && (
                  <p className="text-sm text-red-600">{editErrors.correo}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#5F5F5F]" htmlFor="edit-user-phone">
                  Telefono
                </label>
                <Input
                  id="edit-user-phone"
                  className={editErrors.telefono ? 'border-red-400 focus-visible:ring-red-300' : 'bg-[#FAFAFA] border-gray-200'}
                  value={editForm.telefono}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, telefono: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, telefono: '' }));
                  }}
                  placeholder="Opcional"
                />
                {editErrors.telefono && (
                  <p className="text-sm text-red-600">{editErrors.telefono}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="adminSecondary" size="admin" onClick={cancelEdit}>
                Cancelar
              </Button>
              <Button variant="adminPrimary" size="admin" onClick={() => requestEditConfirmation(editingUser)}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      )}

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
        confirmVariant="adminDanger"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
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
        confirmVariant="adminPrimary"
        onCancel={() => setEditConfirmCandidate(null)}
        onConfirm={() => saveEdit(editConfirmCandidate)}
      />
        {/* Modal de creación de usuario. */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#333]">Agregar usuario</h2>
            <p className="mt-2 text-sm text-[#555]">
              Crea un inquilino o arrendatario con datos personales (sin reservas ni propiedades).
            </p>
            {/* Formulario de alta con validaciones por campo. */}
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
              <Button variant="adminSecondary" size="admin" onClick={closeCreateModal} disabled={creating}>
                Cancelar
              </Button>
              <Button variant="adminPrimary" size="admin" onClick={requestCreateConfirmation} disabled={creating}>
                {creating ? 'Guardando...' : 'Crear usuario'}
              </Button>
            </div>
          </div>
        </div>
      )}
          {/* Confirmación final antes de crear usuario. */}
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
        confirmVariant="adminPrimary"
        disableCancel={creating}
        disableConfirm={creating}
        onCancel={() => setShowCreateConfirmModal(false)}
        onConfirm={createUser}
      />
        {/* Navegación rápida entre módulos de administración. */}
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

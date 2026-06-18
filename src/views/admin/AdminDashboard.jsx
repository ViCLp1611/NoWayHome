{/*Componente principal del panel de administración, que maneja la navegación entre las diferentes secciones
//  (dashboard, gestión de usuarios, propiedades y reservas) y el cierre de sesión, 
// utilizando un estado local para controlar la página actual y renderizando el contenido correspondiente según la selección del usuario, 
// proporcionando una experiencia de usuario fluida e intuitiva para los administradores de la plataforma. */}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { PropertyManagement } from './components/PropertyManagement';
import { BookingManagement } from './components/BookingManagement';

{/*// El componente AdminDashboard es el punto de entrada para el panel de administración,
//  que utiliza el AdminLayout para proporcionar una estructura consistente 
// y maneja la navegación entre las diferentes secciones del panel, así como el cierre de sesión. */}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const storedAdmin = sessionStorage.getItem('admin') || localStorage.getItem('admin');

    if (!storedAdmin) {
      navigate('/login');
    }
  }, [navigate]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'users':
        return <UserManagement onNavigate={setCurrentPage} />;
      case 'properties':
        return <PropertyManagement onNavigate={setCurrentPage} />;
      case 'bookings':
        return <BookingManagement onNavigate={setCurrentPage} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };
// Función para manejar el cierre de sesión, que elimina el token de administrador del almacenamiento local, restablece la página actual a dashboard y redirige al usuario a la página de inicio, proporcionando una experiencia de usuario segura y clara para cerrar sesión en el panel de administración.
  const handleLogout = () => {
    localStorage.removeItem('admin');
    sessionStorage.removeItem('admin');
    setCurrentPage('dashboard');
    navigate('/');
  };
{/*Renderizamos el AdminLayout con la página actual y las funciones de navegación y cierre de sesión, 
// y dentro del layout renderizamos el contenido correspondiente según la página seleccionada,
//  proporcionando una experiencia de usuario fluida e intuitiva para los administradores de la plataforma.*/}
  return (
    <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout}>
      {renderPage()}
    </AdminLayout>
  );
}

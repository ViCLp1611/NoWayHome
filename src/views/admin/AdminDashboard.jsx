import React, { useState } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { PropertyManagement } from './components/PropertyManagement';
import { BookingManagement } from './components/BookingManagement';

export default function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  console.log('AdminDashboard renderizando, currentPage:', currentPage);

  const renderPage = () => {
    console.log('Renderizando página:', currentPage);
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

  return (
    <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </AdminLayout>
  );
}

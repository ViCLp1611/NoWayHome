import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  Calendar, 
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export function AdminLayout({ children, currentPage, onNavigate, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', name: 'Usuarios', icon: Users },
    { id: 'properties', name: 'Propiedades', icon: Home },
    { id: 'bookings', name: 'Reservas', icon: Calendar },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
        <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F]">Admin Panel</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="lg:hidden"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F]">Admin Panel</h1>
          <p className="text-sm text-[#5F5F5F]/60 mt-1">Gestión del sistema</p>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'bg-[#6B8E23] text-white'
                      : 'text-[#5F5F5F] hover:bg-[#F2E8CF]'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-['Inter']">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (onLogout) onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#5F5F5F] hover:bg-[#F2E8CF] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-['Inter']">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}

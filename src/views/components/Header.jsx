import { Home, User, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Header({ onNavigate, currentPage, isLoggedIn }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (page) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-[#6B8E23]/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavigation('home')}
            className="font-poppins font-semibold text-xl md:text-2xl text-[#6B8E23] hover:text-[#5a7a1e] transition-colors"
          >
            NoWayHome
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => handleNavigation('home')}
              className={`flex items-center gap-2 text-[#5F5F5F] hover:text-[#6B8E23] transition-colors ${
                currentPage === 'home' ? 'text-[#6B8E23] font-medium' : ''
              }`}
            >
              <Home className="h-5 w-5" />
              Inicio
            </button>

            {isLoggedIn ? (
              <button
                onClick={() => handleNavigation('profile')}
                className={`flex items-center gap-2 text-[#5F5F5F] hover:text-[#6B8E23] transition-colors ${
                  currentPage === 'profile' ? 'text-[#6B8E23] font-medium' : ''
                }`}
              >
                <User className="h-5 w-5" />
                Perfil
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation('login')}
                  className={`flex items-center gap-2 text-[#5F5F5F] hover:text-[#6B8E23] transition-colors ${
                    currentPage === 'login' ? 'text-[#6B8E23] font-medium' : ''
                  }`}
                >
                  <LogIn className="h-5 w-5" />
                  Iniciar Sesión
                </button>

                <Button
                  onClick={() => handleNavigation('register')}
                  className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl"
                >
                  Registrarse
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-[#5F5F5F] hover:text-[#6B8E23] transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[#6B8E23]/10">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleNavigation('home')}
                className={`flex items-center gap-2 text-[#5F5F5F] hover:text-[#6B8E23] transition-colors py-2 ${
                  currentPage === 'home' ? 'text-[#6B8E23] font-medium' : ''
                }`}
              >
                <Home className="h-5 w-5" />
                Inicio
              </button>

              {isLoggedIn ? (
                <button
                  onClick={() => handleNavigation('profile')}
                  className={`flex items-center gap-2 text-[#5F5F5F] hover:text-[#6B8E23] transition-colors py-2 ${
                    currentPage === 'profile' ? 'text-[#6B8E23] font-medium' : ''
                  }`}
                >
                  <User className="h-5 w-5" />
                  Perfil
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation('login')}
                    className={`flex items-center gap-2 text-[#5F5F5F] hover:text-[#6B8E23] transition-colors py-2 ${
                      currentPage === 'login' ? 'text-[#6B8E23] font-medium' : ''
                    }`}
                  >
                    <LogIn className="h-5 w-5" />
                    Iniciar Sesión
                  </button>

                  <Button
                    onClick={() => handleNavigation('register')}
                    className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl w-full"
                  >
                    Registrarse
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
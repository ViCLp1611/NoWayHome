import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/app/components/ui/button'

export function UserNavbar() {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleNavigation = path => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('user')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-[#6B8E23]/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button className="font-poppins font-semibold text-xl md:text-2xl text-[#6B8E23] hover:text-[#5a7a1e] transition-colors">
            NoWayHome
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button
              onClick={handleLogout}
              className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-[#5F5F5F] hover:text-[#6B8E23] transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[#6B8E23]/10">
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleLogout}
                className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl w-full justify-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

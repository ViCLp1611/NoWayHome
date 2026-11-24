import { Home, LogOut, Menu, User, X } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  {
    label: 'Explorar',
    path: '/inquilino/explorar',
    icon: Home,
  },
  {
    label: 'Perfil',
    path: '/inquilino/perfil',
    icon: User,
  },
]

export function InquilinoNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const activePath = path => location.pathname === path

  const handleNavigation = path => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    sessionStorage.clear()
    localStorage.clear()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl shadow-sm shadow-slate-900/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => handleNavigation('/inquilino/explorar')}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-foreground shadow-sm shadow-slate-900/5 transition duration-200 hover:text-primary-ink focus:outline-none"
        >
          <Home className="h-4 w-4" />
          NoWayHome
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
            const isActive = activePath(path)
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleNavigation(path)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition duration-200 ${
                  isActive
                    ? 'text-primary-ink'
                    : 'text-foreground hover:text-primary-ink hover:bg-accent/10'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-foreground transition duration-200 hover:bg-accent/15 hover:text-primary-ink"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </nav>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition duration-200 hover:border-primary-ink hover:text-primary-ink md:hidden"
          aria-label="Abrir menú"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
              const isActive = activePath(path)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleNavigation(path)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition duration-200 ${
                    isActive
                      ? 'bg-accent/10 text-primary-ink'
                      : 'text-foreground hover:bg-accent/10 hover:text-primary-ink'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-2xl bg-accent/10 px-4 py-3 text-foreground transition duration-200 hover:bg-accent/15 hover:text-primary-ink"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

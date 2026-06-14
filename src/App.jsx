import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header } from '@/views/components/Header'
import { HomePage } from '@/views/pages/HomePage'
import { LoginPage } from '@/views/pages/LoginPage'
import { RegisterPage } from '@/views/pages/RegisterPage'
import { InquilinoPage } from '@/views/inquilino/pages/InquilinoPage' // Ruta actualizada al nuevo directorio user
import AdminDashboard from '@/views/admin/AdminDashboard'
import { AdminLogin } from '@/views/admin/AdminLogin'

// Nuevas importaciones para el Arrendatario (Anfitrión)
import { HostProtectedRoute } from '@/routes/HostProtectedRoute'
import { ArrendatarioLayout } from '@/views/arrendatario/ArrendatarioLayout'
import { ArrendatarioDashboard } from '@/views/arrendatario/ArrendatarioDashboard'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Header />
                <HomePage />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <Header />
                <LoginPage />
              </>
            }
          />
          <Route
            path="/register"
            element={
              <>
                <Header />
                <RegisterPage />
              </>
            }
          />
          <Route
            path="/inquilino"
            element={
              // Se remueve el <Header /> público ya que ProfilePage ahora incluye su propio <UserNavbar />
              <InquilinoPage />
            }
          />

          {/* RUTAS DE ADMINISTRADOR */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* NUEVAS RUTAS DE ARRENDATARIO (Anfitrión Protegido) */}
          <Route path="/arrendatario" element={<HostProtectedRoute />}>
            <Route element={<ArrendatarioLayout />}>
              <Route index element={<ArrendatarioDashboard />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

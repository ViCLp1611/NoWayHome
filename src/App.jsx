import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from '@/views/components/Header'
import { HomePage } from '@/views/pages/HomePage'
import { LoginPage } from '@/views/pages/LoginPage'
import { RegisterPage } from '@/views/pages/RegisterPage'
import { ForgotPassword } from '@/views/pages/ForgotPassword'
import { ResetPassword } from '@/views/pages/ResetPassword'
import { UpdatePassword } from '@/views/pages/UpdatePassword'
import AdminDashboard from '@/views/admin/AdminDashboard'

// Importaciones corregidas con extensión .jsx explícita y rutas exactas
import { ProfilePage as InquilinoProfile } from '@/views/inquilino/pages/ProfilePage.jsx'
import { ExplorarPage } from '@/views/inquilino/pages/ExplorarPage.jsx'
import { PropertyDetailPage } from '@/views/inquilino/pages/PropertyDetailPage.jsx'
import { ReservaPage } from '@/views/inquilino/pages/ReservaPage.jsx'

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
            path="/forgot-password"
            element={
              <>
                <Header />
                <ForgotPassword />
              </>
            }
          />
          <Route
            path="/reset-password"
            element={
              <>
                <Header />
                <ResetPassword />
              </>
            }
          />
          <Route
            path="/update-password"
            element={
              <>
                <Header />
                <UpdatePassword />
              </>
            }
          />

          {/* === RUTAS DE ADMIN === */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* === RUTAS DEL INQUILINO (Huésped) === */}
          <Route path="/inquilino" element={<Navigate to="/inquilino/explorar" replace />} />
          <Route path="/inquilino/perfil" element={<InquilinoProfile />} />
          <Route path="/inquilino/explorar" element={<ExplorarPage />} />
          <Route path="/inquilino/propiedad/:id" element={<PropertyDetailPage />} />
          <Route path="/inquilino/reserva/:id" element={<ReservaPage />} />

          {/* === RUTAS DEL ARRENDATARIO (Anfitrión) === */}
          <Route
            path="/arrendatario"
            element={
              <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[#5F5F5F] font-poppins">
                Módulo de Arrendatario en construcción...
              </div>
            }
          />

          {/* === FALLBACKS === */}
          <Route path="/profile" element={<Navigate to="/inquilino/perfil" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from '@/views/components/Header'
import { HomePage } from '@/views/pages/HomePage'
import { LoginPage } from '@/views/pages/LoginPage'
import { RegisterPage } from '@/views/pages/RegisterPage'
import { ForgotPassword } from '@/views/pages/ForgotPassword'
import { ResetPassword } from '@/views/pages/ResetPassword'
import { UpdatePassword } from '@/views/pages/UpdatePassword'
import { ProfilePage } from '@/views/user/pages/ProfilePage'
import { CrearPropiedad } from '@/views/pages/arrendatario/CrearPropiedad'
import { EditarPropiedad } from '@/views/pages/arrendatario/EditarPropiedad'
import { MisPropiedades } from '@/views/pages/arrendatario/MisPropiedades'
import AdminDashboard from '@/views/admin/AdminDashboard'

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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/inquilino" element={<ProfilePage />} />
          <Route path="/arrendatario" element={<ProfilePage />} />
          <Route path="/arrendatario/perfil" element={<ProfilePage />} />
          <Route path="/arrendatario/propiedades" element={<MisPropiedades />} />
          <Route path="/arrendatario/propiedades/nueva" element={<CrearPropiedad />} />
          <Route path="/arrendatario/propiedades/:id/editar" element={<EditarPropiedad />} />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  )
}

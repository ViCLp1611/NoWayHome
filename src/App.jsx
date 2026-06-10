import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header } from '@/views/components/Header'
import { HomePage } from '@/views/pages/HomePage'
import { LoginPage } from '@/views/pages/LoginPage'
import { RegisterPage } from '@/views/pages/RegisterPage'
import { ProfilePage } from '@/views/user/pages/ProfilePage' // Ruta actualizada al nuevo directorio user
import AdminDashboard from '@/views/admin/AdminDashboard'
import { AdminLogin } from '@/views/admin/AdminLogin'

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
            path="/profile"
            element={
              // Se remueve el <Header /> público ya que ProfilePage ahora incluye su propio <UserNavbar />
              <ProfilePage />
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  )
}

import { Navigate, Outlet } from 'react-router-dom'

export const HostProtectedRoute = () => {
  const sessionData = sessionStorage.getItem('user') || localStorage.getItem('user')
  const user = sessionData ? JSON.parse(sessionData) : null

  // Verificamos si hay un usuario y si su rol es 'host' (anfitrión)
  // Agregamos también la búsqueda de id_arrendatario por si en algún momento el backend lo devuelve así
  const isHost = user && (user.role === 'host' || user.rol === 'host' || user.id_arrendatario)

  if (!isHost) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

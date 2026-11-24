import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Settings,
  Heart,
  Star,
  LogOut,
  Edit,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { mockUserBookings } from '@/models/bookingModel'
import { mockFavoriteProperties } from '@/models/propertyModel'
import { PerfilArrendatario } from '@/views/pages/arrendatario/PerfilArrendatario'
import { UserNavbar } from '@/views/user/components/UserNavbar.jsx' // Importación con alias corregida

export function ProfilePage() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Buscar en session y local storage
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')

    if (storedUser) {
      setUserData(JSON.parse(storedUser))
    } else {
      // Si no hay sesión, expulsar al login/raíz
      navigate('/')
    }
    setIsLoading(false)
  }, [navigate])

  const handleLogout = () => {
    sessionStorage.removeItem('user')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleUserUpdate = updatedData => {
    setUserData(currentUser => {
      const nextUser = {
        ...currentUser,
        ...updatedData,
      }

      if (sessionStorage.getItem('user')) {
        sessionStorage.setItem('user', JSON.stringify(nextUser))
      }

      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(nextUser))
      }

      return nextUser
    })
  }

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Cargando perfil...
      </div>
    )
  }

  // Generar iniciales dinámicas para el Avatar (ej. "Juan Pérez" -> "JP")
  const getInitials = name => {
    if (!name) return 'US'
    const names = name.split(' ')
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const isTenant = userData.role === 'guest' || userData.role === 'inquilino' || userData.id_inquilino
  const isHost =
    userData.role === 'host' || userData.role === 'arrendatario' || userData.id_arrendatario

  if (userData.role === 'administrador') {
    return <Navigate to="/admin" replace />
  }

  if (isTenant) {
    return <Navigate to="/inquilino/perfil" replace />
  }

  if (isHost) {
    return <PerfilArrendatario userData={userData} onUserUpdate={handleUserUpdate} />
  }

  const userRole = isTenant ? 'Huésped' : 'Anfitrión'

  const mockBookings = mockUserBookings.map(booking => ({
    ...booking.toJSON(),
    status: booking.getStatusText(),
  }))

  const mockFavorites = mockFavoriteProperties.map(prop => prop.toJSON())

  return (
    <>
      <UserNavbar /> {/* Navbar inyectado en la página */}
      <div className="min-h-screen py-8 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          {/* Profile Header */}
          <Card className="p-6 md:p-8 mb-8 bg-white border border-border shadow-sm rounded-2xl">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24 bg-primary ring-4 ring-secondary">
                <AvatarFallback className="text-foreground text-2xl font-poppins">
                  {getInitials(userData.nombre)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                  <h1 className="text-foreground capitalize">
                    {userData.nombre || 'Usuario'}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-primary text-primary-ink" />
                    <span className="text-foreground font-medium">Nuevo en NoWayHome</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-accent-ink" />
                    <span className="text-sm">{userData.correo}</span>
                  </div>
                  {userData.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-accent-ink" />
                      <span className="text-sm">{userData.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent-ink" />
                    <span className="text-sm">Ubicación no definida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent-ink" />
                    <span className="text-sm">Miembro verificado</span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col gap-3 w-full md:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 md:flex-initial border-2 border-primary-ink text-primary-ink hover:bg-primary hover:text-primary-foreground shadow-none rounded-xl transition-all"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-border mb-8 p-1 rounded-xl">
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
              >
                Mis Reservas
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
              >
                Favoritos
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
              >
                Configuración
              </TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-foreground">
                  Próximas Reservas
                </h2>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-none rounded-xl"
                >
                  Nueva Reserva
                </Button>
              </div>

              {mockBookings.map(booking => (
                <Card
                  key={booking.id}
                  className="p-6 bg-secondary border-none shadow-none rounded-2xl"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg text-foreground mb-3">
                        {booking.property}
                      </h3>
                      <div className="space-y-2 text-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-accent-ink" />
                          <span className="text-sm">{booking.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-accent-ink" />
                          <span className="text-sm">{booking.dates}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end justify-between gap-3">
                      <div className="text-left md:text-right">
                        <span className="font-poppins font-semibold text-2xl text-primary-ink">
                          ${booking.price}
                        </span>
                        <span className="block text-sm text-foreground mt-1">
                          Estado:{' '}
                          <span
                            className={
                              booking.status === 'Confirmada'
                                ? 'text-primary-ink font-medium'
                                : 'text-accent-ink font-medium'
                            }
                          >
                            {booking.status}
                          </span>
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="border-2 border-primary-ink text-primary-ink hover:bg-primary hover:text-primary-foreground shadow-none rounded-xl transition-all"
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-foreground flex items-center gap-2">
                  <Heart className="h-6 w-6 fill-primary text-primary-ink" />
                  Propiedades Favoritas
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockFavorites.map(favorite => (
                  <Card
                    key={favorite.id}
                    className="p-6 bg-white border border-border shadow-sm rounded-2xl"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-foreground">
                        {favorite.title}
                      </h3>
                      <Heart className="h-5 w-5 fill-primary text-primary-ink cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex items-center gap-2 text-foreground mb-5">
                      <MapPin className="h-4 w-4 text-accent-ink" />
                      <span className="text-sm">{favorite.location}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="font-poppins font-semibold text-lg text-primary-ink">
                        ${favorite.price} / noche
                      </span>
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-none rounded-lg"
                      >
                        Reservar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-foreground flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary-ink" />
                  Configuración de Cuenta
                </h2>
              </div>

              <Card className="p-6 md:p-8 bg-secondary border-none shadow-none rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg text-foreground mb-2">
                      Rol actual
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white text-primary-ink font-medium text-sm">
                        {userRole}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {userRole === 'Huésped' ? 'Reservar alojamiento' : 'Gestionar propiedades'}
                      </span>
                    </div>
                  </div>
                  {userRole === 'Huésped' && (
                    <Button
                      variant="outline"
                      className="border-2 border-primary-ink text-primary-ink hover:bg-primary hover:text-primary-foreground shadow-none rounded-xl transition-all whitespace-nowrap"
                    >
                      Convertirme en anfitrión
                    </Button>
                  )}
                </div>
              </Card>

              <Card className="p-6 md:p-8 bg-white border border-border shadow-sm rounded-2xl">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg text-foreground mb-5">
                      Preferencias de Notificaciones
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-secondary/30 rounded-lg transition-colors">
                        <span className="text-foreground">Ofertas especiales</span>
                        <input
                          type="checkbox"
                          className="rounded border-control-border text-primary-ink focus:ring-ring focus:ring-offset-0"
                          defaultChecked
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-secondary/30 rounded-lg transition-colors">
                        <span className="text-foreground">Recordatorios de reserva</span>
                        <input
                          type="checkbox"
                          className="rounded border-control-border text-primary-ink focus:ring-ring focus:ring-offset-0"
                          defaultChecked
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-secondary/30 rounded-lg transition-colors">
                        <span className="text-foreground">Newsletter</span>
                        <input
                          type="checkbox"
                          className="rounded border-control-border text-primary-ink focus:ring-ring focus:ring-offset-0"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-border">
                    <h3 className="text-lg text-foreground mb-5">
                      Seguridad
                    </h3>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-2 border-border text-foreground hover:border-primary-ink hover:bg-secondary/30 shadow-none rounded-xl h-12 transition-all"
                      >
                        Cambiar contraseña
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

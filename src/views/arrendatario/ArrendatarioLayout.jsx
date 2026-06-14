import { useState, useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { Mail, Phone, MapPin, Calendar, Settings, Star, Edit } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
// CAMBIO APLICADO: Importamos el modal con tu nuevo nombre
import { EditInquilinoModal } from '@/views/inquilino/components/EditInquilinoModal.jsx'
// IMPORTAMOS EL NUEVO NAVBAR
import { ArrendatarioNavbar } from './components/ArrendatarioNavbar'

export function ArrendatarioLayout() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')

    if (storedUser) {
      setUserData(JSON.parse(storedUser))
    } else {
      navigate('/')
    }
    setIsLoading(false)
  }, [navigate])

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[#5F5F5F] font-medium">
        Cargando entorno de anfitrión...
      </div>
    )
  }

  const getInitials = name => {
    if (!name) return 'AN'
    const names = name.split(' ')
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">
      {/* INYECTAMOS EL NAVBAR REUTILIZABLE AQUÍ */}
      <ArrendatarioNavbar />

      <div className="py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Profile Header */}
          <Card className="p-6 md:p-8 mb-8 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24 bg-[#6B8E23] ring-4 ring-[#F2E8CF]">
                <AvatarFallback className="text-white text-2xl font-poppins">
                  {getInitials(userData.nombre)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                  <h1 className="font-poppins font-semibold text-2xl md:text-3xl text-[#5F5F5F] capitalize">
                    {userData.nombre || 'Anfitrión'}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-[#6B8E23] text-[#6B8E23]" />
                    <span className="text-[#5F5F5F] font-medium">Anfitrión Verificado</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#5F5F5F]">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#A67C52]" />
                    <span className="text-sm">{userData.correo}</span>
                  </div>
                  {userData.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#A67C52]" />
                      <span className="text-sm">{userData.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#A67C52]" />
                    <span className="text-sm">Ubicación no definida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#A67C52]" />
                    <span className="text-sm">Activo en la plataforma</span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col gap-3 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 md:flex-initial border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl transition-all"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white border border-[#6B8E23]/10 mb-8 p-1 rounded-xl">
              <TabsTrigger
                value="properties"
                className="data-[state=active]:bg-[#6B8E23] data-[state=active]:text-white rounded-lg transition-all"
              >
                Mis Propiedades
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-[#6B8E23] data-[state=active]:text-white rounded-lg transition-all"
              >
                Configuración
              </TabsTrigger>
            </TabsList>

            {/* PESTAÑA: MIS PROPIEDADES */}
            <TabsContent value="properties" className="space-y-6">
              <Outlet />
            </TabsContent>

            {/* PESTAÑA: CONFIGURACIÓN */}
            <TabsContent value="settings" className="space-y-6">
              <div className="mb-6">
                <h2 className="font-poppins font-semibold text-2xl text-[#5F5F5F] flex items-center gap-2">
                  <Settings className="h-6 w-6 text-[#6B8E23]" />
                  Configuración de Cuenta
                </h2>
              </div>

              <Card className="p-6 md:p-8 bg-[#F2E8CF] border-none shadow-none rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-poppins font-semibold text-lg text-[#5F5F5F] mb-2">
                      Rol actual
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white text-[#6B8E23] font-medium text-sm">
                        Anfitrión
                      </span>
                      <span className="text-sm text-[#5F5F5F]/70">
                        Tienes permisos para gestionar propiedades y reservas.
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
                <div className="space-y-8">
                  <div>
                    <h3 className="font-poppins font-semibold text-lg text-[#5F5F5F] mb-5">
                      Preferencias de Notificaciones
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-[#F2E8CF]/30 rounded-lg transition-colors">
                        <span className="text-[#5F5F5F]">Nuevas solicitudes de reserva</span>
                        <input
                          type="checkbox"
                          className="rounded border-[#6B8E23]/30 text-[#6B8E23] focus:ring-[#6B8E23] focus:ring-offset-0"
                          defaultChecked
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-[#F2E8CF]/30 rounded-lg transition-colors">
                        <span className="text-[#5F5F5F]">Mensajes de huéspedes</span>
                        <input
                          type="checkbox"
                          className="rounded border-[#6B8E23]/30 text-[#6B8E23] focus:ring-[#6B8E23] focus:ring-offset-0"
                          defaultChecked
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-[#F2E8CF]/30 rounded-lg transition-colors">
                        <span className="text-[#5F5F5F]">Boletín de novedades No Way Home</span>
                        <input
                          type="checkbox"
                          className="rounded border-[#6B8E23]/30 text-[#6B8E23] focus:ring-[#6B8E23] focus:ring-offset-0"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-[#6B8E23]/10">
                    <h3 className="font-poppins font-semibold text-lg text-[#5F5F5F] mb-5">
                      Seguridad
                    </h3>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-2 border-[#6B8E23]/20 text-[#5F5F5F] hover:border-[#6B8E23] hover:bg-[#F2E8CF]/30 shadow-none rounded-xl h-12 transition-all"
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

      {/* CAMBIO APLICADO: Ahora llamamos a EditInquilinoModal que es como tú lo nombraste */}
      {userData && (
        <EditInquilinoModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userData={userData}
          onUpdateSuccess={updatedData => {
            setUserData(updatedData)
            sessionStorage.setItem('user', JSON.stringify(updatedData))
            localStorage.setItem('user', JSON.stringify(updatedData))
          }}
        />
      )}
    </div>
  )
}

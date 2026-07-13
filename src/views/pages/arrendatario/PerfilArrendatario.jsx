import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeDollarSign,
  Building2,
  Calendar,
  CalendarCheck,
  Edit,
  LogOut,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Settings,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { getLandlordProfile, updateLandlordProfile } from '@/services/landlordProfileService'
import { getLandlordProperties } from '@/services/propertyService'
import { landlordBookingService } from '@/services/landlordBookingService'
import { ConfirmActionModal } from '@/views/admin/components/ConfirmActionModal'
import { UserNavbar } from '@/views/user/components/UserNavbar.jsx'
import { ChangePasswordModal } from '@/views/inquilino/pages/ChangePasswordModal.jsx'

const statusStyles = {
  activa: 'bg-[#6B8E23] text-white',
  inactiva: 'bg-[#A67C52]/20 text-[#5F5F5F]',
  suspendida: 'bg-amber-100 text-amber-800',
}

export function PerfilArrendatario({ userData, onUserUpdate }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(userData)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre: userData?.nombre || '',
    telefono: userData?.telefono || '',
  })
  const [editErrors, setEditErrors] = useState({})
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [actionMessage, setActionMessage] = useState({
    open: false,
    type: '',
    title: '',
    description: '',
  })
  const [recentProperties, setRecentProperties] = useState([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(true)
  const [propertiesError, setPropertiesError] = useState('')
  const [reservationStats, setReservationStats] = useState({
    totalConfirmado: 0,
    totalPendiente: 0,
    totalNoActivo: 0,
    countConfirmada: 0,
    countPendiente: 0,
    countNoActiva: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState('')

  const idArrendatario = useMemo(() => {
    return userData?.id_arrendatario || userData?.id
  }, [userData])

  const showActionMessage = (type, description, title) => {
    setActionMessage({
      open: true,
      type,
      title: title || (type === 'success' ? 'Accion completada' : 'Error'),
      description,
    })
  }

  useEffect(() => {
    setProfile(userData)
    setEditForm({
      nombre: userData?.nombre || '',
      telefono: userData?.telefono || '',
    })
  }, [userData])

  useEffect(() => {
    if (!idArrendatario) {
      showActionMessage('error', 'No se pudo identificar tu cuenta de arrendatario.')
      return
    }

    async function loadProfile() {
      try {
        const nextProfile = await getLandlordProfile(idArrendatario)
        setProfile(currentProfile => ({ ...currentProfile, ...nextProfile }))
        setEditForm({
          nombre: nextProfile.nombre || '',
          telefono: nextProfile.telefono || '',
        })
        onUserUpdate?.(nextProfile)
      } catch (error) {
        showActionMessage('error', error.message || 'No se pudo cargar tu informacion.')
      }
    }

    loadProfile()
  }, [idArrendatario])

  useEffect(() => {
    if (!idArrendatario) {
      setIsLoadingProperties(false)
      setPropertiesError('No se pudo identificar tu cuenta de arrendatario.')
      return
    }

    async function loadRecentProperties() {
      try {
        setIsLoadingProperties(true)
        setPropertiesError('')
        const properties = await getLandlordProperties(idArrendatario)
        setRecentProperties(properties.slice(0, 3))
      } catch (error) {
        setPropertiesError('No se pudieron cargar tus propiedades.')
      } finally {
        setIsLoadingProperties(false)
      }
    }

    loadRecentProperties()
  }, [idArrendatario])

  useEffect(() => {
    if (!idArrendatario) {
      setIsLoadingStats(false)
      setStatsError('No se pudo identificar tu cuenta de arrendatario.')
      return
    }

    async function loadReservationStats() {
      try {
        setIsLoadingStats(true)
        setStatsError('')

        const reservas = await landlordBookingService.obtenerReservasRecibidas(idArrendatario)

        const nextStats = reservas.reduce(
          (acc, reserva) => {
            const status = String(reserva.estado || '').toLowerCase()
            const amount = Number(reserva.total ?? reserva.pago ?? 0)
            const safeAmount = Number.isFinite(amount) ? amount : 0

            if (status === 'confirmada') {
              acc.totalConfirmado += safeAmount
              acc.countConfirmada += 1
              return acc
            }

            if (status === 'pendiente') {
              acc.totalPendiente += safeAmount
              acc.countPendiente += 1
              return acc
            }

            if (status === 'cancelada' || status === 'rechazada') {
              acc.totalNoActivo += safeAmount
              acc.countNoActiva += 1
            }

            return acc
          },
          {
            totalConfirmado: 0,
            totalPendiente: 0,
            totalNoActivo: 0,
            countConfirmada: 0,
            countPendiente: 0,
            countNoActiva: 0,
          }
        )

        setReservationStats(nextStats)
      } catch (_error) {
        setStatsError('No se pudieron cargar los ingresos estimados.')
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadReservationStats()
  }, [idArrendatario])

  const getInitials = name => {
    if (!name) return 'US'
    const names = name.split(' ')
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const handleLogout = () => {
    sessionStorage.removeItem('user')
    localStorage.removeItem('user')
    navigate('/')
  }

  const openEditProfile = () => {
    setEditForm({
      nombre: profile?.nombre || '',
      telefono: profile?.telefono || '',
    })
    setEditErrors({})
    setIsEditOpen(true)
  }

  const closeEditProfile = () => {
    if (isSavingProfile) return
    setIsEditOpen(false)
    setEditErrors({})
  }

  const handleEditFieldChange = event => {
    const { name, value } = event.target
    setEditForm(current => ({ ...current, [name]: value }))
    setEditErrors(current => ({ ...current, [name]: '' }))
  }

  const validateEditForm = () => {
    const nextErrors = {}
    const telefono = editForm.telefono.trim().replace(/\D/g, '')

    if (!editForm.nombre.trim()) {
      nextErrors.nombre = 'El nombre es obligatorio.'
    }

    if (editForm.telefono.trim() && (telefono.length < 7 || telefono.length > 20)) {
      nextErrors.telefono = 'Ingresa un telefono valido.'
    }

    return nextErrors
  }

  const handleSaveProfile = async event => {
    event.preventDefault()

    const nextErrors = validateEditForm()
    setEditErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean)) return

    try {
      setIsSavingProfile(true)
      const updatedProfile = await updateLandlordProfile(idArrendatario, {
        nombre: editForm.nombre,
        telefono: editForm.telefono,
      })
      setProfile(currentProfile => ({ ...currentProfile, ...updatedProfile }))
      onUserUpdate?.(updatedProfile)
      setIsEditOpen(false)
      showActionMessage('success', 'Informacion actualizada correctamente.')
    } catch (error) {
      showActionMessage(
        'error',
        error.message || 'No se pudo actualizar tu informacion. Intenta nuevamente.'
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  const formatPrice = property => {
    const price = Number(property.precio_por_noche || 0).toLocaleString('es-MX', {
      maximumFractionDigits: 2,
    })
    return property.tipo_precio === 'mensual' ? `$${price} mensual` : `$${price} por noche`
  }

  const getStatusClass = estado => {
    return statusStyles[estado] || statusStyles.inactiva
  }

  const formatCurrency = value => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0)
  }

  const renderEditError = field => {
    if (!editErrors[field]) return null
    return <p className="mt-2 text-sm text-red-700">{editErrors[field]}</p>
  }

  return (
    <>
      <UserNavbar />
      <div className="min-h-screen py-8 px-4 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-5xl">
          <Card className="p-6 md:p-8 mb-8 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24 bg-[#6B8E23] ring-4 ring-[#F2E8CF]">
                <AvatarFallback className="text-white text-2xl font-poppins">
                  {getInitials(profile?.nombre)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                  <h1 className="font-poppins font-semibold text-2xl md:text-3xl text-[#5F5F5F] capitalize">
                    {profile?.nombre || 'Usuario'}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-[#6B8E23] text-[#6B8E23]" />
                    <span className="text-[#5F5F5F] font-medium">Arrendatario en NoWayHome</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#5F5F5F]">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#A67C52]" />
                    <span className="text-sm">{profile?.correo}</span>
                  </div>
                  {profile?.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#A67C52]" />
                      <span className="text-sm">{profile.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#A67C52]" />
                    <span className="text-sm">Ubicacion no definida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#A67C52]" />
                    <span className="text-sm">Miembro verificado</span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col gap-3 w-full md:w-auto">
                <Button
                  onClick={openEditProfile}
                  variant="outline"
                  className="flex-1 md:flex-initial border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl transition-all"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-[#6B8E23]/10 mb-8 p-1 rounded-xl">
              <TabsTrigger
                value="properties"
                className="data-[state=active]:bg-[#6B8E23] data-[state=active]:text-white rounded-lg transition-all"
              >
                Mis propiedades
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:bg-[#6B8E23] data-[state=active]:text-white rounded-lg transition-all"
              >
                Actividad
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-[#6B8E23] data-[state=active]:text-white rounded-lg transition-all"
              >
                Configuracion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="space-y-6">
              <Card className="p-6 bg-[#F2E8CF] border-none shadow-none rounded-2xl">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="font-poppins font-semibold text-2xl text-[#5F5F5F] mb-3 flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-[#6B8E23]" />
                        Mis propiedades
                      </h2>
                      <p className="text-[#5F5F5F]">
                        Administra los alojamientos que tienes publicados en NoWayHome.
                      </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-3">
                      <Button
                        onClick={() => navigate('/arrendatario/propiedades')}
                        variant="outline"
                        className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl"
                      >
                        Ver todas mis propiedades
                      </Button>
                      <Button
                        onClick={() => navigate('/arrendatario/propiedades/nueva')}
                        className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar propiedad
                      </Button>
                    </div>
                  </div>

                  {isLoadingProperties && (
                    <p className="text-sm text-[#5F5F5F]">Cargando propiedades...</p>
                  )}

                  {!isLoadingProperties && propertiesError && (
                    <p className="text-sm text-red-800">No se pudieron cargar tus propiedades.</p>
                  )}

                  {!isLoadingProperties && !propertiesError && recentProperties.length === 0 && (
                    <div className="rounded-2xl bg-white p-5 border border-[#6B8E23]/10">
                      <p className="mb-4 text-[#5F5F5F]">Aún no tienes propiedades registradas.</p>
                      <Button
                        onClick={() => navigate('/arrendatario/propiedades/nueva')}
                        className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar propiedad
                      </Button>
                    </div>
                  )}

                  {!isLoadingProperties && !propertiesError && recentProperties.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {recentProperties.map(property => (
                        <Card
                          key={property.id_propiedad}
                          className="overflow-hidden bg-white border border-[#6B8E23]/10 shadow-none rounded-2xl"
                        >
                          {property.imagen_principal ? (
                            <img
                              src={property.imagen_principal}
                              alt={property.titulo}
                              className="h-32 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-32 w-full items-center justify-center bg-[#FAFAFA] text-[#6B8E23]">
                              <Building2 className="h-8 w-8" />
                            </div>
                          )}

                          <div className="p-4">
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate font-poppins font-semibold text-[#5F5F5F]">
                                  {property.titulo}
                                </h3>
                                <p className="mt-1 truncate text-xs text-[#5F5F5F]/75">
                                  {[property.ciudad, property.pais].filter(Boolean).join(', ')}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium ${getStatusClass(property.estado)}`}
                              >
                                {property.estado}
                              </span>
                            </div>
                            <p className="font-poppins text-sm font-semibold text-[#6B8E23]">
                              {formatPrice(property)}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <div className="mb-6">
                <h2 className="font-poppins font-semibold text-2xl text-[#5F5F5F] flex items-center gap-2">
                  <CalendarCheck className="h-6 w-6 text-[#6B8E23]" />
                  Actividad de arrendatario
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-poppins font-semibold text-[#5F5F5F]">
                      Reservas recibidas
                    </h3>
                    <CalendarCheck className="h-5 w-5 text-[#6B8E23]" />
                  </div>
                  <p className="text-sm text-[#5F5F5F] mb-5">
                    Aqui podras revisar solicitudes y reservas asociadas a tus alojamientos.
                  </p>
                  <Button
                    onClick={() => navigate('/arrendatario/reservas')}
                    variant="outline"
                    className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl transition-all"
                  >
                    Ver reservas
                  </Button>
                </Card>

                <Card className="p-6 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-poppins font-semibold text-[#5F5F5F]">
                      Ingresos / transacciones
                    </h3>
                    <BadgeDollarSign className="h-5 w-5 text-[#6B8E23]" />
                  </div>
                  {isLoadingStats && (
                    <p className="text-sm text-[#5F5F5F] mb-5">Calculando ingresos estimados...</p>
                  )}

                  {!isLoadingStats && statsError && (
                    <p className="text-sm text-red-800 mb-5">{statsError}</p>
                  )}

                  {!isLoadingStats && !statsError && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2">
                        <span className="text-[#5F5F5F]">Total estimado confirmado</span>
                        <span className="font-semibold text-green-700">
                          {formatCurrency(reservationStats.totalConfirmado)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
                        <span className="text-[#5F5F5F]">Total pendiente</span>
                        <span className="font-semibold text-amber-700">
                          {formatCurrency(reservationStats.totalPendiente)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#FAFAFA] px-3 py-2">
                        <span className="text-[#5F5F5F]">Total cancelado/rechazado</span>
                        <span className="font-semibold text-[#5F5F5F]">
                          {formatCurrency(reservationStats.totalNoActivo)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="rounded-lg bg-[#F2E8CF] px-2 py-2 text-center text-[#5F5F5F]">
                          {reservationStats.countConfirmada} confirmadas
                        </div>
                        <div className="rounded-lg bg-[#F2E8CF] px-2 py-2 text-center text-[#5F5F5F]">
                          {reservationStats.countPendiente} pendientes
                        </div>
                        <div className="rounded-lg bg-[#F2E8CF] px-2 py-2 text-center text-[#5F5F5F]">
                          {reservationStats.countNoActiva} cancel/rechaz.
                        </div>
                      </div>

                      <p className="pt-1 text-xs text-[#5F5F5F]/75">
                        Estos montos son estimados y se calculan con base en las reservas
                        registradas. Los pagos reales se habilitarán más adelante.
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="mb-6">
                <h2 className="font-poppins font-semibold text-2xl text-[#5F5F5F] flex items-center gap-2">
                  <Settings className="h-6 w-6 text-[#6B8E23]" />
                  Configuracion de Cuenta
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
                        Arrendatario
                      </span>
                      <span className="text-sm text-[#5F5F5F]/70">
                        Publicar y gestionar alojamientos
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl transition-all whitespace-nowrap"
                  >
                    Convertirme en huésped
                  </Button>
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
                        <span className="text-[#5F5F5F]">Ofertas especiales</span>
                        <input
                          type="checkbox"
                          className="rounded border-[#6B8E23]/30 text-[#6B8E23] focus:ring-[#6B8E23] focus:ring-offset-0"
                          defaultChecked
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-[#F2E8CF]/30 rounded-lg transition-colors">
                        <span className="text-[#5F5F5F]">Recordatorios de reserva</span>
                        <input
                          type="checkbox"
                          className="rounded border-[#6B8E23]/30 text-[#6B8E23] focus:ring-[#6B8E23] focus:ring-offset-0"
                          defaultChecked
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-[#F2E8CF]/30 rounded-lg transition-colors">
                        <span className="text-[#5F5F5F]">Newsletter</span>
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
                        onClick={() => setIsChangePasswordOpen(true)}
                        variant="outline"
                        className="w-full justify-start border-2 border-[#6B8E23]/20 text-[#5F5F5F] hover:border-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl h-12 transition-all"
                      >
                        <Lock className="h-4 w-4 mr-2" />
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

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userData={profile}
      />

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="font-poppins text-xl font-semibold text-[#5F5F5F]">
                Editar informacion personal
              </h2>
              <p className="mt-2 text-sm text-[#5F5F5F]/75">
                Actualiza los datos visibles en tu perfil de arrendatario.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label htmlFor="profile-nombre" className="text-[#5F5F5F] font-medium">
                  Nombre
                </label>
                <Input
                  id="profile-nombre"
                  name="nombre"
                  value={editForm.nombre}
                  onChange={handleEditFieldChange}
                  className="mt-2 h-12 rounded-xl border-[#6B8E23]/20 text-[#5F5F5F] focus:border-[#6B8E23]"
                />
                {renderEditError('nombre')}
              </div>

              <div>
                <label htmlFor="profile-telefono" className="text-[#5F5F5F] font-medium">
                  Telefono
                </label>
                <Input
                  id="profile-telefono"
                  name="telefono"
                  value={editForm.telefono}
                  onChange={handleEditFieldChange}
                  className="mt-2 h-12 rounded-xl border-[#6B8E23]/20 text-[#5F5F5F] focus:border-[#6B8E23]"
                />
                {renderEditError('telefono')}
              </div>

              <div>
                <label htmlFor="profile-correo" className="text-[#5F5F5F] font-medium">
                  Correo
                </label>
                <Input
                  id="profile-correo"
                  value={profile?.correo || ''}
                  disabled
                  className="mt-2 h-12 rounded-xl border-[#6B8E23]/20 bg-[#FAFAFA] text-[#5F5F5F] disabled:opacity-80"
                />
                <p className="mt-2 text-xs leading-5 text-[#5F5F5F]/70">
                  El correo se usa para iniciar sesion y no puede modificarse desde esta seccion.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditProfile}
                  disabled={isSavingProfile}
                  className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl disabled:opacity-60"
                >
                  {isSavingProfile ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmActionModal
        open={actionMessage.open}
        type={actionMessage.type}
        title={actionMessage.title}
        description={actionMessage.description}
        confirmLabel="Entendido"
        onConfirm={() => setActionMessage({ open: false, type: '', title: '', description: '' })}
      />
    </>
  )
}

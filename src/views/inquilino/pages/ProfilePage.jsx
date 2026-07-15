import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, MapPin, Calendar, Settings, Heart, Star, Edit, Lock } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { EditInquilinoModal } from '@/views/inquilino/pages/EditInquilinoModal.jsx'
import { ChangePasswordModal } from '@/views/inquilino/pages/ChangePasswordModal.jsx'
import { inquilinoController } from '@/controllers/inquilinoController'
import { toast } from 'sonner'
import { formatDateLong } from '@/utils/dateUtils'
import { tenantBookingService } from '@/services/tenantBookingService'
import { CancelBookingModal } from '@/app/components/CancelBookingModal'
import { API_URL } from '@/config/api'

export function ProfilePage() {
  const navigate = useNavigate()

  const [userData, setUserData] = useState(null)
  const [reservas, setReservas] = useState([])
  const [favoritos, setFavoritos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationError, setCancellationError] = useState('')

  useEffect(() => {
    const fetchPerfil = async () => {
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
      if (!storedUser) {
        navigate('/')
        return
      }

      const parsedUser = JSON.parse(storedUser)
      const userId = parsedUser.id_inquilino || parsedUser.id

      if (!userId) {
        navigate('/')
        return
      }

      const result = await inquilinoController.cargarPerfilCompleto(userId)
      if (result.success) {
        setUserData({ ...parsedUser, ...result.data.perfil })

        // Filtra las reservas que el inquilino ha marcado como ocultas.
        const reservasVisibles = (result.data.reservas || []).filter(
          reserva => !reserva.oculto_para_inquilino
        )
        const normalizedReservas = reservasVisibles.map(reserva => {
          const navigationId = reserva.id_reserva || null

          return {
            ...reserva,
            // Usamos una propiedad 'id_navegacion' para no sobreescribir el id_reserva original.
            id_navegacion: navigationId,
            fecha_entrada: reserva.fecha_entrada || reserva.fecha_inicio,
            fecha_salida: reserva.fecha_salida || reserva.fecha_fin,
            estado: reserva.estado_reserva || reserva.estado,
            estado_reserva: reserva.estado_reserva || reserva.estado,
            precio_base: reserva.precio_base ?? (reserva.precio || reserva.precio_noche || 0),
            comision_y_otros:
              reserva.comision_y_otros ?? reserva.tarifa_servicio ?? reserva.tarifa ?? 0,
            total_pagado: reserva.total_pagado ?? reserva.pago ?? reserva.total ?? 0,
            titulo:
              reserva.titulo ||
              reserva.titulo_propiedad ||
              reserva.propiedad?.titulo ||
              reserva.nombre_propiedad ||
              reserva.title ||
              reserva.propiedad?.nombre,
            titulo_propiedad:
              reserva.titulo ||
              reserva.titulo_propiedad ||
              reserva.propiedad?.titulo ||
              reserva.nombre_propiedad ||
              reserva.title ||
              reserva.propiedad?.nombre,
            ubicacion:
              reserva.ubicacion ||
              reserva.ubicacion_propiedad ||
              reserva.direccion ||
              reserva.propiedad?.direccion ||
              reserva.propiedad?.ubicacion ||
              reserva.propiedad?.ciudad ||
              '',
            ubicacion_propiedad:
              reserva.ubicacion ||
              reserva.ubicacion_propiedad ||
              reserva.direccion ||
              reserva.propiedad?.direccion ||
              reserva.propiedad?.ubicacion ||
              reserva.propiedad?.ciudad ||
              '',
            imagen_principal:
              reserva.imagen_principal ||
              reserva.imagen_portada ||
              reserva.propiedad?.imagen_principal ||
              reserva.propiedad?.imagen ||
              null,
          }
        })
        setReservas(normalizedReservas)
        setFavoritos(result.data.favoritos || [])
      } else {
        setLoadError(result.error || 'No se pudo cargar tu informacion completa.')
        setUserData(parsedUser)
      }

      setIsLoading(false)
    }

    fetchPerfil()
  }, [navigate])

  const handleUpdateSuccess = updatedUser => {
    setUserData(updatedUser)
  }

  const handleRemoveFavorito = async propiedadId => {
    const currentUserId = userData?.id_inquilino || userData?.id
    if (!currentUserId) {
      toast.error('No se pudo identificar al usuario para esta acción.')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/inquilino/favoritos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_inquilino: currentUserId,
          id_propiedad: propiedadId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Ocurrió un error en el servidor.')
      }

      setFavoritos(prevFavoritos =>
        prevFavoritos.filter(fav => fav.propiedad?.id_propiedad !== propiedadId)
      )
      toast.success('Propiedad eliminada de tus favoritos.')
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar de favoritos. Intenta de nuevo.')
      console.error('Error al eliminar favorito:', error)
    }
  }

  const reservasPorPropiedadId = useMemo(
    () => new Map(reservas.map(reserva => [reserva.id_propiedad, reserva])),
    [reservas]
  )

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <LoadingState message="Cargando perfil..." className="min-h-screen" />
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

  const userRole = 'Huésped' // Estamos en el módulo Inquilino, el rol es fijo visualmente

  // Formateador de moneda
  const formatPrice = price => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)
  }

  const getText = value => (typeof value === 'string' ? value.trim() : '')
  const getTitleFromDescription = description =>
    getText(description)
      .split('\n')
      .map(part => part.trim())
      .find(Boolean) || ''

  const getFavoriteTitle = favorite =>
    favorite.propiedad?.titulo ||
    getTitleFromDescription(favorite.propiedad?.descripcion) ||
    `Propiedad ${favorite.propiedad?.id_propiedad || ''}`.trim()

  const getFavoriteLocation = favorite =>
    favorite.propiedad?.ubicacion ||
    favorite.propiedad?.ciudad ||
    favorite.propiedad?.direccion ||
    'Ubicación no especificada'

  const getBookingTitle = booking =>
    booking.titulo ||
    booking.titulo_propiedad ||
    booking.propiedad?.titulo ||
    booking.propiedad?.title ||
    booking.propiedad?.nombre ||
    booking.nombre_propiedad ||
    booking.title ||
    getTitleFromDescription(booking.propiedad?.descripcion) ||
    booking.descripcion ||
    `Propiedad ${booking.id_propiedad || booking.id || ''}`

  const getBookingLocation = booking =>
    booking.ubicacion ||
    booking.ubicacion_propiedad ||
    booking.propiedad?.ubicacion ||
    booking.propiedad?.ciudad ||
    booking.propiedad?.direccion ||
    booking.ubicacion ||
    booking.ciudad ||
    booking.direccion ||
    'Ubicación oculta'

  const getBookingStartDate = booking => booking.fecha_entrada || booking.fecha_inicio
  const getBookingEndDate = booking => booking.fecha_salida || booking.fecha_fin
  const getBookingTotal = booking =>
    booking.total_pagado ?? booking.precio_total ?? booking.total ?? booking.pago ?? 0
  const getBookingStatus = booking => booking.estado_reserva || booking.estado || 'Procesando'
  const getBookingGuests = booking => booking.huespedes ?? booking.huéspedes ?? 1
  const getBookingCommission = booking =>
    booking.comision_y_otros ?? booking.tarifa_servicio ?? booking.tarifa ?? 0
  const getBookingPriceBase = booking =>
    booking.precio_base ?? booking.precio ?? booking.precio_noche ?? 0

  const paidStatuses = ['COMPLETADO', 'COMPLETED', 'CONFIRMADO', 'CONFIRMED', 'PAGADO', 'PAID']
  const hasConfirmedPayment = booking => {
    const payments = Array.isArray(booking?.pagos) ? booking.pagos : []
    const directStatus = String(
      booking?.estado_pago || booking?.pago?.estado_pago || ''
    ).toUpperCase()
    return (
      paidStatuses.includes(directStatus) ||
      payments.some(payment =>
        paidStatuses.includes(String(payment?.estado_pago || '').toUpperCase())
      )
    )
  }

  const handleCancelBooking = async cancellationReason => {
    const tenantId = userData?.id_inquilino || userData?.id
    if (!bookingToCancel?.id_reserva || !tenantId) return

    setIsCancelling(true)
    setCancellationError('')
    try {
      const updatedBooking = await tenantBookingService.cancelarReserva({
        idReserva: bookingToCancel.id_reserva,
        idInquilino: tenantId,
        motivoCancelacion: cancellationReason,
      })
      setReservas(current =>
        current.map(booking =>
          booking.id_reserva === updatedBooking.id_reserva
            ? {
                ...booking,
                ...updatedBooking,
                estado: updatedBooking.estado,
                estado_reserva: updatedBooking.estado,
              }
            : booking
        )
      )
      toast.success('Reserva cancelada correctamente.', {
        description: hasConfirmedPayment(bookingToCancel)
          ? 'La reserva fue cancelada. Si existía un pago asociado, el reembolso se gestionará en una fase posterior.'
          : undefined,
      })
      setBookingToCancel(null)
    } catch (error) {
      console.error('No se pudo cancelar la reserva:', error)
      setCancellationError('No se pudo cancelar la reserva. Intenta nuevamente.')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <InquilinoNavbar /> {/* Nuevo Navbar inyectado en la página */}
      <div className="min-h-screen py-8 px-4 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-5xl">
          {loadError && (
            <AlertMessage
              type="warning"
              title="Perfil cargado parcialmente"
              message={loadError}
              className="mb-6"
            />
          )}

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
                    {userData.nombre || 'Usuario'}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-[#6B8E23] text-[#6B8E23]" />
                    <span className="text-[#5F5F5F] font-medium">Nuevo en NoWayHome</span>
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
                    <Calendar className="h-4 w-4 text-[#A67C52]" />
                    <span className="text-sm">Miembro verificado</span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col gap-3 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(true)}
                  className="flex-1 md:flex-initial border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl transition-all"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          </Card>
          <EditInquilinoModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            userData={userData}
            onUpdateSuccess={handleUpdateSuccess}
          />
          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
            userData={userData}
          />

          {/* Tabs Section */}
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-[#6B8E23]/10 mb-8 p-1 rounded-xl">
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-[#6B8E23] data-[state=active]:text-white rounded-lg transition-all"
              >
                Mis Reservas
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="data-[state=active]:bg-[#6B8E23] data-[state=active]:text-white rounded-lg transition-all"
              >
                Favoritos
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-[#6B8E23] data-[state=active]:text-white rounded-lg transition-all"
              >
                Configuración
              </TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="font-poppins font-semibold text-2xl text-[#5F5F5F]">
                  Próximas Reservas
                </h2>
                <Button
                  onClick={() => navigate('/inquilino/explorar')}
                  className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl"
                >
                  Nueva Reserva
                </Button>
              </div>

              {reservas.length === 0 ? (
                <div className="text-center py-12 text-[#5F5F5F]/70">
                  Aún no tienes reservas realizadas.
                </div>
              ) : (
                reservas.map((booking, bookingIndex) => {
                  const estadoCrudo = String(getBookingStatus(booking) || '').toLowerCase()
                  let estadoNormalizado = estadoCrudo
                  if (estadoCrudo === 'confirmed') estadoNormalizado = 'confirmada'
                  if (estadoCrudo === 'pending') estadoNormalizado = 'pendiente'
                  if (estadoCrudo === 'cancelled') estadoNormalizado = 'cancelada'

                  const statusClassName =
                    estadoNormalizado === 'confirmada'
                      ? 'text-[#6B8E23] font-medium'
                      : estadoNormalizado === 'cancelada'
                        ? 'text-red-600 font-medium'
                        : 'text-[#A67C52] font-medium'

                  return (
                    <Card
                      key={
                        booking.id_reserva || `reservation-${bookingIndex}`
                      }
                      className="p-6 bg-[#F2E8CF] border-none shadow-none rounded-2xl"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-poppins font-semibold text-lg text-[#5F5F5F] mb-3">
                            {getBookingTitle(booking)}
                          </h3>
                          <div className="space-y-2 text-[#5F5F5F]">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-[#A67C52]" />
                              <span className="text-sm">{getBookingLocation(booking)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-[#A67C52]" />
                              <span className="text-sm">
                                {formatDateLong(getBookingStartDate(booking))} al{' '}
                                {formatDateLong(getBookingEndDate(booking))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-start md:items-end justify-between gap-3">
                          <div className="text-left md:text-right">
                            <span className="font-poppins font-semibold text-2xl text-[#6B8E23]">
                              {formatPrice(getBookingTotal(booking))}
                            </span>
                            <span className="block text-sm text-[#5F5F5F] mt-1">
                              Estado:{' '}
                              <span className={statusClassName}>
                                {estadoNormalizado.charAt(0).toUpperCase() +
                                  estadoNormalizado.slice(1)}
                              </span>
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const reservaId = booking.id_navegacion
                              if (reservaId) {
                                navigate(
                                  `/inquilino/reserva-detalle/${encodeURIComponent(reservaId)}`
                                )
                              }
                            }}
                            disabled={!booking.id_navegacion}
                            className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl transition-all"
                          >
                            Ver Detalles
                          </Button>
                          {['pendiente', 'confirmada'].includes(estadoNormalizado) &&
                            booking.id_reserva && (
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                  setBookingToCancel(booking)
                                  setCancellationError('')
                                }}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Cancelar reserva
                              </Button>
                            )}
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-6">
              <div className="mb-6">
                <h2 className="font-poppins font-semibold text-2xl text-[#5F5F5F] flex items-center gap-2">
                  <Heart className="h-6 w-6 fill-[#6B8E23] text-[#6B8E23]" />
                  Propiedades Favoritas
                </h2>
              </div>

              {favoritos.length === 0 ? (
                <div className="text-center py-12 text-[#5F5F5F]/70">
                  Tu lista de favoritos está vacía.
                </div>
              ) : (
                <div className="space-y-6">
                  {favoritos.map(favorite => {
                    const propiedadId = favorite.propiedad?.id_propiedad
                    const reservaAsociada = reservasPorPropiedadId.get(propiedadId)

                    return (
                      <Card
                        key={favorite.id_favorito || propiedadId}
                        className="p-6 bg-[#F2E8CF] border-none shadow-none rounded-2xl"
                      >
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-4 mb-3">
                              <h3 className="font-poppins font-semibold text-lg text-[#5F5F5F] flex-1">
                                {getFavoriteTitle(favorite)}
                              </h3>
                              <button
                                onClick={() => handleRemoveFavorito(propiedadId)}
                                className="shrink-0"
                                aria-label="Eliminar de favoritos"
                                disabled={!propiedadId}
                              >
                                <Heart className="h-5 w-5 fill-[#6B8E23] text-[#6B8E23] cursor-pointer hover:fill-red-500 hover:text-red-500 transition-colors" />
                              </button>
                            </div>
                            <div className="space-y-2 text-[#5F5F5F]">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-[#A67C52]" />
                                <span className="text-sm">{getFavoriteLocation(favorite)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-start md:items-end justify-between gap-3">
                            <div className="text-left md:text-right">
                              <span className="font-poppins font-semibold text-2xl text-[#6B8E23]">
                                {formatPrice(
                                  favorite.propiedad?.precio_noche || favorite.propiedad?.precio
                                )}
                              </span>
                              <span className="block text-sm text-[#5F5F5F] mt-1">/ noche</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (reservaAsociada && reservaAsociada.id_navegacion) {
                                  navigate(
                                    `/inquilino/reserva-detalle/${encodeURIComponent(
                                      reservaAsociada.id_navegacion
                                    )}`
                                  )
                                } else if (propiedadId) {
                                  navigate(`/inquilino/propiedad/${propiedadId}`)
                                }
                              }}
                              disabled={!propiedadId}
                              className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl transition-all"
                            >
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
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
                        {userRole}
                      </span>
                      <span className="text-sm text-[#5F5F5F]/70">Reservar alojamiento</span>
                    </div>
                  </div>
                  {userRole === 'Huésped' && (
                    <Button
                      variant="outline"
                      className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl transition-all whitespace-nowrap"
                    >
                      Convertirme en anfitrión
                    </Button>
                  )}
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
                        variant="outline"
                        onClick={() => setIsChangePasswordOpen(true)}
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

          <CancelBookingModal
            open={Boolean(bookingToCancel)}
            onClose={() => setBookingToCancel(null)}
            onConfirm={handleCancelBooking}
            isLoading={isCancelling}
            error={cancellationError}
          />
        </div>
      </div>
    </>
  )
}

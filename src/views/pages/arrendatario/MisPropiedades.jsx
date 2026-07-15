import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Eye,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { getLandlordProperties } from '@/services/propertyService'
import { PropertyLocationMap } from '@/views/components/PropertyLocationMap'
import { UserNavbar } from '@/views/user/components/UserNavbar.jsx'

const statusStyles = {
  activa: 'bg-[#6B8E23] text-white',
  inactiva: 'bg-[#A67C52]/20 text-[#5F5F5F]',
  suspendida: 'bg-amber-100 text-amber-800',
}

function getPropertyImages(property) {
  const images = Array.isArray(property?.imagenes) ? property.imagenes : []
  const imageUrls = images.map(image => image?.url).filter(Boolean)

  if (property?.imagen_principal && !imageUrls.includes(property.imagen_principal)) {
    return [property.imagen_principal, ...imageUrls]
  }

  return imageUrls
}

function getMainImage(property) {
  return property?.imagen_principal || getPropertyImages(property)[0] || ''
}

function hasCoordinates(property) {
  return (
    property?.latitud !== null &&
    property?.latitud !== undefined &&
    property?.latitud !== '' &&
    property?.longitud !== null &&
    property?.longitud !== undefined &&
    property?.longitud !== ''
  )
}

export function MisPropiedades() {
  const navigate = useNavigate()
  const [canView, setCanView] = useState(false)
  const [userData, setUserData] = useState(null)
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')

    if (!storedUser) {
      navigate('/')
      return
    }

    const user = JSON.parse(storedUser)
    const role = user?.role || user?.rol

    if (role !== 'arrendatario' && role !== 'host' && !user?.id_arrendatario) {
      navigate('/profile')
      return
    }

    setUserData(user)
    setCanView(true)
  }, [navigate])

  const idArrendatario = useMemo(() => {
    return userData?.id_arrendatario || userData?.id
  }, [userData])

  useEffect(() => {
    if (!canView || !idArrendatario) return

    async function loadProperties() {
      try {
        setIsLoading(true)
        setError('')
        const data = await getLandlordProperties(idArrendatario)
        setProperties(data)
      } catch (loadError) {
        setError(loadError.message || 'No se pudieron cargar tus propiedades. Intenta nuevamente.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProperties()
  }, [canView, idArrendatario])

  const formatPrice = property => {
    const price = Number(property.precio_por_noche || 0).toLocaleString('es-MX', {
      maximumFractionDigits: 2,
    })
    return property.tipo_precio === 'mensual' ? `$${price} mensual` : `$${price} por noche`
  }

  const getStatusClass = estado => {
    return statusStyles[estado] || statusStyles.inactiva
  }

  if (!canView) return null

  const selectedImages = getPropertyImages(selectedProperty)
  const selectedMainImage = getMainImage(selectedProperty)
  const selectedLocation = [selectedProperty?.direccion, selectedProperty?.ciudad, selectedProperty?.pais]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <UserNavbar />
      <main className="min-h-screen bg-[#FAFAFA] px-4 py-8">
        <div className="container mx-auto max-w-5xl">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/arrendatario/perfil')}
            className="mb-5 border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Button>

          <Card className="bg-[#F2E8CF] border-none shadow-none rounded-2xl p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#6B8E23]">
                  <Building2 className="h-6 w-6" />
                </div>
                <h1 className="font-poppins text-2xl font-semibold text-[#5F5F5F] md:text-3xl">
                  Mis propiedades
                </h1>
                <p className="mt-3 max-w-2xl text-[#5F5F5F]/80">
                  Administra los alojamientos que tienes publicados en NoWayHome.
                </p>
              </div>
              <Button
                onClick={() => navigate('/arrendatario/propiedades/nueva')}
                className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar propiedad
              </Button>
            </div>
          </Card>

          <section className="mt-8">
            {isLoading && (
              <Card className="p-6 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl text-[#5F5F5F]">
                Cargando propiedades...
              </Card>
            )}

            {!isLoading && error && (
              <Card className="p-6 bg-white border border-red-100 shadow-sm rounded-2xl">
                <p className="text-red-800">No se pudieron cargar tus propiedades. Intenta nuevamente.</p>
              </Card>
            )}

            {!isLoading && !error && properties.length === 0 && (
              <Card className="p-6 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[#5F5F5F]">Aún no tienes propiedades registradas.</p>
                  <Button
                    onClick={() => navigate('/arrendatario/propiedades/nueva')}
                    className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar propiedad
                  </Button>
                </div>
              </Card>
            )}

            {!isLoading && !error && properties.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {properties.map(property => (
                  <Card
                    key={property.id_propiedad}
                    className="overflow-hidden bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl"
                  >
                    {property.imagen_principal ? (
                      <img
                        src={property.imagen_principal}
                        alt={property.titulo}
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 w-full items-center justify-center bg-[#F2E8CF] text-[#6B8E23]">
                        <Building2 className="h-10 w-10" />
                      </div>
                    )}

                    <div className="p-6">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h2 className="font-poppins text-xl font-semibold text-[#5F5F5F]">
                            {property.titulo}
                          </h2>
                          <p className="mt-1 text-sm text-[#5F5F5F]/75">
                            {[property.ciudad, property.pais].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-lg px-3 py-1 text-xs font-medium ${getStatusClass(property.estado)}`}
                        >
                          {property.estado}
                        </span>
                      </div>

                      <p className="font-poppins text-lg font-semibold text-[#6B8E23]">
                        {formatPrice(property)}
                      </p>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-[#5F5F5F]">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#A67C52]" />
                          {property.capacidad}
                        </span>
                        <span className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-[#A67C52]" />
                          {property.numero_habitaciones}
                        </span>
                        <span className="flex items-center gap-2">
                          <Bath className="h-4 w-4 text-[#A67C52]" />
                          {property.numero_banos}
                        </span>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          onClick={() => setSelectedProperty(property)}
                          variant="outline"
                          className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </Button>
                        <Button
                          type="button"
                          onClick={() =>
                            navigate(`/arrendatario/propiedades/${property.id_propiedad}/editar`)
                          }
                          variant="outline"
                          className="border-2 border-[#6B8E23]/20 text-[#5F5F5F] hover:border-[#6B8E23] hover:bg-[#F2E8CF]/30 shadow-none rounded-xl"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {selectedProperty && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="property-preview-title"
            >
              <Card className="w-full max-w-5xl overflow-hidden bg-[#F2E8CF] border-none shadow-xl rounded-2xl">
                <div className="flex flex-col gap-3 border-b border-[#6B8E23]/15 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#6B8E23]">
                      Vista previa de publicación
                    </p>
                    <h2
                      id="property-preview-title"
                      className="mt-1 font-poppins text-2xl font-semibold text-[#5F5F5F]"
                    >
                      {selectedProperty.titulo || 'Propiedad sin título'}
                    </h2>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      onClick={() =>
                        navigate(`/arrendatario/propiedades/${selectedProperty.id_propiedad}/editar`)
                      }
                      variant="outline"
                      className="border-2 border-[#6B8E23]/20 text-[#5F5F5F] hover:border-[#6B8E23] hover:bg-white/60 shadow-none rounded-xl"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar propiedad
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setSelectedProperty(null)}
                      className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cerrar previsualización
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-[1.25fr_0.75fr]">
                  <div className="space-y-5">
                    {selectedMainImage ? (
                      <img
                        src={selectedMainImage}
                        alt={selectedProperty.titulo || 'Imagen principal de la propiedad'}
                        className="h-80 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-80 w-full items-center justify-center rounded-xl bg-white text-[#6B8E23]">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <ImageIcon className="h-10 w-10" />
                          <p className="font-medium text-[#5F5F5F]">Imagen no disponible</p>
                        </div>
                      </div>
                    )}

                    {selectedImages.length > 1 && (
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                        {selectedImages.slice(1).map((imageUrl, index) => (
                          <img
                            key={`${imageUrl}-${index}`}
                            src={imageUrl}
                            alt={`Imagen adicional ${index + 1}`}
                            className="h-24 w-full rounded-xl object-cover"
                          />
                        ))}
                      </div>
                    )}

                    <div className="rounded-xl bg-white p-5 text-[#5F5F5F]">
                      <h3 className="font-poppins text-xl font-semibold">
                        {selectedProperty.titulo || 'Propiedad sin título'}
                      </h3>
                      <p className="mt-3 leading-7 text-[#5F5F5F]/85">
                        {selectedProperty.descripcion || 'Sin descripción disponible.'}
                      </p>
                      <p className="mt-4 flex items-start gap-2 text-sm text-[#5F5F5F]/80">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#A67C52]" />
                        {selectedLocation || 'Dirección no disponible'}
                      </p>
                    </div>
                  </div>

                  <aside className="space-y-5">
                    <div className="rounded-xl bg-white p-5">
                      <p className="font-poppins text-2xl font-semibold text-[#6B8E23]">
                        {formatPrice(selectedProperty)}
                      </p>
                      <p className="mt-1 text-sm text-[#5F5F5F]/75">
                        {selectedProperty.tipo_precio === 'mensual' ? 'Precio mensual' : 'Precio por noche'}
                      </p>
                      <span
                        className={`mt-4 inline-flex rounded-lg px-3 py-1 text-xs font-medium ${getStatusClass(selectedProperty.estado)}`}
                      >
                        {selectedProperty.estado || 'sin estado'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 rounded-xl bg-white p-5 text-center text-[#5F5F5F]">
                      <div>
                        <Users className="mx-auto h-5 w-5 text-[#A67C52]" />
                        <p className="mt-2 font-semibold">{selectedProperty.capacidad ?? '-'}</p>
                        <p className="text-xs text-[#5F5F5F]/70">Capacidad</p>
                      </div>
                      <div>
                        <BedDouble className="mx-auto h-5 w-5 text-[#A67C52]" />
                        <p className="mt-2 font-semibold">
                          {selectedProperty.numero_habitaciones ?? '-'}
                        </p>
                        <p className="text-xs text-[#5F5F5F]/70">Habitaciones</p>
                      </div>
                      <div>
                        <Bath className="mx-auto h-5 w-5 text-[#A67C52]" />
                        <p className="mt-2 font-semibold">{selectedProperty.numero_banos ?? '-'}</p>
                        <p className="text-xs text-[#5F5F5F]/70">Baños</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white p-5">
                      <h3 className="font-poppins text-lg font-semibold text-[#5F5F5F]">
                        Ubicación
                      </h3>
                      {hasCoordinates(selectedProperty) ? (
                        <PropertyLocationMap
                          latitud={selectedProperty.latitud}
                          longitud={selectedProperty.longitud}
                          className="mt-3"
                        />
                      ) : (
                        <div className="mt-3 flex min-h-56 items-center justify-center rounded-xl border border-[#6B8E23]/15 bg-[#F2E8CF]/55 text-[#5F5F5F]">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <MapPin className="h-6 w-6 text-[#A67C52]" />
                            <p className="font-medium">Ubicación no disponible</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </aside>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

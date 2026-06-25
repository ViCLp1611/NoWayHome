import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bath, BedDouble, Building2, Eye, Pencil, Plus, Users } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { getLandlordProperties } from '@/services/propertyService'
import { UserNavbar } from '@/views/user/components/UserNavbar.jsx'

const statusStyles = {
  activa: 'bg-[#6B8E23] text-white',
  inactiva: 'bg-[#A67C52]/20 text-[#5F5F5F]',
  suspendida: 'bg-amber-100 text-amber-800',
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
                          Ver detalle
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
            <Card className="mt-8 p-6 bg-[#F2E8CF] border-none shadow-none rounded-2xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="font-poppins text-xl font-semibold text-[#5F5F5F]">
                    {selectedProperty.titulo}
                  </h2>
                  <p className="mt-2 text-[#5F5F5F]/80">{selectedProperty.descripcion}</p>
                  <p className="mt-3 text-sm text-[#5F5F5F]">
                    {selectedProperty.direccion}
                    {selectedProperty.ciudad ? `, ${selectedProperty.ciudad}` : ''}
                    {selectedProperty.pais ? `, ${selectedProperty.pais}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setSelectedProperty(null)}
                  variant="outline"
                  className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl"
                >
                  Cerrar
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}

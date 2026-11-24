import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Star, Heart, Search } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { propiedadController } from '@/controllers/propiedadController.js'
import { toast } from 'sonner'
import { PLACEHOLDER_PROPERTY_IMAGE } from '@/views/inquilino/constants.js'
import { API_URL } from '@/config/api'

export function ExplorarPage() {
  const navigate = useNavigate()
  const [propiedades, setPropiedades] = useState([])
  const [filtro, setFiltro] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [favoritos, setFavoritos] = useState(new Set())
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
    if (!storedUser) {
      navigate('/')
      return
    }
    const parsedUser = JSON.parse(storedUser)
    const currentUserId = parsedUser?.id_inquilino || parsedUser?.id
    setUserId(currentUserId)

    const fetchPageData = async () => {
      if (!currentUserId) return

      try {
        setError('')
        setIsLoading(true)

        // Las propiedades ya vienen filtradas desde el backend para no mostrar las que
        // tienen una reserva activa ('pendiente' o 'confirmada').
        const [propiedadesResult, favoritosResponse] = await Promise.all([
          propiedadController.cargarPropiedades(),
          fetch(`${API_URL}/api/inquilino/${currentUserId}/favoritos`),
        ])

        // Process favorites
        if (favoritosResponse.ok) {
          const favoritosData = await favoritosResponse.json()
          if (favoritosData.success && Array.isArray(favoritosData.data)) {
            const favIds = new Set(favoritosData.data)
            setFavoritos(favIds)
          } else {
            console.error(
              'Error al procesar favoritos:',
              favoritosData.message || 'Respuesta no válida'
            )
          }
        } else {
          console.error('Error al cargar favoritos:', favoritosResponse.statusText)
        }

        // Process properties
        let propiedadesRaw = []
        if (
          propiedadesResult &&
          propiedadesResult.success &&
          Array.isArray(propiedadesResult.data)
        ) {
          propiedadesRaw = propiedadesResult.data
        } else if (Array.isArray(propiedadesResult)) {
          propiedadesRaw = propiedadesResult
        } else {
          throw new Error(
            propiedadesResult.error || 'No se pudieron cargar las propiedades disponibles.'
          )
        }

        setPropiedades(propiedadesRaw)
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los datos de la página.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPageData()
  }, [navigate])

  const propiedadesFiltradas = propiedades.filter(prop => {
    if (!filtro.trim()) return true

    const termino = filtro.toLowerCase()
    const nombreProp =
      prop.titulo || prop.titulo_propiedad || prop.nombre_propiedad || 'Propiedad sin título'
    const ubicacionProp = prop.ubicacion || prop.direccion || prop.ciudad || ''

    return (
      nombreProp.toLowerCase().includes(termino) || ubicacionProp.toLowerCase().includes(termino)
    )
  })

  const formatPrice = price => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)
  }

  const handleToggleFavorito = async (e, propiedadId) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      toast.error('Debes iniciar sesión para gestionar tus favoritos.')
      return
    }

    const isFavorito = favoritos.has(propiedadId)
    try {
      const response = await fetch(`${API_URL}/api/inquilino/favoritos`, {
        method: isFavorito ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_inquilino: userId,
          id_propiedad: propiedadId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Ocurrió un error en el servidor.')
      }

      if (isFavorito) {
        setFavoritos(prev => {
          const newFavs = new Set(prev)
          newFavs.delete(propiedadId)
          return newFavs
        })
        toast.success('Propiedad eliminada de tus favoritos.')
      } else {
        setFavoritos(prev => new Set(prev).add(propiedadId))
        toast.success('Propiedad agregada a tus favoritos.')
      }
    } catch (error) {
      toast.error(error.message || 'No se pudo actualizar tus favoritos. Intenta de nuevo.')
      console.error('Error al gestionar favoritos:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState message="Buscando alojamientos disponibles..." className="min-h-screen" />
      </div>
    )
  }

  return (
    <>
      <InquilinoNavbar />

      <div className="min-h-screen bg-background px-4 py-8 md:py-12">
        <div className="container mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <h1 className="tracking-tight text-foreground">
                Encuentra tu próximo destino
              </h1>
              <p className="text-base text-muted-foreground">
                Explora las mejores propiedades en No Way Home
              </p>
            </div>

            <div className="w-full md:w-[400px] shrink-0">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-ink" />
                <Input
                  placeholder="Buscar por ciudad, destino o nombre..."
                  className="h-14 w-full rounded-2xl border border-border bg-white pl-12 pr-4 text-foreground shadow-sm transition-all hover:shadow-md focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring"
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <AlertMessage
              type="error"
              title="No pudimos cargar el catálogo"
              message={error}
              className="mb-8 rounded-2xl"
            />
          )}

          {!error && propiedadesFiltradas.length === 0 ? (
            <div className="mt-12 rounded-3xl bg-white p-8 shadow-sm border border-border">
              <EmptyState
                icon={Search}
                title="No encontramos resultados"
                message="Intenta con otros términos de búsqueda o revisa la disponibilidad."
              />
            </div>
          ) : (
            !error && (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {propiedadesFiltradas.map(prop => {
                  const id = prop.id_propiedad
                  const nombre =
                    prop.titulo ||
                    prop.titulo_propiedad ||
                    prop.nombre_propiedad ||
                    'Propiedad sin título'
                  const ubicacion =
                    prop.ubicacion || prop.direccion || prop.ciudad || 'Ubicación no especificada'
                  const precio = prop.precio_noche || prop.precio || prop.costo || 0
                  const imagen = prop.imagen_principal || PLACEHOLDER_PROPERTY_IMAGE
                  const isFavorito = favoritos.has(id)

                  return (
                    <Card
                      key={id}
                      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-transparent bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_12px_30px_color-mix(in_srgb,var(--primary)_8%,transparent)]"
                    >
                      {/* Imagen superior con gradiente sutil al hacer hover */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-secondary/30">
                        <img
                          src={imagen}
                          alt={nombre}
                          className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        <button
                          onClick={e => handleToggleFavorito(e, id)}
                          className="absolute right-3 top-3 rounded-full bg-white/90 p-2.5 backdrop-blur-md transition-all hover:scale-110 hover:bg-white shadow-sm"
                        >
                          <Heart
                            className={`h-5 w-5 transition-colors ${
                              isFavorito
                                ? 'fill-[#ff4757] text-[#ff4757]'
                                : 'text-foreground hover:fill-[#ff4757] hover:text-[#ff4757]'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Contenido de la Tarjeta */}
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <h3
                              className="line-clamp-2 flex-1 text-base leading-tight text-foreground"
                              title={nombre}
                            >
                              {nombre}
                            </h3>
                            <div className="flex shrink-0 items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 whitespace-nowrap">
                              <Star className="h-3.5 w-3.5 fill-primary text-primary-ink" />
                              <span className="text-xs font-semibold text-foreground">4.9</span>
                            </div>
                          </div>

                          <div className="mb-4 flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0 text-accent-ink" />
                            <span className="line-clamp-1 text-sm font-medium">{ubicacion}</span>
                          </div>
                        </div>

                        <div className="mt-auto space-y-4 pt-2">
                          <div className="flex items-baseline justify-between border-t border-secondary pt-4">
                            <span className="text-xl font-medium text-primary-ink">
                              {formatPrice(precio)}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">/ noche</span>
                          </div>

                          {/* Botón de Detalles Mejorado (Única Acción) */}
                          <Button
                            onClick={() => navigate(`/inquilino/propiedad/${id}`)}
                            className="h-11 w-full rounded-xl bg-primary text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary-hover active:bg-primary-active hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--primary)_20%,transparent)] hover:-translate-y-0.5"
                          >
                            Ver detalles
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>
    </>
  )
}

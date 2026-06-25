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
import { PLACEHOLDER_PROPERTY_IMAGE } from '@/views/inquilino/constants.js'
import { propiedadController } from '@/controllers/propiedadController.js'

export function ExplorarPage() {
  const navigate = useNavigate()
  const [propiedades, setPropiedades] = useState([])
  const [filtro, setFiltro] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
    if (!storedUser) {
      navigate('/')
      return
    }

    const fetchPropiedades = async () => {
      try {
        setError('')
        const result = await propiedadController.cargarPropiedades()
        if (result && result.success && Array.isArray(result.data)) {
          setPropiedades(result.data)
        } else if (Array.isArray(result)) {
          setPropiedades(result)
        } else {
          setError('No se pudieron cargar las propiedades disponibles.')
        }
      } catch (err) {
        setError(err.message || 'No se pudieron cargar las propiedades disponibles.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropiedades()
  }, [navigate])

  const propiedadesFiltradas = propiedades.filter(prop => {
    if (!filtro.trim()) return true

    const termino = filtro.toLowerCase()
    const nombreProp = prop.nombre || prop.titulo || prop.descripcion || ''
    const ubicacionProp = prop.ubicacion || prop.direccion || prop.ciudad || ''

    return (
      nombreProp.toLowerCase().includes(termino) ||
      ubicacionProp.toLowerCase().includes(termino)
    )
  })

  const formatPrice = price => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <LoadingState message="Buscando alojamientos disponibles..." className="min-h-screen" />
      </div>
    )
  }

  return (
    <>
      <InquilinoNavbar />

      <div className="min-h-screen bg-[#FAFAFA] px-4 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <h1 className="font-poppins text-3xl font-bold text-[#5F5F5F]">
                Encuentra tu proximo destino
              </h1>
              <p className="mt-1 text-[#5F5F5F]/70">
                Explora las mejores propiedades en No Way Home
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/inquilino/perfil')}
                className="rounded-xl border-2 border-[#6B8E23] text-[#6B8E23] shadow-none hover:bg-[#F2E8CF]"
              >
                Mi perfil
              </Button>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F5F5F]/50" />
                <Input
                  placeholder="Buscar por ciudad, destino o nombre..."
                  className="h-12 rounded-xl border-[#6B8E23]/20 bg-white pl-10 text-[#5F5F5F] focus-visible:ring-[#6B8E23]"
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <AlertMessage
              type="error"
              title="No pudimos cargar el catalogo"
              message={error}
              className="mb-6"
            />
          )}

          {!error && propiedadesFiltradas.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No encontramos resultados"
              message="Intenta con otros terminos de busqueda o revisa la disponibilidad."
            />
          ) : (
            !error && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {propiedadesFiltradas.map(prop => {
                  const id = prop.id_propiedad || prop.id
                  const nombre = prop.descripcion || prop.nombre || prop.titulo || 'Sin nombre'
                  const ubicacion =
                    prop.ubicacion || prop.direccion || prop.ciudad || 'Ubicacion no especificada'
                  const precio = prop.precio_noche || prop.precio || prop.costo || 0
                  const imagen = prop.imagen_principal || PLACEHOLDER_PROPERTY_IMAGE

                  return (
                    <Card
                      key={id}
                      className="group flex flex-col overflow-hidden rounded-2xl border-none bg-white shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
                        <img
                          src={imagen}
                          alt={nombre}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <button className="absolute right-3 top-3 rounded-full bg-white/70 p-2 backdrop-blur-sm transition-colors hover:bg-white">
                          <Heart className="h-5 w-5 text-[#5F5F5F] transition-colors hover:fill-[#6B8E23] hover:text-[#6B8E23]" />
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h3
                              className="line-clamp-2 flex-1 font-poppins text-base font-semibold text-[#5F5F5F]"
                              title={nombre}
                            >
                              {nombre}
                            </h3>
                            <div className="flex shrink-0 items-center gap-1 rounded-md bg-[#F2E8CF] px-2 py-0.5 whitespace-nowrap">
                              <Star className="h-3 w-3 fill-[#6B8E23] text-[#6B8E23]" />
                              <span className="text-xs font-semibold text-[#5F5F5F]">4.9</span>
                            </div>
                          </div>

                          <div className="mb-3 flex items-center gap-1 text-[#5F5F5F]/80">
                            <MapPin className="h-4 w-4 shrink-0 text-[#A67C52]" />
                            <span className="line-clamp-1 text-xs sm:text-sm">{ubicacion}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <span className="font-poppins text-lg font-semibold text-[#6B8E23]">
                              {formatPrice(precio)}
                            </span>
                            <span className="text-xs text-[#5F5F5F]/70">por noche</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/inquilino/propiedad/${id}`)}
                              className="rounded-xl border-2 border-[#6B8E23] text-[#6B8E23] shadow-none hover:bg-[#F2E8CF] text-xs sm:text-sm py-2"
                            >
                              Ver detalles
                            </Button>
                            <Button
                              onClick={() => navigate(`/inquilino/reserva/${id}`)}
                              className="rounded-xl bg-[#6B8E23] text-white shadow-none hover:bg-[#5a7a1e] text-xs sm:text-sm py-2"
                            >
                              Reservar
                            </Button>
                          </div>
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

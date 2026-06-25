import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Star, Heart, Loader2, Search } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { propiedadController } from '@/controllers/propiedadController.js'

export function ExplorarPage() {
  const navigate = useNavigate()
  const [propiedades, setPropiedades] = useState([])
  const [filtro, setFiltro] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
    if (!storedUser) {
      navigate('/')
      return
    }

    const fetchPropiedades = async () => {
      try {
        const result = await propiedadController.cargarPropiedades()
        if (result && result.success && Array.isArray(result.data)) {
          setPropiedades(result.data)
        } else if (Array.isArray(result)) {
          setPropiedades(result)
        } else {
          console.error('Estructura de datos inesperada:', result)
        }
      } catch (err) {
        console.error('Error al intentar cargar propiedades en vista:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropiedades()
  }, [navigate])

  // FILTRADO ROBUSTO: Validamos de forma segura que las propiedades tengan nombre o ubicación
  // FILTRADO ROBUSTO: Validamos de forma segura
  const propiedadesFiltradas = propiedades.filter(prop => {
    // 1. Si el buscador está vacío, muestra todo inmediatamente
    if (!filtro.trim()) return true

    const termino = filtro.toLowerCase()

    // 2. Protegemos contra nulos y nombres de columnas alternativos
    const nombreProp = prop.nombre || prop.titulo || ''
    const ubicacionProp = prop.ubicacion || prop.direccion || prop.ciudad || ''

    const coincideNombre = nombreProp.toLowerCase().includes(termino)
    const coincideUbicacion = ubicacionProp.toLowerCase().includes(termino)

    return coincideNombre || coincideUbicacion
  })

  const formatPrice = price => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] text-[#6B8E23]">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p className="text-[#5F5F5F] font-poppins font-medium">
          Buscando alojamientos increíbles...
        </p>
      </div>
    )
  }

  return (
    <>
      <InquilinoNavbar />

      <div className="min-h-screen py-8 px-4 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-7xl">
          {/* Header & buscador */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="font-poppins font-bold text-3xl text-[#5F5F5F]">
                Encuentra tu próximo destino
              </h1>
              <p className="text-[#5F5F5F]/70 mt-1">
                Explora las mejores propiedades en No Way Home
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/inquilino/perfil')}
                className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#F2E8CF] shadow-none rounded-xl"
              >
                Mi perfil
              </Button>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5F5F5F]/50" />
                <Input
                  placeholder="Buscar por ciudad, destino o nombre..."
                  className="pl-10 h-12 rounded-xl border-[#6B8E23]/20 focus-visible:ring-[#6B8E23] text-[#5F5F5F] bg-white"
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Grid de Propiedades */}
          {propiedadesFiltradas.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#6B8E23]/10">
              <Search className="h-12 w-12 text-[#A67C52] mx-auto mb-4 opacity-50" />
              <h3 className="font-poppins font-semibold text-xl text-[#5F5F5F] mb-2">
                No encontramos resultados
              </h3>
              <p className="text-[#5F5F5F]/70">
                Intenta con otros términos de búsqueda o revisa la disponibilidad.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {propiedadesFiltradas.map(prop => {
                // 💡 MAPEO CORREGIDO: Priorizamos 'descripcion' como el título de la tarjeta
                const id = prop.id_propiedad || prop.id
                const nombre = prop.descripcion || prop.nombre || prop.titulo || 'Sin nombre'
                const ubicacion =
                  prop.ubicacion || prop.direccion || prop.ciudad || 'Ubicación no especificada'
                const precio = prop.precio_noche || prop.precio || prop.costo || 0
                const imagen =
                  prop.imagen ||
                  prop.foto ||
                  prop.url_imagen ||
                  prop.imagen_url ||
                  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'

                return (
                  <Card
                    key={id}
                    className="group overflow-hidden rounded-2xl border-none shadow-sm hover:shadow-md transition-all bg-white cursor-pointer"
                  >
                    {/* Imagen */}
                    <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                      <img
                        src={imagen}
                        alt={nombre}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      <button className="absolute top-3 right-3 p-2 rounded-full bg-white/70 hover:bg-white backdrop-blur-sm transition-colors">
                        <Heart className="h-5 w-5 text-[#5F5F5F] hover:fill-[#6B8E23] hover:text-[#6B8E23] transition-colors" />
                      </button>
                    </div>

                    {/* Contenido */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3
                          className="font-poppins font-semibold text-lg text-[#5F5F5F] line-clamp-1"
                          title={nombre}
                        >
                          {nombre}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0 bg-[#F2E8CF] px-2 py-0.5 rounded-md">
                          <Star className="h-3 w-3 fill-[#6B8E23] text-[#6B8E23]" />
                          <span className="text-xs font-semibold text-[#5F5F5F]">4.9</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[#5F5F5F]/80 mb-3">
                        <MapPin className="h-4 w-4 shrink-0 text-[#A67C52]" />
                        <span className="text-sm line-clamp-1">{ubicacion}</span>
                      </div>

                      <div className="flex items-center justify-between mt-4 gap-3">
                        <div className="flex flex-col">
                          <span className="font-poppins font-semibold text-lg text-[#6B8E23]">
                            {formatPrice(precio)}
                          </span>
                          <span className="text-xs text-[#5F5F5F]/70">por noche</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/inquilino/propiedad/${id}`)}
                            className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#F2E8CF] shadow-none rounded-xl"
                          >
                            Ver detalles
                          </Button>
                          <Button
                            onClick={() => navigate(`/inquilino/reserva/${id}`)}
                            className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl"
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
          )}
        </div>
      </div>
    </>
  )
}

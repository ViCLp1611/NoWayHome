import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Calendar, Users } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { PropertyCard } from '@/views/components/PropertyCard'
import { PLACEHOLDER_PROPERTY_IMAGE } from '@/views/inquilino/constants.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function HomePage() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [destino, setDestino] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Se corrige el puerto de la API a 3001 para que coincida con la configuración del backend.
        // El error 'net::ERR_CONNECTION_REFUSED' indica que el servidor no está escuchando en el puerto 4000.
        // Otros servicios del proyecto usan el puerto 3001 como predeterminado.
        const response = await fetch(`${API_URL}/api/inquilino/properties`)
        if (!response.ok) {
          throw new Error(
            `No se pudieron cargar las propiedades. Estado del servidor: ${response.status}`
          )
        }
        const result = await response.json()

        // Se ajusta la extracción de datos para que coincida con la estructura de respuesta de la API.
        // Otros componentes como ExplorarPage y ProfilePage esperan un objeto { success: true, data: [...] }.
        // Si la API devuelve { "data": [...] } o { "properties": [...] }, esta lógica lo manejará.
        let propertiesData = []
        if (result && result.success && Array.isArray(result.data)) {
          propertiesData = result.data
        } else if (result && Array.isArray(result.properties)) {
          propertiesData = result.properties
        } else if (Array.isArray(result)) {
          propertiesData = result
        }

        const getPropertyTitle = description => {
          const lines = String(description || '')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
          return lines[0] || 'Propiedad sin título'
        }

        const mappedProperties = propertiesData.map(prop => ({
          ...prop,
          id: prop.id_propiedad,
          title: getPropertyTitle(prop.descripcion),
          location: prop.direccion,
          price: prop.precio,
          image: prop.imagen_principal || PLACEHOLDER_PROPERTY_IMAGE,
        }))

        setProperties(mappedProperties)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  const handleSearch = () => {
    navigate('/inquilino/explorar', { state: { searchTerm: destino } })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#F2E8CF] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="font-poppins font-semibold text-4xl md:text-5xl text-[#5F5F5F] mb-5 leading-tight">
              Encuentra tu Hospedaje Perfecto
            </h1>
            <p className="text-[#5F5F5F]/80 text-lg md:text-xl mb-6">
              Explora miles de propiedades únicas en los mejores destinos
            </p>
            {/* Enlace discreto para anfitriones */}
            <button
              onClick={() => navigate('/register')}
              className="text-sm text-[#A67C52] hover:text-[#6B8E23] transition-colors underline decoration-dotted"
            >
              ¿Eres anfitrión? Publica tu espacio
            </button>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-[#6B8E23]/10 p-5 md:p-7">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="flex items-center gap-3 pb-5 md:pb-0 border-b md:border-b-0 md:border-r border-[#6B8E23]/10 md:pr-5">
                <MapPin className="h-5 w-5 text-[#A67C52] flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs text-[#5F5F5F]/70 block mb-1">Destino</label>
                  <Input
                    placeholder="¿Dónde vas?"
                    value={destino}
                    onChange={e => setDestino(e.target.value)}
                    className="border-none p-0 h-auto focus-visible:ring-0 text-[#5F5F5F] placeholder:text-[#5F5F5F]/40"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pb-5 md:pb-0 border-b md:border-b-0 md:border-r border-[#6B8E23]/10 md:pr-5">
                <Calendar className="h-5 w-5 text-[#A67C52] flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs text-[#5F5F5F]/70 block mb-1">Fecha</label>
                  <Input
                    placeholder="Entrada - Salida"
                    className="border-none p-0 h-auto focus-visible:ring-0 text-[#5F5F5F] placeholder:text-[#5F5F5F]/40"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pb-5 md:pb-0 md:pr-5">
                <Users className="h-5 w-5 text-[#A67C52] flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs text-[#5F5F5F]/70 block mb-1">Huéspedes</label>
                  <Input
                    placeholder="Añadir huéspedes"
                    className="border-none p-0 h-auto focus-visible:ring-0 text-[#5F5F5F] placeholder:text-[#5F5F5F]/40"
                  />
                </div>
              </div>

              <Button
                onClick={handleSearch}
                className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl"
              >
                <Search className="h-5 w-5 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
              Propiedades Disponibles
            </h2>
            <p className="text-[#5F5F5F]/70 text-lg">Las mejores opciones seleccionadas para ti</p>
          </div>

          {isLoading && <p className="text-center text-[#5F5F5F]">Cargando propiedades...</p>}
          {error && <p className="text-center text-red-600">Error: {error}</p>}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {properties.map(property => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#6B8E23] py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-poppins font-semibold text-3xl md:text-4xl text-white mb-5 leading-tight">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Únete a miles de viajeros que confían en nosotros para encontrar su hospedaje ideal
          </p>
          <Button
            onClick={() => navigate('/register')}
            className="bg-white text-[#6B8E23] hover:bg-[#F2E8CF] shadow-none rounded-xl px-8 h-12"
          >
            Comenzar ahora
          </Button>
        </div>
      </section>
    </div>
  )
}

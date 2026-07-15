import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  MapPin,
  Users,
  Star,
  DollarSign,
  Facebook,
  Twitter,
  Instagram,
  Mail,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card } from '@/app/components/ui/card'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { PLACEHOLDER_PROPERTY_IMAGE } from '@/views/inquilino/constants.js'
import { propiedadController } from '@/controllers/propiedadController.js'

// Importación de los PDFs legales desde la carpeta assets
import politicaPdf from '@/assets/politica-de-privacidad.pdf'
import terminosPdf from '@/assets/terminos-y-condiciones.pdf' // Ajusta este nombre si tu archivo se llama distinto

export function HomePage() {
  const navigate = useNavigate()
  const [propiedades, setPropiedades] = useState([])
  const [destino, setDestino] = useState('')
  const [precioMax, setPrecioMax] = useState('')
  const [huespedes, setHuespedes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPropiedades = async () => {
      try {
        setError(null)
        const result = await propiedadController.cargarPropiedades()

        let propiedadesRaw = []
        if (result && result.success && Array.isArray(result.data)) {
          propiedadesRaw = result.data
        } else if (Array.isArray(result)) {
          propiedadesRaw = result
        } else {
          throw new Error('No se pudieron cargar las propiedades disponibles.')
        }
        setPropiedades(propiedadesRaw)
      } catch (err) {
        setError(err.message || 'Error al conectar con el servidor.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropiedades()
  }, [])

  // Filtrado tridimensional en tiempo real en base a los 3 campos
  const propiedadesFiltradas = propiedades.filter(prop => {
    // 1. Filtro por texto (Destino / Título)
    const termino = destino.toLowerCase().trim()
    const matchTexto = (() => {
      if (!termino) return true
      const nombreProp = prop.titulo || prop.descripcion || prop.nombre || ''
      const ubicacionProp = prop.ubicacion || prop.direccion || prop.ciudad || ''
      return (
        nombreProp.toLowerCase().includes(termino) || ubicacionProp.toLowerCase().includes(termino)
      )
    })()

    // 2. Filtro por Costo deseado (Precio Máximo)
    const maxPrice = parseFloat(precioMax)
    const matchPrecio = (() => {
      if (isNaN(maxPrice) || maxPrice <= 0) return true
      const precioProp = prop.precio_noche || prop.precio || prop.costo || 0
      return precioProp <= maxPrice
    })()

    // 3. Filtro por Número de Huéspedes
    const numHuespedes = parseInt(huespedes, 10)
    const matchHuespedes = (() => {
      if (isNaN(numHuespedes) || numHuespedes <= 0) return true
      const capacidadProp = prop.capacidad || prop.huespedes || prop.max_huespedes || 0
      return capacidadProp >= numHuespedes
    })()

    return matchTexto && matchPrecio && matchHuespedes
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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
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
            <button
              onClick={() => navigate('/register')}
              className="text-sm text-[#A67C52] hover:text-[#6B8E23] transition-colors underline decoration-dotted"
            >
              ¿Eres anfitrión? Publica tu espacio
            </button>
          </div>

          {/* Search Bar de 3 campos funcionales (Sin botón extra) */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-[#6B8E23]/10 p-5 md:p-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Campo 1: Destino o Título */}
              <div className="flex items-center gap-3 pb-5 md:pb-0 border-b md:border-b-0 md:border-r border-[#6B8E23]/10 md:pr-5">
                <MapPin className="h-5 w-5 text-[#A67C52] flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs text-[#5F5F5F]/70 block mb-1">Destino o Título</label>
                  <Input
                    placeholder="¿Dónde vas o qué buscas?"
                    value={destino}
                    onChange={e => setDestino(e.target.value)}
                    className="border-none p-0 h-auto focus-visible:ring-0 text-[#5F5F5F] placeholder:text-[#5F5F5F]/40 bg-transparent"
                  />
                </div>
              </div>

              {/* Campo 2: Costo Deseado */}
              <div className="flex items-center gap-3 pb-5 md:pb-0 border-b md:border-b-0 md:border-r border-[#6B8E23]/10 md:pr-5">
                <DollarSign className="h-5 w-5 text-[#A67C52] flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs text-[#5F5F5F]/70 block mb-1">Costo Máximo</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Precio máximo"
                    value={precioMax}
                    onChange={e => setPrecioMax(e.target.value)}
                    className="border-none p-0 h-auto focus-visible:ring-0 text-[#5F5F5F] placeholder:text-[#5F5F5F]/40 bg-transparent"
                  />
                </div>
              </div>

              {/* Campo 3: Número de Huéspedes */}
              <div className="flex items-center gap-3 pb-5 md:pb-0 md:pr-5">
                <Users className="h-5 w-5 text-[#A67C52] flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs text-[#5F5F5F]/70 block mb-1">Huéspedes</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="¿Cuántos van?"
                    value={huespedes}
                    onChange={e => setHuespedes(e.target.value)}
                    className="border-none p-0 h-auto focus-visible:ring-0 text-[#5F5F5F] placeholder:text-[#5F5F5F]/40 bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Propiedades */}
      <section className="flex-grow py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-10">
            <h2 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
              Propiedades Disponibles
            </h2>
            <p className="text-[#5F5F5F]/70 text-lg">Las mejores opciones seleccionadas para ti</p>
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
            <div className="mt-12 rounded-3xl bg-white p-8 shadow-sm border border-[#6B8E23]/10">
              <EmptyState
                icon={Search}
                title="No encontramos resultados"
                message="Intenta modificando los valores del buscador o los filtros aplicados."
              />
            </div>
          ) : (
            !error && (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {propiedadesFiltradas.map(prop => {
                  const id = prop.id_propiedad || prop.id
                  const nombre = prop.titulo || prop.descripcion || prop.nombre || 'Sin nombre'
                  const ubicacion =
                    prop.ubicacion || prop.direccion || prop.ciudad || 'Ubicación no especificada'
                  const precio = prop.precio_noche || prop.precio || prop.costo || 0
                  const imagen = prop.imagen_principal || PLACEHOLDER_PROPERTY_IMAGE

                  return (
                    <Card
                      key={id}
                      /* Estricta visualización: No redirige al detalle de la propiedad */
                      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-transparent bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#6B8E23]/20 hover:shadow-[0_12px_30px_rgba(107,142,35,0.08)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#F2E8CF]/30">
                        <img
                          src={imagen}
                          alt={nombre}
                          className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <h3
                              className="line-clamp-2 flex-1 font-poppins text-base font-semibold leading-tight text-[#5F5F5F]"
                              title={nombre}
                            >
                              {nombre}
                            </h3>
                            <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#F2E8CF] px-2.5 py-1 whitespace-nowrap">
                              <Star className="h-3.5 w-3.5 fill-[#6B8E23] text-[#6B8E23]" />
                              <span className="text-xs font-semibold text-[#5F5F5F]">
                                {prop.calificacion_promedio || '4.9'}
                              </span>
                            </div>
                          </div>

                          <div className="mb-4 flex items-center gap-1.5 text-[#5F5F5F]/70">
                            <MapPin className="h-4 w-4 shrink-0 text-[#A67C52]" />
                            <span className="line-clamp-1 text-sm font-medium">{ubicacion}</span>
                          </div>
                        </div>

                        <div className="mt-auto space-y-4 pt-2">
                          <div className="flex items-baseline justify-between border-t border-[#F2E8CF] pt-4">
                            <span className="font-poppins text-xl font-bold text-[#6B8E23]">
                              {formatPrice(precio)}
                            </span>
                            <span className="text-sm font-medium text-[#5F5F5F]/60">/ noche</span>
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

      {/* Footer Profesional */}
      <footer className="bg-white border-t border-[#6B8E23]/10 pt-16 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Branding & Descripción */}
            <div className="md:col-span-1 space-y-4">
              <h3 className="font-poppins text-2xl font-bold text-[#6B8E23]">No Way Home</h3>
              <p className="text-[#5F5F5F]/70 text-sm leading-relaxed">
                Tu plataforma de confianza para encontrar los mejores alojamientos temporales.
                Siéntete en casa, sin importar a dónde vayas.
              </p>
              <div className="flex space-x-4 pt-2">
                <a href="#" className="text-[#A67C52] hover:text-[#6B8E23] transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-[#A67C52] hover:text-[#6B8E23] transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-[#A67C52] hover:text-[#6B8E23] transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Enlaces Rápidos */}
            <div>
              <h4 className="font-poppins font-semibold text-[#5F5F5F] mb-4">Descubre</h4>
              <ul className="space-y-3">
                <li>
                  <button className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left">
                    Destinos populares
                  </button>
                </li>
                <li>
                  <button className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left">
                    Alojamientos destacados
                  </button>
                </li>
                <li>
                  <button className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left">
                    Ofertas especiales
                  </button>
                </li>
                <li>
                  <button className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left">
                    Cómo funciona
                  </button>
                </li>
              </ul>
            </div>

            {/* Anfitriones */}
            <div>
              <h4 className="font-poppins font-semibold text-[#5F5F5F] mb-4">Anfitriones</h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => navigate('/register')}
                    className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left"
                  >
                    Publica tu espacio
                  </button>
                </li>
                <li>
                  <button className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left">
                    Recursos para anfitriones
                  </button>
                </li>
                <li>
                  <button className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left">
                    Foro de la comunidad
                  </button>
                </li>
                <li>
                  <button className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left">
                    Protección para anfitriones
                  </button>
                </li>
              </ul>
            </div>

            {/* Soporte */}
            <div>
              <h4 className="font-poppins font-semibold text-[#5F5F5F] mb-4">Soporte</h4>
              <ul className="space-y-3">
                <li>
                  <button className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left">
                    Centro de ayuda
                  </button>
                </li>
                <li>
                  <button className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left">
                    Opciones de cancelación
                  </button>
                </li>
                <li>
                  <button className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors text-left">
                    Medidas de seguridad
                  </button>
                </li>
                <li className="flex items-center gap-2 mt-4">
                  <Mail className="h-4 w-4 text-[#A67C52]" />
                  <a
                    href="mailto:nowayhomeadmin@gmail.com"
                    className="text-[#5F5F5F]/70 hover:text-[#6B8E23] text-sm transition-colors"
                  >
                    nowayhomeadmin@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright y Políticas usando Etiquetas <a> con importación */}
          <div className="border-t border-[#6B8E23]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#5F5F5F]/60 text-sm">
              © {new Date().getFullYear()} No Way Home. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <a
                href={politicaPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5F5F5F]/60 hover:text-[#6B8E23] text-sm transition-colors font-medium"
              >
                Privacidad
              </a>
              <a
                href={terminosPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5F5F5F]/60 hover:text-[#6B8E23] text-sm transition-colors font-medium"
              >
                Términos
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

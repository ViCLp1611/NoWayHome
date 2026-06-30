import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, ChevronLeft, ChevronRight, Users, Bed, Bath } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { PLACEHOLDER_PROPERTY_IMAGE } from '@/views/inquilino/constants.js'
import { propiedadController } from '@/controllers/propiedadController.js'

export function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [propiedad, setPropiedad] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [imagenActual, setImagenActual] = useState(0)

  useEffect(() => {
    const fetchPropiedad = async () => {
      try {
        setError('')
        const result = await propiedadController.cargarDetallesPropiedad(id)
        if (result.success) {
          setPropiedad(result.data)
        } else {
          setError(result.error || 'No se pudo cargar la propiedad.')
        }
      } catch (loadError) {
        setError(loadError.message || 'No se pudo cargar la propiedad.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropiedad()
  }, [id])

  const formatPrice = price => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)
  }

  const handlePrevImage = () => {
    setImagenActual(prev => (prev === 0 ? imagenes.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setImagenActual(prev => (prev === imagenes.length - 1 ? 0 : prev + 1))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <LoadingState message="Cargando propiedad..." className="min-h-screen" />
      </div>
    )
  }

  if (!propiedad) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-8">
        <div className="container mx-auto max-w-3xl">
          {error && (
            <AlertMessage
              type="error"
              title="No pudimos cargar esta propiedad"
              message={error}
              className="mb-6"
            />
          )}
          <EmptyState
            title="Propiedad no disponible"
            message="La propiedad solicitada no existe o no esta disponible para reservar."
            action={
              <Button
                onClick={() => navigate('/inquilino/explorar')}
                className="h-auto min-h-[44px] w-full rounded-lg bg-[#6B8E23] px-4 py-3 text-base font-medium text-white transition hover:bg-[#5a7a1e] sm:w-auto"
              >
                Explorar otras propiedades
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const title = propiedad.titulo || propiedad.descripcion || propiedad.title || 'Propiedad'
  const location =
    propiedad.ubicacion || propiedad.direccion || propiedad.location || 'Ubicacion desconocida'
  const price = propiedad.precio_noche || propiedad.precio || propiedad.price || 0
  const image = propiedad.imagen_principal || PLACEHOLDER_PROPERTY_IMAGE
  const imagenes = propiedad.imagenes || []

  return (
    <>
      <InquilinoNavbar />
      <main className="min-h-screen bg-[#FAFAFA] py-8 sm:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/inquilino/explorar')}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-[#5F5F5F] transition-colors hover:text-[#6B8E23]"
          >
            <ArrowLeft className="h-4 w-4 text-[#A67C52]" />
            <span>Volver al catálogo</span>
          </button>

          {error && (
            <AlertMessage
              type="error"
              title="No pudimos cargar esta propiedad"
              message={error}
              className="mb-8"
            />
          )}

          <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-6">
            {/* Columna de Contenido Principal */}
            <div className="lg:col-span-7">
              <header>
                <h1 className="font-poppins text-[28px] font-semibold text-[#5F5F5F] lg:text-[36px]">
                  {title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#5F5F5F]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#A67C52]" />
                    <span className="font-medium">{location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-[#A67C52]" />
                    <span className="font-medium">4.9</span>
                  </div>
                </div>
              </header>

              {/* Galería de Imágenes */}
              <div className="relative mt-6">
                <img
                  src={imagenes.length > 0 ? imagenes[imagenActual]?.url : image}
                  alt={title}
                  className="aspect-[4/3] w-full rounded-xl object-cover md:aspect-[16/10] lg:h-[500px]"
                />
                {imagenes.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#5F5F5F] shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#5F5F5F] shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
                      aria-label="Imagen siguiente"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 p-1.5 backdrop-blur-sm">
                      {imagenes.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImagenActual(idx)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            idx === imagenActual ? 'w-6 bg-[#6B8E23]' : 'w-2 bg-white/70'
                          }`}
                          aria-label={`Ver imagen ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Columna de Reserva (Sticky) */}
            <div className="lg:col-span-5">
              <div className="sticky top-28">
                <Card className="rounded-xl border-0 bg-[#F2E8CF] p-6 shadow-none">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-poppins text-2xl font-semibold text-[#5F5F5F]">
                        {formatPrice(price)}
                      </span>
                      <span className="text-sm text-[#5F5F5F]/80">/ noche</span>
                    </div>
                    <span className="rounded-full bg-white/60 px-3 py-1 text-sm font-medium capitalize text-[#5F5F5F]">
                      {propiedad.estado || 'Disponible'}
                    </span>
                  </div>

                  {/* Detalles de la Propiedad */}
                  <div className="mt-6 border-t border-[#A67C52]/20 pt-6">
                    <h3 className="font-poppins text-base font-semibold text-[#5F5F5F]">
                      Características
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-[#5F5F5F]">
                      {propiedad.descripcion ||
                        propiedad.resena ||
                        'Descripción no disponible para esta propiedad.'}
                    </p>
                  </div>

                  <div className="mt-6 space-y-4 border-t border-[#A67C52]/20 pt-6">
                    <Button
                      onClick={() => navigate(`/inquilino/reserva/${id}`)}
                      className="h-auto min-h-[44px] w-full rounded-lg bg-[#6B8E23] px-4 py-3 text-base font-medium text-white transition hover:bg-[#5a7a1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B8E23] focus-visible:ring-offset-2"
                    >
                      Reservar ahora
                    </Button>
                  </div>

                  <div className="mt-6 rounded-lg bg-white/50 p-4 text-sm text-[#5F5F5F]/90">
                    <p className="font-medium text-[#5F5F5F]">Información importante</p>
                    <p className="mt-1">
                      Tu reserva será registrada y podrás consultarla desde tu perfil. Se confirmará
                      conforme a disponibilidad.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

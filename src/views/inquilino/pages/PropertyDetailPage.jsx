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
                className="rounded-xl bg-[#6B8E23] text-white"
              >
                Volver a explorar
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
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <button
            onClick={() => navigate('/inquilino/explorar')}
            className="mb-6 flex items-center gap-2 font-medium text-[#5F5F5F] transition-colors hover:text-black"
          >
            <ArrowLeft className="h-5 w-5" /> Volver al catalogo
          </button>

          {error && (
            <AlertMessage
              type="error"
              title="No pudimos cargar esta propiedad"
              message={error}
              className="mb-6"
            />
          )}

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.5fr_1fr]">
            <Card className="overflow-hidden rounded-3xl border border-[#6B8E23]/10 shadow-sm">
              <div className="relative">
                <img
                  src={imagenes.length > 0 ? imagenes[imagenActual]?.url : image}
                  alt={title}
                  className="h-96 w-full object-cover"
                />

                {imagenes.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white transition-all hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white transition-all hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
                      aria-label="Imagen siguiente"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {imagenes.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImagenActual(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === imagenActual
                              ? 'w-8 bg-[#6B8E23]'
                              : 'w-2 bg-white/50 hover:bg-white/75'
                          }`}
                          aria-label={`Ver imagen ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="p-8">
                <h1 className="mb-4 font-poppins text-3xl font-semibold text-[#5F5F5F]">{title}</h1>
                <div className="mb-6 flex items-center gap-4 text-[#5F5F5F]/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#A67C52]" />
                    <span>{location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#6B8E23]" />
                    <span>4.9</span>
                  </div>
                </div>
                <p className="mb-6 leading-relaxed text-[#5F5F5F]">
                  {propiedad.descripcion ||
                    propiedad.resena ||
                    'Descripcion no disponible para esta propiedad.'}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#F2E8CF] p-5">
                    <h3 className="mb-2 text-sm text-[#5F5F5F]/70">Precio por noche</h3>
                    <p className="text-2xl font-semibold text-[#6B8E23]">{formatPrice(price)}</p>
                  </div>
                  <div className="rounded-2xl bg-[#F2E8CF] p-5">
                    <h3 className="mb-2 text-sm text-[#5F5F5F]/70">Estado</h3>
                    <p className="text-lg font-semibold capitalize text-[#5F5F5F]">
                      {propiedad.estado || 'Disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-[#6B8E23]/10 bg-white p-8 shadow-sm">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#5F5F5F]/70">Reserva esta propiedad</p>
                  <h2 className="text-2xl font-semibold text-[#5F5F5F]">
                    Preparate para tu estancia
                  </h2>
                </div>

                <div className="space-y-3 border-t border-[#6B8E23]/10 pt-4">
                  <h3 className="text-sm font-semibold text-[#5F5F5F]/70">Características</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {propiedad.capacidad && (
                      <div className="flex items-center gap-2 rounded-lg bg-[#F2E8CF] p-3">
                        <Users className="h-4 w-4 text-[#6B8E23]" />
                        <div>
                          <p className="text-xs text-[#5F5F5F]/70">Capacidad</p>
                          <p className="font-semibold text-[#5F5F5F]">{propiedad.capacidad}</p>
                        </div>
                      </div>
                    )}
                    {propiedad.numero_habitaciones && (
                      <div className="flex items-center gap-2 rounded-lg bg-[#F2E8CF] p-3">
                        <Bed className="h-4 w-4 text-[#6B8E23]" />
                        <div>
                          <p className="text-xs text-[#5F5F5F]/70">Habitaciones</p>
                          <p className="font-semibold text-[#5F5F5F]">{propiedad.numero_habitaciones}</p>
                        </div>
                      </div>
                    )}
                    {propiedad.numero_banos && (
                      <div className="flex items-center gap-2 rounded-lg bg-[#F2E8CF] p-3">
                        <Bath className="h-4 w-4 text-[#6B8E23]" />
                        <div>
                          <p className="text-xs text-[#5F5F5F]/70">Baños</p>
                          <p className="font-semibold text-[#5F5F5F]">{propiedad.numero_banos}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 border-t border-[#6B8E23]/10 pt-4">
                  <div>
                    <p className="text-sm text-[#5F5F5F]/70">Ubicacion</p>
                    <p className="text-base font-medium text-[#5F5F5F]">{location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#5F5F5F]/70">Precio por noche</p>
                    <p className="text-xl font-semibold text-[#6B8E23]">{formatPrice(price)}</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#6B8E23]/10 pt-4">
                  <Button
                    onClick={() => navigate(`/inquilino/reserva/${id}`)}
                    className="h-12 w-full rounded-xl bg-[#6B8E23] text-white shadow-none hover:bg-[#5a7a1e]"
                  >
                    Reservar ahora
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/inquilino/perfil')}
                    className="h-12 w-full rounded-xl border-2 border-[#6B8E23] text-[#6B8E23] shadow-none hover:bg-[#F2E8CF]"
                  >
                    Ir a mi perfil
                  </Button>
                </div>

                <div className="rounded-xl bg-[#F2E8CF]/50 p-4 text-xs text-[#5F5F5F]/80">
                  <p className="font-semibold text-[#5F5F5F] mb-1">Información importante</p>
                  <p>Tu reserva será registrada y podrás consultarla desde tu perfil. Se confirmará conforme a disponibilidad.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

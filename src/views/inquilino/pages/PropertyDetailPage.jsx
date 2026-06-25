import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { propiedadController } from '@/controllers/propiedadController.js'

export function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [propiedad, setPropiedad] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPropiedad = async () => {
      try {
        const result = await propiedadController.cargarDetallesPropiedad(id)
        if (result.success) {
          setPropiedad(result.data)
        } else {
          console.error('Error cargando propiedad:', result.error)
          alert('No se pudo cargar la propiedad. Intenta de nuevo.')
        }
      } catch (error) {
        console.error('Error inesperado cargando propiedad:', error)
        alert('Ocurrió un error al cargar la propiedad.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropiedad()
  }, [id])

  const formatPrice = price => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[#6B8E23]">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    )
  }

  if (!propiedad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] text-[#5F5F5F] px-4">
        <p className="text-lg mb-4">No se encontró la propiedad solicitada.</p>
        <Button
          onClick={() => navigate('/inquilino/explorar')}
          className="bg-[#6B8E23] text-white rounded-xl"
        >
          Volver a explorar
        </Button>
      </div>
    )
  }

  const title = propiedad.titulo || propiedad.descripcion || propiedad.title || 'Propiedad'
  const location =
    propiedad.ubicacion || propiedad.direccion || propiedad.location || 'Ubicación desconocida'
  const price = propiedad.precio_noche || propiedad.precio || propiedad.price || 0
  const image =
    propiedad.imagen ||
    propiedad.foto ||
    propiedad.image ||
    propiedad.url_imagen ||
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200'

  return (
    <>
      <InquilinoNavbar />
      <div className="min-h-screen py-8 px-4 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-6xl">
          <button
            onClick={() => navigate('/inquilino/explorar')}
            className="flex items-center gap-2 mb-6 text-[#5F5F5F] font-medium hover:text-black transition-colors"
          >
            <ArrowLeft className="h-5 w-5" /> Volver al catálogo
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10">
            <Card className="overflow-hidden rounded-3xl shadow-sm border border-[#6B8E23]/10">
              <img src={image} alt={title} className="w-full h-96 object-cover" />
              <div className="p-8">
                <h1 className="font-poppins text-3xl font-semibold text-[#5F5F5F] mb-4">{title}</h1>
                <div className="flex items-center gap-4 mb-6 text-[#5F5F5F]/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#A67C52]" />
                    <span>{location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#6B8E23]" />
                    <span>4.9</span>
                  </div>
                </div>
                <p className="text-[#5F5F5F] leading-relaxed mb-6">
                  {propiedad.descripcion ||
                    propiedad.resena ||
                    'Descripción no disponible para esta propiedad.'}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-[#F2E8CF] rounded-2xl p-5">
                    <h3 className="text-sm text-[#5F5F5F]/70 mb-2">Precio por noche</h3>
                    <p className="text-2xl font-semibold text-[#6B8E23]">{formatPrice(price)}</p>
                  </div>
                  <div className="bg-[#F2E8CF] rounded-2xl p-5">
                    <h3 className="text-sm text-[#5F5F5F]/70 mb-2">Estado</h3>
                    <p className="text-lg font-semibold capitalize text-[#5F5F5F]">
                      {propiedad.estado || 'Disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8 rounded-3xl border border-[#6B8E23]/10 shadow-sm bg-white">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#5F5F5F]/70">Reserva esta propiedad</p>
                  <h2 className="text-2xl font-semibold text-[#5F5F5F]">
                    Prepárate para tu estancia
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#5F5F5F]/70">Ubicación</p>
                    <p className="text-base text-[#5F5F5F]">{location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#5F5F5F]/70">Precio total estimado</p>
                    <p className="text-xl font-semibold text-[#6B8E23]">{formatPrice(price)}</p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate(`/inquilino/reserva/${id}`)}
                  className="w-full bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl h-12"
                >
                  Reservar ahora
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/inquilino/perfil')}
                  className="w-full border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#F2E8CF] shadow-none rounded-xl h-12"
                >
                  Ir a mi perfil
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

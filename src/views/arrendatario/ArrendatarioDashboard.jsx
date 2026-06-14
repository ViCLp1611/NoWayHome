import { useEffect, useState } from 'react'
import { propertyController } from '@/controllers/propertyController'
import { MapPin, DollarSign, Home as HomeIcon } from 'lucide-react'

export function ArrendatarioDashboard() {
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const sessionData = sessionStorage.getItem('user') || localStorage.getItem('user')
        const user = sessionData ? JSON.parse(sessionData) : null

        // Utilizamos una validación dinámica por si el ID viene estandarizado como "id" o como "id_arrendatario"
        const hostId = user?.id_arrendatario || user?.id

        if (hostId) {
          const result = await propertyController.getPropertiesByHost(hostId)
          if (result.success) {
            // SOLUCIÓN: Aseguramos que siempre se guarde un Arreglo, incluso si result.data es null
            setProperties(result.data || [])
          } else {
            setError(result.error)
            setProperties([]) // Fallback de seguridad
          }
        } else {
          setError('No se pudo identificar la sesión del anfitrión.')
          setProperties([])
        }
      } catch (err) {
        console.error('Error al cargar propiedades:', err)
        setError('Ocurrió un error inesperado al consultar la base de datos.')
        setProperties([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center text-[#5F5F5F] font-medium text-lg animate-pulse">
          Cargando tus propiedades...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#5F5F5F] font-poppins">
          Panel de Control
        </h2>
        <button className="bg-[#6B8E23] hover:bg-[#5a7a1e] text-white px-5 py-2.5 rounded-xl shadow-sm transition-colors font-semibold flex items-center gap-2 w-full sm:w-auto justify-center">
          <HomeIcon size={20} /> Publicar Nueva Propiedad
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl relative shadow-sm font-medium">
          {error}
        </div>
      )}

      {/* SOLUCIÓN: Usamos optional chaining (?.) para prevenir el error del map y verificamos que sea un array vacío */}
      {(!properties || properties.length === 0) && !error ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-[#6B8E23]/10 mt-6">
          <div className="h-20 w-20 bg-[#F2E8CF] rounded-full flex items-center justify-center mx-auto mb-4">
            <HomeIcon className="text-[#6B8E23]" size={40} />
          </div>
          <p className="text-[#5F5F5F] text-xl font-semibold font-poppins">
            Aún no tienes propiedades publicadas.
          </p>
          <p className="text-[#5F5F5F]/70 mt-2 max-w-md mx-auto">
            Sube tu primer alojamiento para empezar a recibir huéspedes y administrar tus reservas
            desde aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* El uso de ?.map asegura que si properties es undefined, simplemente no renderiza nada en lugar de crashear */}
          {properties?.map(propiedad => (
            <div
              key={propiedad.id_propiedad || Math.random()}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-[#6B8E23]/10 overflow-hidden group"
            >
              <div className="h-48 bg-[#F2E8CF] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600&auto=format&fit=crop"
                  alt={propiedad.titulo || 'Alojamiento No Way Home'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 bg-white/95 px-3 py-1 rounded-lg text-xs font-bold text-[#6B8E23] shadow-sm uppercase tracking-wider">
                  {propiedad.estado || 'Activo'}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <h3 className="text-lg font-bold text-[#5F5F5F] truncate font-poppins">
                  {propiedad.titulo || 'Sin título'}
                </h3>

                <div className="flex items-center text-[#5F5F5F]/70 text-sm">
                  <MapPin size={16} className="mr-2 text-[#A67C52] shrink-0" />
                  <span className="truncate">
                    {propiedad.direccion || 'Dirección no especificada'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#6B8E23]/10">
                  <div className="flex items-center text-[#5F5F5F] font-semibold text-lg">
                    <DollarSign size={18} className="text-[#6B8E23]" />
                    <span>
                      {propiedad.precio_noche || '0.00'}{' '}
                      <span className="text-xs font-normal text-[#5F5F5F]/70">/ noche</span>
                    </span>
                  </div>
                  <button className="text-sm font-medium text-[#6B8E23] hover:underline">
                    Gestionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

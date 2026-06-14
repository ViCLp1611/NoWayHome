import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { supabase } from '@/lib/supabaseClient'

export function EditInquilinoModal({ isOpen, onClose, userData, onUpdateSuccess }) {
  const [formData, setFormData] = useState({
    nombre: userData?.nombre || '',
    telefono: userData?.telefono || '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // 1. Tomamos el ID sin importar cómo lo haya guardado el Login
      const userId = userData.id_inquilino || userData.id_arrendatario || userData.id

      if (!userId) {
        throw new Error('Error crítico: El usuario en sesión no tiene un ID válido.')
      }

      // 2. INTENTO 1: Disparamos la actualización a la tabla INQUILINO
      let { data, error: supabaseError } = await supabase
        .from('inquilino')
        .update({
          nombre: formData.nombre,
          telefono: formData.telefono,
        })
        .eq('id_inquilino', userId)
        .select()

      if (supabaseError) throw supabaseError

      // 3. INTENTO 2: Si no encontró la fila en inquilino, disparamos a ARRENDATARIO
      if (!data || data.length === 0) {
        const res = await supabase
          .from('arrendatario')
          .update({
            nombre: formData.nombre,
            telefono: formData.telefono,
          })
          .eq('id_arrendatario', userId)
          .select()

        supabaseError = res.error
        data = res.data

        if (supabaseError) throw supabaseError

        // Si TAMPOCO lo encontró en arrendatario, entonces el usuario de plano no existe
        if (!data || data.length === 0) {
          throw new Error(`El ID ${userId} no se encontró ni en inquilinos ni en arrendatarios.`)
        }
      }

      // 4. ÉXITO: Preparamos los datos mezclando lo que teníamos con la respuesta de la BD
      const updatedUser = { ...userData, ...data[0] }

      // 5. Actualizamos el Storage para que la página no se rompa al recargar
      if (sessionStorage.getItem('user')) {
        sessionStorage.setItem('user', JSON.stringify(updatedUser))
      } else if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      // 6. Refrescamos la UI y cerramos
      onUpdateSuccess(updatedUser)
      onClose()
    } catch (err) {
      console.error('Error actualizando perfil:', err)
      setError(err.message || 'Hubo un problema de conexión al actualizar tu perfil.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#6B8E23]/10">
          <h2 className="font-poppins font-semibold text-xl text-[#5F5F5F]">Editar Perfil</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#5F5F5F] hover:text-[#6B8E23] transition-colors rounded-full p-1 hover:bg-[#F2E8CF]/50 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-[#5F5F5F] mb-1.5">
                Nombre Completo
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-[#6B8E23]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent text-[#5F5F5F] transition-all disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-[#5F5F5F] mb-1.5">
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-[#6B8E23]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent text-[#5F5F5F] transition-all disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5F5F5F]/60 mb-1.5">
                Correo Electrónico{' '}
                <span className="text-xs font-normal text-[#A67C52] ml-1">(No editable)</span>
              </label>
              <input
                type="email"
                disabled
                value={userData.correo || ''}
                className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-[#5F5F5F]/60 cursor-not-allowed select-none"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[#6B8E23]/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-2 border-[#5F5F5F]/20 text-[#5F5F5F] shadow-none rounded-xl hover:bg-gray-50 hover:text-[#5F5F5F] transition-all disabled:opacity-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl min-w-[140px] transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

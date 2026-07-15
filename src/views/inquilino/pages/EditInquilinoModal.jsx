import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { inquilinoController } from '@/controllers/inquilinoController'

export function EditInquilinoModal({ isOpen, onClose, userData, onUpdateSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Efecto para poblar el formulario cuando el modal se abre o los datos del usuario cambian.
  useEffect(() => {
    if (userData) {
      setFormData({
        nombre: userData.nombre || '',
        telefono: userData.telefono || '',
      })
    }
  }, [userData, isOpen])

  // Efecto para limpiar los mensajes de error/éxito solo cuando el modal se abre.
  // Esto previene que el mensaje de "Cambios realizados" se borre inmediatamente
  // después de una actualización exitosa, que es cuando `userData` cambia.
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccess(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const userId = userData?.id_inquilino || userData?.id
      if (!userId) {
        throw new Error('No se encontró un ID válido de inquilino para actualizar.')
      }

      const result = await inquilinoController.actualizarPerfil(userId, {
        nombre: formData.nombre,
        telefono: formData.telefono,
      })

      if (!result.success) {
        throw new Error(result.error || 'No se pudo actualizar el perfil.')
      }

      const updatedUser = { ...userData, ...result.data }
      if (sessionStorage.getItem('user')) {
        sessionStorage.setItem('user', JSON.stringify(updatedUser))
      } else if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      onUpdateSuccess(updatedUser)
      setSuccess('Cambios realizados')
      setIsLoading(false)

      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      console.error('Error durante la actualización del perfil:', err)
      setError(err.message || 'Hubo un problema al actualizar tu perfil.')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white border border-[#6B8E23]/10 shadow-lg rounded-2xl overflow-hidden transform transition-all p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-poppins font-semibold text-xl text-[#5F5F5F]">
            Editar Perfil de Huésped
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading || !!success}
            className="text-[#5F5F5F] hover:text-[#6B8E23] transition-colors rounded-full p-1.5 hover:bg-[#F2E8CF]/50 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <AlertMessage type="error" title="No se pudo guardar el perfil" message={error} />
          )}
          {success && <AlertMessage type="success" title="Éxito" message={success} />}

          <div className="space-y-1.5">
            <label htmlFor="nombre" className="text-sm font-medium text-[#5F5F5F] block">
              Nombre Completo
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              disabled={isLoading || !!success}
              className="w-full px-4 py-2.5 border border-[#6B8E23]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent text-[#5F5F5F] transition-all disabled:opacity-50 disabled:bg-gray-50"
              placeholder="Tu nombre completo"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="telefono" className="text-sm font-medium text-[#5F5F5F] block">
              Teléfono Celular
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              disabled={isLoading || !!success}
              className="w-full px-4 py-2.5 border border-[#6B8E23]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent text-[#5F5F5F] transition-all disabled:opacity-50 disabled:bg-gray-50"
              placeholder="Ej. 5512345678"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#5F5F5F]/60 flex justify-between items-center">
              <span>Correo Electrónico</span>
              <span className="text-xs font-normal text-gray-400 italic">(No editable)</span>
            </label>
            <input
              type="email"
              disabled
              value={userData?.correo || ''}
              className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-[#5F5F5F]/60 cursor-not-allowed select-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading || !!success}
              className="border-2 border-[#5F5F5F]/20 text-[#5F5F5F] shadow-none rounded-xl hover:bg-gray-50 hover:text-[#5F5F5F] transition-all disabled:opacity-50"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isLoading || !!success}
              className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl min-w-[140px] transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
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

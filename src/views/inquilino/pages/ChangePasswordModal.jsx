import { useState } from 'react'
import { X, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { authController } from '@/controllers/authController'

export function ChangePasswordModal({ isOpen, onClose, userData }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const resetForm = () => {
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setIsLoading(false)
    setError('')
    setSuccess('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    const userId = userData?.id_inquilino || userData?.id
    const role = userData?.role

    if (!userId || !role) {
      setError('No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.')
      setIsLoading(false)
      return
    }

    const result = await authController.updatePassword({
      userId,
      role,
      password,
      confirmPassword,
    })

    if (result.success) {
      setSuccess(result.message)
      setTimeout(() => {
        handleClose()
      }, 2000)
    } else {
      setError(result.message)
    }

    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white border border-[#6B8E23]/10 shadow-lg rounded-2xl overflow-hidden transform transition-all p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-poppins font-semibold text-xl text-[#5F5F5F]">Cambiar Contraseña</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-[#5F5F5F] hover:text-[#6B8E23] transition-colors rounded-full p-1.5 hover:bg-[#F2E8CF]/50 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <AlertMessage type="error" title="Error" message={error} />}
          {success && <AlertMessage type="success" title="Éxito" message={success} />}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#5F5F5F] block">Nueva Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 border border-[#6B8E23]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent text-[#5F5F5F] transition-all disabled:opacity-50 disabled:bg-gray-50"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6B8E23]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#5F5F5F] block">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 border border-[#6B8E23]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent text-[#5F5F5F] transition-all disabled:opacity-50 disabled:bg-gray-50"
                placeholder="Repite la contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6B8E23]"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !password || !confirmPassword}>
              {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

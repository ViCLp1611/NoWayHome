import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { resetPassword } from '@/services/passwordResetService'

export function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState(token ? '' : 'El enlace no es valido o ha expirado.')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('El enlace no es valido o ha expirado.')
      return
    }

    if (!newPassword || !confirmPassword) {
      setError('Completa ambos campos de contrasena.')
      return
    }

    if (newPassword.length < 8) {
      setError('La contrasena debe tener minimo 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('La contrasena y la confirmacion deben coincidir.')
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPassword(token, newPassword)
      setSuccess(result.message || 'Contrasena actualizada correctamente.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (resetError) {
      setError(resetError.message || 'El enlace no es valido o ha expirado.')
    } finally {
      setIsLoading(false)
    }
  }

  const formDisabled = isLoading || Boolean(success) || !token

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <Card className="w-full max-w-md p-8 md:p-10 bg-[#F2E8CF] border border-[#6B8E23]/10 shadow-sm rounded-2xl">
        <div className="text-center mb-8">
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
            Nueva contrasena
          </h1>
          <p className="font-inter text-[#5F5F5F]/75 text-base leading-relaxed">
            Crea una contrasena nueva para recuperar el acceso a tu cuenta.
          </p>
        </div>

        {(error || success) && (
          <Alert
            className={
              success ? 'mb-6 border-green-200 bg-green-50' : 'mb-6 border-red-200 bg-red-50'
            }
          >
            {success ? (
              <CheckCircle2 className="h-4 w-4 text-[#6B8E23]" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={success ? 'text-[#5F5F5F]' : 'text-red-800'}>
              {success || error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="new-password" className="font-inter text-[#5F5F5F] font-medium">
              Nueva contrasena
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Ingresa tu nueva contrasena"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="pl-12 pr-12 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl transition-colors"
                disabled={formDisabled}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(value => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5F5F5F]/50 hover:text-[#5F5F5F] transition-colors disabled:opacity-50"
                aria-label={showNewPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                disabled={formDisabled}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-new-password" className="font-inter text-[#5F5F5F] font-medium">
              Confirmar contrasena
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirma tu nueva contrasena"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="pl-12 pr-12 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl transition-colors"
                disabled={formDisabled}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(value => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5F5F5F]/50 hover:text-[#5F5F5F] transition-colors disabled:opacity-50"
                aria-label={showConfirmPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                disabled={formDisabled}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={formDisabled}
            className="w-full bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl disabled:opacity-50"
          >
            {isLoading ? 'Actualizando contrasena...' : 'Actualizar contrasena'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/login')}
            className="w-full text-[#6B8E23] hover:text-[#5a7a1e] hover:bg-[#6B8E23]/10 h-11 rounded-xl shadow-none"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al login
          </Button>
        </form>
      </Card>
    </div>
  )
}

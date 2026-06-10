import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { supabase } from '@/lib/supabaseClient'

const recoveryErrorMessage = 'No se pudo actualizar la contraseña. El enlace pudo haber expirado.'

const hasRecoveryLinkMarker = () => {
  const queryParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  return (
    queryParams.get('type') === 'recovery' ||
    hashParams.get('type') === 'recovery' ||
    queryParams.has('code')
  )
}

export function UpdatePassword() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)

  useEffect(() => {
    let isMounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === 'PASSWORD_RECOVERY' && session) {
        setHasRecoverySession(true)
        setError('')
        setIsCheckingSession(false)
        return
      }

      if (session && hasRecoveryLinkMarker()) {
        setHasRecoverySession(true)
        setError('')
        setIsCheckingSession(false)
      }
    })

    const checkRecoverySession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (!isMounted) return

        if (sessionError) {
          console.error('Error verificando sesion de recuperacion:', sessionError)
          setError(recoveryErrorMessage)
          setHasRecoverySession(false)
          return
        }

        if (data.session && hasRecoveryLinkMarker()) {
          setHasRecoverySession(true)
          setError('')
          return
        }

        setHasRecoverySession(false)
        setError(recoveryErrorMessage)
      } catch (sessionError) {
        if (!isMounted) return
        console.error('Error inesperado verificando sesion de recuperacion:', sessionError)
        setError(recoveryErrorMessage)
        setHasRecoverySession(false)
      } finally {
        if (isMounted) {
          setIsCheckingSession(false)
        }
      }
    }

    checkRecoverySession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!success) return undefined

    const redirectTimer = window.setTimeout(async () => {
      await supabase.auth.signOut()
      navigate('/login', { replace: true })
    }, 1600)

    return () => window.clearTimeout(redirectTimer)
  }, [navigate, success])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newPassword || !confirmPassword) {
      setError('Completa ambos campos de contraseña.')
      return
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('La contraseña y la confirmación deben coincidir.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !data.session || !hasRecoverySession) {
        if (sessionError) {
          console.error('Sesion de recuperacion invalida:', sessionError)
        }
        setError(recoveryErrorMessage)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        console.error('Error actualizando contraseña:', updateError)
        setError(recoveryErrorMessage)
        return
      }

      setSuccess('Contraseña actualizada correctamente.')
    } catch (updateError) {
      console.error('Error inesperado actualizando contraseña:', updateError)
      setError(recoveryErrorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const formDisabled = isCheckingSession || isLoading || Boolean(success) || !hasRecoverySession

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <Card className="w-full max-w-md p-8 md:p-10 bg-[#F2E8CF] border border-[#6B8E23]/10 shadow-sm rounded-2xl">
        <div className="text-center mb-8">
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
            Nueva contraseña
          </h1>
          <p className="font-inter text-[#5F5F5F]/75 text-base leading-relaxed">
            Crea una contraseña nueva para recuperar el acceso a tu cuenta.
          </p>
        </div>

        {(error || success) && (
          <Alert
            className={
              success
                ? 'mb-6 border-green-200 bg-green-50'
                : 'mb-6 border-red-200 bg-red-50'
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
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Ingresa tu nueva contraseña"
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
                aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={formDisabled}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-new-password" className="font-inter text-[#5F5F5F] font-medium">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirma tu nueva contraseña"
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
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
            {isCheckingSession
              ? 'Validando enlace...'
              : isLoading
                ? 'Actualizando contraseña...'
                : 'Actualizar contraseña'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
      </Card>
    </div>
  )
}

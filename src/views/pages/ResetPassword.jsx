import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { checkResetTokenStatus, resetPassword } from '@/services/passwordResetService'

/*
|--------------------------------------------------------------------------
| Restablecimiento de contrasena desde token
|--------------------------------------------------------------------------
| Lee el token desde /reset-password?token=... y envia token +
| nueva contrasena a POST /api/auth/reset-password.
|
| Seguridad:
| - Un enlace nuevo inicia desbloqueado para permitir el cambio.
| - Una vez actualizada la contrasena, guarda la marca de enlace usado y
|   consulta el estado en el servidor para que al refrescar la pagina los
|   campos permanezcan bloqueados.
| - No incluye botones ni navegacion hacia el login de la web para evitar
|   confusiones con la aplicacion movil.
*/
function getUsedTokenKey(token) {
  return `used_reset_token_${String(token || '').trim()}`
}

function isTokenMarkedUsedLocally(token) {
  if (!token || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(getUsedTokenKey(token)) === 'true'
  } catch {
    return false
  }
}

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams])

  const initialUsed = isTokenMarkedUsedLocally(token)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [alreadyUsed, setAlreadyUsed] = useState(initialUsed)
  const [isTokenInvalid, setIsTokenInvalid] = useState(!token)
  const [error, setError] = useState(token ? '' : 'El enlace no es valido o ha expirado.')
  const [success, setSuccess] = useState(
    initialUsed
      ? 'El cambio de contraseña ya fue realizado correctamente desde este enlace. Por seguridad, los campos permanecen bloqueados.'
      : ''
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const verifyToken = async () => {
      if (!token) {
        setIsTokenInvalid(true)
        setError('El enlace no es valido o ha expirado.')
        return
      }

      if (isTokenMarkedUsedLocally(token)) {
        setAlreadyUsed(true)
        setSuccess(
          'El cambio de contraseña ya fue realizado correctamente desde este enlace. Por seguridad, los campos permanecen bloqueados.'
        )
        return
      }

      try {
        const status = await checkResetTokenStatus(token)
        if (!isMounted || status?.skipped) return

        if (status?.valid === false) {
          if (status?.status === 'used') {
            try {
              window.localStorage.setItem(getUsedTokenKey(token), 'true')
            } catch {
              // Ignorar errores de almacenamiento
            }
            setAlreadyUsed(true)
            setSuccess(
              'El cambio de contraseña ya fue realizado correctamente desde este enlace. Por seguridad, los campos permanecen bloqueados.'
            )
          } else {
            setIsTokenInvalid(true)
            setError(status?.message || 'El enlace no es valido o ha expirado.')
          }
        }
      } catch {
        // No bloquear enlaces nuevos ante errores de red temporales
      }
    }

    verifyToken()
    return () => {
      isMounted = false
    }
  }, [token])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token || alreadyUsed || isTokenInvalid) {
      setError('El enlace no es valido o ya fue utilizado.')
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
      await resetPassword(token, newPassword)
      try {
        window.localStorage.setItem(getUsedTokenKey(token), 'true')
      } catch {
        // Ignorar errores de almacenamiento
      }
      setAlreadyUsed(true)
      setSuccess(
        '¡Tu contraseña se actualizó correctamente! Ya puedes cerrar esta ventana y regresar a la aplicación móvil de NoWayHome para iniciar sesión.'
      )
      setNewPassword('')
      setConfirmPassword('')
    } catch (resetError) {
      const msg = resetError?.message || 'El enlace no es valido o ha expirado.'
      if (/enlace|expirad|token/i.test(msg)) {
        setIsTokenInvalid(true)
      }
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const formDisabled = isLoading || Boolean(success) || alreadyUsed || isTokenInvalid || !token

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <Card className="w-full max-w-md p-8 md:p-10 bg-[#F2E8CF] border border-[#6B8E23]/10 shadow-sm rounded-2xl">
        <div className="text-center mb-8">
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
            Nueva contrasena
          </h1>
          <p className="font-inter text-[#5F5F5F]/75 text-base leading-relaxed">
            {Boolean(success) || alreadyUsed
              ? 'El cambio de contraseña ha concluido de forma segura.'
              : 'Crea una contrasena nueva para recuperar el acceso a tu cuenta.'}
          </p>
        </div>

        {(error || success) && (
          <Alert
            className={
              success ? 'mb-6 border-green-300 bg-green-50' : 'mb-6 border-red-200 bg-red-50'
            }
          >
            {success ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <AlertDescription className={success ? 'text-green-900 font-medium' : 'text-red-800'}>
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
                placeholder={
                  formDisabled ? 'Campo bloqueado por seguridad' : 'Ingresa tu nueva contrasena'
                }
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="pl-12 pr-12 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl transition-colors disabled:bg-gray-100 disabled:opacity-65 disabled:cursor-not-allowed"
                disabled={formDisabled}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(value => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5F5F5F]/50 hover:text-[#5F5F5F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                placeholder={
                  formDisabled ? 'Campo bloqueado por seguridad' : 'Confirma tu nueva contrasena'
                }
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="pl-12 pr-12 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl transition-colors disabled:bg-gray-100 disabled:opacity-65 disabled:cursor-not-allowed"
                disabled={formDisabled}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(value => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5F5F5F]/50 hover:text-[#5F5F5F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="w-full bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {isLoading
              ? 'Actualizando contrasena...'
              : Boolean(success) || alreadyUsed
                ? 'Contraseña actualizada'
                : 'Actualizar contrasena'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/70 border border-[#6B8E23]/15 text-xs text-[#5F5F5F]">
            <ShieldCheck className="h-4 w-4 text-[#6B8E23] shrink-0" />
            <span>
              Por seguridad, cierra esta ventana al finalizar y vuelve a tu aplicación móvil NoWayHome.
            </span>
          </div>
        </form>
      </Card>
    </div>
  )
}

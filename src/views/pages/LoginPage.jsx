import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Eye, EyeOff, Key, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { authController } from '../../controllers/authController'

/*
|--------------------------------------------------------------------------
| Pantalla de login unificado + 2FA
|--------------------------------------------------------------------------
| Consume el flujo:
| - POST /api/auth/login para validar correo/contrasena y solicitar 2FA.
| - POST /api/auth/verify-2fa para completar la sesion.
|
| Seguridad:
| - No se guarda usuario en storage hasta que 2FA termina correctamente.
| - pendingRole conserva temporalmente el rol devuelto por backend para
|   validar el codigo en la tabla two_factor_codes.
| - No mostrar mensajes que revelen si un correo existe.
*/
export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState('credentials')
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingRole, setPendingRole] = useState('')

  const redirectByRole = role => {
    if (role === 'administrador') {
      navigate('/admin')
      return
    }

    if (role === 'arrendatario') {
      navigate('/arrendatario')
      return
    }

    navigate('/inquilino')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (step === 'credentials') {
        // Primer paso: el backend valida credenciales y envia codigo 2FA.
        // Todavia no se considera sesion iniciada.
        const loginResult = await authController.login(email, password)

        if (loginResult.success && loginResult.requires2FA) {
          setPendingRole(loginResult.role)
          setStep('verify')
          setVerificationCode('')
          return
        }

        setError(loginResult.message || 'Credenciales incorrectas. Verifica tu correo y contrasena.')
        return
      }

      // Segundo paso: se verifica el codigo temporal antes de guardar usuario.
      const verifyResult = await authController.verify2FA(email, verificationCode, pendingRole)

      if (!verifyResult.success) {
        setError(verifyResult.message || 'Codigo invalido o expirado.')
        return
      }

      const storageKey = verifyResult.user.role === 'administrador' ? 'admin' : 'user'
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem(storageKey, JSON.stringify(verifyResult.user))
      redirectByRole(verifyResult.user.role)
    } catch (err) {
      setError(err.message || 'Error inesperado al iniciar sesion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <Card className="w-full max-w-md p-8 md:p-10 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
        <div className="text-center mb-10">
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
            Bienvenido de nuevo
          </h1>
          <p className="text-[#5F5F5F]/70 text-lg">Inicia sesion para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 'credentials' ? (
            <>
              <div className="space-y-2">
                <label htmlFor="email" className="text-[#5F5F5F] font-medium">
                  Correo electronico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-[#5F5F5F] font-medium">
                  Contrasena
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Escribe tu contrasena"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] placeholder:text-[#5F5F5F]/50 rounded-xl transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5F5F5F]/50 hover:text-[#5F5F5F] transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-[#6B8E23]/30 text-[#6B8E23] focus:ring-[#6B8E23] focus:ring-offset-0"
                  />
                  <span className="text-[#5F5F5F]">Recordarme</span>
                </label>

                <Button
                  type="button"
                  variant="ghost"
                  className="text-[#6B8E23] hover:text-[#5a7a1e] hover:bg-[#6B8E23]/10 h-8 px-3 rounded-lg transition-all font-medium text-xs sm:text-sm flex items-center shadow-none"
                  onClick={() => navigate('/forgot-password')}
                >
                  <Key className="w-3.5 h-3.5 mr-1.5" />
                  Olvide mi contrasena
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-5 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-[#6B8E23]" />
              <div className="space-y-2">
                <h2 className="font-poppins font-semibold text-xl text-[#5F5F5F]">
                  Verificacion en dos pasos
                </h2>
                <p className="text-sm text-[#5F5F5F]/75">
                  Ingresa el codigo de 6 digitos enviado a {email}.
                </p>
              </div>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="h-14 text-center text-2xl tracking-[0.4em] bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors font-semibold"
                required
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep('credentials')
                  setVerificationCode('')
                  setPendingRole('')
                  setError('')
                }}
                className="text-[#6B8E23] hover:text-[#5a7a1e] hover:bg-[#6B8E23]/10 h-9 rounded-lg shadow-none"
              >
                Volver al login
              </Button>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl disabled:opacity-50"
          >
            {isLoading
              ? step === 'credentials'
                ? 'Enviando codigo...'
                : 'Verificando codigo...'
              : step === 'credentials'
                ? 'Iniciar sesion'
                : 'Verificar y entrar'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-xs text-center text-[#5F5F5F]/70 mt-2">
            El acceso es valido para huespedes, anfitriones y administradores
          </p>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[#5F5F5F]">
            No tienes cuenta?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[#6B8E23] font-medium hover:text-[#5a7a1e] transition-colors"
            >
              Registrate aqui
            </button>
          </p>
        </div>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// Agregamos los iconos 'Eye' y 'EyeOff' para ver/ocultar contraseña
import { Mail, Lock, ArrowRight, AlertCircle, Database, Key, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
// Importamos el controlador y la función específica para el admin
import { authController, handleAdminLogin } from '../../controllers/authController'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // Estado para controlar la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false)

  // Nuevos estados para controlar el flujo de 2FA
  const [step, setStep] = useState(1) // 1 = Credenciales, 2 = Código 2FA
  const [otpCode, setOtpCode] = useState('')
  const [tempRole, setTempRole] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (step === 1) {
        // 1. Intentar iniciar sesión como usuario común (Inquilino / Arrendatario)
        const userResult = await authController.login(email, password)

        if (userResult.success) {
          // Guardamos el rol temporalmente y cambiamos al paso de verificación 2FA
          setTempRole(userResult.role)
          setStep(2)
          setIsLoading(false)
          return // Detenemos la ejecución para que el usuario ingrese el código
        }

        // 2. Si no es usuario común, intentar como Administrador (Se mantiene intacto)
        const adminResult = await handleAdminLogin(email, password)

        if (adminResult.success) {
          if (rememberMe) {
            localStorage.setItem('admin', JSON.stringify(adminResult.admin))
          } else {
            sessionStorage.setItem('admin', JSON.stringify(adminResult.admin))
          }
          navigate('/admin') // Redirige a la vista de administrador
          return // Detenemos la ejecución si el login fue exitoso
        }

        // 3. Si falla en ambas tablas, mostramos el error
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      } else if (step === 2) {
        // 4. Paso 2: Validar el código OTP (2FA)
        const result = await authController.verify2FA(email, otpCode, tempRole)

        if (result.success) {
          // Si el código es correcto, guardamos la sesión
          if (rememberMe) {
            localStorage.setItem('user', JSON.stringify(result.user))
          } else {
            sessionStorage.setItem('user', JSON.stringify(result.user))
          }

          // SOLUCIÓN: Redirección inteligente basada en la variable tempRole
          // (que sabemos que es 'host' para arrendatarios)
          if (tempRole === 'host') {
            navigate('/arrendatario') // Redirige a la vista de anfitrión
          } else {
            // CAMBIO APLICADO: Ahora redirige correctamente a la vista de Inquilino
            navigate('/inquilino')
          }
        } else {
          setError(result.message)
        }
      }
    } catch (err) {
      setError(err.message || 'Error inesperado durante la autenticación')
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
          <p className="text-[#5F5F5F]/70 text-lg">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <>
              {/* VISTA 1: FORMULARIO DE CREDENCIALES ORDINARIO */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-[#5F5F5F] font-medium">
                  Correo Electrónico
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
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Escribe tu contraseña"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] placeholder:text-[#5F5F5F]/50 rounded-xl transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5F5F5F]/50 hover:text-[#5F5F5F] transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
                  onClick={e => {
                    e.preventDefault()
                    console.log('Recuperar contraseña clickeado')
                  }}
                >
                  <Key className="w-3.5 h-3.5 mr-1.5" />
                  Recuperar contraseña
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* VISTA 2: FORMULARIO DE VERIFICACIÓN 2FA */}
              <div className="space-y-4 text-center py-2">
                <Database className="mx-auto h-12 w-12 text-[#6B8E23] mb-4" />
                <h3 className="font-medium text-[#5F5F5F] text-lg">Verificación de seguridad</h3>
                <p className="text-sm text-[#5F5F5F]/80">
                  Hemos enviado un código de 6 dígitos a <br />
                  <strong className="text-[#5F5F5F]">{email}</strong>
                </p>

                <div className="space-y-2 mt-6">
                  <Input
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="h-14 text-center text-3xl tracking-[0.5em] bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors font-semibold"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setOtpCode('')
                    setError('')
                  }}
                  className="text-sm text-[#A67C52] hover:underline mt-4 focus:outline-none"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl disabled:opacity-50"
          >
            {isLoading
              ? step === 1
                ? 'Iniciando sesión...'
                : 'Verificando código...'
              : step === 1
                ? 'Iniciar Sesión'
                : 'Verificar y Entrar'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Mostrar error si existe */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Texto informativo actualizado */}
          <p className="text-xs text-center text-[#5F5F5F]/70 mt-2">
            El acceso es válido para huéspedes, anfitriones y administradores
          </p>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[#5F5F5F]">
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[#6B8E23] font-medium hover:text-[#5a7a1e] transition-colors"
            >
              Regístrate aquí
            </button>
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-[#6B8E23]/10">
          <p className="text-sm text-center text-[#5F5F5F]/70 mb-5">O continúa con</p>
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="border-2 border-[#6B8E23]/20 text-[#5F5F5F] hover:text-[#5F5F5F] hover:border-[#6B8E23] hover:bg-[#F2E8CF]/30 shadow-none rounded-xl h-11 transition-all"
            >
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-[#6B8E23]/20 text-[#5F5F5F] hover:text-[#5F5F5F] hover:border-[#6B8E23] hover:bg-[#F2E8CF]/30 shadow-none rounded-xl h-11 transition-all"
            >
              Facebook
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

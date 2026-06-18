import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card } from '@/app/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { requestPasswordReset } from '@/services/passwordResetService'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const genericMessage =
  'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.'

/*
|--------------------------------------------------------------------------
| Solicitud de recuperacion de contrasena
|--------------------------------------------------------------------------
| Consume POST /api/auth/forgot-password mediante passwordResetService.
|
| Seguridad:
| - Siempre muestra un mensaje generico despues de solicitar recuperacion.
| - No debe revelar si el correo existe en administrador, inquilino o
|   arrendatario.
| - El backend genera el token y guarda solo su hash.
*/
export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setError('Ingresa tu correo electronico.')
      return
    }

    if (!emailRegex.test(normalizedEmail)) {
      setError('Ingresa un correo electronico valido.')
      return
    }

    setIsLoading(true)

    try {
      // Tanto exito como error muestran el mismo mensaje para evitar
      // enumeracion de usuarios por correo.
      await requestPasswordReset(normalizedEmail)
      setSuccess(genericMessage)
    } catch {
      setSuccess(genericMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <Card className="w-full max-w-md p-8 md:p-10 bg-[#F2E8CF] border border-[#6B8E23]/10 shadow-sm rounded-2xl">
        <div className="text-center mb-8">
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
            Recuperar contrasena
          </h1>
          <p className="font-inter text-[#5F5F5F]/75 text-base leading-relaxed">
            Escribe el correo asociado a tu cuenta y te enviaremos instrucciones para crear una
            nueva contrasena.
          </p>
        </div>

        {(error || success) && (
          <Alert
            className={
              success
                ? 'mb-6 rounded-lg border-[#6B8E23]/25 bg-white text-[#5F5F5F] shadow-sm'
                : 'mb-6 border-red-200 bg-red-50'
            }
          >
            {success ? (
              <CheckCircle2 className="h-4 w-4 text-[#6B8E23]" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            {success && <AlertTitle className="text-[#333]">Acción completada</AlertTitle>}
            {!success && <AlertTitle className="text-red-800">Error de recuperacion</AlertTitle>}
            <AlertDescription className={success ? 'text-[#5F5F5F]' : 'text-red-800'}>
              {success || error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="recovery-email" className="font-inter text-[#5F5F5F] font-medium">
              Correo electronico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="recovery-email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-12 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl transition-colors"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl disabled:opacity-50"
          >
            {isLoading ? 'Enviando instrucciones...' : 'Enviar instrucciones'}
            <Send className="ml-2 h-5 w-5" />
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

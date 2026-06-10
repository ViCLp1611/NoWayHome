import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card } from '@/app/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { supabase } from '@/lib/supabaseClient'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setError('Ingresa tu correo electronico.')
      return
    }

    if (!emailRegex.test(normalizedEmail)) {
      setError('Ingresa un correo electronico valido.')
      return
    }

    setIsLoading(true)

    const redirectUrl = `${window.location.origin}/update-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: redirectUrl,
    })

    setIsLoading(false)

    if (resetError) {
      console.error('Reset password error:', resetError)
      console.log('Email usado:', normalizedEmail)
      console.log('Redirect URL:', redirectUrl)
      setError(resetError?.message || 'No se pudo enviar el enlace de recuperación.')
      return
    }

    setSuccess('Te enviamos un enlace de recuperacion a tu correo.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <Card className="w-full max-w-md p-8 md:p-10 bg-[#F2E8CF] border border-[#6B8E23]/10 shadow-sm rounded-2xl">
        <div className="text-center mb-8">
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
            Recuperar contraseña
          </h1>
          <p className="font-inter text-[#5F5F5F]/75 text-base leading-relaxed">
            Escribe el correo asociado a tu cuenta y te enviaremos un enlace para crear una
            nueva contraseña.
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
            {!success && <AlertTitle className="text-red-800">Error de recuperación</AlertTitle>}
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
            {isLoading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
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

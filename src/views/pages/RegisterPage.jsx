import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
// Asegúrate de que la ruta de importación coincida con tu configuración de alias o usa la relativa: '../../controllers/authController'
import { authController } from '../../controllers/authController'

// El componente RegisterPage es la pantalla de registro para nuevos usuarios, que permite ingresar información personal y seleccionar un rol para crear una cuenta en la plataforma.
// Utiliza un formulario controlado con estados locales para manejar los valores de entrada, y una función de manejo de envío que se conecta al AuthController para insertar los datos reales en Supabase.
export function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'guest',
    acceptTerms: false,
  })

  // Nuevos estados para manejar la respuesta del servidor
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Estados para alternar la visibilidad de las contraseñas
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleInputChange = e => {
    let { name, value, type, checked } = e.target

    // EXCEPCIÓN: El nombre no deja anotar números ni caracteres especiales (solo letras y espacios)
    if (name === 'name') {
      value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    }

    // EXCEPCIÓN: El teléfono solo deja anotar números (se permiten guiones y espacios por el formato visual)
    if (name === 'phone') {
      value = value.replace(/[^0-9\-\s]/g, '')
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    // --- MANEJO DE EXCEPCIONES Y VALIDACIONES ---

    // 1. Nombre: Solo letras desde 3 hasta 255 caracteres
    const nameTrimmed = formData.name.trim()
    if (nameTrimmed.length < 3 || nameTrimmed.length > 255) {
      setError('El nombre debe tener entre 3 y 255 caracteres.')
      return
    }

    // 2. Correo: Límite local 64, límite dominio 255 y 1 símbolo @
    const emailParts = formData.email.split('@')
    if (emailParts.length !== 2) {
      setError('El correo debe contener exactamente un símbolo @.')
      return
    }
    if (emailParts[0].length > 64) {
      setError('La parte local del correo (antes de la @) no debe exceder los 64 caracteres.')
      return
    }
    if (emailParts[1].length > 255) {
      setError('El dominio del correo (después de la @) no debe exceder los 255 caracteres.')
      return
    }

    // 3. Teléfono: Solo debe aceptar 10 números (se limpian los guiones para validar solo dígitos)
    const phoneDigits = formData.phone.replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      setError('El teléfono debe contener exactamente 10 números.')
      return
    }

    // 4. Contraseñas: Deben coincidir
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden. Verifícalas para poder guardar el registro.')
      return
    }

    // 5. Términos y condiciones
    if (!formData.acceptTerms) {
      setError('Debes aceptar los términos y condiciones.')
      return
    }

    // --- FIN DE VALIDACIONES ---

    setIsLoading(true)

    // Llamada real al controlador
    const result = await authController.register(formData)

    setIsLoading(false)

    if (result.success) {
      // Guardamos la sesión del usuario localmente
      sessionStorage.setItem('user', JSON.stringify(result.user))

      // REDIRECCIÓN DINÁMICA BASADA EN EL ROL
      if (formData.role === 'host') {
        // Si eligió ser anfitrión, lo mandamos a su panel de administración de propiedades
        navigate('/arrendatario') // O '/host', dependiendo de cómo lo llamaste en tu App.jsx
      } else {
        // Si eligió ser huésped, lo mandamos a la vista general o inicio
        navigate('/inquilino') // O '/inquilino', o '/profile', dependiendo de tu ruta base para huéspedes
      }
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <Card className="w-full max-w-md p-8 md:p-10 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
        <div className="text-center mb-10">
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
            Crear Cuenta
          </h1>
          <p className="text-[#5F5F5F]/70 text-lg">Únete a nuestra comunidad</p>
        </div>

        {/* Mostrar alerta de error si falla la validación o el registro en BD */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-[#5F5F5F] font-medium">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={handleInputChange}
                className="pl-12 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-[#5F5F5F] font-medium">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-12 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-[#5F5F5F] font-medium">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+52 0000 0000 0000"
                value={formData.phone}
                onChange={handleInputChange}
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
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-12 pr-10 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5F5F5F]/50 hover:text-[#5F5F5F] transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-[#5F5F5F] font-medium">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirma tu contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pl-12 pr-10 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5F5F5F]/50 hover:text-[#5F5F5F] transition-colors"
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              className="mt-1 rounded border-[#6B8E23]/30 text-[#6B8E23] focus:ring-[#6B8E23] focus:ring-offset-0"
              required
            />
            <label htmlFor="terms" className="text-sm text-[#5F5F5F] leading-relaxed">
              Acepto los{' '}
              <button
                type="button"
                className="text-[#6B8E23] hover:text-[#5a7a1e] transition-colors"
              >
                términos y condiciones
              </button>{' '}
              y la{' '}
              <button
                type="button"
                className="text-[#6B8E23] hover:text-[#5a7a1e] transition-colors"
              >
                política de privacidad
              </button>
            </label>
          </div>

          {/* Selector de rol */}
          <div className="space-y-3 pt-4 border-t border-[#6B8E23]/10">
            <label className="text-[#5F5F5F] font-medium block">¿Cómo usarás NoWayHome?</label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border-2 border-[#6B8E23]/20 rounded-xl cursor-pointer hover:border-[#6B8E23] hover:bg-[#F2E8CF]/20 transition-all has-[:checked]:border-[#6B8E23] has-[:checked]:bg-[#F2E8CF]/30">
                <input
                  type="radio"
                  name="role"
                  value="guest"
                  checked={formData.role === 'guest'}
                  onChange={handleInputChange}
                  className="mt-0.5 text-[#6B8E23] focus:ring-[#6B8E23] focus:ring-offset-0"
                />
                <div>
                  <span className="text-[#5F5F5F] font-medium block">Huésped</span>
                  <span className="text-sm text-[#5F5F5F]/70">Reservar alojamiento</span>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 border-2 border-[#6B8E23]/20 rounded-xl cursor-pointer hover:border-[#6B8E23] hover:bg-[#F2E8CF]/20 transition-all has-[:checked]:border-[#6B8E23] has-[:checked]:bg-[#F2E8CF]/30">
                <input
                  type="radio"
                  name="role"
                  value="host"
                  checked={formData.role === 'host'}
                  onChange={handleInputChange}
                  className="mt-0.5 text-[#6B8E23] focus:ring-[#6B8E23] focus:ring-offset-0"
                />
                <div>
                  <span className="text-[#5F5F5F] font-medium block">Anfitrión</span>
                  <span className="text-sm text-[#5F5F5F]/70">Publicar alojamiento</span>
                </div>
              </label>
            </div>
            <p className="text-xs text-[#5F5F5F]/70 italic">
              El rol podrá modificarse posteriormente desde el perfil
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl mt-6 disabled:opacity-50"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[#5F5F5F]">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#6B8E23] font-medium hover:text-[#5a7a1e] transition-colors"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </Card>
    </div>
  )
}

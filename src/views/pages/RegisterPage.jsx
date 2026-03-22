import { useState } from 'react';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function RegisterPage({ onNavigate, onLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'guest',
    acceptTerms: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
    onNavigate('profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <Card className="w-full max-w-md p-8 md:p-10 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
        <div className="text-center mb-10">
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
            Crear Cuenta
          </h1>
          <p className="text-[#5F5F5F]/70 text-lg">
            Únete a nuestra comunidad
          </p>
        </div>

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
                placeholder="+34 600 000 000"
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
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-12 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors"
                required
              />
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
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pl-12 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors"
                required
              />
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
              <button type="button" className="text-[#6B8E23] hover:text-[#5a7a1e] transition-colors">
                términos y condiciones
              </button>{' '}
              y la{' '}
              <button type="button" className="text-[#6B8E23] hover:text-[#5a7a1e] transition-colors">
                política de privacidad
              </button>
            </label>
          </div>

          {/* Selector de rol */}
          <div className="space-y-3 pt-4 border-t border-[#6B8E23]/10">
            <label className="text-[#5F5F5F] font-medium block">
              ¿Cómo usarás NoWayHome?
            </label>
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
            className="w-full bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl mt-6"
          >
            Crear Cuenta
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[#5F5F5F]">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-[#6B8E23] font-medium hover:text-[#5a7a1e] transition-colors"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
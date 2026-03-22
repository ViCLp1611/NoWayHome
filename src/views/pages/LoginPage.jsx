import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simular login
    navigate('/profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <Card className="w-full max-w-md p-8 md:p-10 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
        <div className="text-center mb-10">
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
            Bienvenido de nuevo
          </h1>
          <p className="text-[#5F5F5F]/70 text-lg">
            Inicia sesión para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => setEmail(e.target.value)}
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
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#6B8E23]/30 text-[#6B8E23] focus:ring-[#6B8E23] focus:ring-offset-0"
              />
              <span className="text-[#5F5F5F]">Recordarme</span>
            </label>
            <button 
              type="button" 
              className="text-[#6B8E23] hover:text-[#5a7a1e] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl"
          >
            Iniciar Sesión
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Texto informativo sobre acceso dual */}
          <p className="text-xs text-center text-[#5F5F5F]/70 mt-2">
            El acceso es válido para huéspedes y anfitriones
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
          <p className="text-sm text-center text-[#5F5F5F]/70 mb-5">
            O continúa con
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              type="button"
              variant="outline" 
              className="border-2 border-[#6B8E23]/20 text-[#5F5F5F] hover:border-[#6B8E23] hover:bg-[#F2E8CF]/30 shadow-none rounded-xl h-11 transition-all"
            >
              Google
            </Button>
            <Button 
              type="button"
              variant="outline" 
              className="border-2 border-[#6B8E23]/20 text-[#5F5F5F] hover:border-[#6B8E23] hover:bg-[#F2E8CF]/30 shadow-none rounded-xl h-11 transition-all"
            >
              Facebook
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
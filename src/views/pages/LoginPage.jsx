import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Database } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { authService } from '@/services/authService';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const admin = await authService.login(email, password);
      // Guardar en localStorage si se seleccionó "Recordarme"
      if (rememberMe) {
        localStorage.setItem('admin', JSON.stringify(admin));
      } else {
        sessionStorage.setItem('admin', JSON.stringify(admin));
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
            disabled={isLoading}
            className="w-full bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl disabled:opacity-50"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Mostrar error si existe */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Texto informativo sobre acceso dual */}
          <p className="text-xs text-center text-[#5F5F5F]/70 mt-2">
            El acceso es válido para huéspedes y anfitriones
          </p>
        </form>

        {/* Instrucciones para crear tabla si hay error de tabla no encontrada */}
        {error && error.includes('La tabla administrador no existe') && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-900">Crear tabla administrador en Supabase</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>1. Ve a tu <strong>Supabase Dashboard</strong> → <strong>SQL Editor</strong></p>
                  <p>2. Crea una nueva consulta y ejecuta este SQL:</p>
                  <div className="bg-blue-100 p-3 rounded-lg font-mono text-xs">
                    <pre className="whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS public.administrador (
    id_admin INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_admin)
);

INSERT INTO public.administrador (nombre, correo, contrasena)
VALUES ('Administrador Principal', 'admin@nowayhome.com', 'admin123')
ON CONFLICT (correo) DO NOTHING;

-- Configurar políticas RLS
ALTER TABLE public.administrador ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir consulta de administradores" ON public.administrador
    FOR SELECT TO anon USING (true);`}</pre>
                  </div>
                  <p>3. Una vez ejecutado, ve a <strong>/admin/login</strong> para iniciar sesión como administrador</p>
                  <p>4. Usa estas credenciales:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li><strong>Correo:</strong> admin@nowayhome.com</li>
                    <li><strong>Contraseña:</strong> admin123</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { handleAdminLogin } from '@/controllers/authController.js';

export function AdminLogin() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await handleAdminLogin(correo, contrasena);

      if (result.success) {
        // Login exitoso - guardar información del admin
        console.log('Login exitoso:', result.admin);
        localStorage.setItem('admin', JSON.stringify(result.admin));
        
        // Redirigir al dashboard de admin
        navigate('/admin');
      } else {
        // Mostrar mensaje de error
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error('Error en login de admin:', error);
      setErrorMessage('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <Card className="w-full max-w-md p-8 md:p-10 bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#6B8E23]/10 rounded-full">
              <Shield className="h-8 w-8 text-[#6B8E23]" />
            </div>
          </div>
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
            Panel Administrador
          </h1>
          <p className="text-[#5F5F5F]/70 text-lg">
            Acceso restringido para administradores
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="correo" className="text-[#5F5F5F] font-medium">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="correo"
                type="email"
                placeholder="admin@nowayhome.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="pl-12 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="contrasena" className="text-[#5F5F5F] font-medium">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A67C52]" />
              <Input
                id="contrasena"
                type="password"
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="pl-12 h-12 bg-[#FAFAFA] border-[#6B8E23]/20 focus:border-[#6B8E23] focus:bg-white text-[#5F5F5F] rounded-xl transition-colors"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">
                {errorMessage}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-[#6B8E23] hover:bg-[#5a7a1f] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                Iniciar Sesión
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[#5F5F5F]/60 text-sm">
            Acceso autorizado únicamente para personal administrativo
          </p>
        </div>
      </Card>
    </div>
  );
}
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PropertyCard } from '@/views/components/PropertyCard';
import { mockFeaturedProperties } from '@/models/propertyModel';

export function HomePage({ onNavigate }) {
  const featuredProperties = mockFeaturedProperties.map(prop => prop.toJSON());

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#F2E8CF] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="font-poppins font-semibold text-4xl md:text-5xl text-[#5F5F5F] mb-5 leading-tight">
              Encuentra tu Hospedaje Perfecto
            </h1>
            <p className="text-[#5F5F5F]/80 text-lg md:text-xl mb-6">
              Explora miles de propiedades únicas en los mejores destinos
            </p>
            {/* Enlace discreto para anfitriones */}
            <button 
              onClick={() => onNavigate('register')}
              className="text-sm text-[#A67C52] hover:text-[#6B8E23] transition-colors underline decoration-dotted"
            >
              ¿Eres anfitrión? Publica tu espacio
            </button>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-[#6B8E23]/10 p-5 md:p-7">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="flex items-center gap-3 pb-5 md:pb-0 border-b md:border-b-0 md:border-r border-[#6B8E23]/10 md:pr-5">
                <MapPin className="h-5 w-5 text-[#A67C52] flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs text-[#5F5F5F]/70 block mb-1">Destino</label>
                  <Input 
                    placeholder="¿Dónde vas?" 
                    className="border-none p-0 h-auto focus-visible:ring-0 text-[#5F5F5F] placeholder:text-[#5F5F5F]/40"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 pb-5 md:pb-0 border-b md:border-b-0 md:border-r border-[#6B8E23]/10 md:pr-5">
                <Calendar className="h-5 w-5 text-[#A67C52] flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs text-[#5F5F5F]/70 block mb-1">Fecha</label>
                  <Input 
                    placeholder="Entrada - Salida" 
                    className="border-none p-0 h-auto focus-visible:ring-0 text-[#5F5F5F] placeholder:text-[#5F5F5F]/40"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 pb-5 md:pb-0 md:pr-5">
                <Users className="h-5 w-5 text-[#A67C52] flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs text-[#5F5F5F]/70 block mb-1">Huéspedes</label>
                  <Input 
                    placeholder="Añadir huéspedes" 
                    className="border-none p-0 h-auto focus-visible:ring-0 text-[#5F5F5F] placeholder:text-[#5F5F5F]/40"
                  />
                </div>
              </div>
              
              <Button className="bg-[#6B8E23] text-white hover:bg-[#5a7a1e] h-12 shadow-none rounded-xl">
                <Search className="h-5 w-5 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="font-poppins font-semibold text-3xl md:text-4xl text-[#5F5F5F] mb-3">
              Propiedades Destacadas
            </h2>
            <p className="text-[#5F5F5F]/70 text-lg">
              Las mejores opciones seleccionadas para ti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white transition-all shadow-none rounded-xl px-8 h-12"
            >
              Ver más propiedades
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#6B8E23] py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-poppins font-semibold text-3xl md:text-4xl text-white mb-5 leading-tight">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Únete a miles de viajeros que confían en nosotros para encontrar su hospedaje ideal
          </p>
          <Button 
            onClick={() => onNavigate('register')}
            className="bg-white text-[#6B8E23] hover:bg-[#F2E8CF] shadow-none rounded-xl px-8 h-12"
          >
            Comenzar ahora
          </Button>
        </div>
      </section>
    </div>
  );
}
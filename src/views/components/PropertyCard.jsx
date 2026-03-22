import { MapPin, Star } from 'lucide-react';
import { Card } from '@/app/components/ui/card';

export function PropertyCard({ id, image, title, location, price, rating, reviews }) {
  return (
    <Card className="overflow-hidden bg-white border border-[#6B8E23]/10 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative h-56 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-5">
        <h3 className="font-poppins font-semibold text-lg text-[#5F5F5F] mb-2 line-clamp-1">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 text-[#5F5F5F]/70 mb-4">
          <MapPin className="h-4 w-4 text-[#A67C52]" />
          <span className="text-sm">{location}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-[#6B8E23] text-[#6B8E23]" />
              <span className="text-sm font-medium text-[#5F5F5F]">{rating}</span>
            </div>
            <span className="text-sm text-[#5F5F5F]/70">({reviews})</span>
          </div>
          
          <div className="text-right">
            <span className="font-poppins font-semibold text-xl text-[#6B8E23]">
              ${price}
            </span>
            <span className="text-sm text-[#5F5F5F]/70"> / noche</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
import { MapPin, Star } from 'lucide-react'
import { Card } from '@/app/components/ui/card'

export function PropertyCard({ id, image, title, location, price, rating, reviews, onClick }) {
  return (
    <Card
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className="overflow-hidden bg-white border border-border shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-5">
        <h3 className="text-lg text-foreground mb-2 line-clamp-1">
          {title}
        </h3>

        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="h-4 w-4 text-accent-ink" />
          <span className="text-sm">{location}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary-ink" />
              <span className="text-sm font-medium text-foreground">{rating}</span>
            </div>
            <span className="text-sm text-muted-foreground">({reviews})</span>
          </div>

          <div className="text-right">
            <span className="font-poppins font-semibold text-xl text-primary-ink">${price}</span>
            <span className="text-sm text-muted-foreground"> / noche</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

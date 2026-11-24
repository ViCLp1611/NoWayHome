import { Loader2 } from 'lucide-react'

export function LoadingState({ message = 'Cargando...', className = '' }) {
  return (
    <div className={`flex min-h-[220px] flex-col items-center justify-center text-foreground ${className}`}>
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary-ink" />
      <p className="font-inter font-normal">{message}</p>
    </div>
  )
}

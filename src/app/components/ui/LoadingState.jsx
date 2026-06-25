import { Loader2 } from 'lucide-react'

export function LoadingState({ message = 'Cargando...', className = '' }) {
  return (
    <div className={`flex min-h-[220px] flex-col items-center justify-center text-[#5F5F5F] ${className}`}>
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#6B8E23]" />
      <p className="font-poppins font-medium">{message}</p>
    </div>
  )
}

import { Search } from 'lucide-react'

export function EmptyState({
  icon: Icon = Search,
  title = 'Sin resultados',
  message,
  action,
  className = '',
}) {
  return (
    <div className={`rounded-lg border border-[#6B8E23]/10 bg-white px-6 py-12 text-center ${className}`}>
      <Icon className="mx-auto mb-4 h-10 w-10 text-[#A67C52]" />
      <h3 className="font-poppins text-lg font-semibold text-[#5F5F5F]">{title}</h3>
      {message && <p className="mx-auto mt-2 max-w-md text-sm text-[#5F5F5F]/70">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

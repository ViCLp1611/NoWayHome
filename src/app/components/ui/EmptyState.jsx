import { Search } from 'lucide-react'

export function EmptyState({
  icon: Icon = Search,
  title = 'Sin resultados',
  message,
  action,
  className = '',
}) {
  return (
    <div className={`rounded-lg border border-border bg-white px-6 py-12 text-center ${className}`}>
      <Icon className="mx-auto mb-4 h-10 w-10 text-accent-ink" />
      <h3 className="text-lg text-foreground">{title}</h3>
      {message && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

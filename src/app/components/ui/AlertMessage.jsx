import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'

const variants = {
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-800',
    iconClassName: 'text-red-600',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-[#6B8E23]/30 bg-[#F2E8CF] text-[#5F5F5F]',
    iconClassName: 'text-[#6B8E23]',
  },
  warning: {
    icon: TriangleAlert,
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    iconClassName: 'text-amber-600',
  },
  info: {
    icon: Info,
    className: 'border-[#6B8E23]/20 bg-white text-[#5F5F5F]',
    iconClassName: 'text-[#6B8E23]',
  },
}

export function AlertMessage({ type = 'info', title, message, className = '' }) {
  if (!message && !title) return null

  const variant = variants[type] || variants.info
  const Icon = variant.icon

  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-lg border p-4 text-sm shadow-sm ${variant.className} ${className}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${variant.iconClassName}`} />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {message && <p className={title ? 'mt-1' : ''}>{message}</p>}
      </div>
    </div>
  )
}

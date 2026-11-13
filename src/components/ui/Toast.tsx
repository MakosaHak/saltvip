import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useAppStore } from '../../store/AppStore'

const icons = { success: CheckCircle, error: AlertCircle, info: Info }

export default function ToastContainer() {
  const { toasts, dismissToast } = useAppStore()

  return (
    <div className="toast-stack">
      {toasts.map(t => {
        const Icon = icons[t.type]
        return (
          <div key={t.id} className={`toast toast-${t.type} slide-up`}>
            <Icon size={18} className="flex-shrink-0" />
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            <button type="button" onClick={() => dismissToast(t.id)} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

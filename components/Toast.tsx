'use client'

import { useToast, ToastVariant } from '@/lib/toast-context'

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  info: {
    bg: 'bg-surface',
    border: 'border-accent-violet/30',
    icon: 'text-accent-violet',
  },
  success: {
    bg: 'bg-success-muted',
    border: 'border-success/30',
    icon: 'text-success',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: 'text-yellow-500',
  },
  error: {
    bg: 'bg-error-muted',
    border: 'border-error/30',
    icon: 'text-error',
  },
}

const variantIcons: Record<ToastVariant, JSX.Element> = {
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md w-full px-4">
      {toasts.map((toast) => {
        const styles = variantStyles[toast.variant]
        return (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className={`
              ${styles.bg} ${styles.border}
              rounded-xl border backdrop-blur-glass
              px-4 py-3 flex items-start gap-3
              cursor-pointer
              animate-slide-down
              shadow-soft
            `}
          >
            <span className={`${styles.icon} flex-shrink-0 mt-0.5`}>
              {variantIcons[toast.variant]}
            </span>
            <p className="text-text-primary text-sm leading-relaxed">
              {toast.message}
            </p>
          </div>
        )
      })}
    </div>
  )
}

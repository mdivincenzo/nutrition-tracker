'use client'

import { ReactNode } from 'react'
import { ToastProvider } from '@/lib/toast-context'
import ToastContainer from '@/components/Toast'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  )
}

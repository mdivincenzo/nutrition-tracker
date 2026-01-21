'use client'

import { usePathname } from 'next/navigation'
import { NavigationProvider } from '@/lib/navigation-context'
import Header from './Header'
import BottomTabs from './BottomTabs'

interface NavigationShellProps {
  children: React.ReactNode
}

export default function NavigationShell({ children }: NavigationShellProps) {
  const pathname = usePathname()

  // Determine active tab from pathname
  const activeTab = pathname.includes('/trends') ? 'trends' : 'log'

  // Don't show navigation shell on settings page
  const isSettingsPage = pathname.includes('/settings')

  if (isSettingsPage) {
    return <>{children}</>
  }

  return (
    <NavigationProvider>
      <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
        <Header />

        <main className="flex-1 overflow-hidden">
          {children}
        </main>

        <BottomTabs activeTab={activeTab} />
      </div>
    </NavigationProvider>
  )
}

import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header with back button */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Link
          href="/dashboard/log"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            color: '#94a3b8',
            transition: 'color 0.15s, background 0.15s',
          }}
        >
          <ChevronLeftIcon style={{ width: '20px', height: '20px' }} />
        </Link>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="p-6">
        <p className="text-text-secondary">Settings content coming soon</p>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { HomeIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconSolid, ChartBarIcon as ChartBarIconSolid } from '@heroicons/react/24/solid'

interface BottomTabsProps {
  activeTab: 'log' | 'trends'
}

export default function BottomTabs({ activeTab }: BottomTabsProps) {
  return (
    <nav
      style={{
        display: 'flex',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#0a0a0f',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <Link
        href="/dashboard/log"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '10px',
          color: activeTab === 'log' ? '#8b5cf6' : '#64748b',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
      >
        {activeTab === 'log' ? (
          <HomeIconSolid style={{ width: '20px', height: '20px' }} />
        ) : (
          <HomeIcon style={{ width: '20px', height: '20px' }} />
        )}
        <span style={{ fontSize: '11px', fontWeight: 500 }}>Log</span>
      </Link>

      <Link
        href="/dashboard/trends"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '10px',
          color: activeTab === 'trends' ? '#8b5cf6' : '#64748b',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
      >
        {activeTab === 'trends' ? (
          <ChartBarIconSolid style={{ width: '20px', height: '20px' }} />
        ) : (
          <ChartBarIcon style={{ width: '20px', height: '20px' }} />
        )}
        <span style={{ fontSize: '11px', fontWeight: 500 }}>Trends</span>
      </Link>
    </nav>
  )
}

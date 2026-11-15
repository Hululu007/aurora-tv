import { useEffect, useState } from 'react'
import type { View } from '../core/types'

interface TopBarProps {
  view: View
  onNavigate: (view: View) => void
  onOpenSources: () => void
  sourceName: string
  demo: boolean
  hidden: boolean
}

const TABS: Array<{ id: View; label: string }> = [
  { id: 'home', label: '首页' },
  { id: 'search', label: '搜索' },
  { id: 'settings', label: '设置' },
]

export function TopBar({ view, onNavigate, onOpenSources, sourceName, demo, hidden }: TopBarProps) {
  const [clock, setClock] = useState(() => formatClock())

  useEffect(() => {
    const timer = window.setInterval(() => setClock(formatClock()), 20000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className={`topbar ${hidden ? 'is-hidden' : ''}`}>
      <button type="button" className="brand" data-nav onClick={() => onNavigate('home')}>
        <span className="brand-mark" aria-hidden />
        <span className="brand-word">
          AURORA<span> TV</span>
        </span>
      </button>

      <nav className="nav" aria-label="主导航">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`nav-item ${view === tab.id ? 'is-active' : ''}`}
            data-nav
            onClick={() => onNavigate(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="topbar-right">
        <button type="button" className="status-pill" data-nav onClick={onOpenSources} title="管理片源">
          <span className={`status-dot ${demo ? 'offline' : ''}`} />
          <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sourceName}
          </span>
        </button>
        <span className="clock">{clock}</span>
      </div>
    </div>
  )
}

function formatClock() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

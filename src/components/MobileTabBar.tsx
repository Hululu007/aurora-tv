import type { View } from '../core/types'
import { ClockIcon, GridIcon, HomeIcon, LibraryIcon, SearchIcon, SettingsIcon } from './Icons'

interface MobileTabBarProps {
  active: 'home' | 'category' | 'search' | 'history' | 'settings' | 'sources'
  onNavigate: (view: View) => void
  onOpenSources: () => void
}

const TABS = [
  { id: 'home', label: '首页', icon: HomeIcon },
  { id: 'category', label: '分类', icon: GridIcon },
  { id: 'search', label: '搜索', icon: SearchIcon },
  { id: 'history', label: '历史', icon: ClockIcon },
  { id: 'sources', label: '片库', icon: LibraryIcon },
  { id: 'settings', label: '设置', icon: SettingsIcon },
] as const

/** 手机端底部导航：拇指可达，替代桌面端的顶部胶囊导航 */
export function MobileTabBar({ active, onNavigate, onOpenSources }: MobileTabBarProps) {
  return (
    <nav className="tabbar" aria-label="底部导航">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            className={`tabbar-item ${isActive ? 'is-active' : ''}`}
            data-nav
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (tab.id === 'sources') onOpenSources()
              else onNavigate(tab.id)
            }}
          >
            <Icon width={22} height={22} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

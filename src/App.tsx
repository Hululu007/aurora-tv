import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { CatalogItem, HistoryEntry, PlayGroup, PlaybackState, View } from './core/types'
import {
  DENSITY_WIDTH,
  loadHistory,
  loadSettings,
  merge,
  saveSettings,
  type Settings,
  type SyncPayload,
  upsertHistory,
} from './core/settings'
import { setProxy } from './core/net'
import {
  activate,
  focusFirst,
  getNavLock,
  isPhoneUi,
  moveFocus,
  setNavLock,
  startGamepadLoop,
} from './core/nav'
import { paletteFromString } from './core/format'
import { useCatalog } from './hooks/useCatalog'
import { TopBar } from './components/TopBar'
import { MobileTabBar } from './components/MobileTabBar'
import { Home as HomeView } from './views/Home'
import { Detail } from './views/Detail'
import { Player } from './views/Player'
import { SettingsView } from './views/Settings'
import { Sources } from './views/Sources'
import { Search } from './views/Search'

type Overlay = 'search' | 'settings' | 'sources' | null

const CACHE_PREFIX = 'aurora.cache.'

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [detail, setDetail] = useState<CatalogItem | null>(null)
  const [playback, setPlayback] = useState<PlaybackState | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [toast, setToast] = useState<string | null>(null)
  const [barHidden, setBarHidden] = useState(false)
  const [ambient, setAmbient] = useState<[string, string, string]>(['#24344f', '#5b7fa6', '#0a0f18'])
  const toastTimer = useRef<number | null>(null)
  const catalog = useCatalog(settings)

  /* ---------------------------------- 设置持久化 --------------------------------- */

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    setProxy(settings.data.proxy)
  }, [settings.data.proxy])

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  /* ----------------------------------- 顶栏 ----------------------------------- */

  useEffect(() => {
    if (!settings.layout.autoHideBar) {
      setBarHidden(false)
      return
    }
    // 手机端顶栏保持简洁常驻，避免滚动时状态与片源入口一起消失
    if (isPhoneUi()) {
      setBarHidden(false)
      return
    }
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y < 60) setBarHidden(false)
      else if (y > lastY + 8) setBarHidden(true)
      else if (y < lastY - 8) setBarHidden(false)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [settings.layout.autoHideBar])

  /* --------------------------------- 全局按键 --------------------------------- */

  const closeTop = useCallback(() => {
    if (getNavLock()) return
    if (overlay) {
      setOverlay(null)
      return
    }
    if (detail) {
      setDetail(null)
      return
    }
    if (playback) {
      setPlayback(null)
      return
    }
    if (window.scrollY > 40) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [detail, overlay, playback])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (getNavLock()) return
      const target = event.target as HTMLElement | null
      const typing =
        Boolean(target) &&
        (target!.tagName === 'INPUT' ||
          target!.tagName === 'TEXTAREA' ||
          target!.isContentEditable)

      if (event.key === 'Escape' || event.key === 'BrowserBack') {
        event.preventDefault()
        if (typing) (target as HTMLElement).blur()
        else closeTop()
        return
      }
      if (typing) return

      if (event.key.startsWith('Arrow')) {
        const dir = event.key.replace('Arrow', '').toLowerCase() as
          | 'up'
          | 'down'
          | 'left'
          | 'right'
        if (moveFocus(dir)) event.preventDefault()
        return
      }
      if (event.key === 'Enter') {
        if (activate()) event.preventDefault()
        return
      }
      if (event.key === ' ') {
        event.preventDefault()
        activate()
      }
    }

    window.addEventListener('keydown', onKey)
    const stopGamepad = startGamepadLoop(() => closeTop())
    return () => {
      window.removeEventListener('keydown', onKey)
      stopGamepad()
    }
  }, [closeTop])

  /* --------------------------------- 焦点复位 --------------------------------- */

  useEffect(() => {
    if (catalog.phase !== 'ready' || overlay || detail || playback) return
    if (isPhoneUi()) return
    const timer = window.setTimeout(() => {
      focusFirst()
    }, 650)
    return () => window.clearTimeout(timer)
  }, [catalog.phase, overlay, detail, playback])

  useEffect(() => {
    if (overlay || detail || playback) return
    if (isPhoneUi()) return
    const timer = window.setTimeout(() => focusFirst(), 120)
    return () => window.clearTimeout(timer)
  }, [overlay, detail, playback])

  /* ---------------------------------- 弹层滚动锁 --------------------------------- */

  useEffect(() => {
    const locked = Boolean(overlay || detail || playback)
    document.body.classList.toggle('is-locked', locked)
    return () => document.body.classList.remove('is-locked')
  }, [overlay, detail, playback])

  /* ---------------------------------- 观看历史 --------------------------------- */

  const continueRow = useMemo(() => {
    const items: CatalogItem[] = history
      .filter((entry) => entry.position > 5 && entry.groups?.length)
      .slice(0, 10)
      .map((entry) => ({
        id: entry.mediaKey,
        name: entry.title,
        poster: entry.poster,
        palette: entry.palette,
        remarks: '继续观看',
        typeName: entry.subtitle ?? '继续播放',
        desc: `上次看到 ${formatPercent(entry.position, entry.duration)}`,
        resume: true,
        startTime: entry.position,
        groups: entry.groups,
        siteKey: entry.mediaKey.split('|')[0],
        groupIndex: entry.groupIndex,
        episodeIndex: entry.episodeIndex,
        mediaKey: entry.mediaKey,
      }))
    return items.length
      ? { key: '__continue', title: '继续观看', subtitle: '从上次停下的地方继续', items }
      : null
  }, [history])

  const rows = useMemo(
    () => (continueRow ? [continueRow, ...catalog.rows] : catalog.rows),
    [catalog.rows, continueRow],
  )

  const progressOf = useCallback(
    (item: CatalogItem) => {
      if (item.resume) return undefined
      const key = `${item.siteKey ?? 'demo'}|${item.id}`
      const entry = history.find((h) => h.mediaKey === key)
      if (!entry || !entry.duration) return undefined
      return entry.position / entry.duration
    },
    [history],
  )

  /* ----------------------------------- 播放 ---------------------------------- */

  const startPlayback = useCallback(
    (groups: PlayGroup[], groupIndex: number, episodeIndex: number, startTime?: number, item?: CatalogItem) => {
      const source = item ?? detail
      if (!source) return
      setDetail(null)
      setOverlay(null)
      setPlayback({
        title: source.name,
        subtitle: source.typeName,
        groups,
        groupIndex,
        episodeIndex,
        poster: source.poster,
        palette: source.palette,
        mediaKey: `${source.siteKey ?? 'demo'}|${source.id}`,
        startTime,
      })
    },
    [detail],
  )

  const handlePlay = useCallback(
    async (item: CatalogItem) => {
      try {
        showToast('正在准备播放…')
        const groups = item.groups?.length ? item.groups : await catalog.loadGroups(item)
        if (!groups.length) throw new Error('没有可用的播放线路')
        setPlayback({
          title: item.name,
          subtitle: item.typeName,
          groups,
          groupIndex: 0,
          episodeIndex: 0,
          poster: item.poster,
          palette: item.palette,
          mediaKey: `${item.siteKey ?? 'demo'}|${item.id}`,
        })
        setDetail(null)
        setOverlay(null)
      } catch (error) {
        showToast((error as Error).message || '播放失败')
      }
    },
    [catalog, showToast],
  )

  const handleOpen = useCallback(
    (item: CatalogItem) => {
      if (item.resume && item.groups) {
        setOverlay(null)
        setPlayback({
          title: item.name,
          subtitle: item.typeName,
          groups: item.groups,
          groupIndex: item.groupIndex ?? 0,
          episodeIndex: item.episodeIndex ?? 0,
          poster: item.poster,
          palette: item.palette,
          mediaKey: item.mediaKey ?? item.id,
          startTime: item.startTime,
        })
        return
      }
      setOverlay(null)
      setDetail(item)
    },
    [],
  )

  const handleProgress = useCallback(
    (payload: { groupIndex: number; episodeIndex: number; position: number; duration: number }) => {
      if (!playback) return
      setHistory(
        upsertHistory({
          mediaKey: playback.mediaKey,
          title: playback.title,
          subtitle: playback.subtitle,
          poster: playback.poster,
          palette: playback.palette,
          groupIndex: payload.groupIndex,
          episodeIndex: payload.episodeIndex,
          position: payload.position,
          duration: payload.duration,
          updatedAt: Date.now(),
          groups: playback.groups,
        }),
      )
    },
    [playback],
  )

  /* ---------------------------------- 数据同步 --------------------------------- */

  const applyData = useCallback(
    (configUrl: string, proxy: string) => {
      setSettings((current) => ({
        ...current,
        data: { ...current.data, configUrl, proxy, mode: 'auto' },
      }))
      showToast('已保存，正在重新加载片源…')
    },
    [showToast],
  )

  const importSync = useCallback(
    (payload: SyncPayload) => {
      if (payload.settings) {
        setSettings((current) => merge(current, payload.settings))
      }
      if (payload.history?.length) {
        let next = loadHistory()
        for (const entry of payload.history) next = upsertHistory(entry)
        setHistory(next)
      }
    },
    [],
  )

  const clearCache = useCallback(() => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => localStorage.removeItem(key))
  }, [])

  /* ----------------------------------- 样式 ---------------------------------- */

  const style = useMemo<CSSProperties>(() => {
    const theme = settings.theme
    return {
      '--accent': theme.accent,
      '--radius': `${theme.radius}px`,
      '--card-w-base': `${Math.round(DENSITY_WIDTH[theme.density] * theme.scale)}px`,
      '--blur': `${theme.blur}px`,
      '--dim': String(theme.dim),
      '--font-scale': String(theme.font),
      '--ambient-a': ambient[1],
      '--ambient-b': ambient[2],
    } as CSSProperties
  }, [ambient, settings.theme])

  const activeView: View =
    overlay === 'settings' ? 'settings' : overlay === 'search' ? 'search' : 'home'

  const navigate = (view: View) => {
    if (view === 'home') {
      setOverlay(null)
      setDetail(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setDetail(null)
    setOverlay(view)
  }

  const sourceLabel = catalog.demo
    ? '演示片库'
    : catalog.site?.name ?? (catalog.booting ? '连接中…' : '未连接')

  return (
    <div
      className="app"
      style={style}
      data-focus={settings.theme.focus}
      data-titles={settings.layout.showTitles ? 'on' : 'off'}
      data-motion={settings.theme.motion ? 'on' : 'off'}
    >
      <div className="ambient" />
      <div className="vignette" />
      <div className="grain" />

      <TopBar
        view={activeView}
        onNavigate={navigate}
        onOpenSources={() => {
          setDetail(null)
          setOverlay('sources')
        }}
        sourceName={sourceLabel}
        demo={catalog.demo}
        hidden={barHidden}
      />

      <main className="stage">
        <HomeView
          hero={catalog.hero}
          rows={rows}
          loading={catalog.phase === 'loading' && !catalog.rows.length}
          error={catalog.error}
          demo={catalog.demo}
          showHero={settings.layout.hero}
          rotate={settings.layout.rotate}
          onOpen={handleOpen}
          onPlay={handlePlay}
          onTint={setAmbient}
          onRetry={catalog.reload}
          onDemo={catalog.enableDemo}
          onOpenSettings={() => setOverlay('settings')}
          progressOf={progressOf}
        />
      </main>

      {detail ? (
        <Detail
          item={detail}
          history={history.find((h) => h.mediaKey === `${detail.siteKey ?? 'demo'}|${detail.id}`)}
          loadGroups={catalog.loadGroups}
          onClose={() => setDetail(null)}
          onPlay={(groups, groupIndex, episodeIndex, startTime) =>
            startPlayback(groups, groupIndex, episodeIndex, startTime)
          }
        />
      ) : null}

      {overlay === 'search' ? (
        <Search
          demo={catalog.demo}
          siteName={catalog.site?.name ?? '演示片库'}
          search={catalog.search}
          onOpen={handleOpen}
          onClose={() => setOverlay(null)}
        />
      ) : null}

      {overlay === 'settings' ? (
        <SettingsView
          settings={settings}
          history={history}
          onChange={setSettings}
          onClose={() => setOverlay(null)}
          onOpenSources={() => setOverlay('sources')}
          onApplyData={applyData}
          onImportSync={importSync}
          onClearCache={clearCache}
          onToast={showToast}
        />
      ) : null}

      {overlay === 'sources' ? (
        <Sources
          sources={catalog.sources}
          sourceIndex={catalog.sourceIndex}
          sites={catalog.sites}
          activeSite={catalog.site}
          parseCount={catalog.parses.length}
          demo={catalog.demo}
          loading={catalog.phase === 'loading'}
          error={catalog.error}
          onSelectSource={(index) => {
            setSettings((current) => ({ ...current, data: { ...current.data, sourceIndex: index } }))
            setOverlay(null)
          }}
          onSelectSite={(site) => {
            void catalog.selectSite(site)
            setSettings((current) => ({ ...current, data: { ...current.data, siteKey: site.key } }))
            setOverlay(null)
          }}
          onAddSite={(name, api) => {
            void catalog.addSite(name, api)
            setOverlay(null)
          }}
          onRefresh={() => {
            clearCache()
            catalog.reload()
          }}
          onDemo={catalog.enableDemo}
          onClose={() => setOverlay(null)}
        />
      ) : null}

      {playback ? (
        <Player
          state={playback}
          autoNext={settings.play.autoNext}
          seekStep={settings.play.seekStep}
          onClose={() => {
            setNavLock(false)
            setPlayback(null)
          }}
          resolveUrl={catalog.resolvePlay}
          onProgress={handleProgress}
        />
      ) : null}

      {!overlay && !detail && !playback ? (
        <MobileTabBar
          active="home"
          onNavigate={navigate}
          onOpenSources={() => setOverlay('sources')}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}

function formatPercent(position: number, duration: number): string {
  if (!duration) return '上次观看'
  const percent = Math.round((position / duration) * 100)
  return `已观看 ${percent}%`
}

import type { CatalogItem, Row } from '../core/types'
import { Hero } from '../components/Hero'
import { Shelf } from '../components/Shelf'

interface HomeProps {
  hero: CatalogItem[]
  rows: Row[]
  loading: boolean
  error?: string | null
  demo: boolean
  showHero: boolean
  rotate: boolean
  onOpen: (item: CatalogItem) => void
  onPlay: (item: CatalogItem) => void
  onTint: (colors: [string, string, string]) => void
  onRetry: () => void
  onDemo: () => void
  onOpenSettings: () => void
  progressOf: (item: CatalogItem) => number | undefined
}

export function Home({
  hero,
  rows,
  loading,
  error,
  demo,
  showHero,
  rotate,
  onOpen,
  onPlay,
  onTint,
  onRetry,
  onDemo,
  onOpenSettings,
  progressOf,
}: HomeProps) {
  if (loading) {
    return (
      <div>
        <div
          style={{
            padding: '0 var(--safe-x)',
            marginBottom: 16,
            fontSize: 12,
            color: 'rgba(245,245,247,.35)',
            letterSpacing: '.02em',
          }}
        >
          正在探测可用片源，首次启动可能需要十几秒…
        </div>
        <HomeSkeleton showHero={showHero} />
      </div>
    )
  }

  if (error && !rows.length) {
    return (
      <div className="empty">
        <h3>片源暂时没有响应</h3>
        <p>{error}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn primary" data-nav onClick={onRetry}>
            重新加载
          </button>
          <button type="button" className="btn ghost" data-nav onClick={onDemo}>
            先看演示片库
          </button>
          <button type="button" className="btn ghost" data-nav onClick={onOpenSettings}>
            配置片源
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {demo ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            margin: '0 var(--safe-x) 6px',
            padding: '8px 14px',
            width: 'fit-content',
            maxWidth: 'calc(100% - 2 * var(--safe-x))',
            borderRadius: 12,
            background: 'rgba(255, 180, 92, 0.08)',
            border: '1px solid rgba(255, 180, 92, 0.25)',
            color: 'rgba(255, 210, 160, 0.9)',
            fontSize: 12,
          }}
        >
          <span className="tag warn">演示模式</span>
          <span style={{ color: 'rgba(245,245,247,.55)' }}>
            {error
              ? `片源连接失败：${error}`
              : '当前展示内置演示片库，播放的是公开测试流。连接真实片源请到「设置 → 片源」。'}
          </span>
        </div>
      ) : null}

      {showHero && hero.length ? (
        <Hero items={hero} rotate={rotate} onPlay={onPlay} onOpen={onOpen} onTint={onTint} />
      ) : null}

      {rows.map((row, index) => (
        <Shelf
          key={row.key}
          row={row}
          onOpen={onOpen}
          progressOf={progressOf}
          delay={Math.min(index, 6) * 60}
        />
      ))}

      {!rows.length ? (
        <div className="empty">
          <h3>这个源没有返回内容</h3>
          <p>换一个站点或稍后再试。部分站点会限制并发，降低刷新频率通常有效。</p>
          <button type="button" className="btn ghost" data-nav onClick={onRetry}>
            重新加载
          </button>
        </div>
      ) : null}
    </>
  )
}

function HomeSkeleton({ showHero }: { showHero: boolean }) {
  return (
    <div>
      {showHero ? <div className="skel skel-hero" /> : null}
      {[0, 1, 2].map((row) => (
        <div key={row} className="skel-row">
          {[0, 1, 2, 3, 4, 5].map((card) => (
            <div key={card} className="skel skel-card" />
          ))}
        </div>
      ))}
    </div>
  )
}

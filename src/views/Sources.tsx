import { useEffect, useRef, useState } from 'react'
import type { MultiUrl, Site } from '../core/types'
import { focusFirst, setNavRoot } from '../core/nav'
import { ChevronLeft, RefreshIcon } from '../components/Icons'

interface SourcesProps {
  sources: MultiUrl[]
  sourceIndex: number
  sites: Site[]
  activeSite: Site | null
  parseCount: number
  demo: boolean
  loading: boolean
  error: string | null
  onSelectSource: (index: number) => void
  onSelectSite: (site: Site) => void
  onAddSite: (name: string, api: string) => void
  onRefresh: () => void
  onDemo: () => void
  onClose: () => void
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export function Sources({
  sources,
  sourceIndex,
  sites,
  activeSite,
  parseCount,
  demo,
  loading,
  error,
  onSelectSource,
  onSelectSite,
  onAddSite,
  onRefresh,
  onDemo,
  onClose,
}: SourcesProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState('')
  const [api, setApi] = useState('')

  useEffect(() => {
    setNavRoot(rootRef.current)
    const raf = requestAnimationFrame(() => focusFirst())
    return () => {
      setNavRoot(null)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="layer" data-layer="sources">
      <div className="panel" ref={rootRef}>
        <div className="panel-inner">
          <div className="panel-head">
            <div>
              <h1>片源</h1>
              <p>
                {demo
                  ? '当前是演示模式。选择下方任一站点即可切换到真实片源。'
                  : `正在使用 ${activeSite?.name ?? '本地站点'} · ${sites.length} 个站点 · ${parseCount} 条解析线路`}
              </p>
            </div>
            <div className="actions">
              <button type="button" className="icon-btn" data-nav onClick={onRefresh} title="刷新">
                <RefreshIcon width={17} height={17} />
              </button>
              <button type="button" className="btn primary" data-nav onClick={onClose}>
                完成
              </button>
            </div>
          </div>

          {error ? (
            <div
              style={{
                marginBottom: 18,
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(255,120,120,.08)',
                border: '1px solid rgba(255,120,120,.22)',
                color: '#ffb3b3',
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          ) : null}

          <div className="group">
            <div className="group-title">聚合配置（{sources.length} 个源）</div>
            <div className="source-list">
              {sources.length === 0 ? (
                <div className="hint" style={{ padding: '12px 0' }}>
                  还没有加载到配置。检查设置里的配置文件地址，或先看看演示片库。
                </div>
              ) : null}
              {sources.map((source, index) => (
                <button
                  key={source.url}
                  type="button"
                  className={`source-item ${index === sourceIndex ? 'is-on' : ''}`}
                  data-nav
                  onClick={() => onSelectSource(index)}
                  style={
                    index === sourceIndex
                      ? { borderColor: 'rgba(255,255,255,.28)', background: 'rgba(255,255,255,.07)' }
                      : undefined
                  }
                >
                  <div className="source-main">
                    <div className="source-name">{source.name}</div>
                    <div className="source-meta">{hostOf(source.url)}</div>
                  </div>
                  <span className="source-count">
                    {index === sourceIndex ? (loading ? '加载中…' : '使用中') : '切换'}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 16, flexWrap: 'wrap' }}>
              <button type="button" className="btn ghost" data-nav onClick={onDemo}>
                使用演示片库
              </button>
            </div>
          </div>

          <div className="group">
            <div className="group-title">可播放站点（CMS 接口）</div>
            {loading ? (
              <div style={{ padding: '18px 0 22px', color: 'rgba(245,245,247,.4)', fontSize: 12.5 }}>
                正在读取站点列表…
              </div>
            ) : (
              <div className="source-list">
                {sites.map((site) => (
                  <button
                    key={site.key}
                    type="button"
                    className="source-item"
                    data-nav
                    onClick={() => onSelectSite(site)}
                  >
                    <div className="source-main">
                      <div className="source-name">{site.name}</div>
                      <div className="source-meta">{hostOf(site.api)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {site.searchable ? <span className="tag ok">可搜索</span> : null}
                      {activeSite?.key === site.key ? <span className="tag">使用中</span> : null}
                    </div>
                  </button>
                ))}
                {!sites.length && !loading ? (
                  <div className="hint" style={{ padding: '10px 0' }}>
                    这个源下暂时没有可直连的 CMS 站点，试试切换上面的其他聚合源。
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="group">
            <div className="group-title">手动添加站点</div>
            <div style={{ padding: '12px 0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  className="field"
                  style={{ maxWidth: 220 }}
                  placeholder="站点名称"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <input
                  className="field"
                  style={{ flex: 1, minWidth: 260 }}
                  placeholder="https://example.com/api.php/provide/vod/"
                  value={api}
                  onChange={(event) => setApi(event.target.value)}
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="btn ghost"
                  data-nav
                  disabled={!name.trim() || !/^https?:\/\//.test(api.trim())}
                  onClick={() => {
                    onAddSite(name.trim(), api.trim())
                    setName('')
                    setApi('')
                  }}
                >
                  添加并使用
                </button>
              </div>
              <div className="hint">
                需要标准的苹果 CMS / MacCMS 接口（返回 class 与 list 的 JSON）。spider 类型（jar / drpy）暂未内置内核。
              </div>
            </div>
          </div>

          <div className="group">
            <div className="group-title">关于兼容性</div>
            <div style={{ padding: '12px 0 20px', fontSize: 12.5, lineHeight: 1.8, color: 'rgba(245,245,247,.5)' }}>
              你的 tvbox-multi.json 里共有 6 个聚合源。其中大多数站点是 <b>type 3</b>（spider / drpy），需要
              Java 或 JS 内核才能运行；本项目当前直连 <b>type 1</b>（CMS JSON）站点，因此能直接播放的是这部分。
              <br />
              后续可把 spider 内核接到 Tauri 端（Rust + QuickJS），前端协议已经按同样的数据结构预留。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

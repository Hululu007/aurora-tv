import { useEffect, useRef, useState } from 'react'
import type { CatalogItem, HistoryEntry, PlayGroup } from '../core/types'
import { Artwork, tintStyle } from '../components/Artwork'
import { Back10Icon, ChevronLeft, PlayIcon } from '../components/Icons'
import { focusFirst, isPhoneUi, setNavRoot } from '../core/nav'
import { paletteFromString } from '../core/format'

interface DetailProps {
  item: CatalogItem
  history?: HistoryEntry
  loadGroups: (item: CatalogItem) => Promise<PlayGroup[]>
  onClose: () => void
  onPlay: (groups: PlayGroup[], groupIndex: number, episodeIndex: number, startTime?: number) => void
}

export function Detail({ item, history, loadGroups, onClose, onPlay }: DetailProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [groups, setGroups] = useState<PlayGroup[] | null>(item.groups ?? null)
  const [groupIndex, setGroupIndex] = useState(0)
  const [loading, setLoading] = useState(!item.groups)
  const [error, setError] = useState<string | null>(null)
  const focusOnce = useRef(false)

  useEffect(() => {
    setNavRoot(rootRef.current)
    rootRef.current?.scrollTo({ top: 0 })
    const raf = isPhoneUi()
      ? 0
      : requestAnimationFrame(() => focusFirst())
    return () => {
      setNavRoot(null)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    let alive = true
    if (item.groups) {
      setGroups(item.groups)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    loadGroups(item)
      .then((result) => {
        if (!alive) return
        setGroups(result)
        if (!result.length) setError('这个站点没有解析出可播放的线路')
      })
      .catch((err: Error) => {
        if (alive) setError(err.message || '线路加载失败')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [item, loadGroups])

  const palette = item.palette ?? paletteFromString(item.name)

  // 线路加载完成后，把焦点落到主按钮上（触屏不需要焦点环）
  useEffect(() => {
    if (!groups?.length || focusOnce.current) return
    focusOnce.current = true
    if (isPhoneUi()) return
    const raf = requestAnimationFrame(() => focusFirst())
    return () => cancelAnimationFrame(raf)
  }, [groups])

  const meta = [item.year, item.typeName, item.area, item.score ? `${item.score} 分` : undefined].filter(
    Boolean,
  )

  const resumeIndex =
    history && groups
      ? Math.min(history.episodeIndex, (groups[history.groupIndex] ?? groups[0]).episodes.length - 1)
      : -1

  const activeGroup = groups?.[groupIndex]

  return (
    <div className="layer" data-layer="detail">
      <div className="detail-scrim" aria-hidden />
      <button
        type="button"
        className="detail-back btn ghost"
        data-nav
        onClick={onClose}
      >
        <ChevronLeft width={16} height={16} />
        返回
      </button>
      <div className="detail" ref={rootRef}>

        <header className="detail-hero">
          <div className="detail-bg" style={tintStyle(palette)}>
            {item.poster ? <img src={item.poster} alt="" aria-hidden /> : <div className="hero-tint" />}
          </div>
          <div className="hero-shade" />
          <div className="detail-copy" style={{ animation: 'rise-in .5s var(--ease) both' }}>
            <span className="eyebrow">{item.typeName || '影片详情'}</span>
            <h1>{item.name}</h1>
            <div className="hero-meta">
              {item.remarks ? <span className="badge accent">{item.remarks}</span> : null}
              {meta.map((text, i) => (
                <span key={`${text}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
                  {i > 0 || item.remarks ? <span className="dot" /> : null}
                  {text}
                </span>
              ))}
            </div>
            <div className="hero-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="btn primary"
                data-nav
                data-autofocus="1"
                disabled={!activeGroup}
                onClick={() => {
                  if (!groups?.length) return
                  const gi = resumeIndex >= 0 ? history!.groupIndex : 0
                  const ei = resumeIndex >= 0 ? resumeIndex : 0
                  onPlay(groups, gi, ei, resumeIndex >= 0 ? history!.position : undefined)
                }}
              >
                <PlayIcon width={16} height={16} />
                {resumeIndex >= 0
                  ? `从第 ${resumeIndex + 1} 集继续`
                  : (activeGroup?.episodes.length ?? 0) <= 1
                    ? '播放正片'
                    : '播放第一集'}
              </button>
            </div>
          </div>
          <div className="detail-poster">
            <Artwork item={item} />
          </div>
        </header>

        <div className="detail-body">
          <section className="section">
            <h3 className="section-title">简介</h3>
            <p className="synopsis">
              {item.desc || '这个站点没有提供简介。'}
            </p>
            {(item.actor || item.director) && (
              <div className="credits">
                {item.director ? (
                  <span>
                    <b>导演</b> {item.director}
                  </span>
                ) : null}
                {item.actor ? (
                  <span>
                    <b>主演</b> {item.actor}
                  </span>
                ) : null}
              </div>
            )}
          </section>

          {loading ? (
            <div className="skel" style={{ height: 120, borderRadius: 16 }} />
          ) : error ? (
            <div className="empty" style={{ padding: '36px 0' }}>
              <p>{error}</p>
            </div>
          ) : groups && groups.length ? (
            <>
              {groups.length > 1 ? (
                <section className="section">
                  <div className="section-head">
                    <h3 className="section-title">线路</h3>
                    <span className="section-hint">{groups.length} 条</span>
                  </div>
                  <div className="seg-pills">
                    {groups.map((group, index) => (
                      <button
                        key={group.name}
                        type="button"
                        className={`pill ${index === groupIndex ? 'is-active' : ''}`}
                        data-nav
                        onClick={() => setGroupIndex(index)}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="section">
                <div className="section-head">
                  <h3 className="section-title">选集</h3>
                  <span className="section-hint">
                    {activeGroup?.episodes.length ?? 0} 集 · 选集播放
                  </span>
                </div>
                <div className="ep-grid">
                  {activeGroup?.episodes.map((episode, index) => (
                    <button
                      key={`${episode.name}-${index}`}
                      type="button"
                      className={`ep ${history?.groupIndex === groupIndex && history?.episodeIndex === index ? 'is-current' : ''}`}
                      data-nav
                      onClick={() => onPlay(groups, groupIndex, index)}
                      title={episode.name}
                    >
                      {episode.name || `第 ${index + 1} 集`}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          <div className="detail-tip">
            <Back10Icon width={16} height={16} />
            <span>提示：按 ESC 或遥控器返回键回到首页</span>
          </div>
        </div>
      </div>
    </div>
  )
}

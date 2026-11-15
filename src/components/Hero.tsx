import { useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogItem } from '../core/types'
import { Artwork, tintStyle } from './Artwork'
import { InfoIcon, PlayIcon } from './Icons'
import { paletteFromString } from '../core/format'

interface HeroProps {
  items: CatalogItem[]
  rotate: boolean
  onPlay: (item: CatalogItem) => void
  onOpen: (item: CatalogItem) => void
  onTint?: (colors: [string, string, string]) => void
}

export function Hero({ items, rotate, onPlay, onOpen, onTint }: HeroProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const list = useMemo(() => items.slice(0, 6), [items])
  const item = list[Math.min(index, Math.max(0, list.length - 1))]

  useEffect(() => {
    setIndex(0)
  }, [items])

  useEffect(() => {
    if (!rotate || paused || list.length <= 1) return
    const timer = window.setInterval(() => {
      // 焦点在 Hero 内时不要换片，否则正在选中的按钮会被替换掉
      const focused = document.querySelector('.is-focused')
      if (focused && heroRef.current?.contains(focused)) return
      setIndex((current) => (current + 1) % list.length)
    }, 9000)
    return () => window.clearInterval(timer)
  }, [rotate, paused, list.length])

  useEffect(() => {
    if (!item) return
    onTint?.(item.palette ?? paletteFromString(item.name))
  }, [item, onTint])

  if (!item) return null

  const palette = item.palette ?? paletteFromString(item.name)
  const meta = [item.year, item.typeName, item.area, item.score ? `${item.score} 分` : undefined].filter(
    Boolean,
  )

  return (
    <header
      ref={heroRef}
      className="hero"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="hero-ambient" style={tintStyle(palette)}>
        {item.poster ? <img src={item.poster} alt="" aria-hidden /> : <div className="hero-tint" />}
      </div>
      <div className="hero-shade" />

      <div className="hero-inner">
        <div className="hero-copy" key={item.id}>
          <span className="eyebrow">Aurora 精选</span>
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
          <p className="hero-desc">{item.desc || '这段影片还没有简介，按确认键查看详情。'}</p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn primary"
              data-nav
              data-autofocus="1"
              onClick={() => onPlay(item)}
            >
              <PlayIcon width={16} height={16} />
              立即播放
            </button>
            <button type="button" className="btn ghost" data-nav onClick={() => onOpen(item)}>
              <InfoIcon width={16} height={16} />
              详情
            </button>
          </div>
        </div>

        <div className="hero-art" key={`art-${item.id}`}>
          <Artwork item={item} size="hero" />
        </div>
      </div>

      {list.length > 1 ? (
        <div className="hero-dots">
          {list.map((dot, i) => (
            <button
              key={dot.id}
              type="button"
              aria-label={`切换到 ${dot.name}`}
              className={`hero-dot ${i === index ? 'is-on' : ''}`}
              data-nav
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </header>
  )
}

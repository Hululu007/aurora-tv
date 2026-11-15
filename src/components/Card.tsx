import { useRef } from 'react'
import { focusByHover } from '../core/nav'
import type { CatalogItem } from '../core/types'
import { Artwork } from './Artwork'

interface CardProps {
  item: CatalogItem
  onOpen: (item: CatalogItem) => void
  progress?: number
  index?: number
}

export function Card({ item, onOpen, progress, index = 0 }: CardProps) {
  const ref = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={ref}
      type="button"
      className="card"
      data-nav
      onPointerEnter={() => ref.current && focusByHover(ref.current)}
      onFocus={() => ref.current && focusByHover(ref.current)}
      onClick={() => onOpen(item)}
      style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
    >
      <Artwork item={item} />
      {typeof progress === 'number' && progress > 0 ? (
        <div className="card-progress">
          <span style={{ width: `${Math.min(100, Math.max(2, progress * 100))}%` }} />
        </div>
      ) : null}
      <div className="card-meta">
        <div className="card-name">{item.name}</div>
        <div className="card-sub">
          {[item.typeName, item.year, item.score ? `${item.score} 分` : undefined]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
    </button>
  )
}

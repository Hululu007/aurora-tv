import { useState } from 'react'
import type { CatalogItem } from '../core/types'
import { paletteFromString } from '../core/format'
import { cx } from '../core/format'

interface ArtworkProps {
  item: CatalogItem
  className?: string
  size?: 'card' | 'hero' | 'detail'
}

export function Artwork({ item, className, size = 'card' }: ArtworkProps) {
  const [broken, setBroken] = useState(false)
  const palette = item.palette ?? paletteFromString(item.name)
  const showImage = Boolean(item.poster) && !broken

  return (
    <div className={cx('poster', className)}>
      {showImage ? (
        <img
          src={item.poster}
          alt={item.name}
          loading="lazy"
          draggable={false}
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="poster-gen" style={tintStyle(palette)}>
          <div className="pg-top">
            <span>Aurora</span>
            <span>{item.year ?? '2025'}</span>
          </div>
          <div className="pg-title" style={size === 'hero' ? { fontSize: 34 } : undefined}>
            {item.name}
          </div>
          <div className="pg-sub">
            {item.typeName ?? '影片'}
            {item.remarks ? ` · ${item.remarks}` : ''}
          </div>
        </div>
      )}

      {item.score && <span className="poster-rating">{item.score}</span>}
      {item.remarks && showImage && <span className="poster-tag">{item.remarks}</span>}
    </div>
  )
}

export function tintStyle(palette: [string, string, string]) {
  return {
    '--c1': palette[0],
    '--c2': palette[1],
    '--c3': palette[2],
  } as React.CSSProperties
}

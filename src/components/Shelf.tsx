import type { CatalogItem, Row } from '../core/types'
import { Card } from './Card'

interface ShelfProps {
  row: Row
  onOpen: (item: CatalogItem) => void
  progressOf?: (item: CatalogItem) => number | undefined
  delay?: number
}

export function Shelf({ row, onOpen, progressOf, delay = 0 }: ShelfProps) {
  if (!row.items.length) return null

  return (
    <section className="shelf" style={{ animationDelay: `${delay}ms` }}>
      <div className="shelf-head">
        <h2 className="shelf-title">{row.title}</h2>
        {row.subtitle ? <span className="shelf-sub">{row.subtitle}</span> : null}
      </div>
      <div className="shelf-track">
        {row.items.map((item, index) => (
          <Card
            key={`${row.key}-${item.id}-${index}`}
            item={item}
            index={index}
            onOpen={onOpen}
            progress={progressOf?.(item)}
          />
        ))}
      </div>
    </section>
  )
}

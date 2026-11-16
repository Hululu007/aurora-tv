import { useCallback, useEffect, useRef, useState } from 'react'
import type { CatalogItem, Site, VodClass } from '../core/types'
import {
  CATEGORIES,
  categoryDef,
  fetchCategoryItems,
  type CategoryId,
} from '../core/categories'
import { fetchClasses } from '../core/tvbox'
import { getProxy } from '../core/net'
import { Card } from '../components/Card'
import { RefreshIcon } from '../components/Icons'

interface CategoryViewProps {
  site: Site | null
  demo: boolean
  onOpen: (item: CatalogItem) => void
  onOpenSources: () => void
}

export function CategoryView({ site, demo, onOpen, onOpenSources }: CategoryViewProps) {
  const [active, setActive] = useState<CategoryId>('movie')
  const [items, setItems] = useState<CatalogItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const classesRef = useRef<VodClass[]>([])
  const ticketRef = useRef(0)
  const siteKey = site?.key ?? 'demo'
  const def = categoryDef(active)

  useEffect(() => {
    classesRef.current = []
  }, [siteKey])

  const load = useCallback(
    async (nextPage: number, replace: boolean, category: CategoryId) => {
      const ticket = ++ticketRef.current
      if (replace) {
        setLoading(true)
        setError(null)
      } else {
        setMore(true)
      }

      try {
        const proxy = getProxy()
        if (!demo && site && !classesRef.current.length) {
          classesRef.current = await fetchClasses(site.api, proxy)
        }
        const list = await fetchCategoryItems(
          site,
          categoryDef(category),
          classesRef.current,
          nextPage,
          demo,
          proxy,
        )
        if (ticket !== ticketRef.current) return

        setItems((previous) => {
          if (replace) return list
          const seen = new Set(previous.map((item) => item.id))
          return [...previous, ...list.filter((item) => !seen.has(item.id))]
        })
        setPage(nextPage)
        setHasMore(list.length >= 10)
      } catch (err) {
        if (ticket === ticketRef.current) {
          setError((err as Error)?.message || '分类加载失败')
        }
      } finally {
        if (ticket === ticketRef.current) {
          setLoading(false)
          setMore(false)
        }
      }
    },
    [demo, site],
  )

  useEffect(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    void load(1, true, active)
    return () => {
      ticketRef.current += 1
    }
  }, [active, siteKey, load])

  const emptyText =
    active === 'ai'
      ? '当前站点没有「AI短剧」分类，去片库换一个站点试试。'
      : active === 'short'
        ? '当前站点没有「短剧」分类，去片库换一个站点试试。'
        : '当前站点这个分类没有返回内容，换一个分类或站点试试。'

  return (
    <section className="category-page">
      <header className="category-head">
        <div>
          <span className="eyebrow">浏览</span>
          <h1>分类</h1>
          <p>{demo ? '演示片库' : site?.name ?? '未连接站点'}</p>
        </div>
        <button type="button" className="btn ghost" data-nav onClick={onOpenSources}>
          <RefreshIcon width={15} height={15} />
          换源
        </button>
      </header>

      <div className="category-tabs" role="tablist" aria-label="分类">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={category.id === active}
            className={`category-tab ${category.id === active ? 'is-active' : ''}`}
            data-nav
            onClick={() => setActive(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="category-body">
        {loading ? (
          <div className="category-grid">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="skel skel-card category-skel" />
            ))}
          </div>
        ) : error ? (
          <div className="empty">
            <h3>分类加载失败</h3>
            <p>{error}</p>
            <button
              type="button"
              className="btn primary"
              data-nav
              onClick={() => void load(1, true, active)}
            >
              重试
            </button>
          </div>
        ) : items.length ? (
          <>
            <div className="category-grid">
              {items.map((item, index) => (
                <Card key={`${item.id}-${index}`} item={item} index={index} onOpen={onOpen} />
              ))}
            </div>
            {hasMore ? (
              <div className="category-more">
                <button
                  type="button"
                  className="btn ghost"
                  data-nav
                  disabled={more}
                  onClick={() => void load(page + 1, false, active)}
                >
                  {more ? '加载中…' : '加载更多'}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="empty">
            <h3>暂无「{def.label}」内容</h3>
            <p>{emptyText}</p>
            <button type="button" className="btn ghost" data-nav onClick={onOpenSources}>
              切换片源
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

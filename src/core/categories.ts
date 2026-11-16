import type { CatalogItem, Site, VodClass } from './types'
import { fetchList, toItem } from './tvbox'
import { DEMO_ROWS } from './demo'

export type CategoryId = 'movie' | 'tv' | 'anime' | 'short' | 'ai' | 'variety'

export interface CategoryDef {
  id: CategoryId
  label: string
  demoTypes: string[]
  match: (className: string) => boolean
}

const hasAny = (name: string, words: string[]) => words.some((word) => name.includes(word))

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'movie',
    label: '电影',
    demoTypes: ['电影'],
    match: (name) =>
      hasAny(name, [
        '电影',
        '动作片',
        '喜剧片',
        '爱情片',
        '科幻片',
        '恐怖片',
        '战争片',
        '剧情片',
        '奇幻片',
        '冒险片',
        '犯罪片',
        '悬疑片',
        '灾难片',
        '伦理片',
      ]),
  },
  {
    id: 'tv',
    label: '电视剧',
    demoTypes: ['剧集'],
    match: (name) =>
      hasAny(name, [
        '电视剧',
        '连续剧',
        '国产剧',
        '香港剧',
        '韩国剧',
        '欧美剧',
        '台湾剧',
        '日本剧',
        '海外剧',
        '泰国剧',
      ]),
  },
  {
    id: 'anime',
    label: '动漫',
    demoTypes: ['动漫'],
    match: (name) => hasAny(name, ['动漫', '动画']),
  },
  {
    id: 'short',
    label: '短剧',
    demoTypes: [],
    match: (name) => name.includes('短剧') && !/ai/i.test(name),
  },
  {
    id: 'ai',
    label: '动漫短剧',
    demoTypes: [],
    match: (name) => /动漫短剧|ai\s*短剧|ai短剧/i.test(name),
  },
  {
    id: 'variety',
    label: '综艺',
    demoTypes: ['综艺'],
    match: (name) => name.includes('综艺'),
  },
]

export function categoryDef(id: CategoryId): CategoryDef {
  return CATEGORIES.find((item) => item.id === id) ?? CATEGORIES[0]
}

export function classesForCategory(classes: VodClass[], def: CategoryDef): VodClass[] {
  return classes.filter((item) => def.match(String(item.type_name))).slice(0, 4)
}

export type SortKey = 'default' | 'time' | 'score' | 'hits' | 'heat'

export const SORTS: Array<{ id: SortKey; label: string }> = [
  { id: 'default', label: '默认' },
  { id: 'time', label: '时间' },
  { id: 'score', label: '评分' },
  { id: 'hits', label: '人气' },
  { id: 'heat', label: '热度' },
]

function timeValue(item: CatalogItem): number {
  if (!item.updatedAt) return 0
  const parsed = Date.parse(item.updatedAt)
  if (Number.isFinite(parsed)) return parsed
  const numeric = Number(item.updatedAt)
  return Number.isFinite(numeric) ? numeric * 1000 : 0
}

export function sortCategoryItems(items: CatalogItem[], sort: SortKey): CatalogItem[] {
  if (sort === 'default' || items.length < 2) return items

  const value = (item: CatalogItem): number => {
    if (sort === 'time') return timeValue(item)
    if (sort === 'score') return Number.parseFloat(item.score ?? '0') || 0
    if (sort === 'hits') return item.hits ?? 0
    return item.hitsDay || item.hits || 0
  }

  return [...items].sort((a, b) => value(b) - value(a))
}

export async function fetchCategoryItems(
  site: Site | null,
  def: CategoryDef,
  classes: VodClass[],
  page: number,
  demo: boolean,
  proxy?: string,
): Promise<CatalogItem[]> {
  if (demo) {
    return DEMO_ROWS.flatMap((row) => row.items)
      .filter((item) => def.demoTypes.includes(item.typeName ?? ''))
      .slice(0, 60)
  }
  if (!site) return []

  const matched = classesForCategory(classes, def)
  if (!matched.length) return []

  const batches = await Promise.all(
    matched.map((cls) => fetchList(site.api, cls.type_id, page, proxy).catch(() => [])),
  )

  const seen = new Set<string>()
  const items: CatalogItem[] = []
  for (const vod of batches.flat()) {
    const item = toItem(vod, site)
    if (!item.id || seen.has(item.id)) continue
    seen.add(item.id)
    items.push(item)
  }
  return items
}

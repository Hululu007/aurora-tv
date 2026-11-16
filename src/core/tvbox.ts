import { getText, mediaUrl, parseLooseJson } from './net'
import type {
  CatalogItem,
  MultiConfig,
  MultiUrl,
  ParseEndpoint,
  PlayGroup,
  RawConfig,
  RawSite,
  Site,
  Vod,
  VodClass,
} from './types'
import { cleanSiteName, isMediaUrl, stripHtml } from './format'

const CACHE_PREFIX = 'aurora.cache.'
const CACHE_TTL = 1000 * 60 * 60 * 3

interface CacheEntry<T> {
  at: number
  value: T
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() - entry.at > CACHE_TTL) return null
    return entry.value
  } catch {
    return null
  }
}

function writeCache<T>(key: string, value: T) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), value }))
  } catch {
    /* 超过配额时忽略 */
  }
}

export async function loadMulti(url: string, proxy?: string): Promise<MultiUrl[]> {
  const cached = readCache<MultiUrl[]>(`multi:${url}`)
  if (cached?.length) return cached
  const text = await getText(url, { proxy })
  const data = parseLooseJson(text) as MultiConfig
  const list = (data.urls ?? [])
    .filter((u): u is MultiUrl => Boolean(u && u.url))
    .map((u) => ({ name: u.name || u.url, url: u.url }))
  if (!list.length) throw new Error('这个配置里没有 urls 列表')
  writeCache(`multi:${url}`, list)
  return list
}

export async function loadSourceConfig(url: string, proxy?: string): Promise<RawConfig> {
  const cached = readCache<RawConfig>(`source:${url}`)
  if (cached) return cached
  const text = await getText(url, { proxy, timeout: 20000 })
  const data = parseLooseJson(text) as RawConfig
  if (!data || typeof data !== 'object') throw new Error('源配置格式不正确')
  writeCache(`source:${url}`, data)
  return data
}

export function toSites(config: RawConfig, sourceIndex: number): Site[] {
  const sites = (config.sites ?? []) as RawSite[]
  return sites
    .filter((site) => {
      const type = Number(site.type)
      const api = String(site.api ?? '')
      return type === 1 && /^https?:\/\//i.test(api)
    })
    .map((site) => ({
      key: `${sourceIndex}::${site.key}`,
      name: cleanSiteName(site.name),
      api: String(site.api),
      searchable: Number(site.searchable ?? 0) === 1 || Number(site.quickSearch ?? 0) === 1,
      sourceIndex,
    }))
    .filter((site) => site.name && site.api)
}

export function statsOf(config: RawConfig) {
  const sites = config.sites ?? []
  const cms = sites.filter((s) => Number(s.type) === 1).length
  const spider = sites.filter((s) => Number(s.type) === 3).length
  return { total: sites.length, cms, spider }
}

function buildUrl(api: string, params: Record<string, string | number | undefined>): string {
  let base = api.trim()
  base = base.replace(/[?&]ac=[^&]*/g, '').replace(/[?&]+$/, '')
  if (!base) return api
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value))
  }
  const query = qs.toString()
  if (!query) return base
  return base + (base.includes('?') ? '&' : '?') + query
}

interface CmsResponse {
  class?: Array<{ type_id: number | string; type_name: string }>
  list?: Vod[]
  data?: { class?: VodClass[]; list?: Vod[] }
  msg?: string
}

async function cmsGet(api: string, params: Record<string, string | number | undefined>, proxy?: string) {
  const url = buildUrl(api, params)
  const text = await getText(url, { proxy, timeout: 15000 })
  const json = parseLooseJson(text) as CmsResponse
  if (!json || typeof json !== 'object') throw new Error('接口返回的不是 JSON')
  return json
}

export async function fetchClasses(api: string, proxy?: string): Promise<VodClass[]> {
  try {
    const json = await cmsGet(api, { ac: 'list' }, proxy)
    const classes = json.class ?? json.data?.class ?? []
    if (classes.length) {
      return classes.map((c) => ({ type_id: c.type_id, type_name: c.type_name }))
    }
  } catch {
    /* 有的站点不支持 ac=list，继续用 videolist 探测 */
  }
  const json = await cmsGet(api, { ac: 'videolist', pg: 1 }, proxy)
  const classes = json.class ?? json.data?.class ?? []
  return classes.map((c) => ({ type_id: c.type_id, type_name: c.type_name }))
}

export async function fetchList(
  api: string,
  typeId: string | number | undefined,
  page = 1,
  proxy?: string,
): Promise<Vod[]> {
  const json = await cmsGet(
    api,
    { ac: 'videolist', t: typeId, pg: page },
    proxy,
  )
  return json.list ?? json.data?.list ?? []
}

export async function fetchDetail(
  api: string,
  id: string | number,
  proxy?: string,
): Promise<Vod | null> {
  const json = await cmsGet(api, { ac: 'videolist', ids: id }, proxy)
  const list = json.list ?? json.data?.list ?? []
  return list[0] ?? null
}

export async function searchSite(api: string, keyword: string, proxy?: string): Promise<Vod[]> {
  const json = await cmsGet(api, { ac: 'videolist', wd: keyword }, proxy)
  return json.list ?? json.data?.list ?? []
}

export function parsePlayGroups(vod: Vod): PlayGroup[] {
  const froms = String(vod.vod_play_from ?? '')
    .split('$$$')
    .map((s) => s.trim())
  const blobs = String(vod.vod_play_url ?? '').split('$$$')
  const groups: PlayGroup[] = []

  blobs.forEach((blob, index) => {
    const episodes = blob
      .split('#')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        const cut = segment.indexOf('$')
        if (cut < 0) return { name: segment, url: segment }
        return { name: segment.slice(0, cut), url: segment.slice(cut + 1) }
      })
      .filter((ep) => Boolean(ep.url))

    if (episodes.length) {
      groups.push({ name: froms[index] || `线路 ${index + 1}`, episodes })
    }
  })

  return groups
}

function tidyRemarks(remarks?: string): string | undefined {
  if (!remarks) return undefined
  const counted = remarks.match(/连载到\s*(\d+)\s*集/)
  if (counted) return `更新至 ${counted[1]} 集`
  const cleaned = remarks
    .replace(/^(连载中|更新中|已完结)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || undefined
}

export function toItem(vod: Vod, site?: Site): CatalogItem {
  return {
    id: String(vod.vod_id ?? ''),
    name: vod.vod_name ?? '未命名',
    poster: vod.vod_pic ? mediaUrl(vod.vod_pic) : undefined,
    remarks: tidyRemarks(vod.vod_remarks),
    year: vod.vod_year,
    area: vod.vod_area,
    score: vod.vod_score !== undefined ? String(vod.vod_score) : undefined,
    typeName: vod.type_name,
    desc: stripHtml(vod.vod_content),
    actor: vod.vod_actor,
    director: vod.vod_director,
    siteKey: site?.key,
    api: site?.api,
  }
}

const ROW_ORDER = ['电影', '电视剧', '剧集', '连续剧', '动漫', '综艺', '纪录片', '短剧', '体育']

export function pickRowClasses(classes: VodClass[], limit = 6): VodClass[] {
  const seen = new Set<string>()
  const picked: VodClass[] = []
  for (const keyword of ROW_ORDER) {
    const found = classes.find(
      (c) => String(c.type_name).includes(keyword) && !seen.has(String(c.type_id)),
    )
    if (found) {
      picked.push(found)
      seen.add(String(found.type_id))
    }
    if (picked.length >= limit) break
  }
  for (const c of classes) {
    if (picked.length >= limit) break
    if (seen.has(String(c.type_id))) continue
    picked.push(c)
    seen.add(String(c.type_id))
  }
  return picked
}

export async function buildRows(site: Site, proxy?: string): Promise<{ rows: Array<{ key: string; title: string; items: CatalogItem[] }>; classes: VodClass[] }> {
  const classes = await fetchClasses(site.api, proxy)
  const picks = pickRowClasses(classes, 10)
  const results = await Promise.all(
    picks.map(async (cls) => {
      try {
        const list = await fetchList(site.api, cls.type_id, 1, proxy)
        const pretty = String(cls.type_name).split(/[\/|｜]/).filter(Boolean).pop() ?? cls.type_name
        return {
          key: String(cls.type_id),
          title: pretty.trim(),
          items: list.map((v) => toItem(v, site)).filter((i) => i.id),
        }
      } catch {
        return { key: String(cls.type_id), title: cls.type_name, items: [] }
      }
    }),
  )

  const nonEmpty = results.filter((row) => row.items.length > 0)
  // 有些站点给的是“电影片/动漫片”这种空分类，优先保留内容较多的分类
  const rich = nonEmpty.filter((row) => row.items.length >= 4)
  let rows = (rich.length >= 2 ? rich : nonEmpty).slice(0, 5)

  // 有些站点按分类取不到数据，但“最新更新”总有内容：拉两页并按类型拆成多行
  if (rows.length < 2) {
    try {
      const batches = await Promise.all(
        [1, 2].map((page) => fetchList(site.api, undefined, page, proxy).catch(() => [])),
      )
      const seen = new Set<string>()
      const items: CatalogItem[] = []
      for (const vod of batches.flat()) {
        const item = toItem(vod, site)
        if (!item.id || seen.has(item.id)) continue
        seen.add(item.id)
        items.push(item)
      }

      if (items.length) {
        const groups = new Map<string, CatalogItem[]>()
        for (const item of items) {
          const title =
            String(item.typeName ?? '')
              .split(/[\/|｜]/)
              .filter(Boolean)
              .pop()
              ?.trim() || '最新更新'
          const group = groups.get(title) ?? []
          group.push(item)
          groups.set(title, group)
        }

        const grouped = [...groups.entries()]
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 5)
          .map(([title, list]) => ({
            key: `latest-${title}`,
            title,
            items: list.slice(0, 30),
          }))

        if (grouped.length > rows.length) rows = grouped
      }
    } catch {
      /* 忽略 */
    }
  }

  return { rows, classes }
}

/* ------------------------------------------------------------------ *
 * 解析线路（TVBox parses）：把网页播放地址解析成 m3u8 / mp4 直链
 * ------------------------------------------------------------------ */

export function normalizeParses(config: RawConfig): ParseEndpoint[] {
  const parses = Array.isArray(config.parses) ? config.parses : []
  return parses
    .filter((item) => item && typeof item === 'object' && /^https?:\/\//i.test(String(item.url ?? '')))
    .map((item) => ({
      name: item.name || '解析线路',
      type: Number(item.type ?? 0),
      url: String(item.url),
      flags: Array.isArray(item.ext?.flag) ? item.ext!.flag!.map(String) : [],
    }))
}

/** 从解析接口的返回里提取第一个可播放直链 */
function extractMediaUrl(text: string): string | null {
  const decoded = text.replace(/\\\//g, '/').replace(/\\u002F/g, '/')

  const direct = decoded.match(
    /https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?/i,
  )
  if (direct) return direct[0]

  try {
    const json = JSON.parse(decoded) as Record<string, unknown>
    const candidates = [
      json.url,
      json.playurl,
      json.playUrl,
      (json.data as Record<string, unknown>)?.url,
      (json.data as Record<string, unknown>)?.playurl,
      json.data,
    ]
    for (const value of candidates) {
      if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value
    }
  } catch {
    /* 不是 JSON，忽略 */
  }
  return null
}

/**
 * 依次尝试配置里的解析接口，把非直链地址解析成可播放地址。
 * 全部失败时原样返回，由播放器给出错误提示。
 */
export async function resolveParseUrl(
  rawUrl: string,
  parses: ParseEndpoint[],
  proxy?: string,
): Promise<string> {
  if (isMediaUrl(rawUrl)) return rawUrl
  if (!/^https?:\/\//i.test(rawUrl)) return rawUrl
  if (!parses.length) return rawUrl

  const ordered = [...parses].sort((a, b) => {
    const score = (item: ParseEndpoint) => (item.type === 1 ? 2 : item.type === 0 ? 1 : 0)
    return score(b) - score(a)
  })

  for (const parse of ordered.slice(0, 5)) {
    try {
      const target = parse.url + encodeURIComponent(rawUrl)
      const text = await getText(target, { proxy, timeout: 9000 })
      const found = extractMediaUrl(text)
      if (found) return found
    } catch {
      /* 换下一条解析线路 */
    }
  }

  return rawUrl
}

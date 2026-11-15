import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  CatalogItem,
  MultiUrl,
  ParseEndpoint,
  PlayGroup,
  Row,
  SearchHit,
  Site,
} from '../core/types'
import type { Settings } from '../core/settings'
import { describeError, setProxy } from '../core/net'
import {
  buildRows,
  fetchDetail,
  loadMulti,
  loadSourceConfig,
  normalizeParses,
  parsePlayGroups,
  resolveParseUrl,
  searchSite,
  toItem,
  toSites,
} from '../core/tvbox'
import { DEMO_HERO, DEMO_ROWS } from '../core/demo'

export interface Catalog {
  phase: 'loading' | 'ready' | 'error'
  demo: boolean
  error: string | null
  sources: MultiUrl[]
  sourceIndex: number
  sites: Site[]
  site: Site | null
  rows: Row[]
  hero: CatalogItem[]
  parses: ParseEndpoint[]
  booting: boolean
  boot: () => void
  selectSource: (index: number) => Promise<void>
  selectSite: (site: Site) => Promise<void>
  reload: () => void
  enableDemo: () => void
  addSite: (name: string, api: string) => Promise<void>
  search: (keyword: string) => Promise<SearchHit[]>
  loadGroups: (item: CatalogItem) => Promise<PlayGroup[]>
  resolvePlay: (url: string) => Promise<string>
}

const LAST_SITE_KEY = 'aurora.lastSite'

function pickHero(rows: Row[]): CatalogItem[] {
  const seen = new Set<string>()
  const picks: CatalogItem[] = []
  for (const row of rows) {
    for (const item of row.items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      picks.push(item)
      if (picks.length >= 5) return picks
    }
  }
  return picks
}

/** 这些站点在常见网络环境下比较稳定，优先探测能明显加快首屏 */
const KNOWN_GOOD_HOSTS = ['lzizy1.com', 'huyaapi.com', 'bfzyapi.com', 'taopianapi.com', 'wogg.link']

function rankSites(sites: Site[], preferredKey: string): Site[] {
  const score = (site: Site) => {
    let value = 0
    if (site.key === preferredKey) value -= 100
    try {
      const host = new URL(site.api).host
      if (KNOWN_GOOD_HOSTS.some((known) => host.includes(known))) value -= 50
    } catch {
      /* ignore */
    }
    if (site.api.startsWith('https://')) value -= 5
    if (site.searchable) value -= 3
    return value
  }
  return [...sites].sort((a, b) => score(a) - score(b))
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('站点响应超时')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

export function useCatalog(settings: Settings): Catalog {
  const [phase, setPhase] = useState<Catalog['phase']>('loading')
  const [demo, setDemo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sources, setSources] = useState<MultiUrl[]>([])
  const [sourceIndex, setSourceIndex] = useState(settings.data.sourceIndex ?? 0)
  const [sites, setSites] = useState<Site[]>([])
  const [site, setSite] = useState<Site | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [hero, setHero] = useState<CatalogItem[]>([])
  const [parses, setParses] = useState<ParseEndpoint[]>([])
  const [booting, setBooting] = useState(true)
  const runId = useRef(0)

  const gotoDemo = useCallback(() => {
    setDemo(true)
    setPhase('ready')
    setRows(DEMO_ROWS)
    setHero(DEMO_HERO)
    setBooting(false)
  }, [])

  const commitRows = useCallback((target: Site, builtRows: Row[]) => {
    setRows(builtRows)
    setHero(pickHero(builtRows))
    setSite(target)
    setSites((current) => (current.some((s) => s.key === target.key) ? current : [target, ...current]))
    setDemo(false)
    setPhase('ready')
    setError(null)
  }, [])

  /** 依次探测站点，返回第一个真正有内容的 */
  const activateFirstWorking = useCallback(
    async (candidates: Site[], proxy: string): Promise<Site> => {
      const preferred = settings.data.siteKey || localStorage.getItem(LAST_SITE_KEY) || ''
      const ordered = rankSites(candidates, preferred).slice(0, 8)
      const failures: string[] = []

      for (const candidate of ordered) {
        try {
          const { rows: builtRows } = await withTimeout(buildRows(candidate, proxy), 9000)
          if (!builtRows.length) {
            failures.push(`${candidate.name} 无内容`)
            continue
          }
          localStorage.setItem(LAST_SITE_KEY, candidate.key)
          commitRows(candidate, builtRows)
          return candidate
        } catch (err) {
          failures.push(`${candidate.name}: ${describeError(err)}`)
        }
      }

      throw new Error(
        `试了 ${ordered.length} 个站点都没有可用内容。${failures.slice(0, 2).join('；')}。` +
          '可以在「片源管理」里换一个源，或先看演示片库。',
      )
    },
    [commitRows, settings.data.siteKey],
  )

  const boot = useCallback(() => {
    const ticket = ++runId.current
    const proxy = settings.data.proxy
    setProxy(proxy)
    setBooting(true)
    setError(null)
    setPhase('loading')

    if (settings.data.mode === 'demo') {
      gotoDemo()
      return
    }

    void (async () => {
      try {
        const list = await loadMulti(settings.data.configUrl, proxy)
        if (ticket !== runId.current) return
        setSources(list)

        const wanted = Math.min(Math.max(0, settings.data.sourceIndex ?? 0), list.length - 1)
        const lastSource = Number(localStorage.getItem('aurora.lastSource'))
        const order: number[] = []
        const push = (index: number) => {
          if (index >= 0 && index < list.length && !order.includes(index)) order.push(index)
        }
        if (settings.data.siteKey) {
          const keyed = Number(settings.data.siteKey.split('::')[0])
          if (Number.isInteger(keyed)) push(keyed)
        }
        if (!settings.data.siteKey && Number.isInteger(lastSource)) push(lastSource)
        push(wanted)
        for (let i = 0; i < list.length; i += 1) push(i)

        const triedSources = order.slice(0, 4)
        const combined: Site[] = []
        const failures: string[] = []

        for (const index of triedSources) {
          if (ticket !== runId.current) return
          try {
            const config = await withTimeout(loadSourceConfig(list[index].url, proxy), 14000)
            if (ticket !== runId.current) return
            const supported = toSites(config, index)
            if (!supported.length) {
              failures.push(`${list[index].name} 无 CMS 站点`)
              continue
            }
            combined.push(...supported)
            setSites(supported)
            setSourceIndex(index)
          } catch (err) {
            failures.push(`${list[index].name}: ${describeError(err)}`)
          }
        }

        if (!combined.length) {
          throw new Error(
            `自动探测的 ${triedSources.length} 个源里没有可直接播放的站点。${failures[0] ?? ''}`,
          )
        }

        const chosen = await activateFirstWorking(combined, proxy)
        setSources(list)
        setSourceIndex(chosen.sourceIndex)
        const chosenConfig = await withTimeout(
          loadSourceConfig(list[chosen.sourceIndex].url, proxy),
          14000,
        ).catch(() => null)
        if (chosenConfig) {
          setSites(toSites(chosenConfig, chosen.sourceIndex))
          setParses(normalizeParses(chosenConfig))
        }
        localStorage.setItem('aurora.lastSource', String(chosen.sourceIndex))
      } catch (err) {
        if (ticket !== runId.current) return
        const message = describeError(err)
        setError(message)
        gotoDemo()
        setPhase('error')
      } finally {
        if (ticket === runId.current) setBooting(false)
      }
    })()
  }, [
    activateFirstWorking,
    gotoDemo,
    settings.data.configUrl,
    settings.data.mode,
    settings.data.proxy,
    settings.data.siteKey,
    settings.data.sourceIndex,
  ])

  useEffect(() => {
    boot()
    // 仅在配置变化时重新启动
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data.configUrl, settings.data.mode, settings.data.proxy, settings.data.sourceIndex])

  const selectSource = useCallback(
    async (index: number) => {
      const proxy = settings.data.proxy
      setProxy(proxy)
      setPhase('loading')
      setError(null)
      setSourceIndex(index)
      const ticket = ++runId.current
      try {
        const list = sources.length ? sources : await loadMulti(settings.data.configUrl, proxy)
        setSources(list)
        const config = await loadSourceConfig(list[index].url, proxy)
        if (ticket !== runId.current) return
        const supported = toSites(config, index)
        setSites(supported)
        if (!supported.length) throw new Error('这个源没有可直接播放的 CMS 站点')
        setParses(normalizeParses(config))
        await activateFirstWorking(supported, proxy)
      } catch (err) {
        if (ticket !== runId.current) return
        setError(describeError(err))
        gotoDemo()
        setPhase('error')
      }
    },
    [activateFirstWorking, gotoDemo, settings.data.configUrl, settings.data.proxy, sources],
  )

  const selectSite = useCallback(
    async (target: Site) => {
      setPhase('loading')
      setError(null)
      try {
        const { rows: builtRows } = await withTimeout(buildRows(target, settings.data.proxy), 16000)
        if (!builtRows.length) throw new Error('这个站点暂时没有返回内容')
        localStorage.setItem(LAST_SITE_KEY, target.key)
        commitRows(target, builtRows)
      } catch (err) {
        setError(describeError(err))
        setPhase(rows.length ? 'ready' : 'error')
        if (!rows.length) gotoDemo()
      }
    },
    [commitRows, gotoDemo, rows.length, settings.data.proxy],
  )

  const addSite = useCallback(
    async (name: string, api: string) => {
      const custom: Site = {
        key: `custom::${name}-${Date.now()}`,
        name,
        api,
        searchable: true,
        sourceIndex: -1,
      }
      setSites((current) => [custom, ...current])
      await selectSite(custom)
    },
    [selectSite],
  )

  const search = useCallback(
    async (keyword: string): Promise<SearchHit[]> => {
      const kw = keyword.trim()
      if (!kw) return []
      if (demo || !site) {
        const all = DEMO_ROWS.flatMap((row) => row.items)
        return all
          .filter((item) => item.name.includes(kw) || (item.desc ?? '').includes(kw))
          .map((item) => ({ item, siteName: '演示片库' }))
      }
      const list = await searchSite(site.api, kw, settings.data.proxy)
      return list.map((vod) => ({ item: toItem(vod, site), siteName: site.name }))
    },
    [demo, settings.data.proxy, site],
  )

  const loadGroups = useCallback(
    async (item: CatalogItem): Promise<PlayGroup[]> => {
      if (item.groups?.length) return item.groups
      if (!item.api) throw new Error('这个条目没有可用的站点接口')
      const vod = await fetchDetail(item.api, item.id, settings.data.proxy)
      if (!vod) throw new Error('站点没有返回详情')
      const groups = parsePlayGroups(vod)
      if (!groups.length) throw new Error('该站点需要专用播放解析器，当前版本暂不支持这条线路')

      const playable = groups
        .map((group) => ({
          ...group,
          episodes: group.episodes.filter((ep) => /^https?:\/\//i.test(ep.url)),
        }))
        .filter((group) => group.episodes.length > 0)
        .sort((a, b) => scoreGroup(b) - scoreGroup(a))

      if (!playable.length) {
        throw new Error('播放地址不是直链（需要网页解析），当前版本暂不支持；换一个站点试试')
      }
      return playable
    },
    [settings.data.proxy],
  )

  const reload = useCallback(() => boot(), [boot])

  const resolvePlay = useCallback(
    (url: string) => resolveParseUrl(url, parses, settings.data.proxy),
    [parses, settings.data.proxy],
  )

  return {
    phase,
    demo,
    error,
    sources,
    sourceIndex,
    sites,
    site,
    rows,
    hero,
    parses,
    booting,
    boot,
    selectSource,
    selectSite,
    reload,
    enableDemo: gotoDemo,
    addSite,
    search,
    loadGroups,
    resolvePlay,
  }
}

/** 优先选择直链 m3u8 / mp4 更多的线路 */
function scoreGroup(group: PlayGroup): number {
  let score = 0
  for (const episode of group.episodes) {
    if (/\.m3u8(\?|#|$)/i.test(episode.url)) score += 2
    else if (/\.mp4(\?|#|$)/i.test(episode.url)) score += 1
  }
  return score / Math.max(1, group.episodes.length)
}

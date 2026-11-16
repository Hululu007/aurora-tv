import type { HistoryEntry } from './types'
import type { SyncSettings } from './settings'
import { httpRequest } from './net'

/** 三端同步用的播放记录文档 */
export interface SyncDoc {
  app: 'aurora-tv-sync'
  version: 1
  updatedAt: number
  deviceId: string
  history: HistoryEntry[]
}

export interface PullResult {
  doc: SyncDoc | null
  gistId?: string
}

const GIST_FILE = 'aurora-tv-history.json'

export function makeSyncDoc(history: HistoryEntry[], deviceId: string): SyncDoc {
  return {
    app: 'aurora-tv-sync',
    version: 1,
    updatedAt: Date.now(),
    deviceId,
    history: history.slice(0, 60),
  }
}

export function parseSyncDoc(text: string): SyncDoc | null {
  try {
    const doc = JSON.parse(text) as SyncDoc
    if (!doc || doc.app !== 'aurora-tv-sync' || !Array.isArray(doc.history)) return null
    return doc
  } catch {
    return null
  }
}

/**
 * 以 mediaKey 为单位合并：updatedAt 更新的记录胜出；
 * 时间相同则取播放进度更靠后的那条。
 */
export function mergeHistory(local: HistoryEntry[], remote: HistoryEntry[]): HistoryEntry[] {
  const map = new Map<string, HistoryEntry>()

  for (const entry of remote) {
    if (entry?.mediaKey) map.set(entry.mediaKey, entry)
  }

  for (const entry of local) {
    if (!entry?.mediaKey) continue
    const prev = map.get(entry.mediaKey)
    if (!prev) {
      map.set(entry.mediaKey, entry)
      continue
    }

    const prevAt = prev.updatedAt ?? 0
    const nextAt = entry.updatedAt ?? 0
    const winner = nextAt > prevAt || (nextAt === prevAt && entry.position >= prev.position) ? entry : prev

    map.set(entry.mediaKey, {
      ...prev,
      ...winner,
      groups: winner.groups?.length ? winner.groups : prev.groups,
      poster: winner.poster ?? prev.poster,
      palette: winner.palette ?? prev.palette,
      subtitle: winner.subtitle ?? prev.subtitle,
    })
  }

  return [...map.values()]
    .filter((entry) => entry.position > 0)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .slice(0, 60)
}

/* ------------------------------------------------------------------ *
 * 局域网 / 自建同步服务
 * ------------------------------------------------------------------ */

function endpointOf(cfg: SyncSettings): string {
  return cfg.endpoint.trim().replace(/\/+$/, '')
}

function httpUrl(cfg: SyncSettings): string {
  const key = encodeURIComponent(cfg.password.trim() || 'default')
  return `${endpointOf(cfg)}/history?key=${key}`
}

async function pullHttp(cfg: SyncSettings): Promise<PullResult> {
  if (!endpointOf(cfg)) throw new Error('请先填写同步服务器地址')
  const response = await httpRequest(httpUrl(cfg), {
    method: 'GET',
    headers: cfg.password ? { Authorization: `Bearer ${cfg.password}` } : undefined,
  })
  if (response.status === 404) return { doc: null }
  if (!response.ok) throw new Error(`同步服务器返回 HTTP ${response.status}`)
  return { doc: parseSyncDoc(response.text) }
}

async function pushHttp(cfg: SyncSettings, doc: SyncDoc): Promise<{ gistId?: string }> {
  if (!endpointOf(cfg)) throw new Error('请先填写同步服务器地址')
  const response = await httpRequest(httpUrl(cfg), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.password ? { Authorization: `Bearer ${cfg.password}` } : {}),
    },
    body: JSON.stringify(doc),
  })
  if (!response.ok) throw new Error(`同步服务器返回 HTTP ${response.status}`)
  return {}
}

/* ------------------------------------------------------------------ *
 * WebDAV（坚果云 / Nextcloud / AList 等）
 * ------------------------------------------------------------------ */

function webdavFile(cfg: SyncSettings): string {
  const base = endpointOf(cfg)
  if (!base) throw new Error('请先填写 WebDAV 地址')
  return /\.json$/i.test(base) ? base : `${base}/aurora-tv-history.json`
}

function basicAuth(cfg: SyncSettings): Record<string, string> | undefined {
  if (!cfg.username) return undefined
  const raw = `${cfg.username}:${cfg.password}`
  return { Authorization: `Basic ${btoa(unescape(encodeURIComponent(raw)))}` }
}

async function pullWebdav(cfg: SyncSettings): Promise<PullResult> {
  const response = await httpRequest(webdavFile(cfg), {
    method: 'GET',
    headers: { Accept: 'application/json', ...(basicAuth(cfg) ?? {}) },
  })
  if (response.status === 404) return { doc: null }
  if (response.status === 401) throw new Error('WebDAV 认证失败，请检查用户名和应用密码')
  if (!response.ok) throw new Error(`WebDAV 返回 HTTP ${response.status}`)
  return { doc: parseSyncDoc(response.text) }
}

async function pushWebdav(cfg: SyncSettings, doc: SyncDoc): Promise<{ gistId?: string }> {
  const response = await httpRequest(webdavFile(cfg), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(basicAuth(cfg) ?? {}),
    },
    body: JSON.stringify(doc),
  })
  if (!response.ok) throw new Error(`WebDAV 写入失败 HTTP ${response.status}`)
  return {}
}

/* ------------------------------------------------------------------ *
 * GitHub Gist
 * ------------------------------------------------------------------ */

const GITHUB_API = 'https://api.github.com'

function gistHeaders(cfg: SyncSettings): Record<string, string> {
  if (!cfg.token.trim()) throw new Error('请先填写 GitHub Token（需要 gist 权限）')
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${cfg.token.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function pullGist(cfg: SyncSettings): Promise<PullResult> {
  if (!cfg.gistId.trim()) return { doc: null }
  const response = await httpRequest(`${GITHUB_API}/gists/${cfg.gistId.trim()}`, {
    method: 'GET',
    headers: gistHeaders(cfg),
  })
  if (response.status === 404) return { doc: null }
  if (!response.ok) throw new Error(`GitHub 返回 HTTP ${response.status}`)

  const json = JSON.parse(response.text) as {
    files?: Record<string, { content?: string; truncated?: boolean }>
  }
  const file = json.files?.[GIST_FILE] ?? Object.values(json.files ?? {})[0]
  if (!file?.content) return { doc: null }
  return { doc: parseSyncDoc(file.content) }
}

async function pushGist(cfg: SyncSettings, doc: SyncDoc): Promise<{ gistId?: string }> {
  const headers = gistHeaders(cfg)
  const files = { [GIST_FILE]: { content: JSON.stringify(doc, null, 2) } }
  const gistId = cfg.gistId.trim()

  if (gistId) {
    const response = await httpRequest(`${GITHUB_API}/gists/${gistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ files }),
    })
    if (!response.ok) throw new Error(`GitHub 写入失败 HTTP ${response.status}`)
    return { gistId }
  }

  const response = await httpRequest(`${GITHUB_API}/gists`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      description: 'Aurora TV 播放记录',
      public: false,
      files,
    }),
  })
  if (!response.ok) throw new Error(`GitHub 创建 Gist 失败 HTTP ${response.status}`)
  const created = JSON.parse(response.text) as { id?: string }
  if (!created.id) throw new Error('GitHub 没有返回 Gist ID')
  return { gistId: created.id }
}

/* ------------------------------------------------------------------ */

export async function pullHistory(cfg: SyncSettings): Promise<PullResult> {
  switch (cfg.provider) {
    case 'http':
      return pullHttp(cfg)
    case 'webdav':
      return pullWebdav(cfg)
    case 'gist':
      return pullGist(cfg)
    default:
      return { doc: null }
  }
}

export async function pushHistory(
  cfg: SyncSettings,
  doc: SyncDoc,
): Promise<{ gistId?: string }> {
  switch (cfg.provider) {
    case 'http':
      return pushHttp(cfg, doc)
    case 'webdav':
      return pushWebdav(cfg, doc)
    case 'gist':
      return pushGist(cfg, doc)
    default:
      return {}
  }
}

export function providerLabel(provider: SyncSettings['provider']): string {
  return { off: '关闭', http: '局域网', webdav: 'WebDAV', gist: 'Gist' }[provider]
}

/** 统一的网络访问层：浏览器走本地代理，Tauri 走 Rust 原生请求（天然无 CORS） */

type Runtime = {
  proxy: string
  tauri: boolean
}

const runtime: Runtime = {
  proxy: 'http://127.0.0.1:8787',
  tauri:
    typeof window !== 'undefined' &&
    Boolean((window as unknown as Record<string, unknown>).__TAURI_INTERNALS__),
}

export function isTauri() {
  return runtime.tauri
}

export function setProxy(proxy: string) {
  runtime.proxy = proxy.trim()
}

export function getProxy() {
  return runtime.proxy
}

function proxyRoot() {
  return runtime.proxy.replace(/\/+$/, '')
}

export function mediaUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (/^(data:|blob:)/i.test(url)) return url
  if (runtime.tauri) return url
  if (!proxyRoot()) return url
  // 浏览器里的 http 图会被 https 页面拦截，统一让代理转发；https 图也顺带解决防盗链。
  return `${proxyRoot()}/img?url=${encodeURIComponent(url)}`
}

async function fetchWithTimeout(url: string, timeout = 12000): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json, text/plain, */*' },
      cache: 'no-store',
    })
  } finally {
    window.clearTimeout(timer)
  }
}

async function tauriFetch(url: string, referer?: string): Promise<string> {
  const internals = (
    window as unknown as {
      __TAURI_INTERNALS__: {
        invoke: (cmd: string, args: Record<string, unknown>) => Promise<unknown>
      }
    }
  ).__TAURI_INTERNALS__
  const text = await internals.invoke('fetch_text', { url, referer: referer ?? null })
  return String(text)
}

export interface HttpRequestInit {
  method?: string
  headers?: Record<string, string>
  body?: string
  timeout?: number
}

export interface HttpResult {
  status: number
  ok: boolean
  text: string
}

/**
 * 通用 HTTP 请求，供同步功能使用。
 * Tauri 走 Rust 原生请求（无 CORS、可带任意 header / method）；
 * 浏览器直接 fetch，WebDAV 之类不支持 CORS 的服务会失败。
 */
export async function httpRequest(url: string, init: HttpRequestInit = {}): Promise<HttpResult> {
  const method = (init.method ?? 'GET').toUpperCase()

  if (runtime.tauri) {
    const internals = (
      window as unknown as {
        __TAURI_INTERNALS__: {
          invoke: (cmd: string, args: Record<string, unknown>) => Promise<unknown>
        }
      }
    ).__TAURI_INTERNALS__
    const result = (await internals.invoke('http_request', {
      method,
      url,
      headers: init.headers ?? {},
      body: init.body ?? null,
    })) as { status: number; body: string }
    return {
      status: result.status,
      ok: result.status >= 200 && result.status < 300,
      text: result.body,
    }
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), init.timeout ?? 15000)
  try {
    const response = await fetch(url, {
      method,
      headers: init.headers,
      body: init.body,
      signal: controller.signal,
      cache: 'no-store',
    })
    return { status: response.status, ok: response.ok, text: await response.text() }
  } finally {
    window.clearTimeout(timer)
  }
}

export interface FetchOptions {
  timeout?: number
  referer?: string
  /** 覆盖全局代理；传空字符串表示直连 */
  proxy?: string
}

/**
 * 拉取纯文本：Tauri 原生请求 → 本地代理 → 直连（可能被 CORS 拦截）。
 */
export async function getText(url: string, options: FetchOptions = {}): Promise<string> {
  if (runtime.tauri) return tauriFetch(url, options.referer)

  const root = (options.proxy ?? proxyRoot()).replace(/\/+$/, '')
  let proxyError: unknown = null

  if (root) {
    try {
      const res = await fetchWithTimeout(
        `${root}/proxy?url=${encodeURIComponent(url)}`,
        options.timeout ?? 12000,
      )
      if (res.ok) return await res.text()
      proxyError = new Error(`代理返回 HTTP ${res.status}`)
    } catch (error) {
      proxyError = error
    }
  }

  try {
    const res = await fetchWithTimeout(url, options.timeout ?? 12000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } catch (error) {
    const reason =
      error instanceof DOMException && error.name === 'AbortError'
        ? '请求超时'
        : (error as Error)?.message || '网络错误'
    const hint = proxyError
      ? '浏览器直连被 CORS / 防盗链拦截，请先运行 npm run proxy 再刷新。'
      : '请检查网络或代理设置。'
    throw new Error(`${reason}。${hint}`)
  }
}

/** 容忍 TVBox 配置里的 // 注释、/* *\/ 注释与尾逗号 */
export function parseLooseJson(text: string): unknown {
  const cleaned = stripComments(text)
  try {
    return JSON.parse(cleaned)
  } catch {
    return JSON.parse(cleaned.replace(/,\s*([}\]])/g, '$1'))
  }
}

function stripComments(src: string): string {
  let out = ''
  let inString = false
  let quote = ''
  let escaped = false
  let i = 0

  while (i < src.length) {
    const ch = src[i]
    const next = src[i + 1]

    if (inString) {
      out += ch
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === quote) inString = false
      i += 1
      continue
    }

    if (ch === '"' || ch === "'") {
      inString = true
      quote = ch
      out += ch
      i += 1
      continue
    }

    if (ch === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') i += 1
      continue
    }

    if (ch === '/' && next === '*') {
      i += 2
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i += 1
      i += 2
      continue
    }

    out += ch
    i += 1
  }

  return out.replace(/^\uFEFF/, '')
}

export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

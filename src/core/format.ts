export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function stripHtml(input?: string): string {
  if (!input) return ''
  const text = input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

export function shortName(name: string): string {
  return name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim() || name
}

/** 名称里常带 “🎬┃豆瓣┃热播” 这类装饰，去掉后再展示 */
export function cleanSiteName(name: string): string {
  const parts = name.split(/[┃|｜]/).map((p) => p.trim()).filter(Boolean)
  const last = parts[parts.length - 1] || name
  return last.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim() || name
}

export function paletteFromString(input: string): [string, string, string] {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 360
  }
  const h1 = hash
  const h2 = (hash + 42) % 360
  return [`hsl(${h1} 38% 26%)`, `hsl(${h2} 46% 44%)`, `hsl(${h1} 30% 9%)`]
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function humanDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function hashKey(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function isPlayableUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) && /\.(m3u8|mp4|flv|mkv|ts)(\?|#|$)/i.test(url)
}

/** 是否已经是可直接播放的媒体地址（m3u8 / mp4 等） */
export function isMediaUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) && /\.(m3u8|mp4|flv|mkv|ts)(\?|#|$)/i.test(url)
}

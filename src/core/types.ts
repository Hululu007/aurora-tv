/** TVBox / 影视仓 配置与接口的数据结构（只覆盖本项目用到的部分） */

export interface RawSite {
  key: string
  name: string
  type: number
  api?: string
  ext?: unknown
  jar?: string
  searchable?: number | string
  quickSearch?: number | string
  filterable?: number | string
  playerType?: number | string
  style?: { type?: string; ratio?: number }
  categories?: string[]
  hide?: number
}

export interface RawConfig {
  spider?: string
  wallpaper?: string
  warningText?: string
  sites?: RawSite[]
  parses?: RawParse[]
  lives?: unknown[]
  doh?: unknown[]
  rules?: unknown[]
  url?: string
}

export interface RawParse {
  name: string
  type: number
  url: string
  ext?: { flag?: string[]; header?: Record<string, string> }
}

/** 归一化后的解析线路（TVBox parses） */
export interface ParseEndpoint {
  name: string
  type: number
  url: string
  flags: string[]
}

export interface MultiUrl {
  name: string
  url: string
}

export interface MultiConfig {
  urls?: MultiUrl[]
  sites?: RawSite[]
}

export interface Vod {
  vod_id: number | string
  vod_name: string
  vod_pic?: string
  vod_remarks?: string
  vod_year?: string
  vod_area?: string
  vod_actor?: string
  vod_director?: string
  vod_content?: string
  vod_score?: string | number
  vod_hits?: string | number
  vod_hits_day?: string | number
  vod_up?: string | number
  vod_time?: string
  type_name?: string
  vod_play_from?: string
  vod_play_url?: string
}

export interface VodClass {
  type_id: number | string
  type_name: string
}

export interface Episode {
  name: string
  url: string
}

export interface PlayGroup {
  name: string
  episodes: Episode[]
}

/** 统一后的影片条目：演示数据与真实 CMS 数据共用 */
export interface CatalogItem {
  id: string
  name: string
  poster?: string
  remarks?: string
  year?: string
  area?: string
  score?: string
  hits?: number
  hitsDay?: number
  updatedAt?: string
  typeName?: string
  desc?: string
  actor?: string
  director?: string
  /** 演示模式下的渐变海报配色 */
  palette?: [string, string, string]
  /** 演示模式内置的线路 */
  groups?: PlayGroup[]
  /** 真实模式下记录来源站点 */
  siteKey?: string
  api?: string
  /** 继续观看卡片 */
  resume?: boolean
  startTime?: number
  groupIndex?: number
  episodeIndex?: number
  mediaKey?: string
}

export interface Row {
  key: string
  title: string
  subtitle?: string
  items: CatalogItem[]
}

export type View = 'home' | 'category' | 'search' | 'settings'

export interface Site {
  key: string
  name: string
  api: string
  searchable: boolean
  sourceIndex: number
}

export interface PlaybackState {
  title: string
  subtitle?: string
  groups: PlayGroup[]
  groupIndex: number
  episodeIndex: number
  poster?: string
  palette?: [string, string, string]
  /** 用于续播 / 三端同步的稳定标识 */
  mediaKey: string
  startTime?: number
}

export interface HistoryEntry {
  mediaKey: string
  title: string
  subtitle?: string
  poster?: string
  palette?: [string, string, string]
  groupIndex: number
  episodeIndex: number
  position: number
  duration: number
  updatedAt: number
  /** 重新拉起播放所需的线路信息（演示数据可直接复用 groups） */
  groups?: PlayGroup[]
}

export interface SearchHit {
  item: CatalogItem
  siteName: string
}

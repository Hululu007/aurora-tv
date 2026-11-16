import type { Site } from './types'

/**
 * 内置的 5 个苹果 CMS 站点（来自 TVBox Desktop 常用源）。
 * 它们不依赖 tvbox-multi 配置，配置源全挂时也能直接播。
 */
export const BUILTIN_SITES: Site[] = [
  {
    key: 'builtin::dytt',
    name: '电影天堂',
    api: 'https://caiji.dyttzyapi.com/api.php/provide/vod',
    searchable: true,
    sourceIndex: -1,
  },
  {
    key: 'builtin::ffzy',
    name: '非凡资源',
    api: 'https://api.ffzyapi.com/api.php/provide/vod',
    searchable: true,
    sourceIndex: -1,
  },
  {
    key: 'builtin::guangsu',
    name: '光速资源',
    api: 'https://api.guangsuapi.com/api.php/provide/vod',
    searchable: true,
    sourceIndex: -1,
  },
  {
    key: 'builtin::lzi',
    name: '量子资源',
    api: 'https://cj.lziapi.com/api.php/provide/vod',
    searchable: true,
    sourceIndex: -1,
  },
  {
    key: 'builtin::subo',
    name: '素博资源',
    api: 'https://subocaiji.com/api.php/provide/vod',
    searchable: true,
    sourceIndex: -1,
  },
]

export function withBuiltinSites(sites: Site[]): Site[] {
  const keys = new Set(BUILTIN_SITES.map((site) => site.key))
  const apis = new Set(BUILTIN_SITES.map((site) => site.api.replace(/\/+$/, '')))
  return [
    ...BUILTIN_SITES,
    ...sites.filter(
      (site) =>
        !keys.has(site.key) && !apis.has(site.api.replace(/\/+$/, '')),
    ),
  ]
}

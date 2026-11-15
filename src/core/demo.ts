import type { CatalogItem, Row } from './types'

/** 公开的测试流，仅用于演示播放链路（非真实影视内容） */
const TEST_STREAMS = [
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  'https://test-streams.mux.dev/pts_shift/master.m3u8',
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
  'https://test-streams.mux.dev/tos_ismc/main.m3u8',
]

interface Seed {
  name: string
  typeName: string
  year: string
  score: string
  blurb: string
  tint: [string, string, string]
  episodes?: number
  remarks?: string
}

const SEEDS: Seed[] = [
  {
    name: '雾港来信',
    typeName: '电影',
    year: '2025',
    score: '8.9',
    blurb: '一座终年被海雾笼罩的港口城市，邮差在退回的信件里读到了三十年前的失踪案。',
    tint: ['#1d2f4a', '#5b7fa6', '#0a0f18'],
    remarks: '4K HDR',
  },
  {
    name: '星际回响',
    typeName: '电影',
    year: '2024',
    score: '9.1',
    blurb: '深空监听站收到一段来自地球方向的旧信号，而那正是它自己二十年前发出的求救。',
    tint: ['#141a33', '#6b6bd6', '#07060f'],
    remarks: '杜比视界',
  },
  {
    name: '山海之间',
    typeName: '纪录片',
    year: '2025',
    score: '9.4',
    blurb: '四季轮转中的海岸线，记录十二个以海为生的小镇与它们缓慢消失的生活方式。',
    tint: ['#173a35', '#4f9d82', '#07110f'],
    remarks: '8 集全',
  },
  {
    name: '最后一班地铁',
    typeName: '电影',
    year: '2023',
    score: '8.2',
    blurb: '末班车上的七位乘客，在同一节车厢里重复着同一个夜晚。',
    tint: ['#3a2020', '#b7644f', '#120807'],
    remarks: '高分',
  },
  {
    name: '量子花园',
    typeName: '剧集',
    year: '2025',
    score: '8.7',
    blurb: '植物学家发现温室里的一株兰花，会在观测的瞬间改变自己的过去。',
    tint: ['#1e2b1f', '#7fae6b', '#080d08'],
    episodes: 8,
    remarks: '更新至 08',
  },
  {
    name: '北纬三十度',
    typeName: '纪录片',
    year: '2024',
    score: '9.0',
    blurb: '沿着同一条纬线穿越高原、沙漠与海洋，寻找文明留下的共同刻度。',
    tint: ['#3b2f1c', '#c49a5a', '#120d06'],
    episodes: 6,
    remarks: '全 6 集',
  },
  {
    name: '风起长安',
    typeName: '剧集',
    year: '2025',
    score: '8.5',
    blurb: '一封没有署名的密函，把负责修缮城防的年轻匠人卷入了朝堂暗流。',
    tint: ['#33231a', '#c07a4b', '#0e0805'],
    episodes: 12,
    remarks: '独播',
  },
  {
    name: '深海来信',
    typeName: '电影',
    year: '2024',
    score: '8.0',
    blurb: '潜航员在六千米海底听见了敲击声，节奏与母亲的摇篮曲一模一样。',
    tint: ['#102c3b', '#3c9bb5', '#050f14'],
    remarks: '悬疑',
  },
  {
    name: '无声之城',
    typeName: '剧集',
    year: '2023',
    score: '8.8',
    blurb: '整座城市突然失去声音，只有一位调音师还能听见别人心里的独白。',
    tint: ['#26232b', '#8e7fa8', '#0a090d'],
    episodes: 10,
    remarks: '完结',
  },
  {
    name: '夏日回声',
    typeName: '电影',
    year: '2022',
    score: '7.9',
    blurb: '毕业前的最后一个夏天，四个朋友决定把没说完的话录进一盒磁带。',
    tint: ['#3a3320', '#d3b264', '#121006'],
    remarks: '青春',
  },
  {
    name: '夜航船',
    typeName: '剧集',
    year: '2024',
    score: '8.3',
    blurb: '一艘没有目的地的内河客船，每晚靠岸时都会少一名乘客。',
    tint: ['#1a2333', '#5a7899', '#080b12'],
    episodes: 9,
    remarks: '悬疑',
  },
  {
    name: '纸飞机',
    typeName: '动漫',
    year: '2025',
    score: '9.2',
    blurb: '住在天台小屋的女孩，把愿望折成纸飞机，寄往云层之上的城市。',
    tint: ['#25314d', '#8aa7d6', '#0a0e17'],
    episodes: 12,
    remarks: '新番',
  },
  {
    name: '光年之外',
    typeName: '动漫',
    year: '2024',
    score: '8.6',
    blurb: '两个星球的孩子通过一台报废的射电望远镜成为笔友。',
    tint: ['#1b2a3f', '#7fb0c9', '#070d13'],
    episodes: 24,
    remarks: '全 24 话',
  },
  {
    name: '猫的第九封信',
    typeName: '动漫',
    year: '2023',
    score: '9.0',
    blurb: '一只会写信的猫，替小镇居民投递那些说不出口的告别。',
    tint: ['#332a1e', '#c9a06a', '#110d07'],
    episodes: 6,
    remarks: '治愈',
  },
  {
    name: '银河修理铺',
    typeName: '动漫',
    year: '2025',
    score: '8.4',
    blurb: '在废弃空间站开修理铺的祖孙俩，修好过会唱歌的卫星和失忆的机器人。',
    tint: ['#20263f', '#8b8fd1', '#080a12'],
    episodes: 10,
    remarks: '更新中',
  },
  {
    name: '雨林密码',
    typeName: '纪录片',
    year: '2025',
    score: '9.3',
    blurb: '一支科考队深入雨林腹地，用声纹记录那些从未被描述的物种。',
    tint: ['#16301f', '#5fa86a', '#061008'],
    episodes: 4,
    remarks: '4K',
  },
  {
    name: '城市之光',
    typeName: '纪录片',
    year: '2024',
    score: '8.7',
    blurb: '深夜十二点的便利店、末班公交与急诊室，构成城市的另一种呼吸。',
    tint: ['#2f2620', '#b78d61', '#0e0a07'],
    episodes: 5,
    remarks: '人文',
  },
  {
    name: '雪线之上',
    typeName: '纪录片',
    year: '2023',
    score: '9.1',
    blurb: '三位高山向导与他们的最后一次攀登，关于山，也关于放手。',
    tint: ['#28323c', '#9fb4c4', '#0a0e12'],
    remarks: '获奖',
  },
  {
    name: '深夜电台',
    typeName: '剧集',
    year: '2025',
    score: '8.1',
    blurb: '凌晨三点的电台热线，每一通电话都指向同一桩旧案。',
    tint: ['#2b1f2f', '#9c6f9e', '#0d080e'],
    episodes: 8,
    remarks: '本周热播',
  },
  {
    name: '风与麦田',
    typeName: '剧集',
    year: '2022',
    score: '8.9',
    blurb: '返乡青年与祖父关于一块麦田的争执，慢慢变成两代人的和解。',
    tint: ['#3a3220', '#c7a95e', '#110e06'],
    episodes: 10,
    remarks: '口碑',
  },
]

function makeItem(seed: Seed, index: number): CatalogItem {
  const count = seed.episodes ?? 1
  const episodes = Array.from({ length: count }, (_, i) => ({
    name: count === 1 ? '正片' : `第 ${String(i + 1).padStart(2, '0')} 集`,
    url: TEST_STREAMS[(index + i) % TEST_STREAMS.length],
  }))

  return {
    id: `demo-${index}`,
    name: seed.name,
    remarks: seed.remarks,
    year: seed.year,
    score: seed.score,
    typeName: seed.typeName,
    desc: seed.blurb,
    palette: seed.tint,
    siteKey: 'demo',
    groups: [{ name: '高清线路', episodes }],
  }
}

const ITEMS = SEEDS.map(makeItem)

function row(title: string, subtitle: string, types: string[]): Row {
  return {
    key: title,
    title,
    subtitle,
    items: ITEMS.filter((item) => item.typeName && types.includes(item.typeName)),
  }
}

export const DEMO_ROWS: Row[] = [
  row('热门电影', '本周编辑精选', ['电影']),
  row('剧集精选', '一次看个够', ['剧集']),
  row('动漫剧场', '新番与经典', ['动漫']),
  row('纪录片 · 人文地理', '慢下来看看世界', ['纪录片']),
]

export const DEMO_HERO = ITEMS.slice(0, 4)

export function demoRowsWithHistory(extra?: Row): Row[] {
  return extra ? [extra, ...DEMO_ROWS] : DEMO_ROWS
}

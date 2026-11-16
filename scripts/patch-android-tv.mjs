#!/usr/bin/env node
/**
 * 把 tauri android init 生成的工程改成对应端的形态：
 *
 *   APP_VARIANT=phone  → 手机：不锁横屏、不加 Leanback 入口、不挂 banner
 *   APP_VARIANT=tv     → 电视：横屏、Leanback 入口、320×180 banner
 *   两者都允许 http 明文（TVBox 片源大量是 http）
 *
 * 在 CI 里于 `tauri android init` 之后、`tauri android build` 之前执行。
 */
import fs from 'node:fs'
import path from 'node:path'

const variant = (process.env.APP_VARIANT || 'tv').toLowerCase() === 'phone' ? 'phone' : 'tv'
const root = process.cwd()
const androidDir = path.join(root, 'src-tauri', 'gen', 'android', 'app', 'src', 'main')
const manifestPath = path.join(androidDir, 'AndroidManifest.xml')

if (!fs.existsSync(manifestPath)) {
  console.error(`[patch-android] 找不到 ${manifestPath}，请先运行 tauri android init`)
  process.exit(1)
}

let manifest = fs.readFileSync(manifestPath, 'utf8')

// Tauri 模板用 ${usesCleartextTraffic} 占位；固定放开
manifest = manifest.replace(/\$\{usesCleartextTraffic\}/g, 'true')

if (variant === 'tv') {
  // 1) 声明电视能力（不是硬性要求，方便同一包也装手机）
  if (!manifest.includes('android.software.leanback')) {
    manifest = manifest.replace(
      /<manifest\b[^>]*>/,
      (tag) =>
        `${tag}\n    <uses-feature android:name="android.software.leanback" android:required="false" />`,
    )
  }

  // 2) MainActivity 横屏
  manifest = manifest.replace(
    /<activity\b[^>]*android:name="\.MainActivity"[^>]*>/s,
    (tag) => {
      if (tag.includes('android:screenOrientation')) return tag
      return tag.replace(/\s*>$/, '\n            android:screenOrientation="landscape">')
    },
  )

  // 3) Leanback 启动入口
  if (!manifest.includes('LEANBACK_LAUNCHER')) {
    manifest = manifest.replace(
      /<category android:name="android\.intent\.category\.LAUNCHER" \/>/,
      (tag) => `${tag}\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />`,
    )
  }

  // 4) banner + 明文流量
  manifest = manifest.replace(/<application\b[^>]*>/s, (tag) => {
    let out = tag
    if (!out.includes('android:banner')) {
      out = out.replace(/\s*>$/, '\n        android:banner="@drawable/banner"\n        >')
    }
    if (!out.includes('usesCleartextTraffic')) {
      out = out.replace(/\s*>$/, '\n        android:usesCleartextTraffic="true"\n        >')
    }
    return out
  })

  const bannerSource = path.join(root, 'docs', 'screenshots', 'banner.png')
  const bannerDir = path.join(androidDir, 'res', 'drawable')
  if (fs.existsSync(bannerSource)) {
    fs.mkdirSync(bannerDir, { recursive: true })
    fs.copyFileSync(bannerSource, path.join(bannerDir, 'banner.png'))
  }
} else {
  // 手机：去掉模板里给 TV 准备的 Leanback 入口和横屏锁
  manifest = manifest.replace(/\s*<category android:name="android\.intent\.category\.LEANBACK_LAUNCHER" \/>/g, '')
  manifest = manifest.replace(/\s*android:screenOrientation="[^"]*"/g, '')
  manifest = manifest.replace(/\s*android:banner="@[^"]*"/g, '')

  if (!manifest.includes('usesCleartextTraffic')) {
    manifest = manifest.replace(/<application\b[^>]*>/s, (tag) =>
      tag.replace(/\s*>$/, '\n        android:usesCleartextTraffic="true"\n        >'),
    )
  }
}

fs.writeFileSync(manifestPath, manifest)
console.log(
  `[patch-android] variant=${variant}：${variant === 'tv' ? 'leanback / landscape / banner' : 'portrait / no leanback'} / cleartext`,
)

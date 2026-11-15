#!/usr/bin/env node
/**
 * 把 tauri android init 生成的工程改成 Android TV 可用的形态：
 *  - 声明 leanback / 无触摸屏（非必需）
 *  - MainActivity 横屏
 *  - 加入 LEANBACK_LAUNCHER，出现在电视的「应用」行
 *  - 放置 320x180 banner
 *  - 允许 http 明文请求（TVBox 片源大量是 http）
 *
 * 在 CI 里于 `tauri android init` 之后、`tauri android build` 之前执行。
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const androidDir = path.join(root, 'src-tauri', 'gen', 'android', 'app', 'src', 'main')
const manifestPath = path.join(androidDir, 'AndroidManifest.xml')

if (!fs.existsSync(manifestPath)) {
  console.error(`[patch-android] 找不到 ${manifestPath}，请先运行 tauri android init`)
  process.exit(1)
}

let manifest = fs.readFileSync(manifestPath, 'utf8')

// Tauri 模板用 ${usesCleartextTraffic} 占位；TVBox 片源大量是 http，这里固定放开
manifest = manifest.replace(/\$\{usesCleartextTraffic\}/g, 'true')

// 1) uses-feature：电视不是必需条件，手机也能装
if (!manifest.includes('android.software.leanback')) {
  manifest = manifest.replace(
    /<manifest\b[^>]*>/,
    (tag) =>
      `${tag}\n\n    <uses-feature android:name="android.software.leanback" android:required="false" />\n` +
      `    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />`,
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

// 3) 加入 LEANBACK_LAUNCHER（只在第一个 LAUNCHER 之后加一次）
if (!manifest.includes('LEANBACK_LAUNCHER')) {
  manifest = manifest.replace(
    /<category android:name="android\.intent\.category\.LAUNCHER" \/>/,
    (tag) => `${tag}\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />`,
  )
}

// 4) application 上补 banner 与明文流量
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

fs.writeFileSync(manifestPath, manifest)

// 5) banner
const bannerSource = path.join(root, 'docs', 'screenshots', 'banner.png')
const bannerDir = path.join(androidDir, 'res', 'drawable')
if (fs.existsSync(bannerSource)) {
  fs.mkdirSync(bannerDir, { recursive: true })
  fs.copyFileSync(bannerSource, path.join(bannerDir, 'banner.png'))
} else {
  console.warn('[patch-android] 缺少 docs/screenshots/banner.png，跳过 banner')
}

console.log('[patch-android] AndroidManifest 已适配 TV：leanback / landscape / banner / cleartext')

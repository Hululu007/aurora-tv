#!/usr/bin/env node
/**
 * 把 Web 版共享到局域网，给鸿蒙 NEXT / 手机浏览器 / 平板用：
 *
 *   npm run build
 *   npm run share
 *
 * 会同时启动：
 *   - 代理 0.0.0.0:8787（解决 CMS / 图片的 CORS）
 *   - 预览 0.0.0.0:4173（加载 dist）
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

if (!fs.existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('先运行 npm run build 生成 dist/')
  process.exit(1)
}

const proxy = spawn(process.execPath, [path.join(root, 'server', 'proxy.mjs'), '--lan'], {
  stdio: 'inherit',
  cwd: root,
})

const vite = spawn(
  process.execPath,
  [
    path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
    'preview',
    '--configLoader',
    'runner',
    '--host',
    '0.0.0.0',
    '--port',
    '4173',
  ],
  { stdio: 'inherit', cwd: root },
)

const interfaces = os.networkInterfaces()
const addresses = []
for (const list of Object.values(interfaces)) {
  for (const item of list ?? []) {
    if (item.family === 'IPv4' && !item.internal) addresses.push(item.address)
  }
}

console.log('\n[aurora] 手机 / 鸿蒙 NEXT 用浏览器打开：')
for (const ip of addresses) console.log(`  http://${ip}:4173`)
console.log('\n[aurora] 在 App 的「设置 → 片源 → 本地代理」里填：')
for (const ip of addresses) console.log(`  http://${ip}:8787`)
console.log('')

let stopping = false
const stop = (code = 0) => {
  if (stopping) return
  stopping = true
  proxy.kill()
  vite.kill()
  process.exit(code)
}

process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
vite.on('exit', (code) => stop(code ?? 0))
proxy.on('exit', (code) => {
  if (!stopping && code !== 0) console.error(`[aurora] proxy exited with ${code}`)
})

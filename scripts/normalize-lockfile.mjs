#!/usr/bin/env node
/** 把 package-lock.json 里的镜像地址换回官方 npm registry，便于 CI / 海外机器安装。 */
import fs from 'node:fs'

const file = new URL('../package-lock.json', import.meta.url)
const text = fs.readFileSync(file, 'utf8')
const next = text
  .replaceAll('https://registry.npmmirror.com', 'https://registry.npmjs.org')
  .replaceAll('https://registry.npm.taobao.org', 'https://registry.npmjs.org')

if (next !== text) {
  fs.writeFileSync(file, next)
  console.log('[normalize-lockfile] rewritten to registry.npmjs.org')
} else {
  console.log('[normalize-lockfile] already clean')
}

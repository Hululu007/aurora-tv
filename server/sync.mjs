/**
 * Aurora TV 局域网播放记录同步服务
 *
 *   npm run sync
 *
 * 默认 http://0.0.0.0:8788，数据存在 .sync-data/ 下。
 * 可选：
 *   PORT=8788
 *   SYNC_TOKEN=你的密钥     （三端在 App 里填同一个密钥）
 *   DATA_DIR=F:\aurora-data
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.PORT || 8788)
const TOKEN = (process.env.SYNC_TOKEN || '').trim()
const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, '..', '.sync-data')
const MAX_BODY = 2 * 1024 * 1024

fs.mkdirSync(DATA_DIR, { recursive: true })

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Max-Age', '86400')
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function keyOf(url) {
  const raw = (url.searchParams.get('key') || 'default').trim()
  return raw.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 64) || 'default'
}

function authorized(req) {
  if (!TOKEN) return true
  const header = req.headers.authorization || ''
  return header === `Bearer ${TOKEN}`
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  cors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)

  if (url.pathname === '/health') {
    sendJson(res, 200, { ok: true, name: 'aurora-tv-sync', token: Boolean(TOKEN) })
    return
  }

  if (url.pathname !== '/history') {
    sendJson(res, 404, { error: 'not found' })
    return
  }

  if (!authorized(req)) {
    sendJson(res, 401, { error: 'unauthorized' })
    return
  }

  const key = keyOf(url)
  const file = path.join(DATA_DIR, `${key}.json`)

  if (req.method === 'GET') {
    if (!fs.existsSync(file)) {
      sendJson(res, 404, { error: 'no history yet' })
      return
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    })
    fs.createReadStream(file).pipe(res)
    return
  }

  if (req.method === 'PUT') {
    try {
      const body = await readBody(req)
      const doc = JSON.parse(body)
      if (!doc || doc.app !== 'aurora-tv-sync' || !Array.isArray(doc.history)) {
        sendJson(res, 400, { error: 'invalid sync document' })
        return
      }

      const tmp = `${file}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(doc))
      fs.renameSync(tmp, file)
      sendJson(res, 200, { ok: true, key, count: doc.history.length })
      console.log(`[sync] ${key}: ${doc.history.length} records from ${req.socket.remoteAddress}`)
    } catch (error) {
      sendJson(res, 400, { error: error.message })
    }
    return
  }

  sendJson(res, 405, { error: 'method not allowed' })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[aurora] sync server: http://0.0.0.0:${PORT}`)
  console.log(`[aurora] data dir: ${DATA_DIR}`)
  if (TOKEN) console.log('[aurora] token protection: ON')
})

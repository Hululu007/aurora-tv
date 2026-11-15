/**
 * Aurora TV 本地代理（仅浏览器开发/预览时需要）
 *
 *   node server/proxy.mjs
 *
 * 为什么需要它：
 *  - TVBox 的接口与图片基本都不发 CORS 头，浏览器直连会被拦截；
 *  - 部分图片有防盗链，需要带上 Referer / UA。
 * Windows / Android 客户端走 Tauri 原生请求，不依赖这个服务。
 */

import http from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'
const TIMEOUT = 25000

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type,Content-Length')
}

function normalize(target) {
  if (target.startsWith('//')) return 'https:' + target
  return target
}

async function proxy(request, response, { binary }) {
  const requestUrl = new URL(request.url, `http://127.0.0.1:${PORT}`)
  const target = requestUrl.searchParams.get('url')

  if (!target) {
    response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify({ error: 'missing ?url=' }))
    return
  }

  const finalUrl = normalize(target)
  if (!/^https?:\/\//i.test(finalUrl)) {
    response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify({ error: 'only http(s) is supported' }))
    return
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const upstream = await fetch(finalUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        Accept: binary ? 'image/avif,image/webp,image/*,*/*;q=0.8' : 'application/json, text/plain, */*',
        Referer: new URL(finalUrl).origin + '/',
      },
    })

    clearTimeout(timer)

    if (!upstream.ok) {
      response.writeHead(upstream.status, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end(`upstream ${upstream.status}`)
      return
    }

    const contentType = upstream.headers.get('content-type') || (binary ? 'image/jpeg' : 'application/json')

    if (binary) {
      const buffer = Buffer.from(await upstream.arrayBuffer())
      response.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=86400',
      })
      response.end(buffer)
      return
    }

    const text = await upstream.text()
    response.writeHead(200, {
      'Content-Type': contentType.includes('charset') ? contentType : `${contentType}; charset=utf-8`,
      'Cache-Control': 'no-store',
    })
    response.end(text)
  } catch (error) {
    clearTimeout(timer)
    const aborted = error?.name === 'AbortError'
    response.writeHead(aborted ? 504 : 502, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end(aborted ? 'upstream timeout' : `proxy error: ${error?.message ?? error}`)
  }
}

const server = http.createServer(async (request, response) => {
  cors(response)

  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  const requestUrl = new URL(request.url, `http://127.0.0.1:${PORT}`)

  if (requestUrl.pathname === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify({ ok: true, name: 'aurora-tv-proxy', port: PORT }))
    return
  }

  if (requestUrl.pathname === '/proxy' || requestUrl.pathname === '/config') {
    await proxy(request, response, { binary: false })
    return
  }

  if (requestUrl.pathname === '/img') {
    await proxy(request, response, { binary: true })
    return
  }

  response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  response.end(
    [
      'Aurora TV proxy is running.',
      '',
      '  GET /proxy?url=<encoded url>   → 转发 JSON / 文本',
      '  GET /img?url=<encoded url>     → 转发图片（带防盗链 Referer）',
      '  GET /health                    → 健康检查',
      '',
      `  port: ${PORT}`,
    ].join('\n'),
  )
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[aurora] proxy ready at http://127.0.0.1:${PORT}`)
})

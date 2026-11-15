#!/usr/bin/env node
/**
 * 一条命令同时启动本地代理与 Vite 开发服务器。
 *   npm start
 */
import { spawn } from 'node:child_process'
import process from 'node:process'

const isWin = process.platform === 'win32'
const proxy = spawn(process.execPath, ['server/proxy.mjs'], {
  stdio: 'inherit',
  env: process.env,
})

const vite = spawn(isWin ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: process.env,
  shell: isWin,
})

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

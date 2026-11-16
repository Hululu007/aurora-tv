import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// PWA：浏览器 / 鸿蒙 NEXT 上缓存应用外壳；Tauri 壳里不需要
if (
  import.meta.env.PROD &&
  'serviceWorker' in navigator &&
  !('__TAURI_INTERNALS__' in window)
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 不支持 SW 的浏览器忽略 */
    })
  })
}

import { useState } from 'react'
import type { HistoryEntry } from '../core/types'

interface HistoryViewProps {
  history: HistoryEntry[]
  onResume: (entry: HistoryEntry) => void
  onDelete: (entry: HistoryEntry) => void
  onClear: () => void
}

function posterStyle(entry: HistoryEntry) {
  if (entry.poster) {
    return {
      backgroundImage: `url("${entry.poster}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  const palette = entry.palette ?? ['#1d2b3a', '#0b1218', '#3d5a80']
  return { background: `linear-gradient(145deg, ${palette[0]}, ${palette[1]} 55%, ${palette[2]})` }
}

function watchTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  const clock = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  if (sameDay) return `今天 ${clock}`
  if (isYesterday) return `昨天 ${clock}`
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')} ${clock}`
}

export function HistoryView({ history, onResume, onDelete, onClear }: HistoryViewProps) {
  const [confirmClear, setConfirmClear] = useState(false)
  const items = history
    .filter((entry) => !entry.deletedAt)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))

  return (
    <section className="history-page">
      <header className="history-head">
        <div>
          <span className="eyebrow">记录</span>
          <h1>播放历史</h1>
          <p>{items.length} 条 · 删除和清空会同步到三端</p>
        </div>
        {confirmClear ? (
          <div className="history-confirm">
            <button
              type="button"
              className="btn ghost"
              data-nav
              onClick={() => setConfirmClear(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="btn primary"
              data-nav
              onClick={() => {
                setConfirmClear(false)
                onClear()
              }}
            >
              确认清空
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn ghost"
            data-nav
            disabled={!items.length}
            onClick={() => setConfirmClear(true)}
          >
            清空全部
          </button>
        )}
      </header>

      {items.length ? (
        <div className="history-list">
          {items.map((entry) => {
            const group = entry.groups?.[entry.groupIndex]
            const episode = group?.episodes[entry.episodeIndex]
            const percent = entry.duration
              ? Math.min(100, Math.round((entry.position / entry.duration) * 100))
              : 0
            return (
              <div className="history-item" key={entry.mediaKey}>
                <button
                  type="button"
                  className="history-main"
                  data-nav
                  onClick={() => onResume(entry)}
                >
                  <span className="history-poster" style={posterStyle(entry)}>
                    {!entry.poster ? entry.title.slice(0, 1) : null}
                  </span>
                  <span className="history-info">
                    <strong>{entry.title}</strong>
                    <small>
                      {entry.subtitle ?? '影片'}
                      {episode ? ` · ${episode.name}` : ''}
                    </small>
                    <span className="history-progress">
                      <span style={{ width: `${percent}%` }} />
                    </span>
                    <em>
                      {percent ? `已观看 ${percent}%` : '刚开始'} · {watchTime(entry.updatedAt)}
                    </em>
                  </span>
                </button>
                <button
                  type="button"
                  className="history-delete"
                  data-nav
                  onClick={() => onDelete(entry)}
                >
                  删除
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty">
          <h3>还没有播放记录</h3>
          <p>播放任意影片后，这里会显示观看进度；删除或清空会同步到手机、电视和 Windows。</p>
        </div>
      )}
    </section>
  )
}

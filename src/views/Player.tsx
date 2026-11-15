import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'
import type { PlaybackState } from '../core/types'
import { focusFirst, setNavLock } from '../core/nav'
import { formatTime } from '../core/format'
import {
  ChevronLeft,
  CloseIcon,
  PauseIcon,
  PlayIcon,
  SkipNextIcon,
  Back10Icon,
  Forward10Icon,
} from '../components/Icons'

interface PlayerProps {
  state: PlaybackState
  autoNext: boolean
  seekStep: number
  onClose: () => void
  onProgress: (payload: {
    groupIndex: number
    episodeIndex: number
    position: number
    duration: number
  }) => void
}

export function Player({ state, autoNext, seekStep, onClose, onProgress }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const hideTimer = useRef<number | null>(null)
  const lastSave = useRef(0)

  const [groupIndex, setGroupIndex] = useState(state.groupIndex)
  const [episodeIndex, setEpisodeIndex] = useState(state.episodeIndex)
  const [playing, setPlaying] = useState(true)
  const [showUi, setShowUi] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [focusIndex, setFocusIndex] = useState(-1)
  const [reloadKey, setReloadKey] = useState(0)

  const group = state.groups[groupIndex]
  const episode = group?.episodes[episodeIndex]
  const url = episode?.url ?? ''

  const reveal = useCallback(() => {
    setShowUi(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      setShowUi(false)
      setFocusIndex(-1)
    }, 3800)
  }, [])

  useEffect(() => {
    setNavLock(true)
    reveal()
    const onMove = () => reveal()
    window.addEventListener('mousemove', onMove)
    return () => {
      setNavLock(false)
      window.removeEventListener('mousemove', onMove)
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [reveal])

  // 加载视频
  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return
    setError(null)
    setPlaying(true)

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (/\.mp4(\?|#|$)/i.test(url) || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        backBufferLength: 30,
      })
      hlsRef.current = hls
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return
        const message =
          data.type === Hls.ErrorTypes.NETWORK_ERROR
            ? '视频流加载失败，可能是线路受限或需要代理。'
            : data.type === Hls.ErrorTypes.MEDIA_ERROR
              ? '视频编码不受支持，换一条线路试试。'
              : '播放器遇到未知错误。'
        setError(message)
      })
    } else {
      video.src = url
    }

    const start = state.startTime ?? 0
    const onLoaded = () => {
      if (start > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(start, Math.max(0, video.duration - 3))
      }
      void video.play().catch(() => setPlaying(false))
    }
    video.addEventListener('loadedmetadata', onLoaded, { once: true })

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, reloadKey])

  const saveProgress = useCallback(
    (force = false) => {
      const video = videoRef.current
      if (!video) return
      const now = Date.now()
      if (!force && now - lastSave.current < 5000) return
      lastSave.current = now
      onProgress({
        groupIndex,
        episodeIndex,
        position: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
      })
    },
    [groupIndex, episodeIndex, onProgress],
  )

  useEffect(() => {
    return () => saveProgress(true)
  }, [saveProgress])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
    reveal()
  }, [reveal])

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current
      if (!video) return
      const max = Number.isFinite(video.duration) ? video.duration : 0
      video.currentTime = Math.min(Math.max(0, video.currentTime + delta), Math.max(0, max - 1))
      reveal()
    },
    [reveal],
  )

  const playEpisode = useCallback(
    (next: number) => {
      if (next < 0 || next >= group.episodes.length) return
      setEpisodeIndex(next)
      reveal()
    },
    [group, reveal],
  )

  const nextEpisode = useCallback(() => {
    if (!autoNext) return
    const hasNext =
      (group && episodeIndex < group.episodes.length - 1) ||
      groupIndex < state.groups.length - 1
    if (!hasNext) return
    if (groupIndex < state.groups.length - 1 && episodeIndex >= group.episodes.length - 1) {
      setGroupIndex(groupIndex + 1)
      setEpisodeIndex(0)
    } else {
      setEpisodeIndex(episodeIndex + 1)
    }
    reveal()
  }, [autoNext, episodeIndex, group, groupIndex, reveal, state.groups.length])

  const buttons = useMemo(
    () => [
      { id: 'play', label: playing ? '暂停' : '播放', run: togglePlay },
      { id: 'back', label: '-10 秒', run: () => seekBy(-seekStep) },
      { id: 'forward', label: '+10 秒', run: () => seekBy(seekStep) },
      { id: 'next', label: '下一集', run: () => playEpisode(episodeIndex + 1) },
      { id: 'close', label: '退出', run: onClose },
    ],
    [episodeIndex, onClose, playEpisode, playing, seekBy, seekStep, togglePlay],
  )

  // 播放器专用按键：方向键调进度，上/下切换按钮，回车执行
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key
      if (key === 'Escape' || key === 'BrowserBack') {
        event.preventDefault()
        saveProgress(true)
        onClose()
        return
      }
      if (key === ' ' || key === 'Enter') {
        event.preventDefault()
        if (focusIndex >= 0) {
          buttons[focusIndex]?.run()
        } else {
          togglePlay()
        }
        return
      }
      if (key === 'ArrowLeft') {
        event.preventDefault()
        seekBy(-seekStep)
        return
      }
      if (key === 'ArrowRight') {
        event.preventDefault()
        seekBy(seekStep)
        return
      }
      if (key === 'ArrowUp') {
        event.preventDefault()
        reveal()
        setFocusIndex((current) => (current + 1) % buttons.length)
        return
      }
      if (key === 'ArrowDown') {
        event.preventDefault()
        reveal()
        setFocusIndex((current) => (current <= 0 ? buttons.length - 1 : current - 1))
        return
      }
      if (key === 'n' || key === 'N') {
        playEpisode(episodeIndex + 1)
      }
      reveal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [buttons, episodeIndex, focusIndex, onClose, playEpisode, reveal, saveProgress, seekBy, seekStep, togglePlay])

  const onTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)
    if (video.buffered.length) {
      setBuffered(video.buffered.end(video.buffered.length - 1))
    }
    saveProgress()
  }

  const onSeekPointer = (clientX: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const video = videoRef.current
    if (video && Number.isFinite(video.duration)) {
      video.currentTime = ratio * video.duration
      reveal()
    }
  }

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className="player">
      <video
        ref={videoRef}
        playsInline
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={nextEpisode}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onError={() => setError('视频加载失败，请换一条线路或稍后再试。')}
        onClick={togglePlay}
      />

      {error ? (
        <div className="player-error">
          <div className="box">
            <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>无法播放</h3>
            <p>{error}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setError(null)
                  setReloadKey((key) => key + 1)
                  reveal()
                }}
              >
                重试
              </button>
              <button type="button" className="btn ghost" onClick={onClose}>
                返回
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`player-ui ${showUi ? 'show' : ''}`}>
        <div className="player-top">
          <div className="player-heading">
            <h2>{state.title}</h2>
            <p>
              {episode?.name}
              {state.groups.length > 1 ? ` · ${group?.name}` : ''}
              {state.subtitle ? ` · ${state.subtitle}` : ''}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} title="关闭">
            <CloseIcon />
          </button>
        </div>

        <div className="player-center">
          <button type="button" className="big-play" onClick={togglePlay} aria-label={playing ? '暂停' : '播放'}>
            {playing ? <PauseIcon width={30} height={30} /> : <PlayIcon width={30} height={30} />}
          </button>
        </div>

        <div className="player-bottom">
          <div
            className={`timeline ${focusIndex === 0 ? 'is-focused' : ''}`}
            onClick={(event) => onSeekPointer(event.clientX, event.currentTarget)}
          >
            <div className="timeline-track">
              <div className="timeline-buffer" style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }} />
              <div className="timeline-fill" style={{ width: `${progress * 100}%` }} />
              <div className="timeline-knob" style={{ left: `${progress * 100}%` }} />
            </div>
          </div>

          <div className="player-row">
            <div className="player-buttons">
              <button
                type="button"
                className={`pbtn ${focusIndex === 0 ? 'is-focused' : ''}`}
                onClick={togglePlay}
              >
                {playing ? <PauseIcon width={17} height={17} /> : <PlayIcon width={17} height={17} />}
                {playing ? '暂停' : '播放'}
              </button>
              <button
                type="button"
                className={`pbtn ${focusIndex === 1 ? 'is-focused' : ''}`}
                onClick={() => seekBy(-seekStep)}
              >
                <Back10Icon width={17} height={17} />
                {seekStep}s
              </button>
              <button
                type="button"
                className={`pbtn ${focusIndex === 2 ? 'is-focused' : ''}`}
                onClick={() => seekBy(seekStep)}
              >
                <Forward10Icon width={17} height={17} />
                {seekStep}s
              </button>
              <button
                type="button"
                className={`pbtn ${focusIndex === 3 ? 'is-focused' : ''}`}
                onClick={() => playEpisode(episodeIndex + 1)}
                disabled={episodeIndex >= (group?.episodes.length ?? 1) - 1}
              >
                <SkipNextIcon width={17} height={17} />
                下一集
              </button>
            </div>
            <div className="player-time">
              {formatTime(currentTime)} <span style={{ opacity: 0.4 }}>/ {formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

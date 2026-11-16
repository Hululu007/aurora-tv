/** 手机边缘返回手势：左边缘向右滑 / 右边缘向左滑 */

const EDGE = 28
const THRESHOLD = 64

export function bindEdgeSwipe(onBack: () => void, enabled: () => boolean): () => void {
  let tracking = false
  let edge = 0
  let startX = 0
  let startY = 0

  const onStart = (event: TouchEvent) => {
    if (event.touches.length !== 1 || !enabled()) return
    const touch = event.touches[0]
    if (touch.clientX <= EDGE) edge = 1
    else if (touch.clientX >= window.innerWidth - EDGE) edge = -1
    else return

    tracking = true
    startX = touch.clientX
    startY = touch.clientY
  }

  const onMove = (event: TouchEvent) => {
    if (!tracking) return
    const touch = event.touches[0]
    const dx = Math.abs(touch.clientX - startX)
    const dy = Math.abs(touch.clientY - startY)
    // 垂直滚动优先，避免和上下滑动冲突
    if (dy > dx && dy > 18) tracking = false
  }

  const onEnd = (event: TouchEvent) => {
    if (!tracking) return
    tracking = false
    const touch = event.changedTouches[0]
    const dx = touch.clientX - startX
    const inward = edge === 1 ? dx : -dx
    if (inward >= THRESHOLD) onBack()
  }

  window.addEventListener('touchstart', onStart, { passive: true })
  window.addEventListener('touchmove', onMove, { passive: true })
  window.addEventListener('touchend', onEnd, { passive: true })
  window.addEventListener('touchcancel', () => {
    tracking = false
  })

  return () => {
    window.removeEventListener('touchstart', onStart)
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onEnd)
  }
}

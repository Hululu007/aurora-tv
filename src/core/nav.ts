/**
 * 遥控器 / 键盘 / 手柄的空间导航。
 * 所有可聚焦元素带 `data-nav`，当前焦点元素带 `.is-focused`。
 */

type Direction = 'up' | 'down' | 'left' | 'right'

let root: HTMLElement | null = null
let active: HTMLElement | null = null
let locked = false

export function setNavRoot(element: HTMLElement | null) {
  root = element
  active = null
  clearFocus()
}

export function setNavLock(value: boolean) {
  locked = value
}

export function getNavLock() {
  return locked
}

function scope(): ParentNode {
  return root ?? document
}

export function navCandidates(): HTMLElement[] {
  const nodes = Array.from(scope().querySelectorAll<HTMLElement>('[data-nav]'))
  return nodes.filter((el) => {
    if (el.dataset.nav === 'off') return false
    if (el.hasAttribute('disabled')) return false
    if (el.getAttribute('aria-hidden') === 'true') return false
    const rect = el.getBoundingClientRect()
    if (rect.width < 4 || rect.height < 4) return false
    if (rect.bottom < 0 || rect.top > window.innerHeight + 200) return false
    const style = getComputedStyle(el)
    return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0'
  })
}

export function clearFocus() {
  document.querySelectorAll<HTMLElement>('.is-focused').forEach((el) => {
    el.classList.remove('is-focused')
    if (el.dataset.navFocus === '1') {
      el.removeAttribute('tabindex')
      delete el.dataset.navFocus
    }
  })
}

export function focusElement(el: HTMLElement | null, options: { scroll?: boolean } = {}) {
  if (!el) return
  if (active === el) {
    if (!el.classList.contains('is-focused')) el.classList.add('is-focused')
    return
  }
  clearFocus()
  active = el
  el.classList.add('is-focused')
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1')
    el.dataset.navFocus = '1'
  }
  try {
    el.focus({ preventScroll: true })
  } catch {
    /* 某些元素不可聚焦时忽略 */
  }
  if (options.scroll !== false) {
    // 电视端优先保证“选中项一定可见”，用即时滚动避免被后台标签页节流
    el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' })
    const rect = el.getBoundingClientRect()
    const topSafe = 96
    const bottomSafe = window.innerHeight - 24
    if (rect.top < topSafe) {
      window.scrollBy({ top: rect.top - topSafe, behavior: 'auto' })
    } else if (rect.bottom > bottomSafe) {
      window.scrollBy({ top: rect.bottom - bottomSafe, behavior: 'auto' })
    }
  }
}

export function focusByHover(el: HTMLElement) {
  if (locked) return
  // 触屏设备没有 hover，别让合成出来的 pointerenter 抢焦点
  if (window.matchMedia('(hover: none)').matches) return
  focusElement(el, { scroll: false })
}

export function focusFirst(): HTMLElement | null {
  const nodes = navCandidates()
  if (!nodes.length) return null
  // 优先主操作按钮，其次正文区域，避免一进来焦点落在顶栏
  const preferred =
    nodes.find((el) => el.dataset.autofocus === '1') ??
    nodes.find((el) => el.closest('.stage, .layer')) ??
    nodes[0]
  focusElement(preferred)
  return preferred
}

export function getActive(): HTMLElement | null {
  return active && document.contains(active) ? active : null
}

function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart))
}

export function moveFocus(direction: Direction): boolean {
  const nodes = navCandidates()
  if (!nodes.length) return false
  let current = getActive()
  if (!current || !nodes.includes(current)) {
    focusFirst()
    return true
  }

  const cur = current.getBoundingClientRect()
  const cx = cur.left + cur.width / 2
  const cy = cur.top + cur.height / 2
  let best: { el: HTMLElement; score: number } | null = null

  for (const node of nodes) {
    if (node === current) continue
    const rect = node.getBoundingClientRect()
    const nx = rect.left + rect.width / 2
    const ny = rect.top + rect.height / 2

    let primary = 0
    let secondary = 0
    let parallel = 0

    if (direction === 'right') {
      primary = rect.left - cur.right
      secondary = Math.abs(ny - cy)
      parallel = overlap(cur.top, cur.bottom, rect.top, rect.bottom)
    } else if (direction === 'left') {
      primary = cur.left - rect.right
      secondary = Math.abs(ny - cy)
      parallel = overlap(cur.top, cur.bottom, rect.top, rect.bottom)
    } else if (direction === 'down') {
      primary = rect.top - cur.bottom
      secondary = Math.abs(nx - cx)
      parallel = overlap(cur.left, cur.right, rect.left, rect.right)
    } else {
      primary = cur.top - rect.bottom
      secondary = Math.abs(nx - cx)
      parallel = overlap(cur.left, cur.right, rect.left, rect.right)
    }

    if (primary < -6) continue
    if (secondary > 0 && parallel <= 0 && secondary > Math.max(rect.width, rect.height) * 0.8) {
      continue
    }

    // 优先选择“同一行/列”的元素，其次才是更近的
    const score = Math.max(primary, 0) + secondary * 2.4 - parallel * 0.6
    if (!best || score < best.score) best = { el: node, score }
  }

  if (!best) {
    // 到达边界时：如果是行尾，尝试上下行；否则保持不动
    return false
  }

  focusElement(best.el)
  return true
}

export function activate(): boolean {
  const el = getActive()
  if (!el) return false
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return false
  el.click()
  return true
}

/** 手柄支持：左摇杆与方向键，A 确认，B 返回 */
export function startGamepadLoop(onBack: () => void) {
  let raf = 0
  let last = 0
  const state = { x: 0, y: 0 }

  const tick = (time: number) => {
    raf = requestAnimationFrame(tick)
    if (time - last < 110) return
    last = time
    const pads = navigator.getGamepads?.() ?? []
    const pad = Array.from(pads).find(Boolean)
    if (!pad) return

    const axisX = pad.axes[0] ?? 0
    const axisY = pad.axes[1] ?? 0
    const pressed = (i: number) => Boolean(pad.buttons[i]?.pressed)

    const dir: Direction | null =
      pressed(15) || axisX > 0.55
        ? 'right'
        : pressed(14) || axisX < -0.55
          ? 'left'
          : pressed(13) || axisY > 0.55
            ? 'down'
            : pressed(12) || axisY < -0.55
              ? 'up'
              : null

    if (dir && !locked) moveFocus(dir)
    if (pressed(0)) activate()
    if (pressed(1)) onBack()
  }

  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}

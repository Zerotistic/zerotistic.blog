const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")

export const motionRunning = () => !reducedMotion.matches && !document.hidden

export function observeMotion(callback: () => void) {
  reducedMotion.addEventListener("change", callback)
  document.addEventListener("visibilitychange", callback)
  callback()
  return () => {
    reducedMotion.removeEventListener("change", callback)
    document.removeEventListener("visibilitychange", callback)
  }
}

/**
 * On an article, once the reader is past its header, unprompted motion
 * (visitors, idle plays) waits. Things still answer when poked.
 */
export const readerBusy = () => {
  if (!document.querySelector("page-grid.reading")) return false
  const header = document.querySelector("main article header")
  return !!header && header.getBoundingClientRect().bottom < 0
}

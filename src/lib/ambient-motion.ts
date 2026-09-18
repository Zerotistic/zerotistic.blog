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

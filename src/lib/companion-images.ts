import { motionRunning, observeMotion } from "./ambient-motion"

// Keep a real static pose in the HTML. Hidden SVG images have no href until
// the companion is visible and the page's initial resources have finished.
// Decode the entire sequence before starting it so slow connections never
// leave a blank frame halfway through a gesture.
export function loadCompanionImages(element: HTMLElement, onReady: () => void) {
  let visible = false
  let scheduled = false
  let loading = false
  let loaded = false
  let stopMotion = () => {}

  const load = async () => {
    scheduled = false
    if (loading || loaded || !visible || !motionRunning()) return
    loading = true
    const images = [...element.querySelectorAll<SVGImageElement>("image")]
    const sources = new Set(
      images
        .map((image) => image.dataset.src || image.getAttribute("href"))
        .filter((src): src is string => !!src),
    )
    try {
      await Promise.all(
        [...sources].map(async (src) => {
          const image = new Image()
          image.decoding = "async"
          image.fetchPriority = "low"
          image.src = src
          await image.decode()
        }),
      )
      for (const image of images) {
        if (image.dataset.src) image.setAttribute("href", image.dataset.src)
      }
      loaded = true
      observer.disconnect()
      stopMotion()
      element.removeEventListener("pointerenter", schedule)
      onReady()
    } catch {
      // Keep the static pose. A subsequent visibility change can retry.
    } finally {
      loading = false
    }
  }
  const schedule = () => {
    if (
      scheduled ||
      loading ||
      loaded ||
      !visible ||
      !motionRunning() ||
      document.readyState !== "complete"
    )
      return
    scheduled = true
    if ("requestIdleCallback" in window)
      window.requestIdleCallback(load, { timeout: 1000 })
    else setTimeout(load, 0)
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    schedule()
  })
  observer.observe(element)
  stopMotion = observeMotion(schedule)
  element.addEventListener("pointerenter", schedule, { passive: true })
  if (document.readyState !== "complete")
    addEventListener("load", schedule, { once: true })
}

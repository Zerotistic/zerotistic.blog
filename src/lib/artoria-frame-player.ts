import { motionRunning, observeMotion } from "./ambient-motion"
import { loadCompanionImages } from "./companion-images"

export function initArtoriaFrames(element: HTMLElement) {
  const button = element.querySelector<HTMLButtonElement>("button")!
  const viewport = element.querySelector<SVGSVGElement>(".artoria-frames")!
  const atlas = viewport.querySelector<SVGImageElement>(".frame-atlas")
  const remark = element.querySelector<HTMLElement>(".artoria-remark")
  const remarks: string[] = JSON.parse(element.dataset.remarks ?? "[]")
  const durations: number[] = JSON.parse(viewport.dataset.durations ?? "[]")
  const columns = Number(viewport.dataset.columns)
  const timers = new Set<number>()
  let ready = false
  let visible = false
  let active = false
  let entered = false
  let playing = false
  let queued = false
  let idleTimer = 0
  let remarkIndex = 0
  let lastHover = Number.NEGATIVE_INFINITY

  const later = (callback: () => void, duration: number) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer)
      if (active) callback()
    }, duration)
    timers.add(timer)
    return timer
  }

  const schedule = () => {
    clearTimeout(idleTimer)
    timers.delete(idleTimer)
    const delay = element.dataset.pose === "reading" ? 9000 : 14000
    idleTimer = later(() => play(), delay + Math.random() * 6000)
  }

  const show = (index: number) => {
    atlas!.setAttribute("x", `${-(index % columns) * 360}`)
    atlas!.setAttribute("y", `${-Math.floor(index / columns) * 540}`)
    element.dataset.frame = `${index}`
  }

  function play(manual = false) {
    if (!motionRunning() || !visible || !atlas) return
    if (!ready || playing) {
      if (manual) queued = true
      return
    }
    clearTimeout(idleTimer)
    timers.delete(idleTimer)
    playing = true
    viewport.setAttribute("data-playing", "")
    const step = (index: number) => {
      if (index === durations.length) {
        playing = false
        show(0)
        viewport.removeAttribute("data-playing")
        if (queued) {
          queued = false
          later(() => play(), 220)
        } else schedule()
        return
      }
      show(index)
      later(() => step(index + 1), durations[index])
    }
    step(0)
  }

  const stop = () => {
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
    playing = false
    queued = false
    viewport.removeAttribute("data-playing")
    element.dataset.frame = "0"
    if (atlas) show(0)
  }

  const update = () => {
    const next = ready && visible && motionRunning()
    button.disabled = remarks.length > 1 ? !visible : !next
    if (next === active) return
    active = next
    element.toggleAttribute("data-awake", active)
    if (!active) {
      stop()
      return
    }
    if (queued) {
      queued = false
      play()
    } else if (!entered) {
      entered = true
      idleTimer = later(
        () => play(),
        element.dataset.pose === "waving" ? 500 : 2000 + Math.random() * 2000,
      )
    } else schedule()
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio > 0
      update()
    },
    { threshold: 0.05 },
  )
  observer.observe(element)
  observeMotion(update)
  if (atlas)
    loadCompanionImages(element, () => {
      ready = true
      update()
    })

  // The bubble's line blurs out and the next one blurs in, so it reads as
  // her saying something new instead of the text flickering.
  const say = (text: string) => {
    if (!remark) return
    for (const animation of remark.getAnimations()) animation.cancel()
    if (!motionRunning()) {
      remark.textContent = text
      return
    }
    const out = remark.animate(
      [
        { opacity: 1, filter: "blur(0)" },
        { opacity: 0, filter: "blur(3px)" },
      ],
      { duration: 110, easing: "ease-in", fill: "forwards" },
    )
    out.onfinish = () => {
      remark.textContent = text
      out.cancel()
      remark.animate(
        [
          { opacity: 0, filter: "blur(3px)" },
          { opacity: 1, filter: "blur(0)" },
        ],
        { duration: 220, easing: "cubic-bezier(.22,1,.36,1)" },
      )
    }
  }

  button.addEventListener("click", () => {
    if (remark && remarks.length > 1) {
      remarkIndex = (remarkIndex + 1) % remarks.length
      say(remarks[remarkIndex])
    }
    play(true)
  })
  button.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch" || !active || playing) return
    if (performance.now() - lastHover < 6000) return
    lastHover = performance.now()
    play()
  })
}

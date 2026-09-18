import { motionRunning, observeMotion } from "./ambient-motion"

type Point = [number, number]
const curve = (a: Point, b: Point, c: Point, d: Point, t: number): Point => {
  const u = 1 - t
  return [0, 1].map(
    (i) =>
      u ** 3 * a[i] +
      3 * u ** 2 * t * b[i] +
      3 * u * t ** 2 * c[i] +
      t ** 3 * d[i],
  ) as Point
}

export function initWorkCompanion(element: HTMLElement) {
  const button = element.querySelector<HTMLButtonElement>("button")!
  const arm = element.querySelector<SVGGElement>(".work-pointing-arm")!
  const bubble = element.querySelector<HTMLElement>("figcaption")!
  const visitor = element.querySelector<HTMLElement>(".work-visitor")!
  const blinkImage = new Image()
  blinkImage.src = "/static/work/artoria-pointing-blink-source.webp"
  let blinkReady = false
  blinkImage
    .decode()
    .then(() => {
      blinkReady = true
    })
    .catch(() => {})
  let visible = false
  let active = false
  let welcomed = false
  let flight: Animation | undefined
  let gesture: Animation | undefined
  let speech: Animation | undefined
  let blinkTimer = 0
  const timers = new Set<number>()

  const later = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer)
      if (active) callback()
    }, delay)
    timers.add(timer)
    return timer
  }

  const blink = () => {
    if (!active || !blinkReady) return
    clearTimeout(blinkTimer)
    timers.delete(blinkTimer)
    element.setAttribute("data-blinking", "")
    blinkTimer = later(() => element.removeAttribute("data-blinking"), 130)
  }

  const scheduleBlink = () =>
    later(
      () => {
        blink()
        scheduleBlink()
      },
      3700 + Math.random() * 4300,
    )

  const point = () => {
    if (!active) return
    gesture?.cancel()
    gesture = arm.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: "rotate(1.8deg)", offset: 0.28 },
        { transform: "rotate(-0.4deg)", offset: 0.65 },
        { transform: "rotate(0deg)" },
      ],
      { duration: 1150, easing: "cubic-bezier(.22,1,.36,1)" },
    )
    speech?.cancel()
    speech = bubble.animate(
      [
        { transform: "translateY(0) rotate(4deg)" },
        { transform: "translateY(-2px) rotate(1deg)", offset: 0.3 },
        { transform: "translateY(0) rotate(5deg)", offset: 0.7 },
        { transform: "translateY(0) rotate(4deg)" },
      ],
      { duration: 1350, easing: "cubic-bezier(.22,1,.36,1)" },
    )
  }

  const endVisit = () => {
    flight?.cancel()
    flight = undefined
    element.removeAttribute("data-visiting")
    element.removeAttribute("data-perched")
  }

  const visit = () => {
    if (!active || flight) return
    const { width: w, height: h } = element.getBoundingClientRect()
    const { width: bw, height: bh } = visitor.getBoundingClientRect()
    // The butterfly's feet (20, 23 in its viewBox) meet the fingertip (7, 126).
    const perch: Point = [
      (w * 7) / 480 - bw / 2,
      (h * 126) / 461 - (bh * 23) / 32,
    ]
    const frames: Keyframe[] = []
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const [x, y] = curve(
        [w * 0.55, -52],
        [w * 1.1, -24],
        [w * 0.22, -40],
        perch,
        1 - (1 - t) ** 2,
      )
      frames.push({
        offset: t * 0.38,
        transform: `translate(${x}px,${y}px) rotate(${Math.sin(t * Math.PI * 2) * 14}deg)`,
        opacity: Math.min(1, t * 6),
      })
    }
    frames.push({
      offset: 0.66,
      transform: `translate(${perch[0]}px,${perch[1]}px) rotate(0deg)`,
      opacity: 1,
    })
    for (let i = 1; i <= 36; i++) {
      const t = i / 36
      const [x, y] = curve(
        perch,
        [w * 0.18, -12],
        [w * 0.75, -48],
        [w * 0.45, -88],
        t * t,
      )
      frames.push({
        offset: 0.66 + t * 0.34,
        transform: `translate(${x}px,${y}px) rotate(${Math.sin(t * Math.PI * 2) * -18}deg)`,
        opacity: Math.min(1, (1 - t) * 6),
      })
    }
    element.setAttribute("data-visiting", "")
    flight = visitor.animate(frames, {
      duration: 12500,
      fill: "both",
      easing: "linear",
    })
    later(() => {
      element.setAttribute("data-perched", "")
      blink()
      later(blink, 420)
    }, 4750)
    later(() => element.removeAttribute("data-perched"), 8250)
    // Let the visitor clear her hand before she points again.
    later(point, 9350)
    flight.onfinish = endVisit
  }

  const update = () => {
    const next = visible && motionRunning()
    button.disabled = !next
    if (next === active) return
    active = next
    element.toggleAttribute("data-awake", active)
    if (active) {
      scheduleBlink()
      if (!welcomed) {
        welcomed = true
        later(point, 550)
      }
    } else {
      for (const timer of timers) clearTimeout(timer)
      timers.clear()
      endVisit()
      gesture?.cancel()
      speech?.cancel()
      element.removeAttribute("data-blinking")
    }
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.4
      update()
    },
    { threshold: [0, 0.4] },
  )
  observer.observe(element)
  observeMotion(update)

  button.addEventListener("click", () => {
    if (!active) return
    if (!flight) {
      point()
      later(blink, 300)
      // Use the shared sitewide cooldown for this little encounter too.
      document.dispatchEvent(new Event("avalon-visitor-started"))
      visit()
    } else {
      blink()
    }
  })
  document.addEventListener("avalon-visit", (event) => {
    if (!active) return
    event.preventDefault()
    visit()
  })
  // A resize changes the perch coordinates; finish gracefully instead of drifting off her hand.
  const resizeObserver = new ResizeObserver(() => {
    if (flight) {
      endVisit()
      for (const timer of timers) clearTimeout(timer)
      timers.clear()
      element.removeAttribute("data-blinking")
      if (active) scheduleBlink()
    }
  })
  resizeObserver.observe(element)
}

import { motionRunning, observeMotion } from "./ambient-motion"

type Point = [number, number]
const bezier = (a: Point, b: Point, c: Point, d: Point, t: number): Point => {
  const u = 1 - t
  return [0, 1].map(
    (i) =>
      u ** 3 * a[i] +
      3 * u ** 2 * t * b[i] +
      3 * u * t ** 2 * c[i] +
      t ** 3 * d[i],
  ) as Point
}

export function initArtoria(element: HTMLElement) {
  const button = element.querySelector<HTMLButtonElement>("button")!
  const visitor = element.querySelector<HTMLElement>(".artoria-visitor")!
  const greeting = element.querySelector<SVGGElement>(".artoria-greeting")!
  const investigating = element.dataset.pose === "investigating"
  let visible = false
  let active = false
  let stateTimer = 0
  let flight: Animation | undefined
  let hello: Animation | undefined
  const timers = new Set<number>()
  button.disabled = false

  const later = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer)
      if (active) callback()
    }, delay)
    timers.add(timer)
    return timer
  }

  const state = (name: string, duration = 0) => {
    clearTimeout(stateTimer)
    timers.delete(stateTimer)
    element.dataset.state = name
    if (duration)
      stateTimer = later(() => {
        element.dataset.state = "idle"
      }, duration)
  }

  const blink = () => {
    if (!investigating || !active) return
    element.setAttribute("data-blinking", "")
    later(() => element.removeAttribute("data-blinking"), 135)
  }

  const scheduleBlink = () => {
    later(
      () => {
        blink()
        if (Math.random() < 0.18) later(blink, 300)
        scheduleBlink()
      },
      3400 + Math.random() * 4500,
    )
  }

  const sparkle = () => {
    element.setAttribute("data-sparkle", "")
    later(() => element.removeAttribute("data-sparkle"), 1250)
  }

  function visit(manual = false) {
    if (!active || flight) return
    if (manual) document.dispatchEvent(new Event("avalon-visitor-started"))
    state("curious")
    element.setAttribute("data-visiting", "")
    const { width: w, height: h } = element.getBoundingClientRect()
    const perch: Point = investigating
      ? [w * 0.8 - 11, h * 0.385 - 9]
      : element.dataset.pose === "reading"
        ? [w * 0.78 - 11, h * 0.56 - 9]
        : [w * 0.78 - 11, h * 0.28 - 9]
    const keyframes: Keyframe[] = []
    for (let i = 0; i <= 36; i++) {
      const t = i / 36
      const eased = 1 - (1 - t) ** 2
      const [x, y] = bezier(
        [-65, h * 0.25],
        [-35, -30],
        [w + 40, -20],
        perch,
        eased,
      )
      keyframes.push({
        offset: t * 0.38,
        transform: `translate(${x}px,${y}px) rotate(${Math.sin(t * 6) * 14}deg)`,
        opacity: Math.min(1, t * 5),
      })
    }
    keyframes.push({
      offset: 0.65,
      transform: `translate(${perch[0]}px,${perch[1]}px) rotate(0deg)`,
      opacity: 1,
    })
    for (let i = 1; i <= 32; i++) {
      const t = i / 32
      const [x, y] = bezier(
        perch,
        [w * 0.4, h * 0.3],
        [w + 45, h * 0.1],
        [w + 60, -70],
        t * t,
      )
      keyframes.push({
        offset: 0.65 + t * 0.35,
        transform: `translate(${x}px,${y}px) rotate(${Math.sin(t * 5) * -18}deg)`,
        opacity: Math.min(1, (1 - t) * 5),
      })
    }
    flight = visitor.animate(keyframes, {
      duration: 13000,
      easing: "linear",
      fill: "both",
    })
    later(() => {
      element.setAttribute("data-perched", "")
      state("investigating")
      sparkle()
      blink()
    }, 4900)
    later(() => {
      element.removeAttribute("data-perched")
      state("curious")
    }, 8450)
    flight.onfinish = () => {
      flight?.cancel()
      flight = undefined
      element.removeAttribute("data-visiting")
      element.removeAttribute("data-perched")
      state("idle")
    }
  }

  const update = () => {
    const next = visible && motionRunning()
    if (next === active) return
    active = next
    element.toggleAttribute("data-awake", active)
    if (active) {
      scheduleBlink()
    } else {
      for (const timer of timers) clearTimeout(timer)
      timers.clear()
      flight?.cancel()
      flight = undefined
      hello?.cancel()
      state("idle")
      for (const name of [
        "data-blinking",
        "data-visiting",
        "data-perched",
        "data-sparkle",
      ])
        element.removeAttribute(name)
      element.style.setProperty("--attention-angle", "0deg")
    }
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

  button.addEventListener("pointermove", (event) => {
    if (!active || event.pointerType === "touch") return
    const box = button.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width - 0.5
    element.style.setProperty("--attention-angle", `${x * 2.5}deg`)
  })
  button.addEventListener("pointerleave", () =>
    element.style.setProperty("--attention-angle", "0deg"),
  )
  button.addEventListener("click", () => {
    if (!active) return
    hello?.cancel()
    hello = greeting.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: "rotate(-3deg)", offset: 0.3 },
        { transform: "rotate(1.2deg)", offset: 0.65 },
        { transform: "rotate(0deg)" },
      ],
      { duration: 1000, easing: "cubic-bezier(.22,1,.36,1)" },
    )
    sparkle()
    later(blink, 250)
    visit(true)
  })

  document.addEventListener("avalon-visit", (event) => {
    if (!active) return
    event.preventDefault()
    visit()
  })
  document.addEventListener("cve-disclosure", (event) => {
    if (!investigating || !active || flight) return
    if ((event as CustomEvent<{ open: boolean }>).detail.open) {
      element.style.setProperty(
        "--study-angle",
        `${2.5 + Math.random() * 0.9}deg`,
      )
      state("investigating", 4800)
      sparkle()
      later(blink, 550)
    } else {
      state("idle")
    }
  })
}

import { loadCompanionImages } from "./companion-images"
import { motionRunning, observeMotion } from "./ambient-motion"
import {
  mentionAtlas,
  mentionInbetweens,
  readingToTurn,
  curiousToReading,
} from "./mention-inbetweens"

type Pose =
  | "reading"
  | "lean"
  | "discover"
  | "show"
  | "proud"
  | "turn"
  | "curious"
type Scene = "idle" | "discovery" | "turn" | "peek" | "grip" | "visit"
type Point = [number, number]
const discoveryDuration = 8000
const clamp = (x: number) => Math.max(0, Math.min(1, x))
const ease = (x: number) => {
  const t = clamp(x)
  return t * t * (3 - 2 * t)
}
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

export function initMentionCompanion(element: HTMLElement) {
  const button = element.querySelector<HTMLButtonElement>("button")!
  const bubble = element.querySelector<HTMLElement>("figcaption")!
  const delight = element.querySelector<HTMLElement>(".newspaper-delight")!
  const visitor = element.querySelector<HTMLElement>(".newspaper-visitor")!
  const atlas = element.querySelector<SVGImageElement>(".news-inbetween-atlas")!
  const leftFoot = element.querySelector<SVGGElement>(".foot-left")!
  const rightFoot = element.querySelector<SVGGElement>(".foot-right")!
  const leaf = element.querySelector<SVGGElement>(".news-leaf")!
  const hand = element.querySelector<SVGGElement>(".news-hand")!
  const parts = new Map(
    Array.from(
      element.querySelectorAll<SVGGElement>(".newspaper-pose"),
      (node) => [
        node.dataset.name as Pose,
        {
          head: node.querySelector<SVGGElement>(".news-head")!,
          paper: node.querySelector<SVGGElement>(".news-paper")!,
        },
      ],
    ),
  )
  const timers = new Set<number>()
  let ready = false,
    visible = false,
    active = false,
    welcomed = false
  let pose: Pose = "reading",
    scene: Scene = "idle"
  let raf = 0,
    idleTimer = 0,
    idleIndex = 0
  let queuedDiscovery = false,
    pendingVisit = false
  let inbetween: number | undefined

  const later = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer)
      if (active) callback()
    }, delay)
    timers.add(timer)
    return timer
  }
  const setPose = (next: Pose) => {
    if (inbetween !== undefined) {
      inbetween = undefined
      element.removeAttribute("data-inbetween")
    }
    if (pose === next) return
    const previous = parts.get(pose)!
    previous.head.style.removeProperty("transform")
    previous.paper.style.removeProperty("transform")
    pose = next
    element.dataset.pose = next
    element.removeAttribute("data-blinking")
  }
  const rig = (head = 0, paper = 0) => {
    if (inbetween !== undefined) return
    const current = parts.get(pose)!
    current.head.style.transform = `rotate(${head}deg)`
    current.paper.style.transform = `rotate(${paper}deg)`
  }
  const tween = (
    from: Pose,
    to: Pose,
    frames: readonly number[],
    elapsed: number,
    duration: number,
  ) => {
    // Each drawing is held for an animation beat; the atlas is decoded before playback.
    const step = Math.floor(clamp(elapsed / duration) * (frames.length + 2))
    if (step === 0 || step >= frames.length + 1) {
      setPose(step === 0 ? from : to)
      rig()
      return
    }
    const index = frames[step - 1]
    if (index === inbetween) return
    inbetween = index
    atlas.setAttribute(
      "x",
      `${-(index % mentionAtlas.columns) * mentionAtlas.strideX - mentionAtlas.padding}`,
    )
    atlas.setAttribute(
      "y",
      `${-Math.floor(index / mentionAtlas.columns) * mentionAtlas.strideY - mentionAtlas.padding}`,
    )
    element.dataset.inbetween = `${index}`
    element.removeAttribute("data-blinking")
  }
  const blink = () => {
    if (pose !== "reading" || scene !== "idle") return
    element.setAttribute("data-blinking", "")
    later(() => element.removeAttribute("data-blinking"), 120)
  }
  const scheduleBlink = () =>
    later(
      () => {
        blink()
        scheduleBlink()
      },
      3400 + Math.random() * 3200,
    )

  const clearScene = () => {
    cancelAnimationFrame(raf)
    raf = 0
    scene = "idle"
    element.dataset.scene = scene
    for (const name of ["data-blinking", "data-visiting", "data-perched"])
      element.removeAttribute(name)
    for (const part of parts.values()) {
      part.head.style.removeProperty("transform")
      part.paper.style.removeProperty("transform")
    }
    for (const node of [
      leftFoot,
      rightFoot,
      leaf,
      hand,
      bubble,
      delight,
      visitor,
    ])
      node.removeAttribute("style")
    setPose("reading")
  }
  const scheduleIdle = () => {
    clearTimeout(idleTimer)
    timers.delete(idleTimer)
    idleTimer = later(
      () => {
        if (scene === "idle") idle()
        else scheduleIdle()
      },
      8500 + Math.random() * 5500,
    )
  }
  const finish = () => {
    clearScene()
    if (queuedDiscovery) {
      queuedDiscovery = false
      later(() => discover(), 450)
    } else if (pendingVisit) {
      pendingVisit = false
      later(visit, 600)
    }
    scheduleIdle()
  }
  const play = (
    name: Scene,
    duration: number,
    draw: (elapsed: number) => void,
  ) => {
    clearScene()
    clearTimeout(idleTimer)
    timers.delete(idleTimer)
    scene = name
    element.dataset.scene = name
    const started = performance.now()
    const frame = (now: number) => {
      if (!active) return
      const elapsed = now - started
      if (elapsed >= duration) {
        finish()
        return
      }
      draw(elapsed)
      raf = requestAnimationFrame(frame)
    }
    draw(0)
    raf = requestAnimationFrame(frame)
  }

  function discover(manual = false) {
    if (!active) return
    if (manual) document.dispatchEvent(new Event("avalon-visitor-started"))
    if (scene === "discovery") {
      if (manual) queuedDiscovery = true
      return
    }
    if (manual) pendingVisit = false
    play("discovery", discoveryDuration, (elapsed) => {
      const t = (elapsed / discoveryDuration) * 6250
      if (t < 360) {
        setPose("reading")
        const wave = Math.sin((t / 360) * Math.PI)
        rig(-0.7 * wave, 0.4 * wave)
      } else if (t < 700) {
        tween("reading", "lean", mentionInbetweens.lean, t - 360, 340)
      } else if (t < 950) {
        setPose("lean")
        rig(-0.6 * Math.sin(((t - 700) / 250) * Math.PI))
      } else if (t < 1420) {
        tween("lean", "discover", mentionInbetweens.lower, t - 950, 470)
      } else if (t < 1630) {
        setPose("discover")
        rig()
      } else if (t < 2300) {
        tween("discover", "show", mentionInbetweens.present, t - 1630, 670)
      } else if (t < 3830) {
        setPose("show")
        const u = t - 2300
        const first = Math.sin(clamp((u - 180) / 510) * Math.PI)
        const second = Math.sin(clamp((u - 830) / 460) * Math.PI)
        const kick = first + second * 0.72
        hand.style.transform = `rotate(${-kick * 2.5}deg)`
        leftFoot.style.transform = `translateY(${-kick * 4}px) rotate(${kick * 12}deg)`
        rightFoot.style.transform = `translateY(${-kick * 3}px) rotate(${-kick * 10}deg)`
        rig(
          -0.7 * Math.sin((u / 1530) * Math.PI * 2),
          -1.2 * Math.sin(clamp(u / 320) * Math.PI),
        )
      } else if (t < 4170) {
        leftFoot.style.removeProperty("transform")
        rightFoot.style.removeProperty("transform")
        hand.style.removeProperty("transform")
        tween("show", "proud", mentionInbetweens.settle, t - 3830, 340)
      } else if (t < 4520) {
        setPose("proud")
        rig(0.45 * Math.sin(((t - 4170) / 350) * Math.PI))
      } else if (t < 5200) {
        tween("proud", "turn", mentionInbetweens.turn, t - 4520, 680)
      } else if (t < 5400) {
        setPose("turn")
        const wave = Math.sin(((t - 5200) / 200) * Math.PI)
        rig(0.2 * wave, -0.5 * wave)
        leaf.style.transform = `rotate(${-2 * wave}deg) scaleX(${1 - 0.08 * wave})`
      } else if (t < 5910) {
        leaf.style.removeProperty("transform")
        tween("turn", "reading", mentionInbetweens.read, t - 5400, 510)
      } else {
        setPose("reading")
        const wave = Math.sin(((t - 5910) / 340) * Math.PI)
        rig(0.4 * wave, 0.25 * wave)
      }
      const speech = ease((t - 2420) / 320) * (1 - ease((t - 4200) / 320))
      bubble.style.opacity = `${speech}`
      bubble.style.visibility = speech > 0 ? "visible" : "hidden"
      delight.style.opacity = `${Math.sin(clamp((t - 2500) / 900) * Math.PI) * 0.75}`
    })
  }

  function idle() {
    const kind = (["turn", "peek", "grip"] as const)[idleIndex++ % 3]
    const duration = kind === "peek" ? 2400 : 2100
    play(kind, duration, (t) => {
      const wave = Math.sin((t / duration) * Math.PI)
      if (kind === "turn") {
        if (t < 230) {
          setPose("reading")
          rig(0.3 * Math.sin((t / 230) * Math.PI))
        } else if (t < 720) {
          tween("reading", "turn", readingToTurn, t - 230, 490)
        } else if (t < 950) {
          setPose("turn")
          const turn = Math.sin(((t - 720) / 230) * Math.PI)
          rig(0.2 * turn, -0.5 * turn)
          leaf.style.transform = `rotate(${-2 * turn}deg) scaleX(${1 - 0.08 * turn})`
        } else if (t < 1500) {
          leaf.style.removeProperty("transform")
          tween("turn", "reading", mentionInbetweens.read, t - 950, 550)
        } else {
          setPose("reading")
          rig(0.3 * Math.sin(((t - 1500) / 600) * Math.PI))
        }
      } else if (kind === "peek") {
        if (t < 500 || t >= 1850) setPose("reading")
        else if (t < 950)
          tween("reading", "curious", mentionInbetweens.curious, t - 500, 450)
        else if (t < 1400) setPose("curious")
        else tween("curious", "reading", curiousToReading, t - 1400, 450)
        if (t >= 950 && t < 1400)
          rig(-0.5 * Math.sin(((t - 950) / 450) * Math.PI))
        else rig()
      } else {
        setPose("reading")
        rig(0.3 * wave, -0.7 * Math.sin((t / duration) * Math.PI * 2))
      }
    })
  }

  function visit() {
    if (!active || scene === "visit") return
    if (scene === "discovery") {
      pendingVisit = true
      return
    }
    const scale = element.clientWidth / 360
    const bw = visitor.offsetWidth,
      bh = visitor.offsetHeight
    const perch: Point = [278 * scale - bw / 2, 140 * scale - (bh * 23) / 32]
    const start: Point = [perch[0] - 55, perch[1] - 48]
    const end: Point = [perch[0] - 35, perch[1] - 65]
    play("visit", 10300, (t) => {
      element.setAttribute("data-visiting", "")
      if (t < 1450 || t >= 9350) setPose("reading")
      else if (t < 1900)
        tween("reading", "curious", mentionInbetweens.curious, t - 1450, 450)
      else if (t < 8900) setPose("curious")
      else tween("curious", "reading", curiousToReading, t - 8900, 450)
      let point: Point,
        opacity = 1,
        paper = 0
      if (t < 3000) {
        const u = ease(t / 3000)
        point = curve(
          start,
          [perch[0] + 20, start[1] - 25],
          [perch[0] + 35, perch[1] - 8],
          perch,
          u,
        )
        opacity = ease(t / 550)
      } else if (t < 6500) {
        element.setAttribute("data-perched", "")
        paper = 1.7 * Math.sin(((t - 3000) / 3500) * Math.PI)
        const angle = (paper * Math.PI) / 180
        // Follow the actual paper corner while she carefully tilts it.
        const dx = 278 - 184,
          dy = 140 - 300
        point = [
          (184 + dx * Math.cos(angle) - dy * Math.sin(angle)) * scale - bw / 2,
          (300 + dx * Math.sin(angle) + dy * Math.cos(angle)) * scale -
            (bh * 23) / 32,
        ]
      } else {
        element.removeAttribute("data-perched")
        const u = ease((t - 6500) / 3400)
        point = curve(
          perch,
          [perch[0] - 35, perch[1] - 15],
          [perch[0] + 15, end[1] - 40],
          end,
          u,
        )
        opacity = 1 - ease((t - 8800) / 1000)
      }
      rig(
        t > 2600 && t < 7000
          ? -0.6 * Math.sin(((t - 2600) / 4400) * Math.PI)
          : 0,
        paper,
      )
      visitor.style.opacity = `${opacity}`
      visitor.style.transform = `translate(${point[0]}px, ${point[1]}px) rotate(${t < 3000 || t > 6500 ? Math.sin(t / 280) * 9 : 0}deg)`
    })
  }

  const reset = () => {
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
    queuedDiscovery = false
    pendingVisit = false
    clearScene()
  }
  const update = () => {
    const next = ready && visible && motionRunning()
    button.disabled = !next
    if (active === next) return
    active = next
    element.toggleAttribute("data-awake", active)
    if (active) {
      scheduleBlink()
      scheduleIdle()
      if (!welcomed) {
        welcomed = true
        later(() => {
          if (scene === "idle") discover()
          else if (scene !== "discovery") queuedDiscovery = true
        }, 1100)
      }
    } else reset()
  }
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.5
      update()
    },
    { threshold: [0, 0.5] },
  ).observe(element)
  observeMotion(update)
  loadCompanionImages(element, () => {
    ready = true
    update()
  })
  button.addEventListener("click", () => discover(true))
  document.addEventListener("avalon-visit", (event) => {
    if (!active) return
    event.preventDefault()
    visit()
  })
  let width = 0
  new ResizeObserver(([entry]) => {
    const next = entry.contentRect.width
    if (width && Math.abs(width - next) > 0.5) {
      reset()
      if (active) {
        scheduleBlink()
        scheduleIdle()
      }
    }
    width = next
  }).observe(element)
}

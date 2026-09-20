import { loadCompanionImages } from "./companion-images"
import { motionRunning, observeMotion } from "./ambient-motion"

type Pose = "proud" | "crouch" | "takeoff" | "air" | "land" | "curious"
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

export function initJumpingCompanion(element: HTMLElement) {
  const button = element.querySelector<HTMLButtonElement>("button")!
  const art = element.querySelector<SVGSVGElement>(".jump-art")!
  const upper = element.querySelector<SVGGElement>(".jump-upper-body")!
  const shadow = element.querySelector<HTMLElement>(".jump-shadow")!
  const bubble = element.querySelector<HTMLElement>("figcaption")!
  const delight = element.querySelector<HTMLElement>(".jump-delight")!
  const visitor = element.querySelector<HTMLElement>(".jump-visitor")!
  const heading = element.closest(".entry-summary")?.querySelector("h2")
  const arms = new Map(
    Array.from(
      element.querySelectorAll<SVGGElement>("[data-pointing-arm]"),
      (node) => {
        const [px, py] = node.dataset.pivot!.split(",").map(Number)
        const [tx, ty] = node.dataset.tip!.split(",").map(Number)
        const [kx, ky] = node.dataset.knuckle!.split(",").map(Number)
        const length = Math.hypot(tx - kx, ty - ky)
        const vx = (tx - kx) / length,
          vy = (ty - ky) / length
        return [
          node.dataset.pointingArm as Pose,
          {
            node,
            px,
            py,
            direction: Math.atan2(vy, vx),
            offset: (tx - px) * vy - (ty - py) * vx,
          },
        ] as const
      },
    ),
  )
  const timers = new Set<number>()
  let ready = false,
    visible = false,
    active = false,
    welcomed = false
  let celebrating = false,
    queuedCelebration = false,
    pendingVisit = false
  let raf = 0,
    blinkTimer = 0
  let flight: Animation | undefined
  let speech: Animation | undefined
  let idle: Animation | undefined
  let pose: Pose = "proud"

  const setPose = (next: Pose) => {
    if (pose === next) return
    pose = next
    element.dataset.pose = next
    element.removeAttribute("data-blinking")
  }
  const later = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer)
      if (active) callback()
    }, delay)
    timers.add(timer)
    return timer
  }
  const clearTimers = () => {
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
  }
  const blink = () => {
    if (!active || pose !== "proud" || celebrating) return
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
      3300 + Math.random() * 3900,
    )

  const scheduleIdle = () =>
    later(
      () => {
        if (!celebrating && !flight) {
          idle?.cancel()
          // A quick, proud nod at the waist; her boots never leave the ground.
          idle = upper.animate(
            [
              { transform: "rotate(0deg)" },
              { transform: "rotate(-2.4deg)", offset: 0.32 },
              { transform: "rotate(.65deg)", offset: 0.7 },
              { transform: "rotate(0deg)" },
            ],
            { duration: 1100, easing: "cubic-bezier(.22,1,.36,1)" },
          )
          later(blink, 480)
        }
        scheduleIdle()
      },
      8500 + Math.random() * 5500,
    )

  const endVisit = () => {
    flight?.cancel()
    flight = undefined
    element.removeAttribute("data-visiting")
    element.removeAttribute("data-perched")
    setPose("proud")
  }

  function celebrate(manual = false) {
    if (!active) return
    if (celebrating) {
      if (manual) queuedCelebration = true
      return
    }
    if (flight) {
      endVisit()
      clearTimers()
      scheduleBlink()
      scheduleIdle()
    }
    if (manual) document.dispatchEvent(new Event("avalon-visitor-started"))
    idle?.cancel()
    celebrating = true
    element.setAttribute("data-celebrating", "")
    element.removeAttribute("data-blinking")
    const started = performance.now()
    const jumpHeight = Math.min(30, element.clientWidth * 0.23)
    const bubbleAbove = getComputedStyle(bubble).bottom !== "auto"
    // Cache layout once. The title and character scroll together; a resize cancels the scene.
    const screen = art.getScreenCTM()
    const headingBox = heading?.getBoundingClientRect()
    const target =
      screen && headingBox
        ? new DOMPoint(
            headingBox.left + headingBox.width * 0.75,
            headingBox.top + headingBox.height * 0.52,
          ).matrixTransform(screen.inverse())
        : undefined
    const artScale = screen ? Math.hypot(screen.a, screen.b) : 1

    const aimArm = (nextPose: Pose, y: number, bodyAngle: number) => {
      const arm = arms.get(nextPose)
      if (!arm || !target) return
      // Undo the body's jump/rotation about (300, 600), then aim the actual
      // index-finger ray at the title. The sleeve overlaps at the elbow joint.
      const radians = (bodyAngle * Math.PI) / 180
      const dx = target.x - 300,
        dy = target.y - 600 - y / artScale
      const x = 300 + dx * Math.cos(radians) + dy * Math.sin(radians) - arm.px
      const localY =
        600 - dx * Math.sin(radians) + dy * Math.cos(radians) - arm.py
      const distance = Math.hypot(x, localY)
      const correction = Math.asin(
        Math.max(-1, Math.min(1, arm.offset / distance)),
      )
      const angle = Math.atan2(localY, x) - arm.direction + correction
      const degrees =
        (Math.atan2(Math.sin(angle), Math.cos(angle)) * 180) / Math.PI
      arm.node.setAttribute(
        "transform",
        `rotate(${Math.max(-80, Math.min(20, degrees))} ${arm.px} ${arm.py})`,
      )
    }
    speech?.cancel()
    speech = bubble.animate(
      [
        { opacity: 0, transform: "translateY(5px) rotate(-5deg)" },
        {
          opacity: 1,
          transform: "translateY(-3px) rotate(5deg)",
          offset: 0.52,
        },
        { opacity: 1, transform: "translateY(0) rotate(3deg)" },
      ],
      {
        duration: 620,
        delay: 310,
        fill: "backwards",
        easing: "cubic-bezier(.22,1,.36,1)",
      },
    )

    const tick = (now: number) => {
      if (!active) return
      const t = now - started
      let nextPose: Pose = "proud",
        y = 0,
        angle = 0,
        lift = 0
      if (t < 130) {
        upper.style.transform = `rotate(${(-1.6 * t) / 130}deg)`
      } else if (t < 250) {
        nextPose = "crouch"
      } else if (t < 910) {
        const u = (t - 250) / 660
        lift = 4 * u * (1 - u)
        y = -jumpHeight * lift
        angle = -4 * Math.sin(u * Math.PI)
        nextPose = u < 0.14 || u > 0.84 ? "takeoff" : "air"
      } else if (t < 1090) {
        nextPose = "land"
      } else if (t < 1610) {
        const u = (t - 1090) / 520
        lift = 4 * u * (1 - u) * 0.52
        y = -jumpHeight * lift
        angle = -2.2 * Math.sin(u * Math.PI)
        nextPose = u < 0.17 || u > 0.83 ? "takeoff" : "air"
      } else if (t < 1760) {
        nextPose = "land"
      } else {
        // The last little nod and dress settling are separate from the jump arc.
        const u = Math.min(1, (t - 1760) / 650)
        upper.style.transform = `rotate(${-2.2 * Math.sin(u * Math.PI * 2) * (1 - u)}deg)`
      }
      setPose(nextPose)
      art.style.transform = `translateY(${y}px) rotate(${angle}deg)`
      aimArm(nextPose, y, angle)
      bubble.style.translate = bubbleAbove ? `0 ${y * 0.9}px` : "none"
      delight.style.translate = `0 ${y}px`
      shadow.style.transform = `scaleX(${1 - lift * 0.43})`
      shadow.style.opacity = `${1 - lift * 0.55}`
      delight.style.opacity =
        t > 420 && t < 810
          ? `${Math.sin(((t - 420) / 390) * Math.PI) * 0.8}`
          : "0"
      if (t < 2440) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
        celebrating = false
        element.removeAttribute("data-celebrating")
        art.style.removeProperty("transform")
        for (const { node } of arms.values()) node.removeAttribute("transform")
        bubble.style.removeProperty("translate")
        delight.style.removeProperty("translate")
        upper.style.removeProperty("transform")
        shadow.style.removeProperty("transform")
        shadow.style.removeProperty("opacity")
        later(blink, 160)
        if (queuedCelebration) {
          queuedCelebration = false
          later(() => celebrate(true), 400)
        } else if (pendingVisit) {
          pendingVisit = false
          later(visit, 650)
        }
      }
    }
    raf = requestAnimationFrame(tick)
  }

  function visit() {
    if (!active || flight) return
    if (celebrating) {
      pendingVisit = true
      return
    }
    idle?.cancel()
    element.setAttribute("data-visiting", "")
    const { width: w, height: h } = element.getBoundingClientRect()
    const { width: bw, height: bh } = visitor.getBoundingClientRect()
    const perch: Point = [
      (w * 88) / 480 - bw / 2,
      (h * 195) / 640 - (bh * 23) / 32,
    ]
    const frames: Keyframe[] = []
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const [x, y] = curve(
        [w * 0.7, -50],
        [w * 1.1, -40],
        [w * 0.1, -10],
        perch,
        1 - (1 - t) ** 2,
      )
      frames.push({
        offset: t * 0.38,
        transform: `translate(${x}px,${y}px) rotate(${Math.sin(t * Math.PI * 2) * 12}deg)`,
        opacity: Math.min(1, t * 6),
      })
    }
    frames.push({
      offset: 0.67,
      transform: `translate(${perch[0]}px,${perch[1]}px) rotate(0deg)`,
      opacity: 1,
    })
    for (let i = 1; i <= 36; i++) {
      const t = i / 36
      const [x, y] = curve(
        perch,
        [w * 0.15, -20],
        [w * 0.9, -60],
        [w * 0.5, -85],
        t * t,
      )
      frames.push({
        offset: 0.67 + t * 0.33,
        transform: `translate(${x}px,${y}px) rotate(${Math.sin(t * Math.PI * 2) * -16}deg)`,
        opacity: Math.min(1, (1 - t) * 6),
      })
    }
    flight = visitor.animate(frames, {
      duration: 11500,
      fill: "both",
      easing: "linear",
    })
    later(() => setPose("curious"), 3600)
    later(() => element.setAttribute("data-perched", ""), 4370)
    later(() => element.removeAttribute("data-perched"), 7705)
    later(() => setPose("proud"), 8600)
    flight.onfinish = () => {
      endVisit()
      later(() => celebrate(), 450)
    }
  }

  const reset = () => {
    clearTimers()
    cancelAnimationFrame(raf)
    raf = 0
    endVisit()
    speech?.cancel()
    idle?.cancel()
    celebrating = false
    queuedCelebration = false
    pendingVisit = false
    for (const name of ["data-blinking", "data-celebrating"])
      element.removeAttribute(name)
    art.style.removeProperty("transform")
    for (const { node } of arms.values()) node.removeAttribute("transform")
    bubble.style.removeProperty("translate")
    delight.style.removeProperty("translate")
    upper.style.removeProperty("transform")
    shadow.style.removeProperty("transform")
    shadow.style.removeProperty("opacity")
    delight.style.opacity = "0"
  }
  const update = () => {
    const next = ready && visible && motionRunning()
    button.disabled = !next
    if (next === active) return
    active = next
    element.toggleAttribute("data-awake", active)
    if (active) {
      scheduleBlink()
      scheduleIdle()
      if (!welcomed) {
        welcomed = true
        later(() => celebrate(), 700)
      }
    } else reset()
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
  loadCompanionImages(element, () => {
    ready = true
    update()
  })
  button.addEventListener("click", () => celebrate(true))
  document.addEventListener("avalon-visit", (event) => {
    if (!active) return
    event.preventDefault()
    visit()
  })
  let lastWidth = 0
  new ResizeObserver(([entry]) => {
    const width = entry.contentRect.width
    if (
      lastWidth &&
      Math.abs(width - lastWidth) > 0.5 &&
      (flight || celebrating)
    ) {
      reset()
      if (active) {
        scheduleBlink()
        scheduleIdle()
      }
    }
    lastWidth = width
  }).observe(element)
}

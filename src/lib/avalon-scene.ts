import { motionRunning, observeMotion } from "./ambient-motion"

// Fixed, repeatable variation keeps the meadow stable through resizes.
const noise = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}
const tau = Math.PI * 2
const visitorClockKey = "avalon-visitor-remaining"

// Count visible browsing time across pages, independently of the scene's clock.
function remainingVisitDelay() {
  try {
    const saved = sessionStorage.getItem(visitorClockKey)
    const seconds = Number(saved)
    if (
      saved !== null &&
      Number.isFinite(seconds) &&
      seconds >= 0 &&
      seconds <= 70
    )
      return Math.max(2, seconds)
  } catch {
    // The scene also works when storage is unavailable.
  }
  return 10
}

export function initAvalon(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) return
  const ctx = context
  let width = 0
  let height = 0
  let edge = 0
  let time = 0
  let lastFrame = 0
  let raf = 0
  let night = 0
  let targetNight = 0
  let nextVisit = remainingVisitDelay()
  let visitorStart = -100
  const themeQuery = matchMedia("(prefers-color-scheme: dark)")
  const saveVisitDelay = () => {
    try {
      sessionStorage.setItem(
        visitorClockKey,
        Math.max(0, nextVisit - time).toFixed(3),
      )
    } catch {}
  }
  const scheduleNextVisit = () => {
    nextVisit = time + 42 + noise(Math.floor(time)) * 28
    saveVisitDelay()
  }
  const particles = Array.from({ length: 22 }, (_, i) => ({
    side: i % 2 ? 1 : -1,
    x: noise(i + 1),
    y: noise(i + 60),
    phase: noise(i + 80) * tau,
    speed: 0.35 + noise(i + 120) * 0.6,
    size: 0.7 + noise(i + 160) * 1.1,
  }))

  const resize = () => {
    width = canvas.clientWidth
    height = canvas.clientHeight
    const ratio = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    edge =
      width >= 1280
        ? Math.max(70, (width - 1215) / 2 + 85)
        : width >= 1024
          ? 28
          : 12
  }
  const theme = () => {
    const preference = document.documentElement.dataset.theme
    targetNight =
      preference === "dark" || (!preference && themeQuery.matches) ? 1 : 0
  }

  function grass() {
    const count = width < 1024 ? 5 : 19
    for (const side of [-1, 1]) {
      for (let i = 0; i < count; i++) {
        const seed = i + (side === 1 ? 75 : 0)
        const reach = width < 1024 ? 15 : Math.min(edge * 0.75, 120)
        const root = noise(seed + 2) * reach
        const x = side < 0 ? root : width - root
        const length =
          (width < 1024 ? 20 : 38) + noise(seed + 5) * (width < 1024 ? 30 : 72)
        const sway =
          Math.sin(time * 0.6 + root * 0.024) * 5 + Math.sin(time * 0.21) * 7
        const bend = (noise(seed + 8) - 0.5) * 24 + sway
        const tipX = x + bend
        const tipY = height - length
        ctx.fillStyle =
          night > 0.5 ? "rgba(133,154,137,0.13)" : "rgba(132,145,104,0.22)"
        ctx.beginPath()
        ctx.moveTo(x - 0.8, height + 3)
        ctx.quadraticCurveTo(x + bend * 0.15, height - length * 0.6, tipX, tipY)
        ctx.quadraticCurveTo(
          x + bend * 0.4 + 1,
          height - length * 0.5,
          x + 1.3,
          height + 3,
        )
        ctx.fill()
        if (i % 4 === 0) {
          ctx.save()
          ctx.translate(tipX, tipY)
          ctx.rotate(bend * 0.018)
          ctx.fillStyle =
            night > 0.5 ? "rgba(176,172,140,0.16)" : "rgba(159,139,94,0.25)"
          for (let j = 0; j < 4; j++) {
            ctx.beginPath()
            ctx.ellipse(
              (j % 2 ? 1 : -1) * 1.5,
              j * 3,
              1.5,
              3.3,
              j % 2 ? 0.5 : -0.5,
              0,
              tau,
            )
            ctx.fill()
          }
          ctx.restore()
        }
      }
    }
  }

  function motes() {
    const count = width < 1024 ? 6 : particles.length
    for (const p of particles.slice(0, count)) {
      const drift =
        Math.sin(time * 0.16 * p.speed + p.phase) * Math.min(18, edge / 3)
      const rawX = 4 + p.x * Math.max(1, edge - 12) + drift
      const x = p.side < 0 ? rawX : width - rawX
      const y = height * (0.26 + ((p.y + time * 0.003 * p.speed) % 0.74))
      const pulse = Math.pow((Math.sin(time * p.speed + p.phase) + 1) / 2, 2)
      const alpha = 0.12 + pulse * 0.38
      ctx.globalAlpha = alpha * (width < 1024 ? 0.6 : 1)
      if (night > 0.01) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, p.size * 4.5)
        glow.addColorStop(0, `rgba(226,226,153,${night * 0.65})`)
        glow.addColorStop(0.25, `rgba(178,210,148,${night * 0.2})`)
        glow.addColorStop(1, "rgba(162,192,148,0)")
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, p.size * 4.5, 0, tau)
        ctx.fill()
      }
      ctx.fillStyle = night > 0.5 ? "#e5e3ad" : "#b9a273"
      ctx.beginPath()
      ctx.ellipse(
        x,
        y,
        p.size * (1 - night * 0.35),
        p.size * 0.65,
        p.phase + time * 0.15,
        0,
        tau,
      )
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // A visitor for pages without a visible companion.
  function visitor() {
    const progress = (time - visitorStart) / 13
    if (progress < 0 || progress > 1 || width < 640) return
    const envelope = Math.min(1, progress * 5, (1 - progress) * 5)
    const x = edge * 0.5 + Math.sin(progress * tau) * Math.min(edge * 0.4, 60)
    const y =
      height * 0.65 -
      Math.sin(progress * Math.PI) * 130 +
      Math.sin(time * 2) * 4
    const flap = 0.25 + Math.abs(Math.sin(time * 13)) * 0.75
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.sin(time * 1.3) * 0.25)
    ctx.globalAlpha = envelope * 0.7
    ctx.fillStyle = night > 0.5 ? "#c8d5bf" : "#b7a16f"
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(side * 4 * flap, -2, 4.5 * flap, 6.5, side * 0.4, 0, tau)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(side * 3 * flap, 4, 3.4 * flap, 4, -side * 0.3, 0, tau)
      ctx.fill()
    }
    ctx.strokeStyle = night > 0.5 ? "#859080" : "#7e704c"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, -5)
    ctx.lineTo(0, 6)
    ctx.stroke()
    ctx.restore()
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (now - lastFrame < 1000 / 30) return
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0
    lastFrame = now
    time += dt
    night += (targetNight - night) * Math.min(1, dt * 2)
    ctx.clearRect(0, 0, width, height)
    grass()
    motes()
    visitor()
    if (time >= nextVisit) {
      const event = new CustomEvent("avalon-visit", { cancelable: true })
      if (document.dispatchEvent(event)) visitorStart = time
      scheduleNextVisit()
    }
  }

  const update = () => {
    if (motionRunning() && !raf) {
      lastFrame = 0
      raf = requestAnimationFrame(frame)
    } else if (!motionRunning()) {
      saveVisitDelay()
      cancelAnimationFrame(raf)
      raf = 0
      ctx.clearRect(0, 0, width, height)
    }
  }

  resize()
  theme()
  night = targetNight
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  const themeObserver = new MutationObserver(theme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  })
  themeQuery.addEventListener("change", theme)
  document.addEventListener("avalon-visitor-started", scheduleNextVisit)
  addEventListener("pagehide", saveVisitDelay)
  addEventListener("pageshow", (event) => {
    if (!event.persisted) return
    nextVisit = time + remainingVisitDelay()
    visitorStart = -100
    lastFrame = 0
  })
  saveVisitDelay()
  observeMotion(update)
}

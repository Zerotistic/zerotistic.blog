import { haptic } from "./haptics"

function initTouchFeedback() {
  let pressed: HTMLElement | undefined
  let pointerId: number | undefined

  const clear = (event?: Event) => {
    if (event instanceof PointerEvent && event.pointerId !== pointerId) return
    pressed?.removeAttribute("data-pressed")
    pressed = undefined
    pointerId = undefined
  }

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!event.isPrimary) return
      clear()
      if (event.pointerType === "mouse" || !(event.target instanceof Element))
        return
      const target = event.target.closest<HTMLElement>(
        'a[href], button:enabled, summary, label:has(> input[type="checkbox"])',
      )
      if (!target || target.getAttribute("aria-disabled") === "true") return
      pressed = target
      pointerId = event.pointerId
      target.setAttribute("data-pressed", "")
    },
    { passive: true },
  )

  document.addEventListener("pointerup", clear, { passive: true })
  document.addEventListener("pointercancel", clear, { passive: true })
  document.addEventListener("scroll", clear, { capture: true, passive: true })
  addEventListener("blur", clear)
  addEventListener("pagehide", clear)
}

function initTooltips() {
  // One shared label for icon-only controls. Mark a control with
  // `data-tooltip` (empty means: use its aria-label). The first tooltip waits
  // a beat; moving to a neighbor right after shows the next one at once.
  const tip = document.createElement("div")
  tip.className = "tooltip"
  tip.setAttribute("aria-hidden", "true")
  document.body.append(tip)

  let current: HTMLElement | undefined
  let showTimer: ReturnType<typeof setTimeout> | undefined
  let lastHidden = Number.NEGATIVE_INFINITY

  const labelOf = (element: HTMLElement) =>
    element.dataset.tooltip || element.getAttribute("aria-label") || ""

  const place = (element: HTMLElement) => {
    tip.textContent = labelOf(element)
    const anchor = element.getBoundingClientRect()
    const { width, height } = tip.getBoundingClientRect()
    const above = anchor.top - height - 8 >= 8
    const top = above ? anchor.top - height - 8 : anchor.bottom + 8
    const left = Math.min(
      Math.max(8, anchor.left + anchor.width / 2 - width / 2),
      innerWidth - width - 8,
    )
    tip.style.left = `${left}px`
    tip.style.top = `${top}px`
    tip.style.transformOrigin = `${anchor.left + anchor.width / 2 - left}px ${above ? "100%" : "0"}`
  }

  const show = (element: HTMLElement, instant = false) => {
    clearTimeout(showTimer)
    current = element
    if (
      !labelOf(element) ||
      element.matches(":disabled, [aria-disabled='true']")
    )
      return
    const reveal = () => {
      place(element)
      tip.setAttribute("data-visible", "")
    }
    if (instant || performance.now() - lastHidden < 500) reveal()
    else showTimer = setTimeout(reveal, 400)
  }

  const hide = () => {
    clearTimeout(showTimer)
    if (tip.hasAttribute("data-visible")) lastHidden = performance.now()
    tip.removeAttribute("data-visible")
    current = undefined
  }

  const target = (event: Event) =>
    event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-tooltip]")
      : null

  document.addEventListener("pointerover", (event) => {
    if (event.pointerType !== "mouse") return
    const element = target(event)
    if (element && element !== current) show(element)
  })
  document.addEventListener("pointerout", (event) => {
    const element = target(event)
    if (element && !element.contains(event.relatedTarget as Node | null)) hide()
  })
  document.addEventListener("focusin", (event) => {
    const element = target(event)
    if (element?.matches(":focus-visible")) show(element, true)
  })
  document.addEventListener("focusout", hide)
  document.addEventListener("pointerdown", hide)
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide()
  })
  addEventListener("scroll", hide, { passive: true })
}

function initAnchorGlide() {
  // Jumping within a page (contents, a link to another section) glides
  // there instead of cutting; the glide itself shows where you went.
  // Arriving from somewhere else (continue reading, a link or search result
  // with a #section) has no such trail, so the heading you land on is
  // briefly tinted instead. Heading "#" links and the skip link keep their
  // default behavior; with reduced motion the jump is instant.
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")

  const land = (target: Element) => {
    const glow = () => {
      target.removeAttribute("data-landed")
      void (target as HTMLElement).offsetWidth
      target.setAttribute("data-landed", "")
      setTimeout(() => target.removeAttribute("data-landed"), 1600)
    }
    if (reduced.matches || !("onscrollend" in window)) return glow()
    let done = false
    const finish = () => {
      if (done) return
      done = true
      glow()
    }
    addEventListener("scrollend", finish, { once: true })
    // Already in place means no scroll, so no scrollend either.
    setTimeout(finish, 900)
  }

  document.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const link = (event.target as Element).closest?.<HTMLAnchorElement>(
      "a[href^='#']",
    )
    if (
      !link ||
      link.hash.length < 2 ||
      link.matches("[data-heading-anchor], .skip-link") ||
      !link.closest("page-toc, prose-content")
    )
      return
    let target: HTMLElement | null = null
    try {
      target = document.getElementById(decodeURIComponent(link.hash.slice(1)))
    } catch {}
    if (!target) return
    event.preventDefault()
    history.pushState(null, "", link.hash)
    target.scrollIntoView({
      behavior: reduced.matches ? "auto" : "smooth",
      block: "start",
    })
  })

  // Arriving on this page at a #section.
  if (location.hash.length > 1) {
    let target: HTMLElement | null = null
    try {
      target = document.getElementById(
        decodeURIComponent(location.hash.slice(1)),
      )
    } catch {}
    if (target?.matches("h1, h2, h3, h4, h5, h6")) land(target)
  }

  // Shared with "continue reading" (ResumeReading).
  addEventListener("site:land", (event) => {
    const target = (event as CustomEvent<Element>).detail
    if (target) land(target)
  })
}

function initThemeToggle() {
  const root = document.documentElement
  const system = matchMedia("(prefers-color-scheme: dark)")
  const button = document.getElementById("theme-toggle")

  const isDark = () =>
    root.dataset.theme === "dark" || (!root.dataset.theme && system.matches)

  const label = () =>
    button?.setAttribute(
      "aria-label",
      isDark() ? "Switch to light theme" : "Switch to dark theme",
    )

  // Swap colors in a single frame: no element gets to transition its own
  // color at its own speed while the theme changes.
  const withoutTransitions = (change: () => void) => {
    root.setAttribute("data-theme-switching", "")
    change()
    void getComputedStyle(root).color
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.removeAttribute("data-theme-switching")),
    )
  }

  // `null` follows the operating system again.
  const apply = (theme: "light" | "dark" | null) =>
    withoutTransitions(() => {
      if (theme) root.dataset.theme = theme
      else delete root.dataset.theme
      label()
    })

  button?.addEventListener("click", () => {
    haptic("light")
    const next = isDark() ? "light" : "dark"
    // Picking what the OS already asks for means "follow the OS" again,
    // so a later system change still applies.
    const matchesSystem = (next === "dark") === system.matches
    try {
      if (matchesSystem) localStorage.removeItem("theme")
      else localStorage.theme = next
    } catch {}
    apply(matchesSystem ? null : next)
  })

  addEventListener("storage", (event) => {
    if (event.key !== "theme") return
    const theme = event.newValue
    apply(theme === "light" || theme === "dark" ? theme : null)
  })

  system.addEventListener("change", () => {
    if (!root.dataset.theme) withoutTransitions(label)
  })

  label()
}

function initScrollEdges() {
  class ScrollEdges extends HTMLElement {
    scroller?: HTMLElement
    observer?: ResizeObserver

    update = () => {
      if (!this.scroller) return
      const { scrollLeft, scrollWidth, clientWidth } = this.scroller
      this.toggleAttribute("data-overflow-start", scrollLeft > 1)
      this.toggleAttribute(
        "data-overflow-end",
        scrollWidth - clientWidth - scrollLeft > 1,
      )
    }

    connectedCallback() {
      const scroller = this.firstElementChild
      if (!(scroller instanceof HTMLElement)) return
      this.scroller = scroller
      scroller.addEventListener("scroll", this.update, { passive: true })
      this.observer = new ResizeObserver(this.update)
      this.observer.observe(scroller)
      for (const child of scroller.children) this.observer.observe(child)
      this.update()
    }

    disconnectedCallback() {
      this.scroller?.removeEventListener("scroll", this.update)
      this.observer?.disconnect()
    }
  }

  if (!customElements.get("scroll-edges"))
    customElements.define("scroll-edges", ScrollEdges)
}

function initSidebarNav() {
  const mobileNavigation = matchMedia("(width < 64rem)")

  document
    .querySelectorAll<HTMLElement>("[data-site-links]")
    .forEach((links) => {
      const reveal = (link: HTMLAnchorElement | null) => {
        if (!mobileNavigation.matches || !link) return
        const bounds = links.getBoundingClientRect()
        const item = link.getBoundingClientRect()
        // Scroll only the link strip, never the page or its hash destination.
        if (item.left < bounds.left) links.scrollLeft += item.left - bounds.left
        else if (item.right > bounds.right)
          links.scrollLeft += item.right - bounds.right
      }

      const revealCurrent = () =>
        reveal(
          links.querySelector<HTMLAnchorElement>(
            ":scope > li > a[aria-current]",
          ),
        )
      links.addEventListener("focusin", (event) => {
        if (event.target instanceof Element) reveal(event.target.closest("a"))
      })

      new ResizeObserver(revealCurrent).observe(links)
      document.fonts.ready.then(revealCurrent)
      mobileNavigation.addEventListener("change", revealCurrent)
    })
}

function initSearchTrigger() {
  const opener = document.querySelector<HTMLButtonElement>("#search-open")
  const dialog = document.querySelector<HTMLDialogElement>("#search")
  if (!opener || !dialog) return

  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ?? navigator.userAgent
  const mac = /Mac|iPhone|iPad|iPod/i.test(platform)
  opener.dataset.tooltip = `Search  ${mac ? "⌘K" : "Ctrl K"}`

  let loading: Promise<typeof import("./search")> | undefined
  const load = () => (loading ??= import("./search"))
  const warm = () => void load().then((m) => m.warmSearch())

  opener.addEventListener("pointerenter", warm, { once: true })
  opener.addEventListener("focus", warm, { once: true })
  opener.addEventListener("click", () => {
    void load().then((m) => m.openSearch())
  })

  document.addEventListener("keydown", (event) => {
    const typing =
      event.target instanceof HTMLElement &&
      (event.target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))
    if (
      (event.key === "k" || event.key === "K") &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault()
      void load().then((m) => m.toggleSearch())
    } else if (event.key === "/" && !typing && !dialog.open) {
      event.preventDefault()
      void load().then((m) => m.openSearch())
    }
  })
}

function initAvalonTrigger() {
  const scene = document.querySelector<HTMLElement>(".avalon-scene")
  const [left, right] =
    document.querySelectorAll<HTMLCanvasElement>(".avalon-life")
  if (!scene || !left || !right) return

  const wide = matchMedia("(width >= 64rem)")
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  let started = false

  const start = () => {
    if (started || !wide.matches || reduced.matches) return
    started = true
    wide.removeEventListener("change", schedule)
    reduced.removeEventListener("change", schedule)
    void import("./avalon-scene").then(({ initAvalon }) => {
      initAvalon(scene, left, right)
    })
  }

  const schedule = () => {
    if (started || !wide.matches || reduced.matches) return
    const run = () => {
      if ("requestIdleCallback" in window)
        window.requestIdleCallback(start, { timeout: 1000 })
      else setTimeout(start, 0)
    }
    if (document.readyState === "complete") run()
    else addEventListener("load", run, { once: true })
  }

  wide.addEventListener("change", schedule)
  reduced.addEventListener("change", schedule)
  schedule()
}

function initArtoriaTrigger() {
  const elements = [...document.querySelectorAll<HTMLElement>(".artoria")]
  const inline = elements.filter((el) =>
    el.classList.contains("artoria-inline"),
  )
  const companions = elements.filter(
    (el) => !el.classList.contains("artoria-inline"),
  )

  if (inline.length) {
    void import("./artoria-frame-player").then(({ initArtoriaFrames }) => {
      for (const element of inline) initArtoriaFrames(element)
    })
  }

  if (companions.length) {
    let modulePromise: Promise<typeof import("./artoria-companion")> | undefined
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const element = entry.target as HTMLElement
          observer.unobserve(element)
          for (const image of element.querySelectorAll<SVGImageElement>(
            "image[data-pose-src]",
          )) {
            image.setAttribute("href", image.dataset.poseSrc!)
            delete image.dataset.poseSrc
          }
          void (modulePromise ??= import("./artoria-companion")).then(
            ({ initArtoria }) => initArtoria(element),
          )
        }
      },
      { rootMargin: "300px" },
    )
    for (const element of companions) observer.observe(element)
  }
}

initTouchFeedback()
initTooltips()
initAnchorGlide()
initThemeToggle()
initScrollEdges()
initSidebarNav()
initSearchTrigger()
initAvalonTrigger()
initArtoriaTrigger()

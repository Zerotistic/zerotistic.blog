import type { LinkPreview } from "./link-previews"
import { closeOnBack } from "./overlay-history"

let initialized = false
const triggers = new Map<
  HTMLAnchorElement,
  { button: HTMLButtonElement; data: LinkPreview }
>()
let scheduleHover:
  | ((
      anchor: HTMLAnchorElement,
      button: HTMLButtonElement,
      data: LinkPreview,
    ) => void)
  | undefined

export function initLinkPreviews(initial?: {
  anchor: HTMLAnchorElement
  kind: "hover" | "focus"
}) {
  if (!initialized) {
    initialized = true
    const panel = document.querySelector<HTMLDialogElement>("#link-preview")
    if (!panel) return
    const heading = panel.querySelector<HTMLElement>("h2")!
    const description = panel.querySelector<HTMLElement>(
      ".preview-description",
    )!
    const site = panel.querySelector<HTMLElement>(".preview-site")!
    const image = panel.querySelector<HTMLImageElement>("img")!
    const openLink = document.createElement("a")
    openLink.className = "preview-open"
    const touch = matchMedia(
      "(hover: none), (pointer: coarse), (width < 40rem)",
    )
    let current: HTMLButtonElement | undefined
    let hoverTimer: ReturnType<typeof setTimeout> | undefined
    let closeTimer: ReturnType<typeof setTimeout> | undefined
    let savedOverflow: string | undefined
    let explicitOpen = false
    let openedAt = 0

    const cancelTimers = () => {
      clearTimeout(hoverTimer)
      clearTimeout(closeTimer)
    }
    const cleanup = () => {
      current?.setAttribute("aria-expanded", "false")
      if (savedOverflow !== undefined) {
        document.documentElement.style.overflow = savedOverflow
        savedOverflow = undefined
      }
      // Let the exit animation finish before the image goes blank.
      setTimeout(() => {
        if (!panel.open) image.removeAttribute("src")
      }, 250)
    }
    const hide = () => {
      cancelTimers()
      if (panel.open) panel.close()
      cleanup()
    }
    panel.addEventListener("close", () => {
      if (!panel.open) cleanup()
    })
    // On touch the sheet is modal; the back gesture closes it.
    const back = closeOnBack(panel, hide)
    panel.querySelector("button")!.addEventListener("click", hide)
    panel.addEventListener("click", (event) => {
      if (event.target !== panel) return
      const rect = panel.getBoundingClientRect()
      if (
        event.clientY < rect.top ||
        event.clientX < rect.left ||
        event.clientX > rect.right
      )
        hide()
    })
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && panel.open) {
        event.preventDefault()
        const returnFocus = panel.contains(document.activeElement)
        hide()
        if (returnFocus) current?.focus()
      }
    })
    document.addEventListener("pointerdown", (event) => {
      if (
        !touch.matches &&
        panel.open &&
        !panel.contains(event.target as Node) &&
        event.target !== current
      )
        hide()
    })
    const scheduleClose = () => {
      clearTimeout(hoverTimer)
      if (!touch.matches && !panel.contains(document.activeElement))
        closeTimer = setTimeout(hide, 180)
    }
    panel.addEventListener("pointerenter", cancelTimers)
    panel.addEventListener("pointerleave", scheduleClose)
    panel.addEventListener("focusout", () => {
      setTimeout(() => {
        if (
          panel.open &&
          explicitOpen &&
          !touch.matches &&
          !panel.contains(document.activeElement) &&
          document.activeElement !== current
        )
          hide()
      }, 0)
    })
    addEventListener(
      "scroll",
      () => {
        if (
          panel.open &&
          !touch.matches &&
          performance.now() - openedAt > 150 &&
          !panel.contains(document.activeElement)
        )
          hide()
      },
      { passive: true },
    )
    addEventListener("resize", hide)
    touch.addEventListener("change", hide)

    const show = (
      anchor: HTMLAnchorElement,
      button: HTMLButtonElement,
      data: LinkPreview,
      explicit: boolean,
    ) => {
      hide()
      current = button
      explicitOpen = explicit
      panel.dataset.hover = String(!explicit && !touch.matches)
      openedAt = performance.now()
      heading.textContent = data.title
      description.textContent = data.description ?? ""
      description.hidden = !data.description
      const url = new URL(anchor.href)
      site.textContent =
        url.host === location.host
          ? "zerotistic.blog"
          : url.hostname.replace(/^www\./, "")
      openLink.href = anchor.href
      openLink.setAttribute("aria-label", `Open ${data.title}`)
      openLink.target = anchor.target
      openLink.rel = "noopener noreferrer"
      if (!openLink.isConnected)
        panel.querySelector(".preview-copy")!.append(openLink)
      // Images are build assets or cached copies, never third-party hover requests.
      image.hidden = !data.image
      if (data.image) image.src = data.image
      image.onerror = () => {
        image.hidden = true
      }
      button.setAttribute("aria-expanded", "true")
      if (touch.matches) {
        panel.showModal()
        back.opened()
        savedOverflow = document.documentElement.style.overflow
        document.documentElement.style.overflow = "hidden"
        // Short sheets drag from anywhere; long ones scroll and drag by the handle.
        panel.style.touchAction =
          panel.scrollHeight > panel.clientHeight ? "" : "none"
      } else {
        const focus = document.activeElement as HTMLElement | null
        panel.show()
        const rect = anchor.getBoundingClientRect()
        // Layout size, not the box mid scale animation.
        const height = panel.offsetHeight
        const width = panel.offsetWidth
        const left = Math.max(12, Math.min(rect.left, innerWidth - width - 12))
        const below = rect.bottom + height + 12 < innerHeight
        const top = Math.max(
          12,
          below ? rect.bottom + 10 : rect.top - height - 10,
        )
        panel.style.left = `${left}px`
        panel.style.top = `${top}px`
        // Grow out of the link that opened it.
        const originX = Math.min(
          Math.max(rect.left + rect.width / 2 - left, 0),
          width,
        )
        panel.style.transformOrigin = `${originX}px ${below ? 0 : height}px`
        if (!explicit) {
          if (focus && focus !== document.body)
            focus.focus({ preventScroll: true })
          else (document.activeElement as HTMLElement | null)?.blur()
        }
      }
    }

    scheduleHover = (anchor, button, data) => {
      if (touch.matches) return
      cancelTimers()
      if (current === button && panel.open) return
      hoverTimer = setTimeout(() => show(anchor, button, data, false), 500)
    }

    openLink.addEventListener("click", () => {
      back.forget()
      hide()
    })

    // Touch: the sheet follows a downward drag and closes when thrown or pulled
    // past a third of its height; otherwise it springs back.
    let drag:
      | { id: number; y: number; t: number; dy: number; v: number }
      | undefined
    let dragged = false
    panel.addEventListener("pointerdown", (event) => {
      if (!touch.matches || event.pointerType === "mouse" || !panel.open) return
      const onHandle = (event.target as Element).closest(".preview-handle")
      if (!onHandle && panel.scrollTop > 0) return
      drag = {
        id: event.pointerId,
        y: event.clientY,
        t: event.timeStamp,
        dy: 0,
        v: 0,
      }
      dragged = false
    })
    panel.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.id) return
      const dy = event.clientY - drag.y
      if (!dragged && dy < 6) return
      if (!dragged) panel.setPointerCapture(drag.id)
      dragged = true
      const dt = Math.max(1, event.timeStamp - drag.t)
      drag.v = (dy - drag.dy) / dt
      drag.dy = dy
      drag.t = event.timeStamp
      // Resist pulling up past the resting position.
      panel.style.translate = `0 ${dy > 0 ? dy : dy / 4}px`
      panel.dataset.dragging = ""
    })
    const release = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return
      const { dy, v } = drag
      drag = undefined
      delete panel.dataset.dragging
      if (!dragged) return
      if (dy > panel.offsetHeight / 3 || v > 0.5) hide()
      panel.style.translate = ""
    }
    panel.addEventListener("pointerup", release)
    panel.addEventListener("pointercancel", release)
    // A drag is not a tap on the link underneath.
    panel.addEventListener(
      "click",
      (event) => {
        if (!dragged) return
        dragged = false
        event.preventDefault()
        event.stopPropagation()
      },
      true,
    )

    document
      .querySelectorAll<HTMLElement>("article[data-link-previews]")
      .forEach((article) => {
        const previews: Record<string, LinkPreview> = JSON.parse(
          article.dataset.linkPreviews || "{}",
        )
        article
          .querySelectorAll<HTMLAnchorElement>("prose-content a[href]")
          .forEach((anchor) => {
            const href = anchor.getAttribute("href")!
            if (
              href.startsWith("#") ||
              anchor.closest(".footnotes, pre, code, h1, h2, h3, h4, h5, h6") ||
              anchor.querySelector("img") ||
              anchor.hasAttribute("data-footnote-ref")
            )
              return
            const url = new URL(anchor.href)
            if (!["http:", "https:"].includes(url.protocol)) return
            url.hash = ""
            url.pathname = url.pathname.replace(/\/$/, "") || "/"
            const key = [location.origin, "https://zerotistic.blog"].includes(
              url.origin,
            )
              ? url.pathname + url.search
              : url.href
            const data = previews[key]
            if (!data?.title) return
            const button = document.createElement("button")
            button.type = "button"
            button.className = "link-preview-trigger"
            button.setAttribute(
              "aria-label",
              `Preview: ${anchor.textContent?.trim() || data.title}`,
            )
            button.setAttribute("aria-haspopup", "dialog")
            button.setAttribute("aria-expanded", "false")
            button.setAttribute("aria-controls", "link-preview")
            button.innerHTML =
              '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="3" width="11" height="10" rx="2"/><path d="M5 6h6M5 9h4"/></svg>'
            anchor.after(button)
            triggers.set(anchor, { button, data })
            button.addEventListener("click", () => {
              if (current === button && panel.open) hide()
              else show(anchor, button, data, true)
            })
            for (const element of [anchor, button]) {
              element.addEventListener("pointerenter", (event) => {
                if (
                  !(event instanceof PointerEvent) ||
                  event.pointerType !== "mouse"
                )
                  return
                scheduleHover?.(anchor, button, data)
              })
              element.addEventListener("pointerleave", scheduleClose)
            }
            // Without a pointer the trigger is hidden, so keyboard focus on the
            // link behaves like hovering it.
            anchor.addEventListener("focus", () => {
              if (!anchor.matches(":focus-visible")) return
              scheduleHover?.(anchor, button, data)
            })
            anchor.addEventListener("blur", scheduleClose)
          })
      })
  }

  if (initial) {
    const entry = triggers.get(initial.anchor)
    if (
      entry &&
      ((initial.kind === "hover" && initial.anchor.matches(":hover")) ||
        (initial.kind === "focus" &&
          document.activeElement === initial.anchor &&
          initial.anchor.matches(":focus-visible")))
    ) {
      scheduleHover?.(initial.anchor, entry.button, entry.data)
    }
  }
}

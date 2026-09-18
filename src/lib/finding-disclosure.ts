export function initFindingDisclosures() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  const controllers = new Map<
    HTMLDetailsElement,
    {
      targetOpen: boolean
      animation?: Animation
      contentAnimation?: Animation
    }
  >()

  const notify = (open: boolean) =>
    document.dispatchEvent(
      new CustomEvent("cve-disclosure", { detail: { open } }),
    )

  const setOpen = (
    details: HTMLDetailsElement,
    open: boolean,
    animate = true,
  ) => {
    const controller = controllers.get(details)
    if (!controller) {
      details.open = open
      return
    }
    const summary = details.querySelector("summary")!
    const content = details.querySelector<HTMLElement>(".record-details")!
    const startHeight = details.getBoundingClientRect().height
    const startOpacity = details.open
      ? Number(getComputedStyle(content).opacity)
      : 0
    controller.animation?.cancel()
    controller.contentAnimation?.cancel()
    controller.targetOpen = open
    const settle = () => {
      details.open = controller.targetOpen
      delete details.dataset.animating
      delete details.dataset.closing
      controller.animation?.cancel()
      controller.contentAnimation?.cancel()
      controller.animation = undefined
      controller.contentAnimation = undefined
    }
    notify(open)
    if (reduced.matches || !animate) {
      settle()
      return
    }
    details.dataset.animating = ""
    details.toggleAttribute("data-closing", !open)
    details.open = true
    const endHeight = open
      ? details.getBoundingClientRect().height
      : summary.getBoundingClientRect().height
    controller.animation = details.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      {
        duration: open ? 240 : 200,
        easing: "cubic-bezier(.22,1,.36,1)",
        fill: "both",
      },
    )
    controller.contentAnimation = content.animate(
      [
        {
          opacity: startOpacity,
          transform: open ? "translateY(3px)" : "translateY(0)",
        },
        { opacity: open ? 1 : 0, transform: "translateY(0)" },
      ],
      { duration: open ? 220 : 140, easing: "ease-out", fill: "both" },
    )
    controller.animation.onfinish = settle
  }

  for (const details of document.querySelectorAll<HTMLDetailsElement>(
    ".finding-details",
  )) {
    const controller = { targetOpen: details.open }
    controllers.set(details, controller)
    details.querySelector("summary")?.addEventListener("click", (event) => {
      event.preventDefault()
      setOpen(details, !controller.targetOpen)
    })
    // Preserve browser Find-in-page and any native/programmatic disclosure.
    details.addEventListener("toggle", () => {
      if (details.hasAttribute("data-animating")) return
      if (controller.targetOpen !== details.open) {
        controller.targetOpen = details.open
        notify(details.open)
      }
    })
  }
  reduced.addEventListener("change", () => {
    if (!reduced.matches) return
    for (const [details, controller] of controllers) {
      if (controller.animation) setOpen(details, controller.targetOpen, false)
    }
  })
  return (details: HTMLDetailsElement) => setOpen(details, true, false)
}

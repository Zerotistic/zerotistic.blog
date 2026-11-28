import { closeOnBack } from "./overlay-history"

let opener: ((img: HTMLImageElement) => void) | undefined

function ensureViewer() {
  if (opener) return opener
  const viewer = document.querySelector<HTMLDialogElement>(".image-viewer")
  if (!viewer) return undefined
  const enlarged = viewer.querySelector("img")!
  const close = viewer.querySelector("button")!
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
  let previousOverflow = ""
  let source: HTMLImageElement | undefined

  // The enlarged image grows out of the one in the article and shrinks back
  // into it, so it's clear where it came from and where it went.
  const morph = (
    update: () => void | Promise<void>,
    from?: HTMLImageElement,
    to?: HTMLImageElement,
  ) => {
    if (
      !document.startViewTransition ||
      reducedMotion.matches ||
      !from ||
      !to
    ) {
      void update()
      return
    }
    from.style.viewTransitionName = "enlarged-image"
    const transition = document.startViewTransition(async () => {
      from.style.viewTransitionName = ""
      to.style.viewTransitionName = "enlarged-image"
      await update()
    })
    transition.finished.finally(() => {
      to.style.viewTransitionName = ""
    })
  }

  const shut = () => {
    if (!viewer.open) return
    morph(() => viewer.close(), enlarged, source)
  }

  const back = closeOnBack(viewer, shut)

  // Clicking anywhere, the picture included, puts it back.
  viewer.addEventListener("click", (event) => {
    if (event.target !== close && !close.contains(event.target as Node)) shut()
  })
  close.addEventListener("click", shut)
  viewer.addEventListener("cancel", (event) => {
    event.preventDefault()
    shut()
  })
  viewer.addEventListener("close", () => {
    document.documentElement.style.overflow = previousOverflow
    enlarged.removeAttribute("src")
  })

  opener = (img: HTMLImageElement) => {
    source = img
    enlarged.alt = img.alt
    morph(
      async () => {
        enlarged.src = img.src || img.currentSrc
        previousOverflow = document.documentElement.style.overflow
        viewer.showModal()
        document.documentElement.style.overflow = "hidden"
        back.opened()
        await enlarged.decode().catch(() => {})
      },
      img,
      enlarged,
    )
  }
  return opener
}

export function openImageViewer(img: HTMLImageElement) {
  ensureViewer()?.(img)
}

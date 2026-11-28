import { copyText } from "./clipboard"

let initialized = false

export function initQuoteLink() {
  if (initialized) return
  initialized = true

  // Select a passage in a post and a small button offers a link straight to
  // it: a text fragment URL that opens the page scrolled to and highlighting
  // that passage. Pointer devices only; touch has its own selection menu.
  const fine = matchMedia("(pointer: fine)")
  const button = document.createElement("button")
  button.type = "button"
  button.className = "quote-link"
  button.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5 9.5 6.5M7 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 0 1 4.5 9l1-1" /></svg><span>Copy link to quote</span>'
  document.body.append(button)
  const label = button.querySelector("span")!
  let url = ""
  let debounce: ReturnType<typeof setTimeout> | undefined
  let reset: ReturnType<typeof setTimeout> | undefined

  // Text fragments reserve "-", "," and "&", so escape them too.
  const encode = (text: string) => encodeURIComponent(text).replace(/-/g, "%2D")

  const hide = () => {
    button.removeAttribute("data-visible")
  }

  const update = () => {
    const selection = getSelection()
    if (
      !fine.matches ||
      !selection ||
      selection.isCollapsed ||
      !selection.rangeCount
    )
      return hide()
    const range = selection.getRangeAt(0)
    const node = range.commonAncestorContainer
    const element = node instanceof Element ? node : node.parentElement
    if (!element?.closest("prose-content") || element.closest(".quote-link"))
      return hide()
    const text = selection.toString().replace(/\s+/g, " ").trim()
    if (text.length < 4) return hide()
    const words = text.split(" ")
    const directive =
      words.length > 10
        ? `${encode(words.slice(0, 4).join(" "))},${encode(words.slice(-4).join(" "))}`
        : encode(text)
    url = `${location.origin}${location.pathname}#:~:text=${directive}`

    const rects = range.getClientRects()
    const end = rects[rects.length - 1] ?? range.getBoundingClientRect()
    label.textContent = "Copy link to quote"
    button.removeAttribute("data-copied")
    const { width, height } = button.getBoundingClientRect()
    const above = end.top - height - 8 >= 8
    const top = above ? end.top - height - 8 : end.bottom + 8
    const left = Math.min(
      Math.max(8, end.right - width / 2),
      innerWidth - width - 8,
    )
    button.style.left = `${left}px`
    button.style.top = `${top}px`
    button.style.transformOrigin = `50% ${above ? "100%" : "0"}`
    button.setAttribute("data-visible", "")
  }

  document.addEventListener("selectionchange", () => {
    clearTimeout(debounce)
    debounce = setTimeout(update, 150)
  })
  // Keep the selection when the button is pressed.
  button.addEventListener("pointerdown", (event) => event.preventDefault())
  button.addEventListener("click", async () => {
    const copied = await copyText(url)
    label.textContent = copied ? "Link copied" : "Couldn’t copy"
    button.toggleAttribute("data-copied", copied)
    clearTimeout(reset)
    reset = setTimeout(hide, 1200)
  })
  addEventListener("scroll", hide, { passive: true })
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide()
  })

  // Handle the selection that triggered lazy loading.
  debounce = setTimeout(update, 150)
}

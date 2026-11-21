export function initMentionNavigation(root: HTMLElement) {
  const nav = root.querySelector<HTMLElement>(".mention-nav")!
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"))
  const sections = links.map(
    (link) => document.getElementById(link.hash.slice(1))!,
  )
  const header = document.querySelector<HTMLElement>("page-header")!
  const mobile = matchMedia("(width < 64rem)")
  let frame = 0

  const update = () => {
    frame = 0
    const top = mobile.matches ? header.getBoundingClientRect().height : 0
    root.style.setProperty("--mentions-sticky-top", `${top}px`)
    const threshold = Math.max(top + nav.offsetHeight + 48, innerHeight * 0.35)
    let selected = 0
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= threshold) selected = index
    })
    // A short last section can reach the document's end before crossing the nav.
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 3)
      selected = sections.length - 1
    links.forEach((link, index) => {
      if (index === selected) link.setAttribute("aria-current", "location")
      else link.removeAttribute("aria-current")
    })
    const current = links[selected]
    nav.style.setProperty("--tab-x", `${current.offsetLeft}px`)
    nav.style.setProperty("--tab-width", `${current.offsetWidth}px`)
    // Place it first, then let later changes slide.
    if (!nav.hasAttribute("data-ready"))
      requestAnimationFrame(() => nav.setAttribute("data-ready", ""))
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update)
  }
  window.addEventListener("scroll", schedule, { passive: true })
  window.addEventListener("resize", schedule, { passive: true })
  window.addEventListener("hashchange", schedule)
  new ResizeObserver(schedule).observe(header)
  new ResizeObserver(schedule).observe(root)
  update()
}

import { copyText } from "./clipboard"
import { haptic } from "./haptics"
import { hashId } from "./utils"

function initScrollToTop() {
  const buttons = [
    ...document.querySelectorAll<HTMLElement>("[data-scroll-top]"),
  ]
  if (!buttons.length) return
  const main = document.getElementById("main-content")
  let lastY = scrollY
  let wantFloating = false
  let settleTimer = 0

  // The floating button covers the ends of lines, so it only shows while
  // the reader is heading back up. The sidebar one shows once past the fold.
  const update = () => {
    const y = scrollY
    const past = y > innerHeight * 0.5
    const up = y < lastY - 4
    const down = y > lastY + 4
    for (const button of buttons) {
      if (!past) button.removeAttribute("data-visible")
      else if (!button.hasAttribute("data-floating"))
        button.setAttribute("data-visible", "")
      else if (up) wantFloating = true
      else if (down) {
        wantFloating = false
        button.removeAttribute("data-visible")
      }
    }
    if (up || down) lastY = y
  }

  // It appears once the scroll has settled, never mid fling, so it is
  // never in the way of what the reader is reading past.
  const settled = () => {
    if (!wantFloating) return
    for (const button of buttons)
      if (button.hasAttribute("data-floating"))
        button.setAttribute("data-visible", "")
  }
  addEventListener("scroll", update, { passive: true })
  if ("onscrollend" in window) addEventListener("scrollend", settled)
  else
    addEventListener(
      "scroll",
      () => {
        clearTimeout(settleTimer)
        settleTimer = window.setTimeout(settled, 120)
      },
      { passive: true },
    )
  update()

  document.addEventListener("click", (event) => {
    if (!(event.target as Element).closest("[data-scroll-top]")) return
    window.scrollTo({ top: 0 })
    // Keep keyboard users at the top too, not on a button at the bottom.
    main?.focus({ preventScroll: true })
  })
}

function initResumeReading() {
  // Long posts remember the section you were in. Coming back later, a pill
  // offers to pick up there. Finishing the post (or 60 days) forgets it.
  type Place = { id: string; title: string; at: number }

  const pill = document.querySelector<HTMLElement>(".resume")
  if (!pill) return
  const key = `resume:${location.pathname.replace(/\/+$/, "")}`
  const maxAge = 60 * 24 * 60 * 60 * 1000
  const go = pill.querySelector<HTMLAnchorElement>(".resume-go")!
  const title = pill.querySelector<HTMLElement>(".resume-title")!
  const dismiss = pill.querySelector<HTMLButtonElement>(".resume-dismiss")!

  const read = (): Place | undefined => {
    try {
      const place = JSON.parse(
        localStorage.getItem(key) ?? "null",
      ) as Place | null
      return place && Date.now() - place.at < maxAge ? place : undefined
    } catch {
      return undefined
    }
  }
  const write = (place: Place | null) => {
    try {
      if (place) localStorage.setItem(key, JSON.stringify(place))
      else localStorage.removeItem(key)
    } catch {}
  }

  const progress = () => {
    const max = document.documentElement.scrollHeight - innerHeight
    return max > 0 ? scrollY / max : 1
  }

  // The current section is whatever the table of contents marks.
  const current = () =>
    document.querySelector<HTMLAnchorElement>("page-toc a[aria-current]")

  let saveTimer = 0
  const save = () => {
    const ratio = progress()
    if (ratio > 0.95) return write(null)
    const link = current()
    if (ratio < 0.06 || !link || link.hash === "#introduction") return
    write({
      id: decodeURIComponent(link.hash.slice(1)),
      title: link.textContent?.trim() ?? "",
      at: Date.now(),
    })
  }
  addEventListener(
    "scroll",
    () => {
      clearTimeout(saveTimer)
      saveTimer = window.setTimeout(save, 400)
    },
    { passive: true },
  )
  addEventListener("pagehide", save)

  const hide = () => pill.removeAttribute("data-visible")

  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined
  const place = read()
  const target = place && document.getElementById(place.id)
  // Back and forward already restore the position; a link with a #section
  // already says where to go.
  if (
    place &&
    target &&
    !location.hash &&
    navigation?.type !== "back_forward"
  ) {
    title.textContent = place.title
    go.href = `#${encodeURIComponent(place.id)}`
    setTimeout(() => {
      if (scrollY > innerHeight) return
      pill.hidden = false
      pill.setAttribute("data-visible", "")
    }, 500)

    go.addEventListener("click", (event) => {
      event.preventDefault()
      // Straight there (gliding through half a post would take ages), then
      // the landing glow shows where you are.
      target.scrollIntoView({ block: "start" })
      dispatchEvent(new CustomEvent("site:land", { detail: target }))
      hide()
    })
    dismiss.addEventListener("click", () => {
      write(null)
      hide()
    })
    // Reading on from the top means the offer is no longer needed.
    addEventListener(
      "scroll",
      () => {
        if (!pill.hidden && scrollY > innerHeight) hide()
      },
      { passive: true },
    )
  }
}

function initCodeTools() {
  const pres = document.querySelectorAll<HTMLElement>(
    "prose-content .expressive-code pre",
  )
  if (!pres.length) return

  document.addEventListener("click", (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest(".expressive-code .copy button")
    )
      haptic("success")
  })

  type CodeBlock = { pre: HTMLElement; scroll: HTMLElement; visible: boolean }
  const blocks = new Map<Element, CodeBlock>()
  const pending = new Set<CodeBlock>()
  let frame = 0

  const flush = () => {
    frame = 0
    // Measure every visible block before writing any styles. Leave distant
    // blocks under content-visibility; reading their size would force layout.
    const measurements = [...pending]
      .filter((block) => block.visible)
      .map((block) => {
        const {
          scrollLeft,
          scrollWidth,
          clientWidth,
          scrollHeight,
          clientHeight,
          scrollTop,
        } = block.pre
        return {
          ...block,
          start: scrollLeft > 1,
          end: scrollWidth - clientWidth - scrollLeft > 1,
          bottom: scrollHeight - clientHeight - scrollTop > 1,
          overflowing:
            scrollWidth > clientWidth + 1 || scrollHeight > clientHeight + 1,
        }
      })
    pending.clear()
    for (const {
      pre,
      scroll,
      start,
      end,
      bottom,
      overflowing,
    } of measurements) {
      scroll.toggleAttribute("data-overflow-start", start)
      scroll.toggleAttribute("data-overflow-end", end)
      scroll.toggleAttribute("data-overflow-bottom", bottom)
      pre.tabIndex = overflowing ? 0 : -1
      if (overflowing) pre.setAttribute("aria-label", "Scrollable code block")
      else pre.removeAttribute("aria-label")
    }
  }
  const schedule = (block: CodeBlock) => {
    if (!block.visible) return
    pending.add(block)
    if (!frame) frame = requestAnimationFrame(flush)
  }
  const visibility = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const block = blocks.get(entry.target)!
        block.visible = entry.isIntersecting
        schedule(block)
      }
    },
    { rootMargin: "300px" },
  )
  const resize = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const block = blocks.get(entry.target)
      if (block) schedule(block)
    }
  })

  // Keep Expressive Code's source-aware copy behavior and success feedback.
  for (const pre of pres) {
    const container = pre.closest<HTMLElement>(".expressive-code")
    const codeFrame = pre.closest<HTMLElement>(".frame")
    if (
      !container ||
      !codeFrame ||
      pre.parentElement?.classList.contains("code-scroll")
    )
      continue
    const scroll = document.createElement("div")
    scroll.className = "code-scroll"
    pre.before(scroll)
    scroll.append(pre)
    const block = { pre, scroll, visible: false }
    blocks.set(container, block)
    blocks.set(pre, block)
    visibility.observe(container)
    resize.observe(pre)
    const code = pre.querySelector("code")
    if (code) {
      blocks.set(code, block)
      resize.observe(code)
    }
    const update = () => schedule(block)
    pre.addEventListener("scroll", update, { passive: true })
    codeFrame.addEventListener("toggle", update, true)
    container.addEventListener("contentvisibilityautostatechange", update)

    const button = codeFrame.querySelector<HTMLButtonElement>(".copy button")
    if (button) {
      button.type = "button"
      button.setAttribute("aria-label", "Copy code")
      button.dataset.copied = "Copied"
    }
  }
  document.fonts.ready.then(() => {
    for (const block of new Set(blocks.values())) schedule(block)
  })
}

function initHeadingLinks() {
  // Clicking a heading's "#" still jumps there and updates the address bar,
  // and also copies the link, confirmed by a check in place of the "#".
  const status = document.createElement("span")
  status.className = "visually-hidden"
  status.setAttribute("role", "status")
  document.body.append(status)
  const timers = new WeakMap<Element, ReturnType<typeof setTimeout>>()

  document.addEventListener("click", (event) => {
    const anchor =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("[data-heading-anchor]")
        : null
    if (!anchor) return
    haptic("success")
    void copyText(anchor.href).then((copied) => {
      if (!copied) return
      clearTimeout(timers.get(anchor))
      anchor.setAttribute("data-copied", "")
      status.textContent = "Link copied"
      timers.set(
        anchor,
        setTimeout(() => {
          anchor.removeAttribute("data-copied")
          status.textContent = ""
        }, 1500),
      )
    })
  })
}

function initTableOfContents() {
  const nav = document.querySelector<HTMLElement>("page-toc nav")
  if (!nav) return

  const ring = nav.querySelector<SVGElement>(".toc-toggle svg")
  const mobile = matchMedia("(width < 64rem)")
  // Browsers with scroll-driven animations draw the ring in CSS.
  if (!CSS.supports("animation-timeline: scroll()")) {
    const progress = () => {
      if (!ring || !mobile.matches) return
      const max = document.documentElement.scrollHeight - innerHeight
      ring.style.setProperty(
        "--progress",
        String(max > 0 ? Math.min(scrollY / max, 1) : 0),
      )
    }
    addEventListener("scroll", progress, { passive: true })
    mobile.addEventListener("change", progress)
    progress()
  }

  const links = new Map(
    [...nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']")].map((a) => [
      hashId(a.hash),
      a,
    ]),
  )
  const articles = document.querySelectorAll("main article")
  const list = nav.querySelector<HTMLElement>(".toc-list")
  const panel = nav.querySelector<HTMLElement>(".toc-panel")
  const currentLabel = nav.querySelector("toc-current")
  const toggle = nav.querySelector<HTMLButtonElement>(".toc-toggle")
  const indicator = nav.querySelector<HTMLElement>(".toc-indicator")
  if (articles.length === 0 || !list || links.size === 0) return

  const isOpen = () => toggle?.getAttribute("aria-expanded") === "true"
  const setOpen = (open: boolean) =>
    toggle?.setAttribute("aria-expanded", String(open))

  // Measured against the list so it scrolls along with it. The first
  // placement jumps; after that it slides.
  const placeIndicator = (link?: HTMLAnchorElement) => {
    if (!indicator || mobile.matches) return
    if (!link || !link.checkVisibility()) {
      indicator.removeAttribute("data-placed")
      return
    }
    const listTop = list.getBoundingClientRect().top - list.scrollTop
    const box = link.getBoundingClientRect()
    const inset = parseFloat(getComputedStyle(link).paddingBlockStart) * 0.5
    indicator.style.setProperty(
      "--indicator-offset",
      `${box.top - listTop + inset}px`,
    )
    indicator.style.setProperty(
      "--indicator-size",
      `${box.height - 2 * inset}px`,
    )
    if (indicator.hasAttribute("data-placed"))
      indicator.setAttribute("data-moving", "")
    else requestAnimationFrame(() => indicator.setAttribute("data-moving", ""))
    indicator.setAttribute("data-placed", "")
  }

  const fallback = currentLabel?.textContent ?? ""

  const groups = [
    ...nav.querySelectorAll<HTMLDetailsElement>("li[data-group] details"),
  ].map((details) => ({
    details,
    active: details.open,
    ids: [...details.querySelectorAll<HTMLAnchorElement>("a[href^='#']")].map(
      (a) => hashId(a.hash),
    ),
  }))

  const blockOf = new Map<Element, string>()
  for (const id of links.keys()) {
    const block = document
      .getElementById(id)
      ?.closest("prose-content > *, article[data-url]")
    if (block && !blockOf.has(block)) blockOf.set(block, id)
  }

  const sectionOf = new Map<Element, string>()
  for (const article of articles) {
    let current = blockOf.get(article)
    for (const child of article.children) {
      if (child.tagName === "PROSE-CONTENT") {
        for (const block of child.children) {
          current = blockOf.get(block) ?? current
          if (current) sectionOf.set(block, current)
        }
      } else if (current) sectionOf.set(child, current)
    }
  }

  const visible = new Set<Element>()
  let prevActive = new Set<string>()

  const center = () => {
    const run = [...list.querySelectorAll<HTMLAnchorElement>("a[data-active]")]
    const first = run[0]
    const last = run[run.length - 1]
    if (!first || !run.every((a) => a.checkVisibility())) return
    const area = list.getBoundingClientRect()
    const runCenter =
      (first.getBoundingClientRect().top +
        last.getBoundingClientRect().bottom) /
      2
    list.scrollTo({
      top: list.scrollTop + runCenter - (area.top + area.height / 2),
    })
  }

  toggle?.addEventListener("click", () => {
    setOpen(!isOpen())
    if (isOpen()) center()
  })

  document.addEventListener("pointerdown", (event) => {
    if (mobile.matches && isOpen() && !event.composedPath().includes(nav)) {
      setOpen(false)
    }
  })
  document.addEventListener("keydown", (event) => {
    if (
      event.key !== "Escape" ||
      event.defaultPrevented ||
      !mobile.matches ||
      !isOpen()
    )
      return
    event.preventDefault()
    setOpen(false)
    toggle?.focus({ preventScroll: true })
  })
  mobile.addEventListener("change", () => {
    if (!mobile.matches) setOpen(false)
    placeIndicator(
      list.querySelector<HTMLAnchorElement>("a[aria-current]") ?? undefined,
    )
  })

  // Picking a section or a depth closes the dropdown so you see it apply.
  panel?.addEventListener("click", (event) => {
    if ((event.target as Element).closest?.("a, [data-level]")) setOpen(false)
  })

  // Opening or closing a group moves the links below it.
  list.addEventListener(
    "toggle",
    () =>
      placeIndicator(
        list.querySelector<HTMLAnchorElement>("a[aria-current]") ?? undefined,
      ),
    true,
  )

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target)
      else visible.delete(entry.target)
    }

    const activeIds = new Set<string>()
    for (const block of visible) {
      const id = sectionOf.get(block)
      if (id) activeIds.add(id)
    }

    let firstActive: HTMLAnchorElement | undefined
    // A sliver of the preceding section shouldn't own the current marker.
    const visibleHeight = new Map<string, number>()
    for (const block of visible) {
      const id = sectionOf.get(block)
      if (!id) continue
      const rect = block.getBoundingClientRect()
      const height = Math.max(
        0,
        Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0),
      )
      visibleHeight.set(id, (visibleHeight.get(id) ?? 0) + height)
    }
    let largestHeight = -1
    for (const [id, link] of links) {
      const on = activeIds.has(id)
      link.toggleAttribute("data-active", on)
      link.removeAttribute("aria-current")
      if (on && (visibleHeight.get(id) ?? 0) > largestHeight) {
        largestHeight = visibleHeight.get(id) ?? 0
        firstActive = link
      }
    }
    firstActive?.setAttribute("aria-current", "location")

    if (currentLabel) {
      // Before the first heading the bar keeps showing the post title.
      const intro = firstActive?.hash === "#introduction"
      const label = (!intro && firstActive?.textContent?.trim()) || fallback
      if (currentLabel.textContent !== label) currentLabel.textContent = label
    }

    for (const group of groups) {
      const active = group.ids.some((id) => activeIds.has(id))
      if (active !== group.active) {
        group.active = active
        if (active) group.details.open = true
      }
    }

    let grew = false
    for (const id of activeIds) {
      if (!prevActive.has(id)) {
        grew = true
        break
      }
    }
    prevActive = activeIds
    if (grew) center()
    placeIndicator(firstActive)
  })

  for (const block of sectionOf.keys()) observer.observe(block)
}

function initDepthDial() {
  // Read a post at roughly the depth you want. Blocks are sorted into levels
  // from the post's own structure, nothing is tagged by hand:
  //   skim        each section's heading, its key paragraph, its figures,
  //               and any TL;DR the post already has
  //   the idea    everything but code (tables stay, they're summaries)
  //   every byte  everything
  // Pointing at a level dims what it would fold, before you pick it. Folded
  // runs become a one-line stub saying what's in them, and open in place.
  type Level = "skim" | "idea" | "full"
  type Kind =
    | "heading"
    | "key"
    | "summary"
    | "figure"
    | "prose"
    | "table"
    | "code"
  const levels: Level[] = ["skim", "idea", "full"]
  const names: Record<Level, string> = {
    skim: "skim",
    idea: "the idea",
    full: "every byte",
  }

  const dial = document.querySelector<HTMLElement>("depth-dial")
  const proses = [
    ...document.querySelectorAll<HTMLElement>("main article prose-content"),
  ]
  const chip = document.querySelector<HTMLElement>(".toc-depth")
  if (!dial || !proses.length) return

  const words = (el: Element) =>
    (el.textContent ?? "").trim().split(/\s+/).filter(Boolean).length
  const text = (el: Element) =>
    (el.textContent ?? "").replace(/\s+/g, " ").trim()

  // A paragraph that says something on its own: not a short lead-in to the
  // code or list after it ("…looks like this:"), not a fragment, not just an
  // image. A long paragraph ending in a colon still carries its content.
  const isStatement = (block: HTMLElement) =>
    block.matches("p") &&
    !block.querySelector("img, video") &&
    words(block) >= 12 &&
    (!text(block).endsWith(":") || words(block) >= 25)

  // A callout the author already titled as a summary.
  const calloutTitle = (block: Element) =>
    block.matches("details[data-callout]")
      ? text(block.querySelector("summary") ?? block)
      : ""
  const isSummary = (block: HTMLElement) =>
    /\b(tl;?dr|summary|in short)\b/i.test(calloutTitle(block))

  const isFigure = (block: HTMLElement) =>
    block.matches(
      "figure:not(.expressive-code *), p:has(> img, > .image-enlarge), .siri-phone-illustration",
    )

  const buttons = [...dial.querySelectorAll<HTMLButtonElement>("[data-level]")]
  const options = dial.querySelector<HTMLElement>(".depth-options")!
  const blocks: HTMLElement[] = []
  const kind = new Map<HTMLElement, Kind>()

  // Classify every block once, section by section.
  for (const prose of proses) {
    const sections: HTMLElement[][] = [[]]
    for (const block of prose.children as HTMLCollectionOf<HTMLElement>) {
      if (block.matches("h2")) sections.push([])
      sections[sections.length - 1].push(block)
    }
    for (const section of sections) {
      const key =
        section.find(isStatement) ??
        section.find((b) => b.matches("p") && !text(b).endsWith(":"))
      for (const block of section) {
        blocks.push(block)
        kind.set(
          block,
          block.matches("h2")
            ? "heading"
            : block === key
              ? "key"
              : isSummary(block)
                ? "summary"
                : block.matches(".expressive-code, pre")
                  ? "code"
                  : block.matches("table")
                    ? "table"
                    : isFigure(block)
                      ? "figure"
                      : "prose",
        )
      }
    }
  }

  const shownAt = (block: HTMLElement, level: Level) => {
    const k = kind.get(block)
    if (level === "full") return true
    if (level === "idea") return k !== "code"
    return k === "heading" || k === "key" || k === "summary" || k === "figure"
  }

  const minutesOf = (list: HTMLElement[]) =>
    list.reduce((n, b) => n + words(b), 0) / 220
  const minutes = new Map(
    levels.map((level) => [
      level,
      Math.max(
        1,
        Math.round(minutesOf(blocks.filter((b) => shownAt(b, level)))),
      ),
    ]),
  )

  // Only worth offering when folding saves real time.
  const full = minutes.get("full")!
  if (full < 6 || full - minutes.get("skim")! < 3) return

  dial.hidden = false
  const time = dial.querySelector<HTMLElement>(".depth-time")!
  const showTime = (target: Level) => {
    time.textContent = `${minutes.get(target)} min`
  }
  for (const button of buttons) {
    const target = button.dataset.level as Level
    button.setAttribute(
      "aria-label",
      `${names[target]}, ${minutes.get(target)} minute${minutes.get(target) === 1 ? "" : "s"}`,
    )
  }

  const revealed = new Set<HTMLElement>()
  const stubOf = new Map<HTMLElement, HTMLElement>()
  const tocLinks = [
    ...document.querySelectorAll<HTMLAnchorElement>("page-toc a[href^='#']"),
  ]
  const blockFor = (link: HTMLAnchorElement) =>
    document
      .getElementById(hashId(link.hash))
      ?.closest<HTMLElement>("prose-content > *")

  const languages: Record<string, string> = {
    text: "output",
    console: "shell",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    py: "python",
  }

  // How a folded block starts, in words: a callout by its title and
  // text, a table by its columns, anything else by its text.
  const opening = (block: HTMLElement) => {
    const title = calloutTitle(block)
    if (title) {
      const body = text(block)
        .slice(text(block.querySelector("summary")!).length)
        .trim()
      return `${title}: ${body}`
    }
    if (block.matches("table"))
      return [...block.querySelectorAll("thead th, tr:first-child th")]
        .map(text)
        .join(" · ")
    if (block.matches(".expressive-code, pre")) return ""
    return text(block)
  }

  // What a stub says: for code, its language, length and first line;
  // for prose, how long it is and how it starts (or its subsections).
  const describe = (run: HTMLElement[]) => {
    if (run.every((b) => b.matches(".expressive-code"))) {
      const names = [
        ...new Set(
          run.map((b) => {
            const language = b.querySelector("pre")?.dataset.language ?? "code"
            return languages[language] ?? language
          }),
        ),
      ]
      const lines = run.flatMap((b) =>
        [...b.querySelectorAll(".ec-line .code")].map(text),
      )
      return {
        meta: `${names.join(", ")} · ${lines.length} line${lines.length === 1 ? "" : "s"}`,
        teaser: lines.find(Boolean) ?? "",
        code: true,
      }
    }
    const time = minutesOf(run)
    const code = run.filter((b) => kind.get(b) === "code").length
    const tables = run.filter((b) => kind.get(b) === "table").length
    const meta = [
      `${time < 1 ? "<1" : Math.round(time)} min`,
      code && `${code} code`,
      tables && `${tables} table${tables > 1 ? "s" : ""}`,
    ]
      .filter(Boolean)
      .join(" · ")
    const subsections = run.filter((b) => b.matches("h3, h4")).map(text)
    return {
      meta,
      teaser: subsections.length
        ? subsections.join(" · ")
        : (run.map(opening).find(Boolean) ?? ""),
      code: false,
    }
  }

  const markFolded = () => {
    for (const link of tocLinks)
      link.toggleAttribute("data-folded", !!blockFor(link)?.hidden)
  }

  let level: Level = "full"

  const apply = (next: Level) => {
    // Keep whatever is at the top of the screen in place. If it folds
    // away, land on the stub that replaces it.
    const anchor = blocks.find(
      (b) => !b.hidden && b.getBoundingClientRect().bottom > 96,
    )
    const before = anchor?.getBoundingClientRect().top ?? 0

    level = next
    for (const stub of new Set(stubOf.values())) stub.remove()
    stubOf.clear()
    let run: HTMLElement[] = []
    const flush = () => {
      if (!run.length) return
      const group = run
      const { meta, teaser, code } = describe(group)
      const stub = document.createElement("button")
      stub.type = "button"
      stub.className = "depth-stub"
      stub.toggleAttribute("data-code", code)
      stub.setAttribute("aria-label", `Show folded part: ${meta}. ${teaser}`)
      const plus = document.createElement("span")
      plus.className = "stub-plus"
      plus.textContent = "+"
      const metaEl = document.createElement("span")
      metaEl.className = "stub-meta"
      metaEl.textContent = meta
      const teaserEl = document.createElement("span")
      teaserEl.className = "stub-teaser"
      teaserEl.textContent = teaser
      stub.append(plus, metaEl, teaserEl)
      stub.addEventListener("click", () => {
        for (const block of group) {
          revealed.add(block)
          block.hidden = false
          stubOf.delete(block)
        }
        stub.remove()
        markFolded()
      })
      group[0].before(stub)
      for (const block of group) stubOf.set(block, stub)
      run = []
    }
    for (const block of blocks) {
      const show = shownAt(block, level) || revealed.has(block)
      block.hidden = !show
      if (show) flush()
      else run.push(block)
      // Runs never continue across two articles of a series.
      if (block === block.parentElement?.lastElementChild) flush()
    }
    flush()
    markFolded()

    for (const button of buttons)
      button.setAttribute(
        "aria-checked",
        String(button.dataset.level === level),
      )
    showTime(level)
    if (chip) {
      chip.textContent = names[level]
      chip.hidden = level === "full"
    }
    try {
      localStorage.depthLevel = level
    } catch {}

    const target = anchor && (anchor.hidden ? stubOf.get(anchor) : anchor)
    if (target) scrollBy(0, target.getBoundingClientRect().top - before)
  }

  // Show what a level would fold, in the post and in the contents.
  const preview = (target: Level | null) => {
    showTime(target ?? level)
    for (const block of blocks) {
      const dim =
        target !== null &&
        !block.hidden &&
        !shownAt(block, target) &&
        !revealed.has(block)
      block.toggleAttribute("data-depth-preview", dim)
    }
    for (const link of tocLinks) {
      const block = blockFor(link)
      link.toggleAttribute(
        "data-depth-preview",
        target !== null && !!block && !block.hidden && !shownAt(block, target),
      )
    }
  }

  for (const button of buttons) {
    const target = button.dataset.level as Level
    button.addEventListener("click", () => {
      preview(null)
      if (target === level) return
      revealed.clear()
      apply(target)
    })
    button.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") preview(target)
    })
    button.addEventListener("pointerleave", () => preview(null))
    button.addEventListener("focus", () => {
      if (button.matches(":focus-visible")) preview(target)
    })
    button.addEventListener("blur", () => preview(null))
  }

  // Arrow keys move between levels, like any radio group.
  options.addEventListener("keydown", (event) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0
    if (!step) return
    event.preventDefault()
    const next =
      levels[(levels.indexOf(level) + step + levels.length) % levels.length]
    apply(next)
    buttons.find((b) => b.dataset.level === next)?.focus()
  })

  // Going to a folded section (contents, search, a link) unfolds it first.
  const unfold = (id: string) => {
    const block = document
      .getElementById(id)
      ?.closest<HTMLElement>("prose-content > *")
    if (block?.hidden) stubOf.get(block)?.click()
  }
  document.addEventListener(
    "click",
    (event) => {
      const link = (event.target as Element).closest?.<HTMLAnchorElement>(
        "a[href^='#']",
      )
      if (link) unfold(hashId(link.hash))
    },
    true,
  )
  addEventListener("hashchange", () => unfold(hashId(location.hash)))

  let saved: Level = "full"
  try {
    if (levels.includes(localStorage.depthLevel))
      saved = localStorage.depthLevel
  } catch {}
  apply(saved)
  if (location.hash) {
    unfold(hashId(location.hash))
    document.getElementById(hashId(location.hash))?.scrollIntoView()
  }
}

function initImageViewerTrigger() {
  // Blur up: the wrapper keeps its placeholder until the image is in.
  for (const wrapper of document.querySelectorAll<HTMLElement>(".lqip")) {
    const img = wrapper.querySelector("img")
    if (!img) continue
    const done = () => wrapper.setAttribute("data-loaded", "")
    if (img.complete && img.naturalWidth) done()
    else {
      img.addEventListener("load", done, { once: true })
      img.addEventListener("error", done, { once: true })
    }
  }

  if (!document.querySelector(".image-viewer")) return

  let loading: Promise<typeof import("./image-viewer")> | undefined
  const load = () => (loading ??= import("./image-viewer"))

  document
    .querySelectorAll<HTMLImageElement>("prose-content img")
    .forEach((img) => {
      // Keep links, diagrams, and decorative illustrations behaving as authored.
      if (img.closest("a, button, .siri-demo, .siri-phone-illustration")) return
      const src = decodeURIComponent(img.currentSrc || img.src)
      if (/\.svg(?:[?&#]|$)/i.test(src)) return
      const trigger = document.createElement("button")
      trigger.type = "button"
      trigger.className = "image-enlarge"
      trigger.setAttribute(
        "aria-label",
        `Enlarge image: ${img.alt || "article illustration"}`,
      )
      img.before(trigger)
      trigger.append(img)
      trigger.addEventListener("pointerenter", () => void load(), {
        once: true,
      })
      trigger.addEventListener("focus", () => void load(), { once: true })
      trigger.addEventListener("click", () => {
        void load().then((m) => m.openImageViewer(img))
      })
    })
}

function initQuoteLinkTrigger() {
  const fine = matchMedia("(pointer: fine)")
  if (!fine.matches) return

  const onSelection = () => {
    const selection = getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount) return
    const node = selection.getRangeAt(0).commonAncestorContainer
    const element = node instanceof Element ? node : node.parentElement
    if (!element?.closest("prose-content")) return
    document.removeEventListener("selectionchange", onSelection)
    void import("./quote-link").then(({ initQuoteLink }) => initQuoteLink())
  }

  document.addEventListener("selectionchange", onSelection)
}

function initLinkPreviewsTrigger() {
  if (
    !document.querySelector("#link-preview") ||
    !document.querySelector("article[data-link-previews]")
  )
    return

  const touch = matchMedia("(hover: none), (pointer: coarse), (width < 40rem)")
  let loading: Promise<typeof import("./link-previews-ui")> | undefined

  const cleanup = () => {
    document.removeEventListener("pointerover", onHover)
    document.removeEventListener("focusin", onFocus)
    touch.removeEventListener("change", onTouchChange)
  }

  const load = (initial?: {
    anchor: HTMLAnchorElement
    kind: "hover" | "focus"
  }) => {
    cleanup()
    void (loading ??= import("./link-previews-ui")).then(
      ({ initLinkPreviews }) => initLinkPreviews(initial),
    )
  }

  const anchorOf = (event: Event) =>
    event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>("prose-content a[href]")
      : null

  const onHover = (event: PointerEvent) => {
    if (touch.matches || event.pointerType !== "mouse") return
    const anchor = anchorOf(event)
    if (anchor) load({ anchor, kind: "hover" })
  }

  const onFocus = (event: FocusEvent) => {
    if (touch.matches) return
    const anchor = anchorOf(event)
    if (anchor?.matches(":focus-visible")) load({ anchor, kind: "focus" })
  }

  const onTouchChange = () => {
    if (touch.matches) load()
  }

  if (touch.matches) {
    const schedule = () => {
      if ("requestIdleCallback" in window)
        window.requestIdleCallback(() => load(), { timeout: 1000 })
      else setTimeout(() => load(), 0)
    }
    if (document.readyState === "complete") schedule()
    else addEventListener("load", schedule, { once: true })
  } else {
    document.addEventListener("pointerover", onHover)
    document.addEventListener("focusin", onFocus)
    touch.addEventListener("change", onTouchChange)
  }
}

function initSeriesReaderTrigger() {
  if (!document.querySelector("article[data-embedded]")) return
  void import("./series-reader").then(({ initSeriesReader }) =>
    initSeriesReader(),
  )
}

initScrollToTop()
initResumeReading()
initCodeTools()
initHeadingLinks()
initTableOfContents()
initDepthDial()
initImageViewerTrigger()
initQuoteLinkTrigger()
initLinkPreviewsTrigger()
initSeriesReaderTrigger()

import { closeOnBack } from "./overlay-history"

type Kind = "post" | "section" | "cve" | "talk" | "mention" | "page"
type Entry = {
  k: Kind
  t: string
  u: string
  c?: string
  m?: string
  x?: string
  i?: string
}
type Field = { weight: number; text: string; words: string[] }
type Doc = Entry & { fields: Field[] }
type Hit = { doc: Doc; score: number }

// Shorthand people type versus the words posts use. Either side finds
// the other.
const synonyms: Record<string, string[]> = {
  uaf: ["use after free", "use-after-free"],
  rce: ["remote code execution", "code execution"],
  lpe: ["privilege escalation"],
  got: ["global offset table"],
  plt: ["procedure linkage table"],
  cff: ["control flow flattening"],
  cfg: ["control flow graph"],
  re: ["reverse engineering", "reversing"],
  rev: ["reverse engineering", "reversing"],
  binja: ["binary ninja"],
  bn: ["binary ninja"],
  xss: ["cross site scripting", "cross-site scripting"],
  vm: ["virtual machine"],
  il: ["intermediate language"],
  ssa: ["static single assignment"],
  poc: ["proof of concept"],
  ml: ["machine learning"],
  elf: ["executable and linkable"],
  pwn: ["exploit", "exploitation"],
}

const weights: Record<Kind, number> = {
  post: 1.25,
  page: 1.1,
  talk: 1,
  cve: 1,
  mention: 0.95,
  section: 0.9,
}
const order: Kind[] = ["post", "section", "cve", "talk", "mention", "page"]
const limits: Record<Kind, number> = {
  post: 4,
  section: 6,
  cve: 5,
  talk: 2,
  mention: 3,
  page: 3,
}
const labels: Record<Kind, string> = {
  post: "posts",
  section: "sections",
  cve: "cves",
  talk: "talks",
  mention: "mentions",
  page: "pages",
}

const normalize = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

const field = (text: string | undefined, weight: number): Field => {
  const value = normalize(text ?? "")
  return { weight, text: ` ${value} `, words: [...new Set(value.split(" "))] }
}

// Damerau-Levenshtein with an early exit once past `max`.
const distance = (a: string, b: string, max: number) => {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) rows[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost,
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        value = Math.min(value, rows[i - 2][j - 2] + 1)
      rows[i][j] = value
      best = Math.min(best, value)
    }
    if (best > max) return max + 1
  }
  return rows[a.length][b.length]
}

// How well one query word matches one field, from 1 (whole word) down
// to a typo, 0 when it doesn't.
const quality = (token: string, alternatives: string[], f: Field) => {
  if (f.text.includes(` ${token} `)) return 1
  for (const phrase of alternatives)
    if (f.text.includes(` ${phrase} `)) return 0.95
  if (f.words.some((word) => word.startsWith(token))) return 0.8
  if (token.length >= 3 && f.text.includes(token)) return 0.6
  if (token.length >= 4) {
    const max = token.length >= 7 ? 2 : 1
    if (f.words.some((word) => distance(token, word, max) <= max)) return 0.45
  }
  return 0
}

const escape = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  )

// Mark where the matched words appear, case insensitive.
// Terms are normalized ("use after free"); text may say "use-after-free".
const termPattern = (tokens: string[]) =>
  new RegExp(
    `(${[...tokens]
      .sort((a, b) => b.length - a.length)
      .map((t) =>
        t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[\\s-]+"),
      )
      .join("|")})`,
    "gi",
  )

const highlight = (text: string, tokens: string[]) => {
  if (!tokens.length) return escape(text)
  const pattern = termPattern(tokens)
  let out = ""
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0
    if (at > last) out += escape(text.slice(last, at))
    out += `<mark>${escape(match[0])}</mark>`
    last = at + match[0].length
  }
  if (last < text.length) out += escape(text.slice(last))
  return out
}

// A short window of body text around the first matching word.
const snippet = (doc: Doc, tokens: string[]) => {
  if (!doc.x) return doc.c
  const at = tokens.length ? doc.x.search(termPattern(tokens)) : -1
  if (at < 0) return doc.c
  // Start on a word, about forty characters before the match.
  const from = Math.max(0, at - 40)
  const start = from === 0 ? 0 : doc.x.indexOf(" ", from) + 1 || from
  return `${start > 0 ? "…" : ""}${doc.x.slice(start, at + 90).trim()}…`
}

let controller:
  | {
      open: () => void
      toggle: () => void
      warm: () => void
    }
  | undefined

function ensureController() {
  if (controller) return controller
  const dialog = document.querySelector<HTMLDialogElement>("#search")
  if (!dialog) return undefined
  const input = dialog.querySelector("input")!
  const list = dialog.querySelector<HTMLElement>("#search-results")!
  const status = dialog.querySelector<HTMLElement>("#search-status")!

  let docs: Doc[] | undefined
  let loading: Promise<void> | undefined
  const load = () =>
    (loading ??= fetch("/search.json")
      .then((response) => response.json() as Promise<Entry[]>)
      .then((entries) => {
        docs = entries.map((entry) => ({
          ...entry,
          fields: [
            field(entry.t, 10),
            field(entry.c, entry.k === "section" ? 2 : 4),
            field(entry.i, 3),
            field(entry.x, 1),
          ],
        }))
      })
      .catch(() => {
        loading = undefined
      }))

  const search = (query: string): Hit[] => {
    const tokens = normalize(query).split(" ").filter(Boolean)
    if (!docs || tokens.length === 0) return []
    const whole = normalize(query)
    const hits: Hit[] = []
    for (const doc of docs) {
      let score = 0
      let matched = true
      // A section has to match on its own words; its post's title alone
      // would pull in every section of that post.
      let own = doc.k !== "section"
      for (const token of tokens) {
        const alternatives = (synonyms[token] ?? []).map(normalize)
        let best = 0
        doc.fields.forEach((f, index) => {
          const value = f.weight * quality(token, alternatives, f)
          if (value > 0 && index !== 1) own = true
          best = Math.max(best, value)
        })
        if (best === 0) {
          matched = false
          break
        }
        score += best
      }
      if (!matched || !own) continue
      if (doc.fields[0].text.includes(` ${whole}`)) score += 6
      hits.push({ doc, score: score * weights[doc.k] })
    }
    return hits.sort((a, b) => b.score - a.score)
  }

  // The words in a document that a query actually matched, typos and
  // synonyms resolved, so highlights and snippets show the real spelling.
  const matchedTerms = (doc: Doc, query: string) => {
    const terms = new Set<string>()
    for (const token of normalize(query)
      .split(" ")
      .filter((t) => t.length > 1)) {
      terms.add(token)
      for (const phrase of synonyms[token] ?? []) terms.add(normalize(phrase))
      if (token.length < 4) continue
      const max = token.length >= 7 ? 2 : 1
      for (const f of doc.fields)
        for (const word of f.words)
          if (!word.startsWith(token) && distance(token, word, max) <= max)
            terms.add(word)
    }
    return [...terms]
  }

  let active = 0
  let options: HTMLElement[] = []

  const setActive = (index: number, scroll = true) => {
    if (!options.length) {
      input.removeAttribute("aria-activedescendant")
      return
    }
    active = (index + options.length) % options.length
    options.forEach((option, i) =>
      option.setAttribute("aria-selected", String(i === active)),
    )
    input.setAttribute("aria-activedescendant", options[active].id)
    if (scroll) options[active].scrollIntoView({ block: "nearest" })
  }

  const row = (doc: Doc, query: string, index: number) => {
    const terms = query ? matchedTerms(doc, query) : []
    const sub = doc.k === "section" && query ? snippet(doc, terms) : doc.c
    const external = /^https?:\/\//.test(doc.u)
    return `<div class="search-option" role="option" id="search-option-${index}" data-kind="${doc.k}" data-href="${escape(doc.u)}"${external ? ' data-external="true"' : ""}>
      <a class="search-option-link" href="${escape(doc.u)}" tabindex="-1"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>
        <span class="search-title">${highlight(doc.t, terms)}</span>
        ${sub ? `<span class="search-context">${highlight(sub, terms)}</span>` : ""}
        ${doc.m ? `<span class="search-meta">${escape(doc.m)}</span>` : ""}
      </a>
    </div>`
  }

  const render = () => {
    const query = input.value.trim()
    let groups: [Kind, Doc[]][]
    if (!query) {
      // Before typing: the newest posts and where else to go.
      groups = [
        ["post", (docs ?? []).filter((d) => d.k === "post").slice(0, 4)],
        ["page", (docs ?? []).filter((d) => d.k === "page").slice(0, 6)],
      ]
    } else {
      const hits = search(query)
      groups = order.map((kind) => [
        kind,
        hits
          .filter((h) => h.doc.k === kind)
          .slice(0, limits[kind])
          .map((h) => h.doc),
      ])
    }
    groups = groups.filter(([, groupDocs]) => groupDocs.length)
    let index = 0
    list.innerHTML = groups.length
      ? groups
          .map(
            ([kind, groupDocs]) =>
              `<div class="search-group" role="group" aria-label="${labels[kind]}"><p class="search-label" aria-hidden="true">${query ? labels[kind] : kind === "post" ? "latest" : "pages"}</p>${groupDocs.map((doc) => row(doc, query, index++)).join("")}</div>`,
          )
          .join("")
      : `<p class="search-empty">${docs ? `Nothing for “${escape(query)}”. Fewer or shorter words help.` : "Loading…"}</p>`
    options = [...list.querySelectorAll<HTMLElement>(".search-option")]
    input.setAttribute(
      "aria-expanded",
      String(dialog.open && options.length > 0),
    )
    status.textContent = query ? `${options.length} results` : ""
    setActive(0)
  }

  const back = closeOnBack(dialog)

  const open = () => {
    if (dialog.open) return
    dialog.showModal()
    back.opened()
    document.documentElement.style.overflow = "hidden"
    input.select()
    render()
    void load()?.then(render)
  }

  const toggle = () => {
    if (dialog.open) dialog.close()
    else open()
  }

  dialog.addEventListener("close", () => {
    document.documentElement.style.overflow = ""
    input.setAttribute("aria-expanded", "false")
  })

  let inputTimer: ReturnType<typeof setTimeout> | undefined
  input.addEventListener("input", () => {
    clearTimeout(inputTimer)
    inputTimer = setTimeout(render, 60)
  })
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault()
      dialog.close()
      return
    }
    if (event.key === "ArrowDown") setActive(active + 1)
    else if (event.key === "ArrowUp") setActive(active - 1)
    else if (event.key === "Enter" && options[active]) {
      const href = options[active].dataset.href!
      const external = options[active].dataset.external === "true"
      back.forget()
      if (external || event.metaKey || event.ctrlKey)
        window.open(href, "_blank", "noopener")
      else location.assign(href)
    } else return
    event.preventDefault()
  })

  list.addEventListener("pointermove", (event) => {
    const option = (event.target as Element).closest<HTMLElement>(
      ".search-option",
    )
    if (option && options.indexOf(option) !== active)
      setActive(options.indexOf(option), false)
  })
  list.addEventListener("click", (event) => {
    if ((event.target as Element).closest(".search-option")) back.forget()
  })
  // Clicking the backdrop closes.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close()
  })

  controller = { open, toggle, warm: () => void load() }
  return controller
}

export function warmSearch() {
  ensureController()?.warm()
}

export function openSearch() {
  ensureController()?.open()
}

export function toggleSearch() {
  ensureController()?.toggle()
}

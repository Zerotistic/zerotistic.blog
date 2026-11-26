import { duplicateProject, products } from "@/data/cves"
import { mentionGroups } from "@/data/mentions"
import { talks } from "@/data/talks"
import { getPosts, getSubposts, titleText } from "@/lib/content"
import { formatDate } from "@/lib/utils"
import { render } from "astro:content"

/** One searchable thing. Short keys keep the file small. */
type Entry = {
  /** kind */
  k: "post" | "section" | "cve" | "talk" | "mention" | "page"
  /** title */
  t: string
  /** url */
  u: string
  /** context line shown under the title */
  c?: string
  /** meta shown on the right (date, severity) */
  m?: string
  /** body text, searched but weighted low */
  x?: string
  /** identifiers from code blocks */
  i?: string
}

const fence = /^\s*(```|~~~)/

// Markdown to the words a reader would search for.
const plain = (markdown: string) =>
  markdown
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^:::\w*(?:\[([^\]]*)\])?.*$/gm, "$1")
    .replace(/\{:[^}]*\}/g, "")
    .replace(/[`*_~>#|$\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const identifiers = (code: string) =>
  [...new Set(code.match(/[A-Za-z_][A-Za-z0-9_]{3,}/g) ?? [])]
    .slice(0, 120)
    .join(" ")

// Split a post body at its headings: the text before the first heading,
// then one chunk per heading, in document order.
function chunks(body: string) {
  const parts: { prose: string[]; code: string[] }[] = [{ prose: [], code: [] }]
  let inFence = false
  for (const line of body.split("\n")) {
    if (fence.test(line)) {
      inFence = !inFence
      continue
    }
    const part = parts[parts.length - 1]
    if (inFence) part.code.push(line)
    else if (/^#{2,6}\s/.test(line)) parts.push({ prose: [], code: [] })
    else part.prose.push(line)
  }
  return parts.map(({ prose, code }) => ({
    text: plain(prose.join("\n")),
    ids: identifiers(code.join("\n")),
  }))
}

export async function GET() {
  const entries: Entry[] = []
  const posts = await getPosts()
  const series = await getSubposts()

  for (const parent of posts) {
    for (const post of [parent, ...(series.get(parent.id) ?? [])]) {
      const url = `/posts/${post.id}/`
      const title = titleText(post.data.title)
      const parts = chunks(post.body ?? "")
      const { headings } = await render(post)
      const listed = headings.filter(({ depth }) => depth >= 2)

      entries.push({
        k: "post",
        t: title,
        u: url,
        c: post.data.description,
        m: formatDate(post.data.date),
        x: [(parts[0]?.text ?? "").slice(0, 1000), ...(post.data.tags ?? [])]
          .filter(Boolean)
          .join(" "),
        i: parts[0]?.ids || undefined,
      })

      // Headings and chunks line up one to one; if a post ever breaks
      // that, its sections are skipped rather than linked wrongly.
      if (listed.length !== parts.length - 1) continue
      listed.forEach(({ slug, text }, index) => {
        const part = parts[index + 1]
        entries.push({
          k: "section",
          t: text,
          u: `${url}#${slug}`,
          c: title,
          x: part.text.slice(0, 1000),
          i: part.ids || undefined,
        })
      })
    }
  }

  for (const product of [...products, duplicateProject]) {
    for (const finding of product.findings) {
      // The duplicate write-up has no score of its own.
      const severity = "severity" in finding ? finding.severity : undefined
      const score = "score" in finding ? finding.score : undefined
      const anchor = finding.id.includes("XXXX")
        ? `${product.id}-pending`
        : finding.id.toLowerCase()
      entries.push({
        k: "cve",
        t: finding.title,
        u: `/cves/#${anchor}`,
        c: `${product.name} · ${finding.id}`,
        m: severity ? `${severity} ${score ?? ""}`.trim() : "duplicate",
        x: `${finding.id} ${severity ?? "duplicate"} ${product.name} ${product.context} ${finding.summary}`,
      })
    }
  }

  for (const talk of talks) {
    entries.push({
      k: "talk",
      t: talk.title,
      u: `/talks/#${talk.id}`,
      c: `${talk.event} · ${talk.location}`,
      m: talk.dateLabel,
      x: talk.description,
    })
  }

  for (const group of mentionGroups) {
    for (const mention of group.mentions) {
      entries.push({
        k: "mention",
        t: mention.name,
        u: `/mentions/#${group.id}`,
        c: mention.context,
        m: mention.year,
        x: `${mention.kind} ${mention.research.label} ${mention.description}`,
      })
    }
  }

  const pages: [string, string, string][] = [
    ["posts", "/posts/", "Everything I’ve written"],
    ["about", "/about/", "Who I am, CTFs over the years, what I’m into"],
    ["work", "/work/", "Experience and education"],
    ["talks", "/talks/", "Conference and meetup talks"],
    ["cves", "/cves/", "Published vulnerabilities"],
    ["mentions", "/mentions/", "Press coverage and citations"],
    ["rss", "/rss.xml", "Subscribe to new posts"],
  ]
  for (const [t, u, c] of pages) entries.push({ k: "page", t, u, c })

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json" },
  })
}

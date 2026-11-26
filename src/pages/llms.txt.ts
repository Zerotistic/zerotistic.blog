import { SITE, SOCIALS } from "@/consts"
import { duplicateProject, products } from "@/data/cves"
import { mentionGroups } from "@/data/mentions"
import { talks } from "@/data/talks"
import { getPosts, getSubposts, titleText } from "@/lib/content"
import type { APIContext } from "astro"

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

export async function GET(context: APIContext) {
  const base = context.site ?? new URL("https://zerotistic.blog")
  const url = (path: string) => new URL(path, base).href

  const posts = await getPosts()
  const series = await getSubposts()
  const cveCount = products.reduce(
    (sum, product) => sum + product.findings.length,
    0,
  )

  const lines: string[] = [
    `# ${SITE.title}`,
    "",
    `> ${SITE.description} Security researcher at HiddenLayer focusing on reverse engineering, vulnerability research, binary exploitation (pwn), deobfuscation, and automation.`,
    "",
    `zerotistic is a security researcher at HiddenLayer and CTF player with Project Sekai and Friendly Maltese Citizens. This site hosts original technical research, Binary Ninja tooling and tutorials, published CVEs and security advisories, conference talks, and press/academic citations.`,
    "",
    `- Website: ${url("/")}`,
    ...SOCIALS.map((social) => `- ${social.label}: ${social.href}`),
    "",
    "## Research & Blog Posts",
    "",
  ]

  for (const post of posts) {
    const title = titleText(post.data.title)
    const tags = post.data.tags?.length
      ? ` Tags: ${post.data.tags.join(", ")}.`
      : ""
    lines.push(
      `- [${title}](${url(`/posts/${post.id}.md`)}): ${post.data.description} (Published ${isoDate(post.data.date)}; HTML: ${url(`/posts/${post.id}/`)}.${tags})`,
    )
    const parts = series.get(post.id) ?? []
    for (const part of parts) {
      const partTitle = titleText(part.data.title)
      lines.push(
        `  - [${partTitle}](${url(`/posts/${part.id}.md`)}): ${part.data.description} (Published ${isoDate(part.data.date)}; HTML: ${url(`/posts/${part.id}/`)})`,
      )
    }
  }

  lines.push(
    "",
    "## Advisories & CVEs",
    "",
    `- [Published CVEs & Security Advisories](${url("/cves/")}): ${cveCount} disclosed vulnerabilities across ${products.map((p) => p.name).join(", ")}, plus an independent RCE exploit chain write-up for ${duplicateProject.name} (${duplicateProject.findings[0].id}).`,
    "",
    "## Talks",
    "",
    ...talks.map((talk) => {
      const href = talk.href.startsWith("http") ? talk.href : url(talk.href)
      return `- [${talk.title}](${href}): ${talk.event}, ${talk.location} (${talk.dateLabel}). ${talk.description}`
    }),
    "",
    "## Press & Academic Mentions",
    "",
    `- [Mentions & Citations](${url("/mentions/")}): ${mentionGroups
      .flatMap((group) => group.mentions.map((m) => `${m.name} (${m.year})`))
      .join(", ")}.`,
    "",
    "## Optional",
    "",
    `- [Full Markdown Compendium](${url("/llms-full.txt")}): Complete site content including all posts, advisories, talks, and career background in a single file.`,
    `- [About](${url("/about/")}): Author biography, CTF teams, and contact links.`,
    `- [Work & Education](${url("/work/")}): Career history across HiddenLayer, Hackcyom, Deloitte, and École 2600.`,
    `- [RSS Feed](${url("/rss.xml")}): Full-text Atom/RSS feed of all articles.`,
    `- [XML Sitemap](${url("/sitemap-index.xml")}): Canonical index of site pages.`,
    "",
  )

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}

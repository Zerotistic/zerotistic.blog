import { SITE, SOCIALS } from "@/consts"
import { duplicateProject, products } from "@/data/cves"
import { mentionGroups } from "@/data/mentions"
import { talks } from "@/data/talks"
import { education, work } from "@/data/work"
import { getPosts, getSubposts, titleText } from "@/lib/content"
import type { APIContext } from "astro"

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

export async function GET(context: APIContext) {
  const base = context.site ?? new URL("https://zerotistic.blog")
  const url = (path: string) => new URL(path, base).href

  const posts = await getPosts()
  const series = await getSubposts()

  const sections: string[] = [
    `# ${SITE.title} — Complete Site Content`,
    "",
    `> ${SITE.description}`,
    "",
    `Canonical site: ${url("/")}`,
    `Index: ${url("/llms.txt")}`,
    `Socials: ${SOCIALS.map((s) => `${s.label} (${s.href})`).join(" | ")}`,
    "",
    "## About",
    "",
    "zerotistic is a security researcher at HiddenLayer specializing in reverse engineering, vulnerability research, binary exploitation (pwn), deobfuscation, and automation. Active CTF player with Project Sekai and Friendly Maltese Citizens.",
    "",
    "## Experience & Education",
    "",
    ...work.map(
      (entry) =>
        `- **${entry.organization}** — ${entry.role} (${entry.start} to ${entry.end ?? "Present"}${entry.location ? `, ${entry.location}` : ""})`,
    ),
    `- **${education.organization}** — ${education.role} (${education.start} to ${education.end ?? "Present"}). ${education.note ?? ""}`,
    "",
    "## Published CVEs & Security Advisories",
    "",
    `Full page: ${url("/cves/")}`,
    "",
  ]

  for (const product of products) {
    sections.push(`### ${product.name} (${product.context})`, "")
    for (const finding of product.findings) {
      const score =
        finding.score && finding.cvss
          ? ` [CVSS ${finding.cvss}: ${finding.score}${finding.severity ? ` ${finding.severity}` : ""}]`
          : ""
      const published = finding.published ? ` (${finding.published})` : ""
      const refs = [
        finding.url ? `CVE: ${finding.url}` : undefined,
        finding.advisory
          ? `${finding.advisory.label}: ${finding.advisory.href}`
          : undefined,
      ]
        .filter(Boolean)
        .join(" | ")
      sections.push(
        `- **${finding.id}**${score}${published} — ${finding.title}: ${finding.summary}${refs ? ` (${refs})` : ""}`,
      )
    }
    sections.push("")
  }

  sections.push(`### ${duplicateProject.name} (${duplicateProject.context})`, "")
  for (const finding of duplicateProject.findings) {
    sections.push(
      `- **${finding.id}** — ${finding.title}: ${finding.summary} (Write-up: ${url(finding.writeup)})`,
    )
  }

  sections.push("", "## Talks", "", `Full page: ${url("/talks/")}`, "")
  for (const talk of talks) {
    const href = talk.href.startsWith("http") ? talk.href : url(talk.href)
    sections.push(
      `- **${talk.title}** (${talk.dateLabel}, ${talk.event}, ${talk.location}): ${talk.description} (${href})`,
    )
  }

  sections.push(
    "",
    "## Press & Academic Mentions",
    "",
    `Full page: ${url("/mentions/")}`,
    "",
  )
  for (const group of mentionGroups) {
    sections.push(`### ${group.title}`, "")
    for (const mention of group.mentions) {
      sections.push(
        `- **${mention.name}** (${mention.year}, ${mention.kind}) — ${mention.context}: ${mention.description} (${mention.href}; cites ${url(mention.research.href)})`,
      )
    }
    sections.push("")
  }

  sections.push("## Full Research Articles & Posts", "")

  for (const parent of posts) {
    const chain = [parent, ...(series.get(parent.id) ?? [])]
    for (const entry of chain) {
      const heading =
        entry.id === parent.id
          ? titleText(entry.data.title)
          : `${titleText(parent.data.title)} — ${titleText(entry.data.title)}`
      sections.push(
        "---",
        "",
        `### ${heading}`,
        "",
        `- Canonical URL: ${url(`/posts/${entry.id}/`)}`,
        `- Markdown URL: ${url(`/posts/${entry.id}.md`)}`,
        `- Published: ${isoDate(entry.data.date)}`,
        ...(entry.data.updated
          ? [`- Updated: ${isoDate(entry.data.updated)}`]
          : []),
        ...(entry.data.tags?.length
          ? [`- Tags: ${entry.data.tags.join(", ")}`]
          : []),
        `- Summary: ${entry.data.description}`,
        "",
        (entry.body ?? "").trim(),
        "",
      )
    }
  }

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}

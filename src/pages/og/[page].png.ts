import { duplicateProject, products } from "@/data/cves"
import { mentionGroups } from "@/data/mentions"
import { talks } from "@/data/talks"
import { getPosts } from "@/lib/content"
import { generateOgImage } from "@/lib/og-image"
import type { APIRoute } from "astro"

type HubCard = {
  page: string
  title: string
  description: string
  meta: string
}

export async function getStaticPaths() {
  const posts = await getPosts()
  const allFindings = products.flatMap((product) => product.findings)
  const publishedCount = allFindings.filter((f) => f.published).length
  const criticalCount = allFindings.filter((f) => f.severity === "critical").length
  const mentionCount = mentionGroups.reduce((n, g) => n + g.mentions.length, 0)

  const cards: HubCard[] = [
    {
      page: "posts",
      title: "Reverse Engineering & Vulnerability Research",
      description:
        "Technical writeups on Binary Ninja, deobfuscation, pwn, protocols, and CTF challenges.",
      meta: `${posts.length} posts · technical writeups`,
    },
    {
      page: "cves",
      title: "Published CVEs & Security Advisories",
      description:
        "Vulnerabilities discovered across AI infrastructure, ML frameworks, and web tooling.",
      meta: `${publishedCount} published · ${products.length} projects · ${criticalCount} critical · ${duplicateProject.findings.length} duplicate`,
    },
    {
      page: "talks",
      title: "Security Research Talks & Slides",
      description:
        "Conference and meetup talks on automated vulnerability discovery and reverse engineering.",
      meta: `${talks.length} talks · recordings & slides`,
    },
    {
      page: "mentions",
      title: "Press Mentions & Research Citations",
      description:
        "Academic theses, zines, podcasts, and press coverage referencing zerotistic’s research.",
      meta: `${mentionCount} citations & press mentions`,
    },
    {
      page: "about",
      title: "About zerotistic",
      description:
        "Security researcher at HiddenLayer. Reverse engineering, pwn, automation, and CTFs.",
      meta: "HiddenLayer · Project Sekai · FMC",
    },
    {
      page: "work",
      title: "Experience & Education",
      description:
        "Security research career across HiddenLayer, Hackcyom, Deloitte, and École 2600.",
      meta: "HiddenLayer · Hackcyom · Deloitte",
    },
  ]

  return cards.map((card) => ({
    params: { page: card.page },
    props: card,
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const { title, description, meta } = props as HubCard
  const image = await generateOgImage({ title, description, meta })
  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  })
}

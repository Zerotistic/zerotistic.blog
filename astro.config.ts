import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"
import { satteri } from "@astrojs/markdown-satteri"
import {
  blockExpressiveCode,
  inlineExpressiveCode,
} from "./src/lib/expressive-code"
import { temmlMath } from "./src/lib/math"
import { calloutDirective } from "./src/lib/callout"
import { externalLinks } from "./src/lib/external-links"
import { headingNamespace } from "./src/lib/heading-namespace"
import { headingAnchors } from "./src/lib/heading-anchors"
import { imageCaptions } from "./src/lib/image-captions"
import { imagePlaceholders } from "./src/lib/image-placeholders"

function gitLastMod(paths: string[]): string | undefined {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...paths], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    return out ? new Date(out).toISOString() : undefined
  } catch {
    return undefined
  }
}

function buildLastModMap(): Map<string, string> {
  const map = new Map<string, string>()
  const blogDir = "src/content/blog"
  let newestPostMs = 0

  for (const slug of readdirSync(blogDir)) {
    const indexPath = join(blogDir, slug, "index.md")
    try {
      const md = readFileSync(indexPath, "utf8")
      const updated = md.match(/^updated:\s*["']?([^"'\n]+)["']?/m)?.[1]
      const date = md.match(/^date:\s*["']?([^"'\n]+)["']?/m)?.[1]
      const raw = updated ?? date
      if (!raw) continue
      const parsed = new Date(raw)
      if (Number.isNaN(parsed.getTime())) continue
      const iso = parsed.toISOString()
      map.set(`/posts/${slug}/`, iso)
      if (parsed.getTime() > newestPostMs) newestPostMs = parsed.getTime()
    } catch {}
  }

  if (newestPostMs > 0) {
    const newestIso = new Date(newestPostMs).toISOString()
    map.set("/", newestIso)
    map.set("/posts/", newestIso)
  }

  const cvesSrc = readFileSync("src/data/cves.ts", "utf8")
  const cveDates = [...cvesSrc.matchAll(/published:\s*"(\d{4}-\d{2}-\d{2})"/g)]
    .map((m) => Date.parse(m[1]))
    .filter(Number.isFinite)
  if (cveDates.length) {
    map.set("/cves/", new Date(Math.max(...cveDates)).toISOString())
  }

  const talksSrc = readFileSync("src/data/talks.ts", "utf8")
  const talkDates = [...talksSrc.matchAll(/date:\s*"(\d{4}-\d{2}-\d{2})"/g)]
    .map((m) => Date.parse(m[1]))
    .filter(Number.isFinite)
  if (talkDates.length) {
    map.set("/talks/", new Date(Math.max(...talkDates)).toISOString())
  }

  const staticSources: [string, string[]][] = [
    ["/about/", ["src/pages/about.astro", "src/data/ctf-history.ts", "src/data/favorites.ts"]],
    ["/work/", ["src/pages/work.astro", "src/data/work.ts"]],
    ["/mentions/", ["src/pages/mentions.astro", "src/data/mentions.ts"]],
  ]
  for (const [route, files] of staticSources) {
    const mod = gitLastMod(files)
    if (mod) map.set(route, mod)
  }

  return map
}

const lastModMap = buildLastModMap()

export default defineConfig({
  site: "https://zerotistic.blog",
  trailingSlash: "always",
  compressHTML: true,
  image: {
    layout: "constrained",
    breakpoints: [480, 768, 1200, 1600],
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        avif: { quality: 62 },
        webp: { quality: 82 },
      },
    },
  },
  // Old Jekyll/Chirpy URLs that must keep resolving.
  redirects: {
    "/tags": "/posts/",
    "/posts/binary-ninja-serie-announcement":
      "/posts/binary-ninja-zero-to-hero/",
    "/posts/binary-ninja-zero-to-hero-1":
      "/posts/binary-ninja-zero-to-hero/part-1/",
    "/posts/binary-ninja-zero-to-hero-2":
      "/posts/binary-ninja-zero-to-hero/part-2/",
    "/archives": "/posts/",
    "/categories": "/posts/",
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !/\/posts\/[^/]+\/[^/]+\/?$/.test(page) &&
        !page.includes("/tags/") &&
        !page.endsWith(".md"),
      serialize(item) {
        const pathname = new URL(item.url).pathname
        const lastmod = lastModMap.get(pathname)
        if (lastmod) item.lastmod = lastmod
        return item
      },
    }),
  ],
  markdown: {
    syntaxHighlight: false,
    processor: satteri({
      features: { directive: true, math: true },
      mdastPlugins: [calloutDirective, inlineExpressiveCode, temmlMath],
      hastPlugins: [
        externalLinks,
        imagePlaceholders,
        imageCaptions,
        blockExpressiveCode,
        headingNamespace,
        headingAnchors,
      ],
    }),
  },
})

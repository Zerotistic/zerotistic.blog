import { getCollection, type CollectionEntry } from "astro:content"
import { getImage } from "astro:assets"
import cached from "@/data/link-previews.json"
import { titleText } from "@/lib/content"

export type LinkPreview = { title: string; description?: string; image?: string }
const origin = "https://zerotistic.blog"

export function previewKey(href: string) {
  const url = new URL(href, origin)
  if (!['http:', 'https:'].includes(url.protocol)) return ""
  url.hash = ""
  url.pathname = url.pathname.replace(/\/$/, "") || "/"
  return url.origin === origin ? url.pathname + url.search : url.href
}

export async function postLinkPreviews(entry: CollectionEntry<"blog">) {
  const previews: Record<string, LinkPreview> = {}
  const body = entry.body ?? ""
  for (const [href, data] of Object.entries(cached) as [string, LinkPreview][]) {
    if (body.includes(href)) previews[previewKey(href)] = data
  }
  const posts = await getCollection("blog", ({ data }) => !data.draft)
  for (const post of posts) {
    const href = `/posts/${post.id}`
    if (!body.includes(href)) continue
    previews[href] = {
      title: titleText(post.data.title),
      description: post.data.description,
      ...(post.data.image ? {
        image: (await getImage({ src: post.data.image, width: 640, format: "webp" })).src,
      } : {}),
    }
  }
  for (const [href, override] of Object.entries(entry.data.linkPreviews ?? {})) {
    const key = previewKey(href)
    if (!key) continue
    if (override === false) {
      delete previews[key]
      continue
    }
    const base = previews[key]
    if (!override.title && !base?.title) continue
    previews[key] = {
      ...base,
      title: override.title ?? base.title,
      ...(override.description !== undefined ? { description: override.description } : {}),
      ...(override.image ? {
        image: (await getImage({ src: override.image, width: 640, format: "webp" })).src,
      } : {}),
    }
  }
  return previews
}

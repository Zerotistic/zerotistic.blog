import { generateOgImage } from "@/lib/og-image"
import { formatDate } from "@/lib/utils"
import { getCollection, type CollectionEntry } from "astro:content"
import type { APIRoute } from "astro"

type Props = { post: CollectionEntry<"blog"> }

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft)
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }))
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as Props
  const tags = (post.data.tags ?? []).map((tag) => `#${tag}`).join("  ")
  const meta = [formatDate(post.data.date), tags].filter(Boolean).join("  ·  ")
  const image = await generateOgImage({
    title: post.data.title,
    meta,
  })
  return new Response(image, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  })
}

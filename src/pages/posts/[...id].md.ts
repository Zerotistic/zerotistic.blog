import { getCollection, getEntries, type CollectionEntry } from "astro:content"
import type { APIContext, GetStaticPaths } from "astro"
import { titleText } from "@/lib/content"
import { isSubpost } from "@/lib/utils"

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("blog", ({ data }) => !data.draft)
  const parents = new Map(
    posts
      .filter((post) => !isSubpost(post.id))
      .map((post) => [post.id, post]),
  )

  return posts.map((post) => ({
    params: { id: post.id },
    props: {
      post,
      parent: isSubpost(post.id)
        ? parents.get(post.id.split("/")[0])
        : undefined,
    },
  }))
}

type Props = {
  post: CollectionEntry<"blog">
  parent?: CollectionEntry<"blog">
}

export async function GET(context: APIContext) {
  const { post, parent } = context.props as Props
  const base = context.site ?? new URL("https://zerotistic.blog")
  const authors = await getEntries(post.data.authors)
  const title =
    parent && parent.id !== post.id
      ? `${titleText(parent.data.title)} — ${titleText(post.data.title)}`
      : titleText(post.data.title)

  const headerLines = [
    `# ${title}`,
    "",
    `> ${post.data.description}`,
    "",
    `- URL: ${new URL(`/posts/${post.id}/`, base).href}`,
    `- Published: ${post.data.date.toISOString().slice(0, 10)}`,
    ...(post.data.updated
      ? [`- Updated: ${post.data.updated.toISOString().slice(0, 10)}`]
      : []),
    ...(authors.length
      ? [`- Author: ${authors.map((a) => a.data.name).join(", ")}`]
      : []),
    ...(post.data.tags?.length
      ? [`- Tags: ${post.data.tags.join(", ")}`]
      : []),
    "",
    "---",
    "",
    (post.body ?? "").trim(),
    "",
  ]

  return new Response(headerLines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}

import { SITE } from "@/consts"
import { getPosts, titleText } from "@/lib/content"
import rss from "@astrojs/rss"
import type { APIContext } from "astro"

export async function GET(context: APIContext) {
  const posts = await getPosts()
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: titleText(post.data.title),
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}`,
    })),
  })
}

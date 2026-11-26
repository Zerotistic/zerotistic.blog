import { SITE } from "@/consts"
import { getPosts, getSubposts, titleText } from "@/lib/content"
import rss from "@astrojs/rss"
import type { APIContext } from "astro"

const cleanRssHtml = (html: string, origin: string) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<div class="copy">[\s\S]*?<\/div>/gi, "")
    .replace(/<div class="gutter"[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/\s+style="--(?:0|1|lqip)[^"]*"/gi, "")
    .replace(/\s+data-astro-[a-z0-9-]+(?:="[^"]*")?/gi, "")
    .replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g, `$1="${origin}$2"`)

export async function GET(context: APIContext) {
  const site = context.site!
  const origin = site.origin
  const posts = await getPosts()
  const series = await getSubposts()

  const feedEntries = posts
    .flatMap((parent) => [
      {
        post: parent,
        title: titleText(parent.data.title),
      },
      ...(series.get(parent.id) ?? []).map((part) => ({
        post: part,
        title: `${titleText(parent.data.title)} — ${titleText(part.data.title)}`,
      })),
    ])
    .sort((a, b) => b.post.data.date.getTime() - a.post.data.date.getTime())

  const selfHref = new URL("rss.xml", site).href

  return rss({
    title: SITE.title,
    description: SITE.description,
    site,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
    customData: [
      `<language>${SITE.locale.toLowerCase()}</language>`,
      `<atom:link href="${selfHref}" rel="self" type="application/rss+xml" />`,
    ].join(""),
    items: feedEntries.map(({ post, title }) => {
      const html = post.rendered?.html
      return {
        title,
        description: post.data.description,
        pubDate: post.data.date,
        link: `/posts/${post.id}/`,
        ...(post.data.tags?.length ? { categories: post.data.tags } : {}),
        ...(html ? { content: cleanRssHtml(html, origin) } : {}),
      }
    }),
  })
}

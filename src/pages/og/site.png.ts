import { SITE } from "@/consts"
import { generateOgImage } from "@/lib/og-image"
import type { APIRoute } from "astro"

export const GET: APIRoute = async () => {
  const image = await generateOgImage({
    title: SITE.title,
    description: "Reverse engineering, pwn, automation and dumb ideas.",
    meta: "vulnerability research · reverse engineering",
  })
  return new Response(image, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  })
}

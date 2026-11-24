import { existsSync, statSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { h } from "hastscript"
import { defineHastPlugin } from "satteri"
import sharp from "sharp"

/**
 * Every local raster image in a post gets a 20 pixel copy of itself inlined
 * as a background on a wrapper. The wrapper shows it, blurred by scaling,
 * until the real image has decoded and fades in over it. Images with
 * transparency (stickers) are left alone: a blurred blob behind cut out art
 * looks like a stain.
 */
const cache = new Map<string, Promise<string | undefined>>()

async function placeholder(path: string) {
  const key = `${path}:${statSync(path).mtimeMs}`
  let pending = cache.get(key)
  if (!pending) {
    pending = (async () => {
      const image = sharp(path)
      // Screenshots often carry an unused alpha channel; only real cut outs
      // are skipped.
      if (!(await image.stats()).isOpaque) return undefined
      const buffer = await image
        .resize(20, undefined, { fit: "inside" })
        .webp({ quality: 40 })
        .toBuffer()
      return `data:image/webp;base64,${buffer.toString("base64")}`
    })()
    cache.set(key, pending)
  }
  return pending
}

export const imagePlaceholders = defineHastPlugin({
  name: "image-placeholders",
  element: {
    filter: ["img"],
    async visit(node, ctx) {
      const src = node.properties.src
      if (typeof src !== "string" || !ctx.fileURL) return
      if (/^(https?:)?\/\//.test(src) || /\.(svg|gif)$/i.test(src)) return
      const path = resolve(dirname(fileURLToPath(ctx.fileURL)), src)
      if (!existsSync(path)) return
      const data = await placeholder(path)
      if (!data) return
      ctx.wrapNode(
        node,
        h("span", { className: ["lqip"], style: `--lqip: url("${data}")` }),
      )
    },
  },
})

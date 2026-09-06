import { readFile, writeFile, readdir, mkdir } from "node:fs/promises"
import { resolve, relative, join } from "node:path"
import { createHash } from "node:crypto"
import { parseHTML } from "linkedom"
import sharp from "sharp"

const root = resolve(import.meta.dirname, "..")
const cachePath = join(root, "src/data/link-previews.json")
const cache = JSON.parse(await readFile(cachePath, "utf8"))
const postFlag = process.argv.indexOf("--post")
const post = postFlag >= 0 ? process.argv[postFlag + 1] : undefined
if (postFlag >= 0 && (!post || post.includes("..") || post.startsWith("/"))) throw Error("Use --post followed by a post slug")
const directory = join(root, "dist/posts", post ?? "")
const urls = new Set()
const origin = "https://zerotistic.blog"
const clean = (text) => (text ?? "").replace(/\s+/g, " ").trim()

function publicUrl(value, base) {
  const url = new URL(value, base)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw Error("Unsupported URL")
  if (url.hostname === "localhost" || url.hostname.endsWith(".local") || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(":")) throw Error("Non-public URL")
  url.hash = ""
  return url
}

async function download(input, limit) {
  let url = publicUrl(input)
  const signal = AbortSignal.timeout(8000)
  for (let redirects = 0; redirects <= 4; redirects++) {
    const response = await fetch(url, {
      redirect: "manual", signal,
      headers: { "User-Agent": "zerotistic.blog link preview cache", Accept: "text/html,image/*;q=0.8" },
    })
    if (response.status >= 300 && response.status < 400 && response.headers.has("location")) {
      await response.body?.cancel()
      url = publicUrl(response.headers.get("location"), url)
      continue
    }
    if (!response.ok) { await response.body?.cancel(); throw Error(`HTTP ${response.status}`) }
    const chunks = []
    let size = 0
    for await (const chunk of response.body) {
      size += chunk.length
      if (size > limit) throw Error("Response too large")
      chunks.push(chunk)
    }
    return { body: Buffer.concat(chunks), type: response.headers.get("content-type") ?? "", url }
  }
  throw Error("Too many redirects")
}

for (const file of await readdir(directory, { recursive: true, withFileTypes: true })) {
  if (!file.isFile() || !file.name.endsWith(".html")) continue
  const { document } = parseHTML(await readFile(join(file.parentPath, file.name), "utf8"))
  for (const anchor of document.querySelectorAll("prose-content a[href]")) {
    if (anchor.closest(".footnotes, pre, code") || anchor.querySelector("img")) continue
    const href = anchor.getAttribute("href")
    if (!/^https?:\/\//.test(href)) continue
    try {
      const url = publicUrl(href)
      if (url.origin !== origin) urls.add(url.href)
    } catch { /* Leave unsupported references as ordinary links. */ }
  }
}

const pending = [...urls].filter(url => process.argv.includes("--force") || !cache[url]?.fetchedAt || Date.now() - Date.parse(cache[url].fetchedAt) > 30 * 86400000)
let updated = 0
await mkdir(join(root, "public/link-previews"), { recursive: true })
await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
  while (pending.length) {
    const url = pending.shift()
    try {
      const result = await download(url, 2 * 1024 * 1024)
      if (!result.type.includes("html")) continue
      const { document } = parseHTML(result.body.toString("utf8"))
      const meta = (name) => document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.getAttribute("content")
      const title = clean(meta("og:title") || meta("twitter:title") || document.querySelector("title")?.textContent).slice(0, 180)
      if (!title) continue
      const description = clean(meta("og:description") || meta("description") || meta("twitter:description")).slice(0, 400)
      const entry = { title, description, fetchedAt: new Date().toISOString() }
      const image = meta("og:image") || meta("twitter:image")
      if (image) {
        try {
          const imageUrl = publicUrl(image, result.url)
          const downloaded = await download(imageUrl, 5 * 1024 * 1024)
          if (!downloaded.type.startsWith("image/")) throw Error("Not an image")
          const filename = `${createHash("sha256").update(url).digest("hex").slice(0, 20)}.webp`
          await sharp(downloaded.body, { limitInputPixels: 16_000_000 }).rotate().resize({ width: 640, height: 360, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(root, "public/link-previews", filename))
          entry.image = `/link-previews/${filename}`
        } catch { /* The text preview still works without an image. */ }
      }
      cache[url] = entry
      updated++
      console.log(`Cached ${url}`)
    } catch (error) {
      console.warn(`Kept existing preview for ${url}: ${error.message}`)
    }
  }
}))
await writeFile(cachePath, JSON.stringify(Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n")
console.log(`${updated} previews updated; cache: ${relative(root, cachePath)}. Run pnpm build to include them.`)

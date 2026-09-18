// Export delivery assets without touching the original artwork or animation atlas.
// Run from the repository root: node scripts/optimize-visual-assets.mjs
import { mkdir, readFile } from "node:fs/promises"
import sharp from "sharp"

const output = "src/assets/optimized"
for (const directory of [
  "artoria",
  "newspaper",
  "jumping",
  "logos",
  "landscape",
])
  await mkdir(`${output}/${directory}`, { recursive: true })

for (const [name, source] of [
  ["day", "avalon-landscape"],
  ["night", "avalon-landscape-dusk"],
])
  await sharp(`public/static/${source}.webp`)
    .avif({ quality: 45, effort: 6 })
    .toFile(`${output}/landscape/${name}.avif`)

async function exportWebp(input, destination, transform = (image) => image) {
  await transform(sharp(input))
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(`${output}/${destination}.webp`)
}

for (const name of ["resting", "reading", "investigating", "waving"])
  await exportWebp(
    name === "resting"
      ? "public/static/artoria-last-episode.webp"
      : `public/static/artoria/${name}.webp`,
    `artoria/${name}`,
  )

// Only these eye pixels are visible through the SVG masks. Keep their original
// 360 × 540 coordinate system when placing the 80 × 65 patch in Artoria.astro.
const eyes = await sharp(
  "public/static/artoria/investigating-blink-source.webp",
)
  .resize(360, 540)
  .toBuffer()
await exportWebp(eyes, "artoria/investigating-eyes", (image) =>
  image.extract({ left: 185, top: 80, width: 80, height: 65 }),
)

for (const name of [
  "proud",
  "blink",
  "crouch",
  "takeoff",
  "air",
  "land",
  "curious",
])
  await exportWebp(`public/static/work/jumping/${name}.webp`, `jumping/${name}`)

for (const name of [
  "reading",
  "lean",
  "discover",
  "show",
  "proud",
  "turn",
  "blink",
  "curious",
  "foot-left",
  "foot-right",
  "inbetweens-padded",
])
  await exportWebp(
    `public/static/mentions/newspaper/${name}.webp`,
    `newspaper/${name}`,
  )
// Everything above the skirt is masked out; the seated base starts at y=330.
await exportWebp(
  "public/static/mentions/newspaper/seated-base.webp",
  "newspaper/seated-base",
  (image) => image.extract({ left: 0, top: 330, width: 360, height: 230 }),
)

for (const [name, extension] of [
  ["hiddenlayer", "png"],
  ["hackcyom", "jpeg"],
])
  await exportWebp(
    `public/static/work/${name}.${extension}`,
    `logos/${name}`,
    (image) => image.resize(96, 96),
  )

// ICO contains several sizes; decode its largest uncompressed BGRA bitmap.
const ico = await readFile("public/static/work/deloitte.ico")
const entries = Array.from({ length: ico.readUInt16LE(4) }, (_, i) => {
  const offset = 6 + i * 16
  return {
    width: ico[offset] || 256,
    length: ico.readUInt32LE(offset + 8),
    start: ico.readUInt32LE(offset + 12),
  }
}).sort((a, b) => b.width - a.width)
const { width, start } = entries[0]
if (
  ico.readUInt32LE(start) !== 40 ||
  ico.readUInt16LE(start + 14) !== 32 ||
  ico.readUInt32LE(start + 16) !== 0
)
  throw new Error("Expected an uncompressed 32-bit Deloitte icon")
const pixels = Buffer.alloc(width * width * 4)
for (let y = 0; y < width; y++) {
  for (let x = 0; x < width; x++) {
    const source = start + 40 + ((width - 1 - y) * width + x) * 4
    const target = (y * width + x) * 4
    pixels[target] = ico[source + 2]
    pixels[target + 1] = ico[source + 1]
    pixels[target + 2] = ico[source]
    pixels[target + 3] = ico[source + 3]
  }
}
await sharp(pixels, { raw: { width, height: width, channels: 4 } })
  .webp({ quality: 88, alphaQuality: 100, effort: 6 })
  .toFile(`${output}/logos/deloitte.webp`)

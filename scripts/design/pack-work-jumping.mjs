// Export generated key poses into equally sized, foot-aligned transparent sprites.
// Artwork is generated with imagegen; this only keys the export backdrop and packs it.
import sharp from "sharp"
import { mkdir } from "node:fs/promises"
const source = new URL("./source/work-jumping-chroma.png", import.meta.url)
const destination = new URL(
  "../../public/static/work/jumping/",
  import.meta.url,
)
await mkdir(destination, { recursive: true })
const { data, info } = await sharp(source.pathname)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
for (let i = 0; i < data.length; i += 4) {
  const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
  const green = g - Math.max(r, b)
  if (green < 25) continue
  if (green > 170 && r < 65 && b < 65) {
    data[i + 3] = 0
  } else {
    const alpha = Math.max(0, Math.min(1, 1 - (green - 15) / 225))
    data[i + 3] = Math.round(255 * alpha)
    if (alpha > 0) {
      data[i] = Math.min(255, Math.round(r / alpha))
      data[i + 2] = Math.min(255, Math.round(b / alpha))
      data[i + 1] = Math.max(
        0,
        Math.min(
          Math.max(data[i], data[i + 2]) + 6,
          Math.round((g - 240 * (1 - alpha)) / alpha),
        ),
      )
    }
  }
}
// The export retains a few neutral backdrop pixels immediately outside its ink.
// Remove only neutral gray connected to the already-transparent background.
// Dark outlines and the opaque white dress are barriers to this edge cleanup.
const visited = new Uint8Array(info.width * info.height)
const queue = new Int32Array(visited.length)
let head = 0,
  tail = 0
for (let p = 0; p < visited.length; p++) {
  if (data[p * 4 + 3] === 0) {
    visited[p] = 1
    queue[tail++] = p
  }
}
while (head < tail) {
  const p = queue[head++]
  for (const n of [p - 1, p + 1, p - info.width, p + info.width]) {
    if (n < 0 || n >= visited.length || visited[n]) continue
    const i = n * 4,
      lo = Math.min(data[i], data[i + 1], data[i + 2]),
      hi = Math.max(data[i], data[i + 1], data[i + 2])
    if (lo >= 100 && hi <= 224 && hi - lo < 22) {
      visited[n] = 1
      data[i + 3] = 0
      queue[tail++] = n
    }
  }
}
const keyed = await sharp(data, { raw: info }).png().toBuffer()
// Region, then its planted-foot / center anchor in the original sheet.
// The airborne frame keeps the same torso alignment as takeoff; the jump is animated in CSS pixels.
const poses = [
  { name: "stand", region: [0, 0, 397, 548], anchor: [239, 539] },
  { name: "crouch", region: [400, 70, 331, 478], anchor: [591, 537] },
  { name: "takeoff", region: [735, 0, 365, 548], anchor: [956, 539] },
  { name: "air", region: [1105, 0, 343, 548], anchor: [1320, 539] },
  { name: "land", region: [0, 552, 386, 534], anchor: [230, 1050] },
  { name: "proud", region: [385, 552, 354, 534], anchor: [604, 1060] },
  { name: "blink", region: [740, 552, 360, 534], anchor: [965, 1060] },
  { name: "curious", region: [1100, 552, 348, 534], anchor: [1325, 1060] },
]
const layers = []
for (let i = 0; i < poses.length; i++) {
  const {
    name,
    region: [left, top, width, height],
    anchor: [ax, ay],
  } = poses[i]
  const crop = await sharp(keyed)
    .extract({ left, top, width, height })
    .toBuffer()
  const frame = await sharp({
    create: { width: 480, height: 640, channels: 4, background: "#00000000" },
  })
    .composite([
      { input: crop, left: 300 - (ax - left), top: 600 - (ay - top) },
    ])
    .png()
    .toBuffer()
  await sharp(frame)
    .webp({ quality: 94, alphaQuality: 100 })
    .toFile(new URL(`${name}.webp`, destination).pathname)
  layers.push({
    input: frame,
    left: (i % 4) * 480,
    top: Math.floor(i / 4) * 640,
  })
}
await sharp({
  create: { width: 1920, height: 1280, channels: 4, background: "#00000000" },
})
  .composite(layers)
  .webp({ quality: 92, alphaQuality: 100 })
  .toFile(new URL("poses.webp", destination).pathname)
console.log("Exported eight transparent poses and sprite atlas.")

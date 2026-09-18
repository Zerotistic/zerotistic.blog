// Export the generated sprite sheet; the drawings themselves remain unmodified.
import sharp from "sharp"
import { mkdir } from "node:fs/promises"
const source = new URL(
  "./source/mentions-newspaper-chroma.png",
  import.meta.url,
)
const destination = new URL(
  "../../public/static/mentions/newspaper/",
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
  if (g < 150 || green < 35) continue
  if (green > 170 && r < 65 && b < 65) data[i + 3] = 0
  else {
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
// Remove residual green only along keyed edges; the green irises remain intact.
for (let p = 0; p < info.width * info.height; p++) {
  const i = p * 4
  if (!data[i + 3] || data[i + 1] <= Math.max(data[i], data[i + 2]) + 8)
    continue
  const edge = [p - 1, p + 1, p - info.width, p + info.width].some(
    (n) => n >= 0 && n < info.width * info.height && data[n * 4 + 3] < 192,
  )
  if (edge) data[i + 1] = Math.max(data[i], data[i + 2]) + 3
}
const keyed = await sharp(data, { raw: info }).png().toBuffer()
const names = [
  "reading",
  "lean",
  "discover",
  "show",
  "proud",
  "turn",
  "blink",
  "curious",
]
for (const [i, name] of names.entries()) {
  const crop = await sharp(keyed)
    .extract({
      left: (i % 4) * 362,
      top: Math.floor(i / 4) * 543,
      width: 360,
      height: 543,
    })
    .toBuffer()
  await sharp({
    create: { width: 360, height: 560, channels: 4, background: "#00000000" },
  })
    .composite([{ input: crop, left: 0, top: 12 }])
    .webp({ quality: 94, alphaQuality: 100 })
    .toFile(new URL(`${name}.webp`, destination).pathname)
}
console.log("Exported eight registered newspaper poses.")

// Separate the warm boot/ankle pixels from the cool ivory skirt for independent kicks.
const { data: seated, info: frameInfo } = await sharp(
  new URL("reading.webp", destination).pathname,
)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
const taken = new Uint8Array(360 * 560)
for (const [side, name] of ["foot-left", "foot-right"].entries()) {
  const mask = new Uint8Array(360 * 560)
  for (let y = 438; y < 547; y++) {
    let first = 360,
      last = -1
    for (let x = 164; x < 259; x++) {
      if (x < 205 + (y - 460) * 0.12 !== (side === 0)) continue
      const i = (y * 360 + x) * 4
      if (
        seated[i + 3] > 8 &&
        seated[i] - seated[i + 2] > 15 &&
        seated[i] - seated[i + 1] > 7
      ) {
        mask[y * 360 + x] = 1
        first = Math.min(first, x)
        last = Math.max(last, x)
      }
    }
    for (let x = first; x <= last; x++)
      if (seated[(y * 360 + x) * 4 + 3]) mask[y * 360 + x] = 1
  }
  for (let pass = 0; pass < 2; pass++) {
    const previous = mask.slice()
    for (let y = 438; y < 549; y++)
      for (let x = 162; x < 260; x++) {
        if (x < 205 + (y - 460) * 0.12 !== (side === 0)) continue
        const n = y * 360 + x,
          i = n * 4
        if (
          !previous[n] &&
          [n - 1, n + 1, n - 360, n + 360].some((p) => previous[p]) &&
          seated[i + 3] > 0 &&
          Math.max(seated[i], seated[i + 1], seated[i + 2]) < 170 &&
          seated[i] - seated[i + 2] > 1
        )
          mask[n] = 1
      }
  }
  const pixels = Buffer.from(seated)
  let count = 0
  for (let p = 0; p < mask.length; p++) {
    if (!mask[p]) pixels.fill(0, p * 4, p * 4 + 4)
    else {
      taken[p] = 1
      count++
    }
  }
  await sharp(pixels, { raw: frameInfo })
    .webp({ lossless: true })
    .toFile(new URL(`${name}.webp`, destination).pathname)
  console.log(`${name}: ${count} separated pixels`)
}
const base = Buffer.from(seated)
for (let p = 0; p < taken.length; p++)
  if (taken[p]) base.fill(0, p * 4, p * 4 + 4)
// Discard isolated remnants of the original boot outline inside the cleared area.
const connected = new Uint8Array(360 * 560),
  queue = []
for (let p = 0; p < connected.length; p++) {
  const x = p % 360,
    y = Math.floor(p / 360)
  if ((x < 160 || x > 261 || y < 438 || y > 548) && base[p * 4 + 3] > 8) {
    connected[p] = 1
    queue.push(p)
  }
}
for (let head = 0; head < queue.length; head++)
  for (const n of [
    queue[head] - 1,
    queue[head] + 1,
    queue[head] - 360,
    queue[head] + 360,
  ]) {
    if (
      n >= 0 &&
      n < connected.length &&
      !connected[n] &&
      base[n * 4 + 3] > 8
    ) {
      connected[n] = 1
      queue.push(n)
    }
  }
for (let p = 0; p < connected.length; p++)
  if (!connected[p]) base.fill(0, p * 4, p * 4 + 4)
await sharp(base, { raw: frameInfo })
  .webp({ lossless: true })
  .toFile(new URL("seated-base.webp", destination).pathname)

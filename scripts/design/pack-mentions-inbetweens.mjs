// Register the new drawings to the existing keyframes, then pack one upper-body atlas.
import sharp from "sharp"
import { writeFile, mkdir } from "node:fs/promises"
const assets = new URL(
  "../../public/static/mentions/newspaper/",
  import.meta.url,
)
const output = new URL("./review/mentions-inbetweens/", import.meta.url)
await mkdir(output, { recursive: true })
const frameWidth = 360,
  frameHeight = 347
// Transparent gutters prevent neighboring rows bleeding into a scaled SVG viewport.
const padding = 8,
  strideX = frameWidth + padding * 2,
  strideY = frameHeight + padding * 2
const mixes = [
  ["reading", "lean", 1 / 3],
  ["reading", "lean", 2 / 3],
  ["lean", "discover", 0.25],
  ["lean", "discover", 0.5],
  ["lean", "discover", 0.75],
  ["discover", "show", 0.25],
  ["discover", "show", 0.5],
  ["discover", "show", 0.75],
  ["show", "proud", 1 / 3],
  ["show", "proud", 2 / 3],
  ["proud", "turn", 0.25],
  ["proud", "turn", 0.5],
  ["proud", "turn", 0.75],
  ["turn", "reading", 0.25],
  ["turn", "reading", 0.5],
  ["turn", "reading", 0.75],
  ["reading", "curious", 0.2],
  ["reading", "curious", 0.4],
  ["reading", "curious", 0.6],
  ["reading", "curious", 0.8],
]
for (const t of [0.2, 0.4, 0.6, 0.8]) mixes.push(["discover", "frame-5", t])
for (const t of [0.2, 0.4, 0.6, 0.8]) mixes.push(["frame-10", "frame-11", t])
async function pixels(path) {
  return sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
}
function key(data, info) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2],
      green = g - Math.max(r, b)
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
  for (let p = 0; p < info.width * info.height; p++) {
    const i = p * 4
    if (!data[i + 3] || data[i + 1] <= Math.max(data[i], data[i + 2]) + 8)
      continue
    if (
      [p - 1, p + 1, p - info.width, p + info.width].some(
        (n) => n >= 0 && n < info.width * info.height && data[n * 4 + 3] < 192,
      )
    )
      data[i + 1] = Math.max(data[i], data[i + 2]) + 3
  }
  return sharp(data, { raw: info }).png().toBuffer()
}
// The open green irises provide stable registration points across changing paper positions.
function eyes({ data, info }) {
  const w = info.width,
    h = info.height,
    mask = new Uint8Array(w * h),
    groups = []
  for (let y = Math.floor(h * 0.1); y < h * 0.41; y++)
    for (let x = Math.floor(w * 0.15); x < w * 0.85; x++) {
      const i = (y * w + x) * 4,
        r = data[i],
        g = data[i + 1],
        b = data[i + 2]
      if (data[i + 3] > 220 && g > r + 7 && g > b + 3 && g < 205)
        mask[y * w + x] = 1
    }
  for (let p = 0; p < mask.length; p++) {
    if (!mask[p]) continue
    const queue = [p]
    mask[p] = 0
    let x = 0,
      y = 0
    for (let head = 0; head < queue.length; head++) {
      const n = queue[head]
      x += n % w
      y += Math.floor(n / w)
      for (const next of [n - 1, n + 1, n - w, n + w])
        if (mask[next]) {
          mask[next] = 0
          queue.push(next)
        }
    }
    if (queue.length >= 4)
      groups.push({
        x: x / queue.length,
        y: y / queue.length,
        area: queue.length,
      })
  }
  const clusters = []
  for (const group of groups.sort((a, b) => b.area - a.area)) {
    const neighbor = clusters.find(
      (c) =>
        Math.abs(c.x - group.x) < w * 0.035 &&
        Math.abs(c.y - group.y) < h * 0.035,
    )
    if (neighbor) {
      const n = neighbor.area + group.area
      neighbor.x = (neighbor.x * neighbor.area + group.x * group.area) / n
      neighbor.y = (neighbor.y * neighbor.area + group.y * group.area) / n
      neighbor.area = n
    } else clusters.push({ ...group })
  }
  const pair = clusters
    .sort((a, b) => b.area - a.area)
    .slice(0, 2)
    .sort((a, b) => a.x - b.x)
  if (pair.length !== 2 || pair[1].x - pair[0].x < w * 0.055)
    throw new Error(`Could not register irises: ${JSON.stringify(clusters)}`)
  return pair.map(({ x, y }) => [x, y])
}
const refs = {}
for (const name of ["reading", "lean", "discover", "show", "proud", "curious"])
  refs[name] = eyes(await pixels(new URL(`${name}.webp`, assets).pathname))
// The live turn keyframe already uses the proud face, offset by (2,4), to keep eyes open.
refs.turn = refs.proud.map(([x, y]) => [x + 2, y + 4])
for (const index of [5, 10, 11]) {
  const [from, to, t] = mixes[index]
  refs[`frame-${index}`] = refs[from].map((p, i) =>
    p.map((v, j) => v + (refs[to][i][j] - v) * t),
  )
}
const sources = []
for (const [name, rows] of [
  ["reveal", 2],
  ["return", 2],
  ["curiosity", 1],
  ["bridge", 2],
]) {
  const { data, info } = await pixels(
    new URL(`./source/mentions-inbetweens-${name}.png`, import.meta.url)
      .pathname,
  )
  const keyed = await key(data, info)
  for (let i = 0; i < rows * 4; i++) {
    const x = Math.round(((i % 4) * info.width) / 4),
      y = Math.round((Math.floor(i / 4) * info.height) / rows)
    const width = Math.round((((i % 4) + 1) * info.width) / 4) - x,
      height = Math.round(((Math.floor(i / 4) + 1) * info.height) / rows) - y
    sources.push(
      await sharp(keyed)
        .extract({ left: x, top: y, width, height })
        .png()
        .toBuffer(),
    )
  }
}
const layers = [],
  registrations = [],
  frames = []
for (const [index, input] of sources.entries()) {
  const raw = await pixels(input),
    actual = eyes(raw)
  const [from, to, t] = mixes[index]
  const target = refs[from].map((p, i) =>
    p.map((v, j) => v + (refs[to][i][j] - v) * t),
  )
  const distance = (pair) =>
    Math.hypot(pair[1][0] - pair[0][0], pair[1][1] - pair[0][1])
  const scale = distance(target) / distance(actual)
  const left = Math.round(
    (target[0][0] + target[1][0]) / 2 -
      ((actual[0][0] + actual[1][0]) / 2) * scale,
  )
  const top = Math.round(
    (target[0][1] + target[1][1]) / 2 -
      ((actual[0][1] + actual[1][1]) / 2) * scale,
  )
  const width = Math.round(raw.info.width * scale),
    height = Math.round(raw.info.height * scale)
  const resized = await sharp(input).resize(width, height).png().toBuffer()
  const cropX = Math.max(0, -left),
    cropY = Math.max(0, -top)
  const clipped = await sharp(resized)
    .extract({
      left: cropX,
      top: cropY,
      width: Math.min(width - cropX, 360 - Math.max(0, left)),
      height: Math.min(height - cropY, 560 - Math.max(0, top)),
    })
    .toBuffer()
  const registered = await sharp({
    create: { width: 360, height: 560, channels: 4, background: "#00000000" },
  })
    .composite([
      { input: clipped, left: Math.max(0, left), top: Math.max(0, top) },
    ])
    .png()
    .toBuffer()
  const frame = await sharp(registered)
    .extract({ left: 0, top: 0, width: frameWidth, height: frameHeight })
    .png()
    .toBuffer()
  frames.push(frame)
  layers.push({
    input: frame,
    left: (index % 4) * strideX + padding,
    top: Math.floor(index / 4) * strideY + padding,
  })
  registrations.push({ index, from, to, t, scale, left, top, actual, target })
  await sharp(frame)
    .webp({ quality: 94, alphaQuality: 100 })
    .toFile(
      new URL(`${String(index).padStart(2, "0")}-${from}-${to}.webp`, output)
        .pathname,
    )
}
await sharp({
  create: {
    width: 4 * strideX,
    height: Math.ceil(frames.length / 4) * strideY,
    channels: 4,
    background: "#00000000",
  },
})
  .composite(layers)
  .webp({ quality: 94, alphaQuality: 100 })
  .toFile(new URL("inbetweens-padded.webp", assets).pathname)
await writeFile(
  new URL("registration.json", output),
  JSON.stringify(registrations, null, 2) + "\n",
)
// A review sheet shows each original endpoint alongside its new in-between drawings.
const rows = [
  ["reading", [0, 1], "lean"],
  ["lean", [2, 3, 4], "discover"],
  ["discover", [20, 21, 22, 23, 5, 6, 7], "show"],
  ["show", [8, 9], "proud"],
  ["proud", [10, 24, 25, 26, 27, 11, 12], "turn"],
  ["turn", [13, 14, 15], "reading"],
  ["reading", [16, 17, 18, 19], "curious"],
]
const proof = []
for (const [row, [from, indices, to]] of rows.entries()) {
  for (const [col, name] of [from, ...indices, to].entries()) {
    let image =
      typeof name === "number"
        ? frames[name]
        : await sharp(new URL(`${name}.webp`, assets).pathname)
            .extract({
              left: 0,
              top: 0,
              width: frameWidth,
              height: frameHeight,
            })
            .png()
            .toBuffer()
    proof.push({
      input: await sharp(image).resize(240, 231).toBuffer(),
      left: col * 240,
      top: row * 241,
    })
  }
}
await sharp({
  create: { width: 2160, height: 1687, channels: 4, background: "#fdfdfc" },
})
  .composite(proof)
  .png()
  .toFile(new URL("contact.png", output).pathname)
console.log(
  registrations.map(({ index, scale, left, top }) => ({
    index,
    scale: +scale.toFixed(3),
    left,
    top,
  })),
)

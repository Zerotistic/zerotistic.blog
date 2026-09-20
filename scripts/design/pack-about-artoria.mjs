// Package whole, image-generated drawings. No articulated layers, warping,
// interpolation or body-part compositing: each frame is one complete image.
import { mkdir } from "node:fs/promises"
import sharp from "sharp"

const poses = ["waving", "reading", "resting", "investigating"]
// The idle and animation must decode to the same colors. Separate lossy
// encodes subtly changed the skin/dress when entering and leaving a gesture.
const webpOptions = { lossless: true, effort: 6 }
const destination = new URL(
  "../../src/assets/optimized/artoria/sequences/",
  import.meta.url,
)
await mkdir(destination, { recursive: true })

function removeExportMatte(data, width) {
  // Same chroma export convention as the other generated companions. This
  // removes only the green export matte, not pieces of the character drawing.
  // Only key pixels connected to the pure matte, preserving her green eyes.
  const matte = new Uint8Array(data.length / 4)
  const queue = new Int32Array(matte.length)
  let head = 0,
    tail = 0
  for (let p = 0; p < matte.length; p++) {
    const i = p * 4
    if (data[i + 1] > 225 && data[i] < 65 && data[i + 2] < 65) {
      matte[p] = 1
      queue[tail++] = p
    }
  }
  while (head < tail) {
    const p = queue[head++]
    for (const n of [
      p % width ? p - 1 : -1,
      (p + 1) % width ? p + 1 : -1,
      p - width,
      p + width,
    ]) {
      if (n < 0 || n >= matte.length || matte[n]) continue
      const i = n * 4
      if (data[i + 1] - Math.max(data[i], data[i + 2]) < 25) continue
      matte[n] = 1
      queue[tail++] = n
    }
  }
  for (let i = 0; i < data.length; i += 4) {
    if (!matte[i / 4]) continue
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2]
    const green = g - Math.max(r, b)
    if (green < 25) continue
    if (green > 170 && r < 65 && b < 65) {
      data[i + 3] = 0
    } else {
      const alpha = Math.max(0, Math.min(1, 1 - (green - 15) / 225))
      data[i + 3] = Math.round(data[i + 3] * alpha)
      if (!alpha) continue
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
  // The generated matte can retain a narrow neutral rim from its previous
  // backdrop. Remove only near-edge neutral residue, never interior whites.
  const distance = new Uint8Array(matte.length)
  head = 0
  tail = 0
  for (let p = 0; p < matte.length; p++) {
    if (data[p * 4 + 3] !== 0) continue
    distance[p] = 1
    queue[tail++] = p
  }
  while (head < tail) {
    const p = queue[head++]
    if (distance[p] > 3) continue
    for (const n of [
      p % width ? p - 1 : -1,
      (p + 1) % width ? p + 1 : -1,
      p - width,
      p + width,
    ]) {
      if (n < 0 || n >= matte.length || distance[n]) continue
      const i = n * 4
      const lo = Math.min(data[i], data[i + 1], data[i + 2])
      const hi = Math.max(data[i], data[i + 1], data[i + 2])
      if (lo < 95 || hi - lo > 20) continue
      distance[n] = distance[p] + 1
      data[i + 3] = 0
      queue[tail++] = n
    }
  }
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) data[i] = data[i + 1] = data[i + 2] = 0
  }
}

function hairAnchor(data, width, height) {
  // Register the entire drawing using the unmoving blonde hair. The image is
  // translated as a whole by a few pixels; nothing is cut, bent or stretched.
  let sx = 0,
    sy = 0,
    count = 0
  for (let y = 0; y < height * 0.34; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2]
      if (
        data[i + 3] < 220 ||
        r < 170 ||
        g < 125 ||
        r - b < 35 ||
        g - b < 15 ||
        g > r + 5
      )
        continue
      sx += x
      sy += y
      count++
    }
  }
  if (!count) throw new Error("Could not register the character's hair")
  return [sx / count, sy / count]
}

function removeNeighborFragments(data, width, height) {
  // A neighboring cell can intrude by one pixel at a sheet boundary. Discard
  // only tiny disconnected boundary fragments; retain the complete figure.
  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(visited.length)
  for (let start = 0; start < visited.length; start++) {
    if (visited[start] || data[start * 4 + 3] < 4) continue
    let head = 0,
      tail = 1,
      edge = false
    visited[start] = 1
    queue[0] = start
    while (head < tail) {
      const p = queue[head++]
      const x = p % width,
        y = Math.floor(p / width)
      if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) edge = true
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const n = ny * width + nx
          if (visited[n] || data[n * 4 + 3] < 4) continue
          visited[n] = 1
          queue[tail++] = n
        }
      }
    }
    if (edge && tail < width * height * 0.001) {
      for (let i = 0; i < tail; i++) data[queue[i] * 4 + 3] = 0
    }
  }
}

for (const pose of poses) {
  const revision = pose === "waving" ? "-v2" : ""
  const source = new URL(
    `./source/about-artoria-${pose}${revision}.png`,
    import.meta.url,
  )
  const { data, info } = await sharp(source.pathname)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const hasTransparency = data.some((value, i) => i % 4 === 3 && value === 0)
  if (!hasTransparency) removeExportMatte(data, info.width)
  const transparent = data.filter(
    (value, i) => i % 4 === 3 && value === 0,
  ).length
  if (transparent < info.width * info.height * 0.12) {
    throw new Error(`${pose}: no usable alpha or chroma export matte`)
  }
  const sheet = await sharp(data, { raw: info }).png().toBuffer()
  const cellWidth = Math.floor(info.width / 4)
  const cellHeight = Math.floor(info.height / 2)
  const scale = Math.min(344 / cellWidth, 524 / cellHeight)
  const width = Math.round(cellWidth * scale)
  const height = Math.round(cellHeight * scale)
  const frames = []
  let anchor
  const offsets = []
  // Play the forward-facing palms in lateral order and retrace the same
  // complete drawings on the return stroke, rather than twisting the wrist.
  const frameOrder =
    pose === "waving" ? [0, 2, 1, 5, 1, 2, 0] : [0, 1, 2, 3, 4, 5, 6]
  for (const frame of frameOrder) {
    const { data: pixels, info: size } = await sharp(sheet)
      .extract({
        left: (frame % 4) * cellWidth,
        top: Math.floor(frame / 4) * cellHeight,
        width: cellWidth,
        height: cellHeight,
      })
      .resize(width, height)
      .raw()
      .toBuffer({ resolveWithObject: true })
    removeNeighborFragments(pixels, width, height)
    const current = hairAnchor(pixels, width, height)
    anchor ??= current
    const dx = Math.round(anchor[0] - current[0])
    const dy = Math.round(anchor[1] - current[1])
    const left = Math.round((360 - width) / 2) + dx
    const top = Math.round((540 - height) / 2) + dy
    if (left < 0 || top < 0 || left + width > 360 || top + height > 540) {
      throw new Error(
        `${pose} frame ${frame}: registration exceeds safe padding`,
      )
    }
    offsets.push([dx, dy])
    frames.push(
      await sharp({
        create: {
          width: 360,
          height: 540,
          channels: 4,
          background: "#00000000",
        },
      })
        .composite([{ input: pixels, raw: size, left, top }])
        .png()
        .toBuffer(),
    )
  }
  // The final hold is exactly the idle drawing, ensuring a clean loop seam.
  frames.push(frames[0])
  const atlas = await sharp({
    create: { width: 1440, height: 1080, channels: 4, background: "#00000000" },
  })
    .composite(
      frames.map((input, index) => ({
        input,
        left: (index % 4) * 360,
        top: Math.floor(index / 4) * 540,
      })),
    )
    .png()
    .toBuffer()
  await sharp(atlas)
    .webp(webpOptions)
    .toFile(new URL(`${pose}-atlas.webp`, destination).pathname)
  // Use the same already-composited pixels for the idle image, too. This
  // avoids even premultiplication rounding differences at translucent edges.
  await sharp(atlas)
    .extract({ left: 0, top: 0, width: 360, height: 540 })
    .webp(webpOptions)
    .toFile(new URL(`${pose}-idle.webp`, destination).pathname)
  console.log(
    `${pose}: eight whole-drawing frames, registration ${JSON.stringify(offsets)}`,
  )
}

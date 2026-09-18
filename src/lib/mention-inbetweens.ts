// Drawn poses between the original keyframes, packed in a single decoded atlas.
const frameWidth = 360
const frameHeight = 347
// Keep neighboring drawings outside the browser's downsampling footprint.
const padding = 8
const strideX = frameWidth + padding * 2
const strideY = frameHeight + padding * 2

export const mentionAtlas = {
  src: "/static/mentions/newspaper/inbetweens-padded.webp",
  columns: 4,
  frameWidth,
  frameHeight,
  padding,
  strideX,
  strideY,
  width: 4 * strideX,
  height: 7 * strideY,
} as const

export const mentionInbetweens = {
  lean: [0, 1],
  lower: [2, 3, 4],
  present: [20, 21, 22, 23, 5, 6, 7],
  settle: [8, 9],
  turn: [10, 24, 25, 26, 27, 11, 12],
  read: [13, 14, 15],
  curious: [16, 17, 18, 19],
} as const

export const readingToTurn = [...mentionInbetweens.read].reverse()
export const curiousToReading = [...mentionInbetweens.curious].reverse()

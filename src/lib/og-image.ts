import monoFont from "@/assets/fonts/IBMPlexMono-Medium.woff2?inline"
import sansFont from "@/assets/fonts/IBMPlexSans-VariableFont_wdth,wght.woff2?inline"
import sharp from "sharp"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const landscape = readFile(resolve("public/static/avalon-landscape-dusk.webp"))
  .then((data) => sharp(data).png().toBuffer())

type OgImage = {
  title: string
  description?: string
  meta?: string
}

type TitleCharacter = {
  value: string
  struck: boolean
}

type TitleWord = {
  characters: TitleCharacter[]
  spaceBefore: boolean
}

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  )

function parseTitle(value: string) {
  const characters: TitleCharacter[] = []
  let cursor = 0

  for (const match of value.matchAll(/~~([^~\n]+)~~/g)) {
    const index = match.index
    characters.push(
      ...Array.from(value.slice(cursor, index), (character) => ({
        value: character,
        struck: false,
      })),
      ...Array.from(match[1], (character) => ({
        value: character,
        struck: true,
      })),
    )
    cursor = index + match[0].length
  }

  characters.push(
    ...Array.from(value.slice(cursor), (character) => ({
      value: character,
      struck: false,
    })),
  )
  return characters
}

function wrapTitle(value: string, maxLength = 34, maxLines = 3) {
  const words: TitleWord[] = []
  let word: TitleCharacter[] = []
  let spaceBefore = false
  let pendingSpace: boolean | undefined

  for (const character of parseTitle(value)) {
    if (/\s/u.test(character.value)) {
      if (word.length > 0) {
        words.push({ characters: word, spaceBefore })
        word = []
      }
      pendingSpace =
        pendingSpace === undefined
          ? character.struck
          : pendingSpace && character.struck
    } else {
      if (word.length === 0) {
        spaceBefore = pendingSpace ?? false
        pendingSpace = undefined
      }
      word.push(character)
    }
  }
  if (word.length > 0) words.push({ characters: word, spaceBefore })

  const lines: TitleCharacter[][] = []
  let line: TitleCharacter[] = []

  for (const word of words) {
    const candidateLength =
      line.length + (line.length > 0 ? 1 : 0) + word.characters.length
    if (candidateLength <= maxLength || line.length === 0) {
      if (line.length > 0) {
        line.push({ value: " ", struck: word.spaceBefore })
      }
      line.push(...word.characters)
      continue
    }
    lines.push(line)
    line = word.characters
  }
  if (line.length > 0) lines.push(line)

  if (lines.length > maxLines) {
    const remaining = lines
      .slice(maxLines - 1)
      .flatMap((part, index) =>
        index === 0 ? part : [{ value: " ", struck: false }, ...part],
      )
    const truncated = remaining.slice(0, maxLength - 1)
    while (truncated.at(-1)?.value === " ") truncated.pop()
    truncated.push({ value: "…", struck: false })
    lines.splice(maxLines - 1, Infinity, truncated)
  }
  return lines
}

function renderTitleLine(line: TitleCharacter[]) {
  let markup = ""
  let text = ""
  let struck = line[0]?.struck ?? false

  const flush = () => {
    if (!text) return
    const escaped = escapeXml(text)
    markup += struck
      ? `<tspan text-decoration="line-through">${escaped.replaceAll(" ", "&#x2010;")}</tspan>`
      : escaped
    text = ""
  }

  for (const character of line) {
    if (character.struck !== struck) {
      flush()
      struck = character.struck
    }
    text += character.value
  }
  flush()
  return markup
}

export async function generateOgImage({ title, description, meta }: OgImage) {
  const backdrop = `data:image/png;base64,${(await landscape).toString("base64")}`
  const lines = wrapTitle(title)
  const titleStart = lines.length === 1 ? 260 : lines.length === 2 ? 225 : 190
  const titleMarkup = lines
    .map(
      (line, index) =>
        `<tspan x="84" y="${titleStart + index * 70}">${renderTitleLine(line)}</tspan>`,
    )
    .join("")
  const descriptionY = titleStart + lines.length * 70 + 16

  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <style>
        @font-face {
          font-family: "Plex Sans";
          src: url("${sansFont}") format("woff2");
        }
        @font-face {
          font-family: "Plex Mono";
          src: url("${monoFont}") format("woff2");
        }
        .sans { font-family: "Plex Sans", sans-serif; }
        .mono { font-family: "Plex Mono", monospace; }
      </style>
      <rect width="1200" height="630" fill="#111110" />
      <image href="${backdrop}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice" opacity="0.9" />
      <defs>
        <linearGradient id="reading-shade">
          <stop offset="0" stop-color="#111110" stop-opacity="0.98" />
          <stop offset="0.65" stop-color="#111110" stop-opacity="0.78" />
          <stop offset="1" stop-color="#111110" stop-opacity="0.1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#reading-shade)" />

      <text x="84" y="92" class="mono" fill="#eeeeec" font-size="28" font-weight="500">zerotistic</text>
      <rect x="252" y="67" width="15" height="28" fill="#8ea6c8" />

      <text class="sans" fill="#eeeeec" font-size="56" font-weight="500">${titleMarkup}</text>
      ${
        description
          ? `<text x="84" y="${descriptionY}" class="sans" fill="#b5b3ad" font-size="28">${escapeXml(description)}</text>`
          : ""
      }

      <line x1="84" y1="524" x2="1116" y2="524" stroke="#3b3a37" />
      ${meta ? `<text x="84" y="572" class="mono" fill="#b5b3ad" font-size="22">${escapeXml(meta)}</text>` : ""}
      <text x="1116" y="572" class="mono" fill="#7c7b74" font-size="22" text-anchor="end">zerotistic.blog</text>
    </svg>
  `

  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()
}

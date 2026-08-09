import monoFont from "@/assets/fonts/IBMPlexMono-Medium.woff2?inline"
import sansFont from "@/assets/fonts/IBMPlexSans-VariableFont_wdth,wght.woff2?inline"
import sharp from "sharp"

type OgImage = {
  title: string
  description?: string
  meta?: string
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

function wrapText(value: string, maxLength = 34, maxLines = 3) {
  const words = value.trim().split(/\s+/)
  const lines: string[] = []
  let line = ""

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length <= maxLength || !line) {
      line = candidate
      continue
    }
    lines.push(line)
    line = word
  }
  if (line) lines.push(line)

  if (lines.length > maxLines) {
    const remaining = lines.slice(maxLines - 1).join(" ")
    lines.splice(
      maxLines - 1,
      Infinity,
      `${remaining.slice(0, maxLength - 1).trimEnd()}…`,
    )
  }
  return lines
}

export async function generateOgImage({ title, description, meta }: OgImage) {
  const lines = wrapText(title)
  const titleStart = lines.length === 1 ? 260 : lines.length === 2 ? 225 : 190
  const titleMarkup = lines
    .map(
      (line, index) =>
        `<tspan x="84" y="${titleStart + index * 70}">${escapeXml(line)}</tspan>`,
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
      <rect width="1200" height="8" fill="#8ea6c8" />

      <text x="84" y="92" class="mono" fill="#eeeeec" font-size="28" font-weight="500">zerotistic</text>
      <rect x="252" y="67" width="15" height="28" fill="#8ea6c8" />
      <text x="1116" y="92" class="mono" fill="#7c7b74" font-size="20" text-anchor="end">// research notes</text>

      <text class="sans" fill="#eeeeec" font-size="58" font-weight="500">${titleMarkup}</text>
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

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { Resvg } from "@resvg/resvg-js"
import satori from "satori"
import sharp from "sharp"

const WIDTH = 1200
const HEIGHT = 630

const backdrop = readFile(resolve("public/static/avalon-landscape-dusk.webp")).then(
  (data) =>
    sharp(data)
      .resize(WIDTH, HEIGHT, { fit: "cover", position: "center" })
      .composite([
        {
          input: Buffer.from(
            `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="shade">
                  <stop offset="0" stop-color="#111110" stop-opacity="0.98" />
                  <stop offset="0.65" stop-color="#111110" stop-opacity="0.78" />
                  <stop offset="1" stop-color="#111110" stop-opacity="0.18" />
                </linearGradient>
              </defs>
              <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#shade)" />
            </svg>`,
          ),
        },
      ])
      .png()
      .toBuffer(),
)

const fonts = Promise.all([
  readFile(
    resolve(
      "node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff",
    ),
  ),
  readFile(
    resolve(
      "node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff",
    ),
  ),
  readFile(
    resolve(
      "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff",
    ),
  ),
  readFile(
    resolve(
      "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff",
    ),
  ),
]).then(([sans400, sans500, mono400, mono500]) => [
  { name: "IBM Plex Sans", data: sans400, weight: 400 as const, style: "normal" as const },
  { name: "IBM Plex Sans", data: sans500, weight: 500 as const, style: "normal" as const },
  { name: "IBM Plex Mono", data: mono400, weight: 400 as const, style: "normal" as const },
  { name: "IBM Plex Mono", data: mono500, weight: 500 as const, style: "normal" as const },
])

type OgImage = {
  title: string
  description?: string
  meta?: string
}

type SatoriNode = {
  type: string
  props: Record<string, unknown>
}

function titleSegments(value: string) {
  const segments: { text: string; struck: boolean }[] = []
  let cursor = 0
  for (const match of value.matchAll(/~~([^~\n]+)~~/g)) {
    const index = match.index ?? 0
    if (index > cursor) {
      segments.push({ text: value.slice(cursor, index), struck: false })
    }
    segments.push({ text: match[1], struck: true })
    cursor = index + match[0].length
  }
  if (cursor < value.length) {
    segments.push({ text: value.slice(cursor), struck: false })
  }
  return segments
}

export async function generateOgImage({ title, description, meta }: OgImage) {
  const segments = titleSegments(title)
  const titleFontSize = title.length > 68 ? 46 : title.length > 48 ? 52 : 58

  const tree: SatoriNode = {
    type: "div",
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 84px 52px",
        color: "#eeeeec",
        fontFamily: "IBM Plex Sans",
      },
      children: [
        // Top wordmark + cursor block
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "IBM Plex Mono",
              fontSize: "28px",
              fontWeight: 500,
              color: "#eeeeec",
            },
            children: [
              { type: "span", props: { children: "zerotistic" } },
              {
                type: "div",
                props: {
                  style: {
                    width: "15px",
                    height: "28px",
                    backgroundColor: "#8ea6c8",
                    marginTop: "2px",
                  },
                },
              },
            ],
          },
        },
        // Main title & optional description
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "22px",
              maxWidth: "960px",
              marginTop: "-12px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexWrap: "wrap",
                    fontSize: `${titleFontSize}px`,
                    fontWeight: 500,
                    lineHeight: 1.18,
                    letterSpacing: "-0.025em",
                    color: "#eeeeec",
                  },
                  children: segments.map(({ text, struck }) => ({
                    type: "span",
                    props: {
                      style: struck
                        ? {
                            textDecoration: "line-through",
                            color: "#b5b3ad",
                            whiteSpace: "pre-wrap",
                          }
                        : { whiteSpace: "pre-wrap" },
                      children: text,
                    },
                  })),
                },
              },
              ...(description
                ? [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "27px",
                          fontWeight: 400,
                          lineHeight: 1.4,
                          color: "#b5b3ad",
                          maxWidth: "900px",
                        },
                        children: description,
                      },
                    },
                  ]
                : []),
            ],
          },
        },
        // Bottom rule + meta + domain
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "26px",
              borderTop: "1px solid #3b3a37",
              fontFamily: "IBM Plex Mono",
              fontSize: "22px",
              fontWeight: 400,
            },
            children: [
              {
                type: "span",
                props: {
                  style: { color: "#b5b3ad" },
                  children: meta ?? "",
                },
              },
              {
                type: "span",
                props: {
                  style: { color: "#8d8d86" },
                  children: "zerotistic.blog",
                },
              },
            ],
          },
        },
      ],
    },
  }

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: await fonts,
  })
  const overlay = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  })
    .render()
    .asPng()

  return sharp(await backdrop)
    .composite([{ input: overlay }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
}

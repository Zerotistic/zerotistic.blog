import { normalizePath } from "./utils"

const poses = {
  resting: {
    name: "resting",
    src: "/static/artoria-last-episode.webp",
    alt: "Artoria sitting quietly in her white Last Episode dress",
  },
  reading: {
    name: "reading",
    src: "/static/artoria/reading.webp",
    alt: "Artoria sitting in her white dress, absorbed in an open book",
  },
  investigating: {
    name: "investigating",
    src: "/static/artoria/investigating.webp",
    alt: "Artoria examining a tiny bug through a magnifying glass",
  },
  waving: {
    name: "waving",
    src: "/static/artoria/waving.webp",
    alt: "Artoria giving a small wave with a bashful smile",
  },
} as const

export function artoriaForPath(pathname: string) {
  const path = normalizePath(pathname)

  if (path === "/cves") return poses.investigating
  if (path === "/mentions") return poses.waving
  if (path === "/posts" || path.startsWith("/posts/")) return poses.reading
  return poses.resting
}

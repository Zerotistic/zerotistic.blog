import wavingImage from "@/assets/optimized/artoria/waving.webp?url"
import investigatingImage from "@/assets/optimized/artoria/investigating.webp?url"
import readingImage from "@/assets/optimized/artoria/reading.webp?url"
import restingImage from "@/assets/optimized/artoria/resting.webp?url"
import { normalizePath } from "./utils"

export const artoriaPoses = {
  resting: {
    name: "resting",
    src: restingImage,
    alt: "Artoria sitting quietly in her white Last Episode dress",
  },
  reading: {
    name: "reading",
    src: readingImage,
    alt: "Artoria sitting in her white dress, absorbed in an open book",
  },
  investigating: {
    name: "investigating",
    src: investigatingImage,
    alt: "Artoria examining a tiny bug through a magnifying glass",
  },
  waving: {
    name: "waving",
    src: wavingImage,
    alt: "Artoria giving a small wave with a bashful smile",
  },
} as const

export function artoriaForPath(pathname: string) {
  const path = normalizePath(pathname)

  if (path === "/cves") return artoriaPoses.investigating
  if (path === "/about" || path === "/mentions") return artoriaPoses.waving
  if (path === "/posts" || path.startsWith("/posts/"))
    return artoriaPoses.reading
  return artoriaPoses.resting
}

import type { artoriaPoses } from "./artoria"

export type ArtoriaPose = keyof typeof artoriaPoses

const images = import.meta.glob<string>(
  "/src/assets/optimized/artoria/sequences/*.webp",
  { eager: true, query: "?url", import: "default" },
)

// Each step is a complete drawing. Durations hold the anticipation and finish
// longer than the moving frames; the four gestures have their own cadence.
export const artoriaTiming: Record<ArtoriaPose, number[]> = {
  waving: [180, 100, 100, 180, 100, 100, 100, 300],
  reading: [420, 140, 140, 170, 150, 140, 170, 450],
  resting: [350, 120, 140, 250, 450, 160, 140, 400],
  investigating: [280, 130, 180, 350, 250, 140, 140, 380],
}

export function artoriaSequence(pose: ArtoriaPose) {
  const base = "/src/assets/optimized/artoria/sequences/"
  const atlas = images[`${base}${pose}-atlas.webp`]
  const idle = images[`${base}${pose}-idle.webp`]
  return atlas && idle ? { atlas, idle, columns: 4, count: 8 } : undefined
}

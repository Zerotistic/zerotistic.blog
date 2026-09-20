import fate from "@/assets/about/favorites/fate-stay-night.png"
import flcl from "@/assets/about/favorites/flcl.jpg"
import plasticMemories from "@/assets/about/favorites/plastic-memories.jpg"
import happiness from "@/assets/about/favorites/three-days-of-happiness.jpg"
import parasite from "@/assets/about/favorites/parasite-in-love.jpg"
import abyss from "@/assets/about/favorites/boys-abyss.jpg"
import type { ImageMetadata } from "astro"

type Favorite = {
  title: string
  cover: ImageMetadata
  href: string
  note?: string
}

// The owner's selections; only Fate has a supplied personal annotation.
// Artwork sources and the generated cat's prompt: src/assets/about/README.md.
export const favoriteShelves: { label: string; items: Favorite[] }[] = [
  {
    label: "anime",
    items: [
      {
        title: "Fate/stay night",
        cover: fate,
        href: "https://anilist.co/anime/356",
        note: "because Saber.",
      },
      { title: "FLCL", cover: flcl, href: "https://anilist.co/anime/227" },
      {
        title: "Plastic Memories",
        cover: plasticMemories,
        href: "https://anilist.co/anime/20872",
      },
    ],
  },
  {
    label: "manga",
    items: [
      {
        title: "Three Days of Happiness",
        cover: happiness,
        href: "https://anilist.co/manga/97553",
      },
      {
        title: "Parasite in Love",
        cover: parasite,
        href: "https://anilist.co/manga/105768",
      },
      {
        title: "Boy’s Abyss",
        cover: abyss,
        href: "https://anilist.co/manga/116186",
      },
    ],
  },
]

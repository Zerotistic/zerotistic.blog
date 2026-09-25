import type { ImageMetadata } from "astro"
import maltaCtf from "@/assets/talks/maltactf-2025.jpg"
import binaryNinja from "@/content/blog/binary-ninja-rump/assets/slide-1.png"

type Talk = {
  id: string
  title: string
  date: string
  dateLabel: string
  event: string
  eventHref?: string
  location: string
  languages: { flag: string; label: string }[]
  description: string
  preview: ImageMetadata
  href: string
} & (
  | { kind: "recording"; videoId: string; duration: string }
  | { kind: "slides" }
)

export const talks: Talk[] = [
  {
    id: "maltactf-2025",
    title:
      "Finding bugs in ML frameworks at scale: automating vulnerability discovery",
    date: "2025-09-14",
    dateLabel: "September 14, 2025",
    event: "MaltaCTF",
    eventHref: "https://luma.com/x12lbhyf",
    location: "Malta",
    languages: [{ flag: "🇬🇧", label: "Talk in English" }],
    description:
      "My approach to automating vulnerability discovery in ML frameworks and finding bugs at scale.",
    preview: maltaCtf,
    kind: "recording",
    videoId: "0LJzujEvV54",
    duration: "32:16",
    href: "https://www.youtube.com/watch?v=0LJzujEvV54",
  },
  {
    id: "binary-ninja-2024",
    title: "Binary Ninja: How to Reverse with Style",
    date: "2024-01-16",
    dateLabel: "January 16, 2024",
    event: "HackTheBox meetup",
    location: "Paris",
    languages: [
      { flag: "🇫🇷", label: "Slides in French" },
      { flag: "🇬🇧", label: "Notes in English" },
    ],
    description:
      "A lightning talk on Binary Ninja's API, intermediate languages, and practical uses in reverse engineering. The slides include my annotations.",
    preview: binaryNinja,
    kind: "slides",
    href: "/posts/binary-ninja-rump/",
  },
]

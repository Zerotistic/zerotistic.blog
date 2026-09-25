import type { SvgComponent } from "astro/types"
import Discord from "@/assets/icons/discord.svg"
import GitHub from "@/assets/icons/github.svg"
import X from "@/assets/icons/x.svg"

export const SITE = {
  title: "zerotistic",
  tagline: "Reverse engineering, pwn, automation and dumb ideas.",
  description:
    "Reverse engineering, pwn, automation and dumb ideas. Vulnerability research, Binary Ninja and CTF writeups.",
  locale: "en-US",
  dir: "ltr",
  twitterHandle: "@gegrgtezrze",
  defaultPageImage: "/og/site.png",
} as const

export const SOCIALS: {
  href: string
  label: string
  icon: SvgComponent
  handle: string
}[] = [
  {
    href: "https://github.com/Zerotistic",
    label: "GitHub",
    handle: "Zerotistic",
    icon: GitHub,
  },
  {
    href: "https://x.com/gegrgtezrze",
    label: "X",
    handle: "@gegrgtezrze",
    icon: X,
  },
  {
    href: "https://discord.com/users/389853712417292300",
    label: "Discord",
    handle: "Zerotistic",
    icon: Discord,
  },
]

export const NAVIGATION = [
  { href: "/posts", label: "posts" },
  { href: "/about", label: "about" },
  { href: "/work", label: "work" },
  { href: "/talks", label: "talks" },
  { href: "/cves", label: "cves" },
  { href: "/mentions", label: "mentions" },
]

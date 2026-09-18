import type { SvgComponent } from "astro/types"
import GitHub from "@/assets/icons/github.svg"
import Twitter from "@/assets/icons/twitter.svg"

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

export const SOCIALS: { href: string; label: string; icon: SvgComponent }[] = [
  { href: "https://github.com/Zerotistic", label: "GitHub", icon: GitHub },
  { href: "https://x.com/gegrgtezrze", label: "X", icon: Twitter },
]

export const NAVIGATION = [
  { href: "/posts", label: "posts" },
  { href: "/work", label: "work" },
  { href: "/cves", label: "cves" },
  { href: "/mentions", label: "mentions" },
]

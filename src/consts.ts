import type { SvgComponent } from "astro/types"
import GitHub from "@/assets/icons/github.svg"
import RSS from "@/assets/icons/rss.svg"
import Twitter from "@/assets/icons/twitter.svg"

export const SITE = {
  title: "zerotistic",
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
  { href: "/rss.xml", label: "RSS", icon: RSS },
]

export const NAVIGATION = [
  { href: "/posts", label: "posts" },
  { href: "/cves", label: "cves" },
  { href: "/mentions", label: "mentions" },
]

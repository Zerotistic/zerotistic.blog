export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date)
}

export function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length
  return `${Math.max(1, Math.round(words / 220))} min read`
}

export const isSubpost = (id: string) => id.includes("/")

export const subpostSlug = (id: string) => id.split("/")[1]

export const normalizePath = (pathname: string) => {
  try {
    return decodeURIComponent(pathname).replace(/\/+$/, "")
  } catch {
    return pathname.replace(/\/+$/, "")
  }
}

export const hashId = (hash: string) => decodeURIComponent(hash.slice(1))

export function isExternalLink(href: string): boolean {
  const site = new URL("https://zerotistic.blog")
  try {
    const url = new URL(href, site)
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.hostname.replace(/^www\./, "") !== site.hostname
    )
  } catch {
    return false
  }
}

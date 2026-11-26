import { SITE, SOCIALS } from "@/consts"

export type Breadcrumb = {
  name: string
  path: string
}

export const personId = (base: URL) => new URL("/#person", base).href
export const websiteId = (base: URL) => new URL("/#website", base).href

export function personSchema(base: URL) {
  return {
    "@type": "Person",
    "@id": personId(base),
    name: SITE.title,
    url: new URL("/", base).href,
    jobTitle: "Security Researcher",
    worksFor: {
      "@type": "Organization",
      name: "HiddenLayer",
      url: "https://hiddenlayer.com",
    },
    sameAs: SOCIALS.map((social) => social.href),
  }
}

export function breadcrumbSchema(items: Breadcrumb[], base: URL) {
  if (items.length < 2) return undefined
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, base).href,
    })),
  }
}

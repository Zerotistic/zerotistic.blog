import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"
import { satteri } from "@astrojs/markdown-satteri"
import {
  blockExpressiveCode,
  inlineExpressiveCode,
} from "./src/lib/expressive-code"
import { temmlMath } from "./src/lib/math"
import { calloutDirective } from "./src/lib/callout"
import { externalLinks } from "./src/lib/external-links"
import { headingNamespace } from "./src/lib/heading-namespace"
import { headingAnchors } from "./src/lib/heading-anchors"

export default defineConfig({
  site: "https://zerotistic.blog",
  compressHTML: true,
  prefetch: { prefetchAll: true },
  // Old Jekyll/Chirpy URLs that must keep resolving.
  redirects: {
    "/tags": "/posts",
    "/posts/binary-ninja-serie-announcement":
      "/posts/binary-ninja-zero-to-hero",
    "/posts/binary-ninja-zero-to-hero-1":
      "/posts/binary-ninja-zero-to-hero/part-1",
    "/posts/binary-ninja-zero-to-hero-2":
      "/posts/binary-ninja-zero-to-hero/part-2",
    "/about": "/",
    "/archives": "/posts",
    "/categories": "/tags",
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !/\/posts\/[^/]+\/[^/]+\/?$/.test(page) && !page.includes("/tags/"),
    }),
  ],
  markdown: {
    syntaxHighlight: false,
    processor: satteri({
      features: { directive: true, math: true },
      mdastPlugins: [calloutDirective, inlineExpressiveCode, temmlMath],
      hastPlugins: [
        externalLinks,
        blockExpressiveCode,
        headingNamespace,
        headingAnchors,
      ],
    }),
  },
})

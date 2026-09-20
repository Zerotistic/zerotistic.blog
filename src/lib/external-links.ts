import { defineHastPlugin } from "satteri"
import { isExternalLink } from "./utils"

export const externalLinks = defineHastPlugin({
  name: "external-links",
  element: {
    filter: ["a"],
    visit(node, ctx) {
      const href = node.properties.href
      if (typeof href === "string" && isExternalLink(href)) {
        ctx.setProperty(node, "target", "_blank")
        ctx.setProperty(node, "rel", "nofollow noreferrer noopener")
      }
    },
  },
})

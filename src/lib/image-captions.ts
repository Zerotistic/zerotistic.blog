import type { Element, ElementContent } from "hast"
import { h } from "hastscript"
import { defineHastPlugin } from "satteri"

const isBlank = (node: ElementContent) =>
  node.type === "text" && !node.value.trim()

/**
 * Posts write a caption as an italic line right under the image, which
 * Markdown folds into one paragraph: `<p><img> <em>caption</em></p>`.
 * Turn that into a real figure so it can be styled and announced as one.
 */
export const imageCaptions = defineHastPlugin({
  name: "image-captions",
  element: {
    filter: ["p"],
    visit(node) {
      const children = node.children.filter((child) => !isBlank(child))
      const [image, caption] = children
      const isImage = (node: ElementContent) =>
        node.type === "element" &&
        (node.tagName === "img" ||
          (node.tagName === "span" &&
            Array.isArray(node.properties.className) &&
            node.properties.className.includes("lqip")))
      if (
        children.length !== 2 ||
        !isImage(image) ||
        caption.type !== "element" ||
        caption.tagName !== "em"
      )
        return
      return h("figure", { className: ["captioned"] }, [
        image as Element,
        h("figcaption", caption.children),
      ])
    },
  },
})

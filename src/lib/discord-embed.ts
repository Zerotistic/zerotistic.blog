export type DiscordEmbedOptions = {
  title: string
  description: string
  url: URL
  details?: string
  avatar?: { url: URL; description: string }
  image?: { url: URL; description: string }
  link?: { url: URL; label: string }
}

const escapeMarkdown = (value: string) =>
  value.replace(/\s+/g, " ").replace(/[\\`*_~|[\]<>#]/g, "\\$&")

// Keep the same intentional ~~strikethrough~~ supported by article headings.
const titleMarkdown = (title: string) =>
  title
    .trim()
    .split(/~~([^~\n]+)~~/g)
    .map((part, index) =>
      index % 2 ? `~~${escapeMarkdown(part)}~~` : escapeMarkdown(part),
    )
    .join("")

export function discordEmbed({
  title,
  description,
  url,
  details,
  avatar,
  image,
  link,
}: DiscordEmbedOptions) {
  const href = url.href.replaceAll("(", "%28").replaceAll(")", "%29")
  const text = [
    { type: 10, content: `## [${titleMarkdown(title)}](${href})` },
    { type: 10, content: escapeMarkdown(description.trim()) },
  ]

  // Link previews accept one Container and a read-only subset of components.
  // https://github.com/discord/discord-api-docs/pull/8606
  const payload = {
    component: {
      type: 17,
      accent_color: 0x8ea6c8,
      components: [
        ...(avatar
          ? [
              {
                type: 9,
                components: text,
                accessory: {
                  type: 11,
                  media: { url: avatar.url.href },
                  description: avatar.description,
                },
              },
            ]
          : text),
        ...(image
          ? [
              {
                type: 12,
                items: [
                  {
                    media: { url: image.url.href },
                    description: image.description,
                  },
                ],
              },
            ]
          : []),
        ...(details
          ? [{ type: 10, content: `-# ${escapeMarkdown(details)}` }]
          : []),
        ...(link
          ? [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: link.label,
                    url: link.url.href,
                  },
                ],
              },
            ]
          : []),
      ],
    },
  }

  // JSON is inserted into a raw-text HTML script, so escape its opening tags.
  return JSON.stringify(payload).replaceAll("<", "\\u003c")
}

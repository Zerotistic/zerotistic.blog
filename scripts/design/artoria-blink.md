# Artoria blink source

Generated with the built-in imagegen tool, using `public/static/artoria/investigating.webp` as the edit reference. Saved as `public/static/artoria/investigating-blink-source.webp` (WebP encoding of the generated image).

The generator returned an opaque background despite the transparency request. Only the two small eyelid regions are rendered, through feathered SVG masks in Artoria.astro. The original illustration supplies every other pixel; do not display this source as a full character image.

## Prompt

Use case: precise-object-edit. Edit target: the provided transparent illustration of Artoria sitting in her white dress with a magnifying glass. Asset type: exact aligned closed-eye blink frame for a website character animation. Preserve the entire image, exact character pose, exact framing, aspect ratio 2:3, silhouette, head position, facial proportions, hairstyle, ahoge strand, clothing, hands, magnifying glass, little bug, every detail and original colors. CHANGE ONLY BOTH EYES: naturally closed eyelids with fine anime eyelash curves, as if a calm momentary blink. No other expression change; retain original neutral mouth. Do not redraw or reposition the character. Background must remain genuinely transparent alpha, not a checkerboard or solid color. Output a single full-body transparent image with the same framing and margins as the original. No text, borders or additional objects. The open-eyed original and this closed-eye frame will be overlaid directly, so exact spatial alignment is crucial.

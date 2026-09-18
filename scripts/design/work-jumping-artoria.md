# Jumping Artoria — Work companion

The approved jumping companion is the default on the Work page in development and production, rendered by `src/components/WorkJumpingCheer.astro` with `src/lib/work-jumping-companion.ts`.

- Preview: `http://localhost:4321/work/`
- Click the little character to replay the celebration.

The original companion is preserved in `src/components/WorkCheer.astro`, `src/lib/work-companion.ts`, and the `public/static/work/artoria-pointing*.webp` assets. To restore it, swap the Work page's component import and render to `WorkCheer`. The local comparison switch has been removed.

## Artwork and export

Generated with the built-in imagegen tool, using `public/static/work/artoria-pointing.webp` as the character/style reference. No CLI image-generation API was used.

The tool's transparency output contained a rendered checkerboard. A second built-in edit replaced it with a chroma-key background. The retained source is `scripts/design/source/work-jumping-chroma.png`. `node scripts/design/pack-work-jumping.mjs` removes that export background and aligns every sprite to a consistent planted-foot anchor. It does not draw the character or distort individual poses.

Final assets: `public/static/work/jumping/{stand,crouch,takeoff,air,land,proud,blink,curious}.webp`. A contact sheet/atlas is saved as `public/static/work/jumping/poses.webp`. Individual frames are used by the component; the atlas is retained for review. The blink only replaces the two eye regions of the proud pose, avoiding a full-body flicker.

The jump follows two continuous parabolic arcs, with discrete drawn poses for anticipation, extension, flight, absorption, and settling. Only the shadow changes scale; the character never stretches. The speech bubble rises with the desktop jump to stay clear of her head. On phones it stays below the landing position. Hidden tabs, offscreen placement, resized scenes and reduced motion return to the static proud pose. Butterfly visits use the existing sitewide schedule.

The pointing arm in the takeoff, airborne, and landing frames is split into an SVG layer, with an overlapping sleeve joint. During each jump, its angle follows the actual company heading: the animation converts the title position into the moving sprite's coordinates and aligns the index-finger direction with it. Layout is measured once per celebration, including the current responsive layout. Original raster frames remain intact.

## Sprite sheet prompt

Use case: illustration-story. Asset type: production animation sprite sheet for a tiny excited website companion. The reference image is a CHARACTER AND ART STYLE REFERENCE, not a layout to copy. Draw a new full-body miniature Artoria/Saber in her ivory white dress: golden blonde braided bun, distinctive ahoge, green eyes, white hair ribbon, puff sleeves, fitted bodice, graceful calf-length skirt, small brown ankle boots. Keep her recognizable, charming and delighted. Refined anime linework and soft warm cel shading, about four heads tall, modest proportions, detailed expressive face. She faces three-quarter LEFT, pointing left toward a job title.

OUTPUT: a precisely regular 4-column by 2-row animation sprite sheet, 2048 x 1536 canvas, eight equal 512 x 768 cells. No visible grid or cell borders. Exactly one full-body character in each cell. Same camera, scale, outfit, head size and identity in every cell. Each character's center of torso approximately x=300 inside its cell; entire figure fits inside x=45..455 and y=80..680. Feet baseline y=680 for standing and crouching. Keep ample clear space between characters. Do not crop hair, boots, fingers or ribbon.

Reading order, left to right:
1. STAND / PROUD: standing with both boots planted, right arm enthusiastically extended to the left and index pointing left at shoulder height; other hand a soft fist near chest; open green eyes looking left; a delighted open smile.
2. ANTICIPATION: small knees-bent crouch, leaning forward, both hands drawn in near chest, eager grin, eyes open; head slightly lower because of real bent knees, never scaled or squashed.
3. TAKEOFF: legs extending onto toes, right arm beginning to extend pointing left; skirt and ribbons lag downward; excited open mouth.
4. AIRBORNE: both legs bent back a little at knees, right index pointing decidedly left, free fist raised happily, big delighted smile, open sparkling green eyes; skirt and ribbon lifted gently by movement. Natural pose, not flying horizontally.
5. LANDING: both boots planted, knees bent to absorb landing, arm still pointing left, torso slightly forward, smiling, ribbon and skirt still drifting upward.
6. SETTLED / PROUD: same pose and aligned body as cell 1, head turned slightly toward viewer, a pleased warm smile, both eyes open.
7. BLINK: exactly cell 6's pose and alignment, with only both eyelids naturally closed for a quick happy blink. Identical smile and silhouette.
8. CURIOUS: both feet planted, right index still points left as in cell 1, slight head tilt toward that fingertip, eyes looking toward it, small curious smile; no butterfly drawn.

Background must be genuine transparent alpha. Do not draw checkerboard tiles, shadows, scenery, text, labels, numbers, sparkles, speech bubbles or extra objects. Clean isolated sprites with precise edges. White fabric must remain opaque.

## Chroma export prompt

Use case: background-extraction. Edit target: the provided eight-pose Artoria sprite sheet. Change ONLY the gray checkerboard background to perfectly flat solid chroma-key green #00FF00. Every background pixel, including enclosed gaps between hands/body, hair/ribbons, skirt/legs, must be uniform #00FF00. This solid green is intentional for automated sprite atlas export. Do not leave any checkerboard, gray, white backdrop, shadow, grid, labels or texture. Preserve all eight characters exactly: their precise locations, original proportions, outlines, poses, facial expressions, detailed white dress folds, boots, hair and skin colors. No green reflections, no green shading on character. Do not redraw or reposition the characters. Preserve canvas aspect ratio and all original margins. White dress stays opaque white. Only the background changes.

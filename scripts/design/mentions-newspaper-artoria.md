# Mentions newspaper companion

Generated with the built-in imagegen tool, using `public/static/artoria/waving.webp` as the character/style reference. The original waving artwork is preserved. No CLI image-generation API was used.

Assets live in `public/static/mentions/newspaper/`; the retained source is `scripts/design/source/mentions-newspaper-chroma.png`. Export with `node scripts/design/pack-mentions-newspaper.mjs`. The initial transparency request produced an opaque checkerboard, so a second built-in edit replaced only the backdrop with chroma green. The exporter keys that backdrop and registers the eight drawings on a shared canvas.

The exporter also separates the warm-colored boots and ankles from the cool ivory skirt into `foot-left.webp`, `foot-right.webp`, and `seated-base.webp`. The skirt and stool remain stationary during the two kicks. SVG layers animate the head, held newspaper, pointing hand, and turning leaf independently. Only the folding paper changes scale; the character never does. The blink is a 120 ms eye-only patch, and the page-turn pose uses an open-eyed face.

The discovery plays once when the visible companion is ready, and clicking or pressing Enter on her replays it. Repeated clicks queue at most one replay. Occasional page turns, grip adjustments, and peeks are interleaved with the shared sitewide butterfly schedule. The visitor follows the newspaper edge while it tilts. Hidden tabs, offscreen placement, a changed scene size, and reduced motion cancel and clean up the animation. Without JavaScript or with reduced motion, the reading pose remains visible. The speech bubble is decorative and is not announced repeatedly by assistive technology.

The component is `src/components/MentionCompanion.astro`, with its controller in `src/lib/mention-companion.ts`. The original waving artwork and generic companion remain available; the Mentions page uses the new companion directly in its heading on every screen size.

## Sprite sheet prompt

Use case: illustration-story.
Asset type: eight-pose animation sprite sheet for the Mentions page of a personal website.
Input image: CHARACTER AND ART STYLE REFERENCE ONLY. Match Artoria/Saber's recognizable blonde braided bun, ahoge, green eyes, white hair ribbon, ivory long-sleeved Last Episode dress, refined anime linework and soft warm shading.
Draw a new miniature full-body Artoria, about four heads tall, sitting on the SAME tiny simple wooden stool, with her small brown ankle boots dangling visibly below her dress. She faces mostly forward, slightly toward the LEFT. She is reading an oversized folded cream newspaper. Charming, delighted, slightly bashful pride. No environment.
A regular FOUR-COLUMN by TWO-ROW sprite sheet, 2048 x 1536, eight 512 x 768 cells. EXACT SAME camera, head size, body proportions, skirt silhouette, stool position and body center in every cell. Body center x=256 in each cell, head top y=100, seat top y=520, boot soles y=660. Entire figure and newspaper fit within x=60..450, y=65..690. Generous empty margins, no overlap between cells.
Reading order:
1 READING: paper raised so top edge sits just below her eyes and hides her mouth and torso. Both hands grip its sides. Green eyes visible reading toward lower-left.
2 LEANING CLOSER: same seated position and newspaper raised; leans her head a little toward a discovery on the page. Intent curious green eyes. Keep skirt and stool identical.
3 DISCOVERY: paper lowered to chest/lap, fully revealing face. Green eyes widened, eyebrows lifted, small delighted open mouth. Hands still holding paper. Same head position and size as first pose.
4 SHOWING: holds the newspaper outward toward viewer at chest height, one hand grips its right edge, her other hand points with index finger at a little framed clipping in the center-left of the paper. Big delighted open-eyed smile. Boots remain in same relaxed dangling position; kicks will be animated separately.
5 PROUD: same outward newspaper and hand positions as pose4, warm smaller bashful closed-mouth smile, green eyes open.
6 PAGE TURN: same seated base, looking down, one hand lifts a loose newspaper leaf across the center fold. Subtle curved paper with clear edges and no extra fingers.
7 BLINK: EXACT copy of pose1 reading, only eyelids briefly closed; keep all geometry and paper identical.
8 BUTTERFLY CURIOSITY: same pose1 with raised paper, head tilted slightly, eyes looking toward the TOP RIGHT corner of the newspaper; affectionate curious smile barely peeking above the paper. Do not draw a butterfly.
The newspaper has fine gray editorial column rules and one small framed clipping, but NO readable text, words, letters, logos, labels or headlines. Paper is opaque cream; dress opaque ivory. No speech bubbles or effects, no borders or panel labels.
Background must be genuinely transparent alpha, not a painted checkerboard. Clean isolated sprites, crisp silhouettes, no cast shadow. Do not distort or crop hands, boots, dress or hair.

## Chroma export prompt

Use case: background-extraction.
Edit target: the provided eight-pose newspaper-reading Artoria sprite sheet.
Change ONLY the checkerboard background to perfectly flat solid chroma-key green #00FF00. Every background pixel including enclosed gaps around stool legs, boots, skirt and hair must be uniform #00FF00. Preserve all eight characters EXACTLY, their locations and scale, expressions, linework, white dress, cream newspaper, hands, boots and wooden stools. Do not move, resize, redraw, crop or add anything. Keep the full original canvas and all margins. White fabric and cream paper stay opaque. No green reflections or tints on foreground. No remaining gray, white backdrop, checkerboard, cast shadow or texture.

# Mentions newspaper animation — intermediate drawings

Generated with the built-in imagegen tool. The original seven poses, scene, replay interaction, speech, foot kicks, butterfly visit, and static lower body are retained. Original component/controller snapshots are in `versions/mentions-newspaper-v1/`.

## Assets and export

- Production: `public/static/mentions/newspaper/inbetweens-padded.webp`, 28 upper-body drawings in a 4×7 atlas (360×347 drawings with an eight-pixel transparent gutter on every side; atlas 1504×2541).
- Sources: `scripts/design/source/mentions-inbetweens-{reveal,return,curiosity,bridge}.png`.
- Export: `node scripts/design/pack-mentions-inbetweens.mjs`.
- Review frames, contact sheet, and registration coordinates: `scripts/design/review/mentions-inbetweens/`.

The exporter removes the chroma background and registers open-eye anchors with uniform scaling and translation. Playback only swaps upper-body drawings; the existing skirt, stool and feet stay fixed. Assets are decoded before animation is enabled. The eight-second discovery uses 24 new drawings, with four more for the curiosity/butterfly glance. Playback is stretched from the original 6.25-second timing, preserving the anticipation, delight, two foot kicks, and relaxed return. The speech bubble fades in place and is explicitly hidden outside its speaking interval; the redundant native hover tooltip is removed. Reduced motion, hidden tabs and offscreen behavior follow the existing lifecycle.

The gutters keep the SVG image filter from sampling the skirt at the bottom of the previous atlas row, which appeared as a faint line across the top of certain frames at small display sizes. The unpadded atlas remains available as `inbetweens.webp`; the runtime loads the padded asset.

## Prompt set

### reveal

Reference images: reading, lean, discover, show

```text
Use case: illustration-story. Production IN-BETWEEN ANIMATION DRAWINGS, not a redesign. Input images are exact animation keyframe references. Preserve the same Artoria/Saber character, same head size, blonde hair/bun/ahoge, green eyes, ivory dress, brown ankle boots, simple stool, newspaper design, anime ink linework and colors. Draw only the intermediate action specified. Keep the stool, skirt below the newspaper, and boots pixel-stable in all cells. No camera motion or zoom. The newspaper must stay the same size and keep consistent gray rules and framed clipping. Each drawing is a very small progression between the supplied endpoints, like a careful animator's in-between sheet. Green eyes OPEN in every frame; no new blinks or closed eyes.
Four perfectly equal columns. Each character uses the same centered framing as the supplied 360x560 reference images; same generous transparent-space margins, ahoge top around 22/560, lap at330/560, boots baseline540/560. Head/hair size stays consistent. Full figures fit entirely within each cell. NO grid lines, labels, frame numbers, words, text, bubbles or effects. Opaque flat chroma-key GREEN #00FF00 background, matching the existing sprite export workflow; no checkerboard, shadows, gradients or green tint on foreground. White dress and cream paper must stay opaque.
Canvas: FOUR columns by TWO rows, eight equal portrait cells, approximately1440x1120.
Input1 READING; input2 LEAN; input3 DISCOVER; input4 SHOW.
Exactly eight NEW intermediate drawings, reading order left-to-right then second row:
1: one-third from READING to LEAN, tiny head tilt toward the page.
2: two-thirds from READING to LEAN, halfway curious attention, newspaper almost unchanged.
3: one-quarter from LEAN to DISCOVER. Newspaper has only begun to lower and reveal her mouth; head begins to straighten, eyes becoming interested.
4: halfway from LEAN to DISCOVER. Newspaper midway down, mouth now visible, surprised smile starting.
5: three-quarters from LEAN to DISCOVER. Paper nearly at lap/chest, eyes widened, delighted smile almost at endpoint.
6: one-quarter from DISCOVER to SHOW. Paper starts to turn outward; left gripping hand begins to release and lift, right hand keeps holding the paper.
7: halfway from DISCOVER to SHOW. Paper rotates toward its outward position, lifted left forearm moving inward over paper, index starting to extend toward the clipping.
8: three-quarters from DISCOVER to SHOW. Index nearly reaches the framed clipping, newspaper almost fully outward, delighted face turning a little toward viewer.
These are consecutive controlled drawing changes. No duplicate endpoints. Do not invent other gestures.
```

### return

Reference images: show, proud, turn, reading

```text
Use case: illustration-story. Production IN-BETWEEN ANIMATION DRAWINGS, not a redesign. Input images are exact animation keyframe references. Preserve the same Artoria/Saber character, same head size, blonde hair/bun/ahoge, green eyes, ivory dress, brown ankle boots, simple stool, newspaper design, anime ink linework and colors. Draw only the intermediate action specified. Keep the stool, skirt below the newspaper, and boots pixel-stable in all cells. No camera motion or zoom. The newspaper must stay the same size and keep consistent gray rules and framed clipping. Each drawing is a very small progression between the supplied endpoints, like a careful animator's in-between sheet. Green eyes OPEN in every frame; no new blinks or closed eyes.
Four perfectly equal columns. Each character uses the same centered framing as the supplied 360x560 reference images; same generous transparent-space margins, ahoge top around 22/560, lap at330/560, boots baseline540/560. Head/hair size stays consistent. Full figures fit entirely within each cell. NO grid lines, labels, frame numbers, words, text, bubbles or effects. Opaque flat chroma-key GREEN #00FF00 background, matching the existing sprite export workflow; no checkerboard, shadows, gradients or green tint on foreground. White dress and cream paper must stay opaque.
Canvas: FOUR columns by TWO rows, eight equal portrait cells, approximately1440x1120.
Input1 SHOW; input2 PROUD; input3 PAGE TURN (use OPEN green eyes, unlike the closed eyes in this reference); input4 READING.
Exactly eight NEW intermediate drawings, reading order:
1: one-third SHOW to PROUD. Open delighted mouth softens a little, head starts to straighten; hand keeps pointing.
2: two-thirds SHOW to PROUD. Smile almost closed and bashful, head nearly upright, paper position close to PROUD.
3: one-quarter PROUD to PAGE TURN. Pointing index retracts, her gaze starts to go down to the newspaper, wrist starts reaching for a page edge.
4: halfway PROUD to PAGE TURN. Newspaper turns back toward her, left hand lifts the near page corner; green eyes look down.
5: three-quarters PROUD to PAGE TURN. Loose page is mostly raised, left fingers nearly in PAGE TURN position, still OPEN green eyes.
6: one-quarter PAGE TURN to READING. Raised page sweeps toward the left side of the fold; paper begins rising from lap, head lifts slightly.
7: halfway PAGE TURN to READING. Leaf settles into the paper, both hands regrip the two edges, newspaper halfway up toward the face.
8: three-quarters PAGE TURN to READING. Newspaper nearly up below the eyes, hides most of mouth; head nearly in original READING position.
No duplicated endpoints. Keep every face OPEN-EYED. Keep each change small and mechanically continuous.
```

### curiosity

Reference images: reading, curious

```text
Use case: illustration-story. Production IN-BETWEEN ANIMATION DRAWINGS, not a redesign. Input images are exact animation keyframe references. Preserve the same Artoria/Saber character, same head size, blonde hair/bun/ahoge, green eyes, ivory dress, brown ankle boots, simple stool, newspaper design, anime ink linework and colors. Draw only the intermediate action specified. Keep the stool, skirt below the newspaper, and boots pixel-stable in all cells. No camera motion or zoom. The newspaper must stay the same size and keep consistent gray rules and framed clipping. Each drawing is a very small progression between the supplied endpoints, like a careful animator's in-between sheet. Green eyes OPEN in every frame; no new blinks or closed eyes.
Four perfectly equal columns. Each character uses the same centered framing as the supplied 360x560 reference images; same generous transparent-space margins, ahoge top around 22/560, lap at330/560, boots baseline540/560. Head/hair size stays consistent. Full figures fit entirely within each cell. NO grid lines, labels, frame numbers, words, text, bubbles or effects. Opaque flat chroma-key GREEN #00FF00 background, matching the existing sprite export workflow; no checkerboard, shadows, gradients or green tint on foreground. White dress and cream paper must stay opaque.
Canvas: FOUR columns by ONE row, four equal portrait cells, approximately1440x560.
Input1 READING; input2 CURIOUS.
Exactly four intermediate drawings at 20%,40%,60%,80% from READING to CURIOUS, left to right. ONLY the head tilts gently toward the top right corner of the newspaper and her green gaze tracks there. The hands, paper, stool, dress, boots and position remain identical to the READING reference in every frame. Draw a gradual small head turn/tilt, not four different facial designs. Do not draw a butterfly. No extra poses or rows.
```

### bridge

Reference images: /home/zero/projects/zerotistic.blog/public/static/mentions/newspaper/discover.webp, /home/zero/projects/zerotistic.blog/scripts/design/review/mentions-inbetweens/05-discover-show.webp, /home/zero/projects/zerotistic.blog/scripts/design/review/mentions-inbetweens/10-proud-turn.webp, /home/zero/projects/zerotistic.blog/scripts/design/review/mentions-inbetweens/11-proud-turn.webp

```text
Use case: illustration-story. Eight precise IN-BETWEEN ANIMATION drawings on a 4 column by 2 row production sprite sheet, same anime Artoria/Saber girl, exact identity and costume and head size and detailed ink lines/colors as the reference sprites. We are filling two remaining jumps in an existing animation, NOT redesigning it.
Input1 (full figure): start pose for row1, reading an open newspaper held low in her lap, mouth delighted.
Input2 (upper body): end pose for row1, folded newspaper raised and turned outward, left hand resting open on its surface.
Input3 (upper body): start pose for row2, left index has just retracted from pointing, newspaper outward, soft proud smile.
Input4 (upper body): end pose for row2, newspaper open and a leaf raised, left hand reaching, gaze lowered with both green eyes OPEN.
ROW1: 4 drawings at20%,40%,60%,80% BETWEEN input1 and input2. The OPEN left page folds GRADUALLY to the right as the whole paper rotates outward and rises a little. At20% paper remains almost as wide as input1; at40% it is halfway turned with center fold still obvious; at60% its left edge is halfway toward the folded position; at80% nearly outward. Left gripping hand gradually releases its left edge and moves across the front surface. This must be a continuous geometric fold, don't immediately draw the end pose.
ROW2: 4 drawings at20%,40%,60%,80% BETWEEN input3 and input4. Wrist gradually reaches the top paper edge, the paper unfolds and the leaf rises little by little. At20% only the top corner separates; at40% loose leaf is just visibly lifting, at60% half raised, at80% almost raised. Do not jump directly to a full raised leaf.
All drawings: open green eyes. Mouth/face subtly interpolate only. Preserve same head size and proportions. No camera movement, bobbing, stretching, squash or scene effects. Draw FULL FIGURES with the same ivory dress, stool and brown boots as input1, lower skirt/stool/boots unchanged in all frames. Each cell is the same centered portrait framing as the360x560 original: hair top22/560, lap330/560, boots baseline540/560. Full figure entirely inside each cell. NO labels, frame numbers, borders, text, bubbles, extra characters. Opaque flat pure GREEN #00FF00 background for sprite-keying; no checkerboard, no gradients or shadows. White dress and cream newspaper opaque, no green reflected tint. Canvas approximately1440x1120, exact4equalcolumns and2equalrows.
```

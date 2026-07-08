# zerotistic.blog — UI/UX Makeover Plan

Goal: drop Jekyll/Chirpy (and Ruby entirely), rebuild on **astro-erudite v2**, and layer a
personal, detail-obsessed design on top. This document covers (1) a review of the current
site, (2) the migration plan, (3) the design direction and where each inspiration feeds in,
and (4) a concrete, phased implementation checklist.

---

## 1. Review of the current site

Stack: Jekyll + jekyll-theme-chirpy, a git submodule for static assets, a Ruby plugin for
last-modified dates, deployed via GitHub Actions to Pages. Content: 9 posts (Binary Ninja
Zero-to-Hero series, CTF writeups, VM deobfuscation, CFF remover) plus About/Archives/Tags/
Categories tabs.

What's wrong with it, honestly:

- **It looks like every other Chirpy blog.** Avatar sidebar on the left, blue accent,
  identical card list, FontAwesome icons. Zero identity — nothing says "this is a VR/RE
  person's site" until you read a post.
- **Heavy for what it is.** PWA/service worker (which mostly causes stale-content bugs),
  Bootstrap-era CSS, FontAwesome webfonts, jQuery-ish JS bundles, Disqus/Giscus scaffolding
  that isn't even enabled. A static blog shipping a service worker is pure liability.
- **The sidebar wastes the best screen real estate** on an avatar and nav that could be one
  row, while long technical posts get a cramped measure.
- **Code blocks are the product and they're mediocre.** Rouge highlighting with forced line
  numbers, no copy affordance worth keeping, no way to highlight/annotate specific lines —
  and your posts live and die by annotated disassembly/Python listings.
- **The series structure is invisible.** "Zero to Hero 1/2" are just two unrelated posts in
  a reverse-chron list. Chirpy has no concept of a series; readers can't tell there's a
  sequence, or where to start.
- **Categories AND tags is one taxonomy too many.** You have ~4 categories and ~10 tags with
  heavy overlap ("Binary Ninja" category + "binja" tag). Two archive pages, both thin.
- **Maintenance friction.** Ruby toolchain + Gemfile + submodule + theme fork means every
  small visual tweak fights the theme. That's why the site still looks stock.

What's worth keeping: dark-first default, `/posts/:title/` permalinks (inbound links exist —
these must survive), the writing itself, TOC on long posts, RSS.

---

## 2. Migration: Jekyll → astro-erudite v2

### 2.1 Why erudite v2 is the right base

v2 is native CSS + [Utopia](https://utopia.fyi/) fluid scales (no Tailwind), Radix Colors
with `light-dark()`, IBM Plex, Expressive Code for both fenced *and inline* code, Sätteri
(Rust) for markdown, ~6.5kb of JS total, 13 direct deps. Two features map 1:1 onto this
blog's actual problems:

1. **Subposts** — a parent post + children rendered as one continuous document, with the URL
   updating via IntersectionObserver as you scroll and a collapsible TOC per part. This is
   *exactly* what the Binary Ninja Zero-to-Hero series should be.
2. **Expressive Code** — line markers (`ins`/`del`/`mark`), collapsible sections, line
   numbers where wanted, ANSI rendering (terminal output in writeups!), single renderer so
   inline and block code never drift apart.

### 2.2 Repo restructure

Start fresh on a branch (`astro-rewrite`), keep the old site on `main` until cutover:

```
src/
├── assets/fonts/ icons/
├── components/
├── content/
│   ├── blog/
│   │   ├── binary-ninja-zero-to-hero/     # series → subposts
│   │   │   ├── index.md                   # parent: the announcement/overview
│   │   │   ├── 01-getting-started.md
│   │   │   └── 02-ui-tour.md
│   │   ├── cff-remover.md
│   │   ├── vm-obfuscation.md
│   │   ├── rwctf-2024-writeup.md
│   │   ├── codeql-mrva.md
│   │   └── ...
│   └── authors/zerotistic.md              # required in v2
├── layouts/
├── lib/
├── pages/
└── styles/                                # color/fonts/layout/typography/shape .css
```

Delete: `Gemfile`, `_config.yml`, `_plugins/`, `_data/`, `_tabs/`, `_include/`, the
`assets/lib` submodule, `.nojekyll`. Images move to co-located `./images/` next to each post
(Astro optimizes them at build time — free win over Chirpy's raw `img_path`).

### 2.3 Content conversion (scriptable, ~1 hour)

Front matter mapping per post:

| Chirpy | erudite v2 |
|---|---|
| `title`, `date` | `title`, `date` (ISO) |
| `categories: [Binary Ninja]` + `tags: [...]` | **tags only** — merge, dedupe, lowercase (`binary-ninja`, `reverse-engineering`, `ctf`, `automation`, `deobfuscation`) |
| `author: zerotistic` | `authors: ['zerotistic']` (schema-validated) |
| `image.path` + `img_path` | `image` (co-located relative path) |
| `comments`, `toc` | drop (TOC is automatic) |
| — | add `description` (write one per post — currently missing, hurts SEO and the index page) |

Body fixes while converting: Chirpy prompt classes (`{: .prompt-tip }` etc.) → v2
`:::note` / `:::warning` callout directives; `{: width=...}` attribute-list syntax → plain
markdown/HTML; mermaid include → check usage and either keep via a small custom element or
render to SVG at build.

### 2.4 URLs, redirects, feeds

- Keep post URLs at **`/posts/:slug/`** (configure the blog route accordingly, or add
  redirects). Non-negotiable: the Binary Ninja posts have inbound links.
- Series pages: parent at `/posts/binary-ninja-zero-to-hero/`, old part URLs
  (`/posts/binary-ninja-zero-to-hero-1/`) → redirect to the namespaced anchor.
- `/categories/`, `/tags/:name/`, `/archives/` → redirect to `/tags/` equivalents or drop
  with redirects to home.
- RSS: keep the feed at the same path Chirpy used (`/feed.xml`) via Astro's RSS endpoint;
  subscribers must not break.
- `robots.txt` + sitemap via `@astrojs/sitemap`.

### 2.5 Deploy

Replace `pages-deploy.yml` with the standard `withastro/action` GitHub Pages workflow
(pnpm, Node 22). Delete the Ruby setup entirely. Build should land well under 30s.

---

## 3. Design direction

One sentence: **a quiet, monospace-accented, dark-first reading machine for reverse
engineering content, where the personality lives in small interactions and typographic
detail rather than decoration.**

The inspirations split into two groups — *sites to feel like* (desengs, detail.design,
userinterface.wiki: restrained, list-driven, typography-led) and *sites to learn details
from* (jakub.kr's article, haptics.lochie.me's tactility, component.gallery's taxonomy
rigor). Nothing gets copied; here's what each contributes:

### 3.1 Identity & typography (from desengs.com, detail.design)

- **Type does the branding.** No avatar sidebar, no logo mark. Wordmark is just
  `zerotistic` set in the mono face, lowercase, with a subtle accent-colored cursor block
  (`▮`) that blinks *once* on load then stops — a nod to the terminal without the tired
  "fake shell prompt" cliché. Motion respects `prefers-reduced-motion`.
- **Two families, strict roles.** Keep erudite's IBM Plex Sans for prose; promote **IBM
  Plex Mono** beyond code: dates, tags, metadata, nav, headings' section numbers. The
  serif-for-emphasis trick desengs uses becomes *mono-for-emphasis* here — it fits RE
  content better.
- **Accent color: one, and earned.** A single phosphor-adjacent green (Radix `grass` scale,
  tuned) used only for interactive states and the cursor mark — never for large surfaces.
  Everything else is Radix `sand`/`olive` neutrals. Dark theme is the primary design
  target; light mode is derived, both via `light-dark()`.
- **Home page = desengs-style dense list, not cards.** One line per post: `date  title
  ......... tags`, mono date left-aligned in a fixed column (`tabular-nums`), leader-dot rule
  to right-aligned tags on wide viewports, collapsing gracefully on mobile. No thumbnails,
  no excerpt cards, no pagination — all posts, one page (v2's default anyway). With 9 posts,
  cards are padding; a list reads as confidence.

### 3.2 Structure & navigation (from component.gallery, userinterface.wiki)

- **Flatten the IA.** Nav is exactly: `posts · about · rss`. About content merges into a
  short homepage intro (3 lines max: who, what this blog is, where to find you) —
  matching v2's removal of the about page. Contact icons (GitHub, X, email, RSS) as
  hand-picked inline SVGs in the footer, not FontAwesome.
- **One taxonomy, done properly** (component.gallery's lesson: rigorous naming beats more
  navigation). Tags only, lowercase-kebab, ≤2 per post, with a `/tags/` index showing
  counts. Filtering on the home list happens client-side with the tags acting as toggles —
  desengs' filter bar pattern, but tiny (~30 lines of vanilla JS in a custom element,
  consistent with v2's no-framework approach).
- **Series as first-class objects.** Zero-to-Hero becomes a v2 subpost series: continuous
  scroll, URL tracking, per-part TOC sections, and a visible `part 2 of N` marker in mono
  under the heading. The homepage list shows the series as *one* entry with a `series · N
  parts` badge instead of N rows.
- **Writeups get structured metadata**, wiki-style: a small mono fact table at the top of
  CTF/RE posts (event, category, difficulty, tools used) rendered from front matter. Cheap
  to add, makes posts scannable, and gives the content the "catalogued" feel of
  userinterface.wiki / component.gallery.

### 3.3 Reading experience (the core product)

- **Measure ~68ch**, fluid type via the Utopia scales v2 ships — don't fight them, tune the
  min/max viewport sizes if anything.
- **Code blocks, fully exploited:** Expressive Code with `mark`/`ins`/`del` line annotations
  for "here's the interesting instruction" moments, collapsible sections for long listings,
  ANSI blocks for terminal transcripts, line numbers *only* when a post references them,
  file-name titles on every block. Retrofit the existing posts' key listings with markers —
  this single change will do more for the writeups than any visual redesign.
- **TOC** in the right rail (v2 default) with active-section highlight; collapses into a
  `<details>` above the post on narrow viewports.
- **Footnotes/asides** for the "probably unhinged" voice: a sidenote style that renders in
  the margin on wide screens and inline-collapsible on mobile, so jokes and tangents stop
  interrupting the technical flow.
- **Prev/next** between posts and parts (v2 ships it), plus reading time in the mono
  metadata row.

### 3.4 The details layer (from jakub.kr, detail.design, haptics.lochie.me)

Every item here is small, cheap, and cumulative — this is where "customized" stops meaning
"different colors":

1. `text-wrap: balance` on headings, `text-wrap: pretty` on prose paragraphs.
2. `font-variant-numeric: tabular-nums` on dates, TOC numbers, line numbers, the post list.
3. **Concentric radii**: define `--radius-outer: calc(var(--radius-inner) + var(--pad))`
   once in `shape.css`; use everywhere something nests (code block in callout, image in
   figure).
4. **Shadows + 1px inset outline** (`outline: 1px solid rgb(255 255 255 / 0.08);
   outline-offset: -1px`) on images and code blocks so screenshots of dark tools don't
   bleed into the dark background.
5. **Interruptible transitions only**: CSS transitions for hover/focus/theme-toggle; no
   keyframe animations on interactive elements. Theme toggle cross-fades color tokens over
   ~150ms; the icon swap animates opacity+scale, not rotation.
6. **Staggered entry on the post list**: 60–80ms opacity/translate cascade on first paint,
   disabled for `prefers-reduced-motion`, never on subsequent client-side navigations.
7. **Optical alignment pass**: icon+text pairs aligned by eye (nudge icons -1px), hanging
   punctuation on blockquotes, mono dates baseline-aligned with sans titles.
8. **Tactility on interactive elements** (haptics.lochie.me's spirit, not its literal
   haptics): links get a two-state underline (low-opacity resting → full on hover with a
   150ms `text-underline-offset` ease); tag toggles and the theme button get a 1px
   press-down transform on `:active`; copy-code button confirms by morphing icon → checkmark
   with a scale/blur micro-transition. On supporting mobile browsers, fire
   `navigator.vibrate(5)` on tag-filter toggles — a one-line real haptics easter egg.
9. **Focus states designed, not defaulted**: 2px accent `outline-offset: 2px` ring,
   consistent everywhere, visible in both themes.
10. **Selection color** in the accent green at low opacity — the kind of thing only
    detail.design readers notice, which is the point.
11. **View Transitions** (v2 supports it) for post → home: the post title morphs between
    list row and article heading. One transition, done well, nothing else animated.
12. **OG images** generated at build (satori or astro-og-canvas): dark background, mono
    title, green cursor block — the identity extends to link unfurls on X/Discord where
    security content actually gets shared.

### 3.5 Explicit non-goals

No comments system (current one is scaffolding anyway; link to X/GitHub discussions
instead). No PWA/service worker. No analytics beyond, at most, a privacy-respecting
counter. No search until post count justifies it (a `/` shortcut can come later via
pagefind). No hero images on every post — only when the image *is* content.

---

## 4. Implementation plan

**Phase 0 — scaffold (½ day).** New branch; `create astro-erudite@latest` (v2); author
entry; deploy workflow swapped to withastro/action; deploy the stock template to a preview
URL so everything after is visual diffing.

**Phase 1 — content (1 day).** Conversion script for the 9 posts (front matter mapping from
§2.3); restructure Zero-to-Hero into a subpost series; write `description` for every post;
move + co-locate images; fix Chirpy-specific markdown; redirects + `/feed.xml` + sitemap.
**Cutover is possible at the end of Phase 1** — stock erudite v2 already beats Chirpy.

**Phase 2 — identity (1–2 days).** Color tokens (Radix sand/olive + tuned grass accent) in
`color.css`; mono-role typography; wordmark + blinking cursor; homepage rewrite: intro
lines + dense post list with series-collapsing; footer with inline SVG contact icons; nav
flattening; tags index + client-side filter element.

**Phase 3 — reading experience (1–2 days).** Expressive Code config (markers, collapsible,
ANSI, titles); retrofit annotations into existing posts' key code listings; writeup
metadata table component; sidenotes; TOC polish; prev/next + reading time.

**Phase 4 — details (1 day, then forever).** Work through §3.4 as a literal checklist,
committing one detail at a time. Finish with an accessibility + reduced-motion audit,
Lighthouse run (target: 100/100/100/100 — v2 makes this realistic), and cross-check link
unfurls, RSS validity, and every old URL against the redirect map.

**Cutover.** Merge to `main`, verify Pages deploy, keep the Jekyll tree available under a
`jekyll-archive` tag for reference, then delete the Ruby files for good.

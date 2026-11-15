# Share buttons, About in the start message, and new social previews: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Share button in the toolbar (the site) and on the opened card (the word), About moved from the toolbar into the start message, and fifteen new chunky-wheel link-preview images chosen per page, with the tagline "Find the word for what you feel".

**Architecture:** One pure share helper (`src/ui/share.ts`) does Web Share with a clipboard fallback; the toolbar and card emit `fw-share` and `main.ts` supplies the title and URL. A pure `src/og.ts` picks each route's preview image and alt text; `headTags` takes it as part of `HeadMeta`, so the build (home) and the Worker (every other route) share one rule. `scripts/make-og-image.mjs` draws the images from the app's own layout and color code (loaded through Vite's `ssrLoadModule`), in Inter, with Playwright's Chromium.

**Tech Stack:** TypeScript, custom elements, Vite 8, Vitest 5 + happy-dom, Playwright 1.65, Cloudflare Worker.

**Spec:** `docs/superpowers/specs/2026-11-15-feels-on-wheels-share-and-preview-design.md`

## Global Constraints

- Branch `share-and-preview`; never push to `main`. Merging needs `checks` and `e2e` (five browsers) green.
- US spelling everywhere (AGENTS.md).
- No text in code: every visible or spoken string lives in `src/data/locales/en.json`.
- The public URL lives only in `site.config.ts`; never hard-code it. The app shares from `location.origin`.
- A share passes exactly `{ title, url }` to `navigator.share`, nothing else; the clipboard gets the URL only.
- "Link copied" shows for 1.5 s (the theme label's `LABEL_MS`) and is announced through the app's announcer.
- No new npm dependencies. The Inter font file is the only new outside file; download it only after Lucas says yes (Task 7).
- Images: 1200 × 630 PNG, dark, files at `public/og/<wheel id>-<wedge id>.png` (`core-happy.png`, `body-whole-body.png`), never precached by the service worker.
- Base images: `core` → `happy`, `body` → `whole-body`.
- `npm test`, `npm run build`, `npm run size` and `npm run test:e2e` pass at the end of every task that touches what they cover.

## Review Focus

1. **`navigator.share` exists but rejects with something other than a cancel** (desktop Safari or Chrome without a fresh tap: `NotAllowedError`, or `TypeError`): the link should be copied instead, not lost. Test in Task 1.
2. **A second tap while the share sheet is still open** (`InvalidStateError` in real browsers): nothing should happen and nothing should throw. Test in Task 1.
3. **Share is focused and an arrow key selects a word** (keys work from toolbar buttons): Share hides, so focus must go to the wheel, not `<body>`. Test in Task 2.
4. **The shared word's URL must be absolute and canonical** (`https://…/happy/playful/aroused`), not the card's relative `href`. Test in Task 5.
5. **About opened from the start message on the body wheel, then Back**: focus returns to the message's About link, which must survive the round trip. Test in Task 5.

---

### Task 1: The share helper and shared icons

**Files:**
- Create: `src/ui/share.ts`, `src/ui/icons.ts`
- Test: `tests/unit/share.test.ts`

**Interfaces:**
- Produces:
  - `type ShareResult = 'shared' | 'copied' | 'canceled' | 'failed' | 'busy'`
  - `shareLink(data: { title: string; url: string }, nav?: Pick<Navigator, 'share' | 'clipboard'>): Promise<ShareResult>` (default `navigator`)
  - `infoIcon(className?: string): SVGSVGElement`, `shareIcon(className?: string): SVGSVGElement` (24-unit viewBox, `aria-hidden="true"`, default class `fw-icon`). `infoIcon` moves here from `toolbar.ts` unchanged. Share icon paths: `M12 3v12M8 7l4-4 4 4` and `M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17.5 10H16`.

- [ ] **Step 1: Write the failing tests** in `tests/unit/share.test.ts` (happy-dom):
  - `uses the share sheet with only title and url` → fake `share` called once with exactly `{ title: 'T', url: 'https://x/' }`; result `'shared'`; clipboard untouched.
  - `a canceled sheet does nothing` → `share` rejects `new DOMException('', 'AbortError')`; result `'canceled'`; clipboard untouched.
  - `a refused sheet falls back to copying` → `share` rejects `new DOMException('', 'NotAllowedError')`; `writeText` called with `'https://x/'`; result `'copied'`. Same for a rejected `TypeError`.
  - `no share sheet copies the link` → `nav = { clipboard }` only; result `'copied'`.
  - `copying fails quietly` → no `share`, `writeText` rejects; result `'failed'`; no throw. No `clipboard` at all → `'failed'`.
  - `a second share while one is open is ignored` → `share` returns a pending promise; second `shareLink` resolves `'busy'` and `share` was called once; after the first resolves, a third call reaches `share` again.
  - `icons are hidden from assistive tech` → both icons have `aria-hidden="true"` and `viewBox="0 0 24 24"`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/share.test.ts` → FAIL (module not found).
- [ ] **Step 3: Implement** `src/ui/share.ts` and `src/ui/icons.ts`. A module-level "in flight" flag gives `'busy'`; it clears in `finally`.
- [ ] **Step 4: Run** `npx vitest run tests/unit/share.test.ts` → PASS.
- [ ] **Step 5: Commit** `git add src/ui/share.ts src/ui/icons.ts tests/unit/share.test.ts && git commit -m "Share: a helper that shares a link or copies it, and the share and info icons"`

### Task 2: The toolbar: theme in the corner, Share and Start over swap, About leaves

**Files:**
- Modify: `src/ui/toolbar.ts`, `src/styles/app.css:100-116,160-170`, `src/data/locales/en.json` (`ui`)
- Test: `tests/unit/card.test.ts` (the `<fw-toolbar>` describe, ~line 384)

**Interfaces:**
- Consumes: `shareIcon`, `infoIcon` removed from toolbar (Task 1).
- Produces: `<fw-toolbar>` children in DOM order `button.fw-start-over`, `button.fw-share`, `span.fw-theme`; Share emits `fw-share` (`CustomEvent<{ what: 'site' }>`, bubbles); method `showCopied(): void` shows `span.fw-share-label` (text `t('linkCopied')`, `aria-hidden`) for `LABEL_MS`. New strings: `ui.shareSite` "Share Feels on Wheels", `ui.linkCopied` "Link copied".

- [ ] **Step 1: Write the failing tests** (replace the About assertions in the toolbar describe):
  - `Share shows while nothing is selected, Start over while something is` → `selected = false`: `.fw-share` not hidden, `.fw-start-over` hidden; `selected = true`: the reverse. No `.fw-about` in the toolbar.
  - `Share is named for what it shares` → `aria-label` and `title` are `'Share Feels on Wheels'` (with the en locale set).
  - `the theme button is last, in the corner` → `el.lastElementChild` is `span.fw-theme`.
  - `Share emits fw-share for the site` → click → one `fw-share` event with `detail.what === 'site'`.
  - `showCopied shows "Link copied" for 1.5 s` → fake timers; label has `data-show` and text `'Link copied'`; after 1500 ms no `data-show`.
  - `hiding a focused Share hands focus to the wheel` → focus `.fw-share`, set `selected = true` → one `fw-focus-lost` event.
- [ ] **Step 2: Run** `npx vitest run tests/unit/card.test.ts -t fw-toolbar` → FAIL.
- [ ] **Step 3: Implement.** Build Share like the theme button (icon-only, 44 px, `fw-share` class) with its label in a wrapper `span.fw-share-wrap` styled like `.fw-theme`'s label. `#sync` sets `share.hidden = selected` and extends the existing "hiding the focused button" guard to Share. CSS: delete the About rules (lines 109-115) and the phone rule; give `.fw-share` the theme toggle's sizing. Add the two strings.
- [ ] **Step 4: Run** `npx vitest run tests/unit/card.test.ts` → PASS.
- [ ] **Step 5: Commit** `git commit -am "Toolbar: Share beside the theme button at rest, Start over in its place while a word is selected; About leaves the toolbar"`

### Task 3: The card's share button

**Files:**
- Modify: `src/ui/card.ts`, `src/styles/app.css:292-330`, `src/data/locales/en.json` (`ui`)
- Test: `tests/unit/card.test.ts`

**Interfaces:**
- Consumes: `shareIcon` (Task 1).
- Produces: the `opened` `CardModel` gains `path: Path` (the opened segment's path); `button.fw-card-share` (with `span.fw-share-label`, `aria-hidden`) emits `fw-share` with `detail: { what: 'word', wheel: string; path: Path; title: string }`; `FwCard.showCopied(): void` as in Task 2. New string `ui.shareWord` "Share {label}".

- [ ] **Step 1: Write the failing tests:**
  - `cardModel gives an opened word its path` → for Happy › Playful › Aroused opened, `model.path === 'happy/playful/aroused'`.
  - `an opened card has a share button named for its word` → `aria-label` and `title` `'Share Aroused'`, not inside `button.fw-card-toggle`, not inside the `h2`.
  - `a selected card has no share button showing` → `selected` model: `.fw-card-share` absent or hidden; going selected → opened in place shows it; opened → selected hides it.
  - `the heading's accessible text is only the word` → `h2.fw-card-heading` `textContent` contains no "Share".
  - `Share emits fw-share for the word` → click → `detail` equals `{ what: 'word', wheel: 'core', path: 'happy/playful/aroused', title: 'Aroused' }`.
  - `focus order: toggle, then Share` → in DOM order `.fw-card-toggle` precedes `.fw-card-share`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/card.test.ts` → FAIL.
- [ ] **Step 3: Implement.** Wrap `h2.fw-card-heading` and the share button in `div.fw-card-bar`; move the sticky rules (`position: sticky; top: 0; z-index; background`) from `.fw-card-heading` to `.fw-card-bar` and point `#watchHeading` at the bar. The bar is `position: relative`; the toggle gets extra end padding and the share button sits absolutely just left of the chevron (≥ 24 × 24 px target), so the DOM order is toggle → Share while Share looks left of the fold arrow (approved mock A). `#setOpen` hides it while folded. Add `ui.shareWord`.
- [ ] **Step 4: Run** `npx vitest run tests/unit/card.test.ts` → PASS.
- [ ] **Step 5: Commit** `git commit -am "Card: a share button beside the fold arrow while a word is open"`

### Task 4: About in the start message

**Files:**
- Modify: `src/ui/hint.ts`, `src/styles/app.css:251-276`
- Test: `tests/unit/hint.test.ts`

**Interfaces:**
- Consumes: `infoIcon` (Task 1).
- Produces: `HintContent` gains `about?: { label: string; href: string }`, included in `same()`. When set, a third block `p.fw-hint-about` holds `a.fw-hint-about-link` (`href`, the info icon, then a `span` with `label`). The link handles no clicks itself: `main.ts`'s document click handler already shows same-origin links in the app.

- [ ] **Step 1: Write the failing tests:**
  - `renders the About line after the text` → with `about: { label: 'About Feels on Wheels', href: '/about' }`: `a.fw-hint-about-link` has `href` `/about`, text `'About Feels on Wheels'`, and its paragraph follows `p.fw-hint-text`; the info icon is `aria-hidden`.
  - `also on the not-found variant` → `variant: 'notFound'` with `about` renders the link.
  - `the same content keeps the same link element` → set equal content twice; the `a.fw-hint-about-link` node is the same object (focus can come back to it).
  - `a changed about re-renders` → different `href` → new link.
- [ ] **Step 2: Run** `npx vitest run tests/unit/hint.test.ts` → FAIL.
- [ ] **Step 3: Implement.** Style `.fw-hint-about`: `margin-top: 0.5rem`, `color: var(--muted)`, `font-size: 0.95rem`, flex with a `0.5rem` gap, icon `1.1rem` stroked in `currentColor`; the link underlined like `.fw-hint-link`.
- [ ] **Step 4: Run** `npx vitest run tests/unit/hint.test.ts` → PASS.
- [ ] **Step 5: Commit** `git commit -am "Start message: a line linking to About"`

### Task 5: Wire sharing and About into the app, and update the end-to-end tests

**Files:**
- Modify: `src/main.ts` (`hintContent` ~229, event wiring ~480-500), `tests/fw-window.d.ts`, `tests/e2e/helpers.ts:37-46`, `tests/e2e/about.spec.ts`, and any spec using `aboutLink`/`sideways` (22 uses)
- Create: `tests/e2e/share.spec.ts`

**Interfaces:**
- Consumes: `shareLink` (Task 1); `fw-share` and `showCopied()` (Tasks 2, 3); `HintContent.about` (Task 4); `routeMeta`, `formatRoute`, `announce` (existing).
- Produces: `aboutLink(page)` in helpers now points at `fw-hint .fw-hint-about-link`; `sideways` is deleted (About no longer depends on width).

- [ ] **Step 1: Write the failing end-to-end tests** in `tests/e2e/share.spec.ts`, stubbing with `page.addInitScript` (`navigator.share` records into `window.__shared`; for the fallback, `share` is deleted and `navigator.clipboard` is replaced by an object whose `writeText` records into `window.__copied`):
  - `Share at rest shares the home page` → on `/`, click `fw-toolbar .fw-share` → `__shared` equals `{ title: 'Feels on Wheels: find the word for what you feel', url: location.origin + '/' }` (the title text lands in Task 6; until then assert `document.title` of `/`).
  - `Share on the body wheel still shares the home page` → `/body` → `url` is `origin + '/'`.
  - `a word's share sends its own address and title` → `/happy/playful/aroused` → click `.fw-card-share` → `{ title: 'Aroused · Feels on Wheels', url: origin + '/happy/playful/aroused' }`.
  - `without a share sheet the link is copied and said` → fallback stub → click Share → `__copied === origin + '/'`, `fw-toolbar .fw-share-label` visible with "Link copied", `#announcer` has "Link copied".
  - `Share and Start over swap; the theme button never moves` → record the theme button's box at rest, open a word (`/happy`), box unchanged, `.fw-share` hidden, `.fw-start-over` visible; click Start over → swapped back.
  - In `about.spec.ts`: `the message's About link opens About; Back returns focus to it` (on `/` and on `/body`) → click `aboutLink`, heading focused, `history.back()`, `focused(page)` is `A.fw-hint-about-link`.
  - In `about.spec.ts`: `the not-found message links to About` → `/nope`, `aboutLink` visible.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/share.spec.ts tests/e2e/about.spec.ts --project=chromium` → FAIL.
- [ ] **Step 3: Implement in `main.ts`:**
  - `hintContent` adds `about: { label: t('about'), href: formatRoute(table, { kind: 'about' }) }` to both the usual and not-found content.
  - One `app.addEventListener('fw-share', …)`: `site` → `{ title: routeMeta({ kind: 'wheel', wheel: table.first, path: null }, table, data.locale).title, url: new URL('/', location.origin).href }`; `word` → `{ title: routeMeta({ kind: 'wheel', wheel, path }, …).title, url: new URL(formatRoute(table, { kind: 'wheel', wheel, path }), location.origin).href }`. Await `shareLink`; on `'copied'`, call `showCopied()` on the event's target and `announce(t('linkCopied'))`.
  - Update the comment at the document click handler: the hint's About link is shown in the app by it.
- [ ] **Step 4: Update the existing end-to-end tests** that opened About from the toolbar: open it from the message (`aboutLink`, after Start over if a word is selected) or by URL; delete the phone "About gives way to Start over" tests (`about.spec.ts` ~195-208) and `sideways`.
- [ ] **Step 5: Run** `npm test && npx playwright test --project=chromium` → PASS; then `npm run test:e2e` (all five) → PASS.
- [ ] **Step 6: Commit** `git commit -am "Share the site from the toolbar and a word from its card; About from the start message"`

### Task 6: Per-page preview images in the head, the new tagline and alt text

**Files:**
- Create: `src/og.ts`, `tests/unit/og.test.ts`
- Modify: `build/site.ts:18-25,36-47,65-90`, `build/site-plugin.ts:10-13,35-40`, `src/worker/handler.ts:52-56`, `build/sw-plugin.ts:8`, `src/data/locales/en.json` (`titles.home`, `page.imageAlt`)
- Test: `tests/unit/site.test.ts`, `tests/unit/worker.test.ts`, `tests/unit/sw.test.ts`, plus title expectations in `tests/unit/content.test.ts`, `tests/unit/meta.test.ts`, `tests/e2e/about.spec.ts`, `tests/e2e/routes.spec.ts`

**Interfaces:**
- Produces (`src/og.ts`, pure):
  - `OG_SIZE = { width: 1200, height: 630 }`
  - `OG_BASE: Readonly<Record<string, string>> = { core: 'happy', body: 'whole-body' }`
  - `ogWedge(route: Route, table: RouteTable): { wheel: string; wedge: string }`: a wheel route with a path → that wheel and the path's first segment; a wheel at rest → that wheel and `OG_BASE[wheel]` (falling back to the first wheel's base when a wheel has none); About and not found → `table.first`/`OG_BASE[table.first]`.
  - `ogImagePath(w: { wheel: string; wedge: string }): string` → `` `og/${wheel}-${wedge}.png` ``
  - `ogImage(route, table, locale: Locale, altTemplate: string): { path: string; alt: string }`: `alt = fill(altTemplate, { wheel: <locale.wheels[wheel].name, lowercased>, wedge: <the wedge's label: feelings[id].label or areas[id]> })`
  - `HeadMeta` gains `image: { path: string; alt: string }`; `headTags` writes `og:image` = `site.url + image.path`, width/height from `OG_SIZE`, `og:image:alt` and `twitter:image:alt` = `image.alt`. `OG_IMAGE` is deleted.
- Strings: `titles.home` "Feels on Wheels: find the word for what you feel"; `page.imageAlt` "The {wheel} with its {wedge} wedges in front, beside the words \"Feels on Wheels: Find the word for what you feel\"."

- [ ] **Step 1: Write the failing tests:**
  - `og.test.ts`, the spec's §5 table: `/` → `og/core-happy.png`; `/happy/playful/aroused` → `og/core-happy.png`; `/sad/lonely` → `og/core-sad.png`; `/body` → `og/body-whole-body.png`; `/body/chest/racing-heart` → `og/body-chest.png`; About → `og/core-happy.png`; not found (`/nope`, `/body/nope`) → `og/core-happy.png`. Alt for `/sad`: `'The feelings wheel with its Sad wedges in front, beside the words "Feels on Wheels: Find the word for what you feel".'`; for `/body/chest`: starts `'The body sensations wheel with its Chest wedges in front'`.
  - `site.test.ts`: the home head has `og:image` `https://lpolito.github.io/feels-on-wheels/og/core-happy.png` (the test's site URL), `og:image:alt` and `twitter:image:alt` equal to the meta's alt; a meta with `image.path 'og/core-sad.png'` writes that.
  - `worker.test.ts`: `/sad/lonely` responds with `og/core-sad.png` in its head; `/body` with `og/body-whole-body.png`.
  - `sw.test.ts`: `precacheManifest` given `og/core-happy.png` leaves it out.
  - Title expectations change to "Feels on Wheels: find the word for what you feel".
- [ ] **Step 2: Run** `npm test` → FAIL.
- [ ] **Step 3: Implement.** `site-plugin.ts`'s `shellHead` gets `image: ogImage({ kind: 'wheel', wheel: table.first, path: null }, table, loadData().locale, s.imageAlt)`; `handler.ts` passes `image: ogImage(route, table, ctx.locale, ctx.strings.imageAlt)`. Add `og` to the SW `SKIP` pattern (`(^|\/)og\/`). Update the two strings. Leave `public/og-image.png` for Task 7.
- [ ] **Step 4: Run** `npm test && npm run build` → PASS.
- [ ] **Step 5: Commit** `git commit -am "Link previews: each page's image follows its core feeling or body area; new tagline"`

### Task 7: The image script, Inter, and the fifteen images

**Files:**
- Rewrite: `scripts/make-og-image.mjs`
- Create: `scripts/fonts/InterVariable.woff2`, `scripts/fonts/OFL.txt`, `public/og/*.png` (15)
- Delete: `public/og-image.png`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: `loadData` (`src/data/load.ts`), `buildLayout`, `homes` (`src/model/layout.ts`), `buildFillTable`, `type Palette` (`src/render/colors.ts`), `ogImagePath` (`src/og.ts`, Task 6), `src/styles/tokens.css`, `en.json`.

- [ ] **Step 1: Ask Lucas** before downloading: Inter 4.1 from its official release, `https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip` (about 6 MB zip; kept: `web/InterVariable.woff2`, about 350 KB, and `LICENSE.txt` as `scripts/fonts/OFL.txt`). Extract into a new empty directory in the scratchpad, copy the two files over.
- [ ] **Step 2: Write the script.** Header comment: what it makes, `node scripts/make-og-image.mjs`, when to rerun, and Inter's name, version, source and license. Decisions it must follow:
  - Load the TypeScript modules with `createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })` and `ssrLoadModule`; close the server at the end. No dev server is started.
  - Palette: in Playwright, `setContent('<html data-theme="dark"><head><style>' + tokens.css + '</style>')` and read `--bg --fg --muted --gap --focus --outline --surface` and every `--hue-<name>` the wheels use from `getComputedStyle(document.documentElement)`; `fills = buildFillTable(palette, 3, 'dark')`; a cell's color is `fills.fill(seg.hue, seg.shadeRing, true)` of the real segment it stands for.
  - Layouts: `core = buildLayout(wheels[0])`, other wheels `buildLayout(w, homes(core))`, as `main.ts` does. One image per ring-0 segment of every wheel, written to `public/` + `ogImagePath({ wheel: w.id, wedge: seg.node.id })`.
  - Geometry (1200 × 630 canvas, pinned from the approved mock): outer radius `590`, center `(-12.8, 315)`, ring radii = `wheel.rings[i].inner/outer × 590`; the featured segment's `mid` drawn at 3 o'clock (screen angle = segment angle − featured `mid`, clockwise).
  - Cells: ring 0, one per segment. Rings 1 and 2: each ring-0 wedge of angular width `W` is split into `max(1, round(W / (2π / 21)))` and `max(1, round(W / (2π / 42)))` equal cells; each cell takes the color of the real segment on that ring at the cell's middle angle (so the body wheel's outer ring keeps each feeling's own color).
  - Cells are filled paths with a `5` px stroke in `--bg`, round joins, on a `--bg` background.
  - Text, left edge `70` px past the wheel's outer edge, right margin `60` px, block vertically centered: the name (`page.name`) in Inter 700, `--fg`, the largest whole px size ≤ 100 that fits on one line; the tagline (from `titles.home` after ": ", first letter capitalized) in Inter 500, `--muted`, `0.4em` below, the largest size that fits and ≤ `round(0.55 × name size)`. Inter comes from `scripts/fonts/InterVariable.woff2` as a base64 `@font-face`, `font-optical-sizing: auto`; wait for `document.fonts.ready` before measuring.
- [ ] **Step 3: Run** `node scripts/make-og-image.mjs` → 15 files in `public/og/`. Open `core-happy.png`, `core-sad.png`, `body-whole-body.png` and `body-stomach.png` and compare with the approved mocks (`.superpowers/brainstorm/*/content/og-inter-core-happy.png`, `og-final-body-*.png`): same layout, cells about equal width, Stomach no longer crowded, text on one line each.
- [ ] **Step 4: Delete** `public/og-image.png`; `grep -rn "og-image.png" --exclude-dir=node_modules --exclude-dir=docs .` → nothing.
- [ ] **Step 5: AGENTS.md.** New section "Social preview images": when a wheel file, the color tokens, the color code (`src/render/colors.ts`), the layout code, the app's name or the tagline changes, run `node scripts/make-og-image.mjs` and commit `public/og/`.
- [ ] **Step 6: Run** `npm test && npm run build && npm run size` → PASS; `dist/og/` has 15 files and `dist/sw.js`'s precache list has none of them.
- [ ] **Step 7: Commit** `git add -A scripts public AGENTS.md && git commit -m "Social preview images: a chunky wheel per core feeling and body area, in Inter"`

### Task 8: Roadmap, accessibility notes, and the whole-branch check

**Files:**
- Modify: `docs/ROADMAP.md`, `ACCESSIBILITY.md` (only if anything there names the toolbar's About button or something new was found)
- Create, only if what shipped differs from the spec: `docs/superpowers/specs/2026-11-15-feels-on-wheels-share-and-preview-changes.md` (already known: the image files are named by wheel id, `core-happy.png`, not `feelings-happy.png`)

- [ ] **Step 1: Roadmap.** Shipped: a row "Share buttons, About in the start message, and per-feeling link previews" with today's date, the spec, this plan and, if written, *changes*. Ideas: delete "About in the start message", "Share button" and "A new social preview image" (subsections and rows), then the now-empty "The toolbar, sharing and installing" and "The social preview" groups; repoint links to them (the "Known issues and ideas" bullet in Before launching, and "Return to the word you jumped from", which mentions Start over in the toolbar). Before launching: drop the parts of that bullet that are done.
- [ ] **Step 2: Changes file** with the naming difference and anything else that drifted.
- [ ] **Step 3: Run everything:** `npm test && npm run build && npm run size && npm run test:e2e` → PASS.
- [ ] **Step 4: Hand checks for the PR's "What and why"** (per AGENTS.md and ACCESSIBILITY.md): keyboard in a browser (Tab to Share, Enter; Tab through the card toggle then Share; the About line; Back from About); list what wasn't done (a screen reader, a real phone's share sheet) for Lucas to try on the preview link, including trying About in the start message to decide whether it stays.
- [ ] **Step 5: Commit** `git commit -am "Roadmap: share, About in the start message and the new previews shipped"`

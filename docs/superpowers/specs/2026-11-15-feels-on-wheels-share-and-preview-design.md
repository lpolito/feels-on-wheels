# Feels on Wheels: share buttons, About in the start message, and new social previews

Approved by Lucas on 2026-11-15. Designed with him that day, from four roadmap ideas in "The toolbar, sharing and installing" and "The social preview". Mocks were made on screenshots of the real app; the choices below are his unless marked as Claude's call.

## Intent

The app is close to launch, and these are what a first visitor would notice:

1. **Share buttons.** Lucas wants people to share Feels on Wheels, both the site and individual feelings. He doesn't know yet what people will do with a shared word (tell someone how they feel, pass on a word and its meaning, or show someone the app), so a share stays neutral: the address and the page's title, nothing else. The person adds their own words in whatever app they share to.
2. **About moves from the toolbar into the start message,** so the toolbar has room for Share and the theme button never moves. Lucas wanted to try this before deciding; he'll try it on the PR's preview link, and it comes out before merging if it doesn't feel right.
3. **A new social preview image,** the picture link previews show, with a new tagline. Each feeling's page shows its own core feeling's colors, so a shared word looks like that word.

Two ideas are dropped (Lucas, 2026-11-15) and leave the roadmap in this change: **help adding it to the home screen** (About's one sentence on installing is enough) and **a dark home-screen icon**.

## Goals, non-goals, anti-goals

- Goal: one tap to share the site, and one to share the opened word, on phones and computers.
- Goal: the theme button stays in the same place on every screen and in every state.
- Goal: a link preview reads as Feels on Wheels at chat-app thumbnail size, and a shared word's preview is in that word's colors.
- Goal: the preview images can be remade by anyone after the wheels' colors or wedge sizes change.
- Non-goal: a different image per word. One per core feeling and one per body area.
- Non-goal: a share button on the About page, or anywhere else not named here.
- Non-goal: any change to installing, the About page's "Install it" section, or home-screen icons.
- Non-goal: making the images on every build or deploy.
- Anti-goal: the share sending anything but the address and title (no prefilled message, no tracking parameters).
- Anti-goal: two share buttons on screen at once that share different things.
- Anti-goal: the preview images swelling the offline cache. Only link previews fetch them.

## Approaches

**Where Share goes.** Mocked: (A) an icon in the opened card's heading, (B) a "Share Aroused" line at the end of the card, (C) the toolbar, in About's place, (D) a button under About's summary, (E) a "Share it" section at the end of About. Lucas chose **A for words and C for the site**. On computers there's room to keep Share in the toolbar while a word is open, but then the toolbar's Share and the card's would share different things side by side, so the toolbar swaps on every screen size, as on phones.

**About in the start message.** Mocked: (F) its own quieter line under the instruction, (G) an ⓘ beside the question, (H) "What is this?" at the end of the sentence. Lucas chose **F**.

**The preview's picture.** Mocked: the real app with its words removed, at several crops, light and dark, with and without the toolbar; and a simpler drawn wheel. Lucas chose **the simpler, chunky wheel**, close in on a short wide window, dark, with no toolbar: "not being so close to the real app" is part of its appeal, and its few thick cells stay crisp at thumbnail size. For the text: in the start message's box or straight on the background, each with the wheel as before or smaller. He chose **straight on the background, smaller wheel, the text as big as fits on one line** (closest to the old image's style).

**One image or one per feeling.** One image for every page was fine, but Lucas preferred each word's page showing its core feeling. Per-page `og:image` is ordinary; the Worker already writes each page's title and description.

**How the images are remade.** (A) by hand, with a unit test that fails when the wheels change and the images weren't remade; (B) by hand, with no check; (C) on every deploy, which needs a headless browser or a PNG library and a font in Cloudflare's build. Lucas chose **B, with a note in AGENTS.md**.

**The images' font.** (A) Inter, an open-license font checked in next to the script and used only for the images; (B) the system font of the machine running the script, which on a Mac is San Francisco, as the app shows on Apple devices. The system font changes with whoever runs the script, and San Francisco's license is meant for Apple platform interfaces, which makes a preview image shown everywhere a gray area. Side by side at preview size they're nearly identical. Lucas chose **Inter**.

## 1. The toolbar

Today: Start over (while a word is selected), the theme button, then the ⓘ About link; on phones About gives way to Start over.

New, on every screen size, right to left:

- **The theme button, in the corner.** It never moves. Its label still shows briefly after a tap.
- **Beside it, Share while nothing is selected; Start over while a word is selected or opened.** One gives way to the other in the same spot.
- **The ⓘ About link leaves the toolbar.** The phone-only rule that hid it goes too.

Start over keeps its text label where it has one today. Share is an icon button like the theme button, with the accessible name and tooltip "Share Feels on Wheels" (`ui.shareSite`).

Focus: when the focused button gives way to the other (Start over clicked, so Share appears; or Escape or Back clearing the selection), focus follows today's rule for a hidden Start over: it goes to the wheel's tree, not `<body>`.

**What it shares:** the home page (`/` on whatever site it's running on, so preview links share themselves), with the home page's title. It shares the home page from the body wheel and from the not-found message too: it's the "share the site" button.

## 2. The card's share button

- Shown in the card's heading while a word is **opened**, beside the fold arrow ("on the open feeling description", Lucas). Not while a word is only selected (Claude's call, following his words; the selected card is a single heading row with nothing else on it).
- A separate button from the fold toggle, never inside it. Its accessible name and tooltip are "Share {word}" (`ui.shareWord`), for example "Share Aroused".
- It shares the opened word's address (the same one its links use, from `formatRoute`) and title ("Aroused · Feels on Wheels", the same as the page title `routeMeta` gives that route).
- On every wheel, so it shares body areas and sensations too.
- The heading row stays sticky as today, so the button stays in view while the card scrolls.

## 3. Sharing, both buttons

- **Where the browser can share** (`navigator.share`, phones and some computers): the system share sheet opens with the title and URL. Nothing else is passed. Canceling the sheet does nothing and shows nothing.
- **Where it can't:** the link is copied to the clipboard, and "Link copied" (`ui.linkCopied`) shows beside the button for 1.5 s, the way the theme label names its choice, and is announced to screen readers through the app's existing announcer. If copying fails too, nothing is shown (Claude's call; there's nothing useful to offer).
- One share icon everywhere: a box with an arrow out of its top, as in the mocks (Claude's call).

## 4. About in the start message

- A third line under the instruction: an ⓘ icon and "About Feels on Wheels" (the existing `ui.about`), in the muted text color, smaller than the instruction is fine if it reads as quieter. A real link to `/about`; a plain click opens About inside the app as the toolbar link does today, and a modified click is left to the browser.
- Also on the not-found message, which is the same panel.
- The message shows whenever nothing is selected, so Start over always brings About back.
- Leaving About ("Back to the wheel", Back) returns focus to the message's About link instead of the toolbar's (it no longer exists).
- The noscript message keeps its About link, unchanged.

Lucas tries this on the PR's preview link. If it doesn't feel right, it's taken out before merging, and the toolbar decision (§1) is revisited with it.

## 5. The social preview images

**The look** (from the approved mocks, `og-final-*`):

- 1200 × 630, dark (`--bg` dark, `#121114`).
- The left part of a simplified wheel coming in from the left edge, its center just off the left edge, vertically centered, the featured wedge centered at 3 o'clock. Its outer edge reaches about halfway across.
- To the right, straight on the background: "Feels on Wheels" in bold, on one line, as big as fits; under it the tagline, in the muted gray, as big as fits on one line and no bigger than about 55% of the name.
- **The simplified wheel:** the real wheel's three rings, the wheel's own proportions (`rings` in the wheel file), and each wedge's real share of the circle (by its number of outermost words, as the app lays it out). The cells are fewer and chunkier: the inner ring is one cell per wedge, and the middle and outer rings are split into cells of roughly equal width, so a big wedge gets more cells than a small one and every cell is about the same size (Claude's call, after seeing narrow body areas crowded with six thin cells each). Thick gaps in the background color between cells.
- **Colors:** the app's own resting fills for the dark theme, ring by ring, from the same color code the wheel draws with. On the feelings wheel, all three rings take their wedge's color. On the body wheel, the inner two rings take the area's color and the outer ring takes each feeling's own core-feeling color, as in the app (each simplified cell takes the color of the real word at its middle).

**Which image a page uses:**

| Page | Image |
|---|---|
| Home (`/`), About, not found | Happy, on the feelings wheel (the base) |
| A feeling on the feelings wheel | its core feeling (`/happy/playful/aroused` → Happy) |
| The body wheel (`/body`) | Whole body |
| An area, sensation or feeling on the body wheel | its area (`/body/chest/…` → Chest) |

Seven feelings-wheel images and eight body-wheel images. The home page and About are built ahead of time, so their head tags get the base image at build time; every other page gets its image from the Worker, which already writes each route's title and description. `headTags` takes the image (and its alt text) as part of the page's meta instead of the fixed `og-image.png`.

**Alt text** names the wheel and the featured wedge, for example: "The feelings wheel with its Happy wedges in front, beside the words "Feels on Wheels: Find the word for what you feel"." A locale string with placeholders replaces `page.imageAlt` (Claude's call on the wording).

**Files:** under `public/og/`, named by wheel and wedge (`feelings-happy.png`, `body-whole-body.png`; Claude's call on the names). The old `public/og-image.png` is deleted. Link previews already cached by chat apps re-fetch in time.

**On PR previews** the image addresses stay on the public site, from `site.config.ts` like every other address in the head (Claude's call, keeping AGENTS.md's rule). So a link shared from a preview shows no picture until the change merges. Before merging, the images are checked by opening them on the preview (`/og/feelings-happy.png`) and the head tags by the tests.

**Not in the offline cache:** the service worker's precache list skips `og/` (today it caches `og-image.png` like any other file).

## 6. The tagline

"Find the word for what you feel", replacing "Name what you feel" (Lucas, 2026-11-15). It's already the wording of About's summary and the home description. It changes:

- `titles.home`: "Feels on Wheels: find the word for what you feel" (the image script takes the tagline from here, capitalized, as it does today);
- the images and their alt text;
- the tests that check the home title.

## 7. The image script

- `scripts/make-og-image.mjs` is rewritten to make all fifteen images. It stays a script run by hand (`node scripts/make-og-image.mjs`), and its images are committed.
- It reads everything that can change from the project's own sources: the wheel files (structure, ring proportions, wedge sizes), the color tokens and the color code that turns them into ring fills, the name and tagline from the locale. Nothing about the wheel is copied into the script, so rerunning it after a color or wedge change is enough.
- It shouldn't need the dev server running (Claude's call; the mocks were made by sampling the running app, which isn't something to keep).
- It renders with Playwright's Chromium, as today. The text is set in **Inter** (bold for the name, medium for the tagline, with Inter's optical sizing for large text), from a font file checked in next to the script under its SIL Open Font License, and never shipped with the app. So the images come out the same on any machine.
- Inter is named, with its license and where it came from, in the script's header comment and beside the font file. It isn't credited on About or in `docs/reference/`: it isn't a source of the app's content (Claude's call, reading AGENTS.md's "Sources and credits" as about the wheels, words and research).
- **AGENTS.md** gets a short note: when the wheels' colors, wedges or sizes change (the wheel files, the color tokens or the color code), or the name or tagline changes, rerun `node scripts/make-og-image.mjs` and commit the images.

## 8. Text

New strings in `src/data/locales/en.json` (US spelling):

- `ui.shareSite`: "Share Feels on Wheels"
- `ui.shareWord`: "Share {label}"
- `ui.linkCopied`: "Link copied"
- the image alt text with placeholders (§5), replacing `page.imageAlt`
- `titles.home` (§6)

## 9. Accessibility

Follows `ACCESSIBILITY.md`'s contributor expectations:

- Both share buttons are real buttons, 44 × 44 px targets in the toolbar and at least 24 × 24 px in the card's heading, with visible focus rings and names that say what they share.
- "Link copied" is announced as well as shown.
- The About line is a real link, in the message's reading order after the instruction.
- Keyboard order in the toolbar follows the visual order. In the card: the breadcrumbs, the fold toggle, then Share.
- Forced colors: the icons follow the text color, as the toolbar's do today.
- `ACCESSIBILITY.md`'s known limitations are updated if anything new is found, and its mentions of the toolbar's About button (if any) follow the move.

## 10. Roadmap and docs, in the same change

- **Ideas:** remove "A dark home-screen icon" and "Help adding it to the home screen" (dropped), and "Share button", "About in the start message" and "A new social preview image" (shipped), both their subsections and table rows; repoint any links to the removed headings. If the group "The toolbar, sharing and installing" or "The social preview" ends up empty, it goes too.
- **Before launching:** the bullet naming the share button, home-screen help and the new preview image is reworded or removed.
- **Shipped:** a row for this change, with this spec and its plan.
- **AGENTS.md:** the note in §7.

## Left to the builder

- How the script gets the app's ring fills from the color code without the dev server.
- How the card's heading lays out the share button beside the toggle without nesting buttons.
- How the image is chosen per route (likely next to `routeMeta`).
- Test coverage: unit tests for the image chosen per route and for the head tags; end-to-end tests for the toolbar swap, both shares (with `navigator.share` stubbed, and the copy fallback), and the About line, including focus returning to it from About.

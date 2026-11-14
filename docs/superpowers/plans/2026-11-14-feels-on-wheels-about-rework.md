# About page rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A friendlier About page: new section order, "Why it exists" in Lucas's words, the GitHub icon in Made by, credit titles as links, a softer screen reader claim, and a chevron on "Back to the wheel".

**Architecture:** The About page is rendered at build time by `renderAbout()` in `build/site.ts` from `page.about` in `src/data/locales/en.json`, and its link rule (`linkify`) turns `[label]({key})` into links. Task 1 teaches the link rule that the `{github}` key is drawn as the GitHub mark, with the label as its accessible name, and adds the chevron. Task 2 rewrites the text and updates the docs. No runtime code changes.

**Tech Stack:** TypeScript, Vite build plugin, Vitest, Playwright (under `wrangler dev`, via `npm run test:e2e`).

**Spec:** `docs/superpowers/specs/2026-11-14-feels-on-wheels-about-rework-design.md` (approved 2026-11-14).

## Global Constraints

- All visible and spoken text lives in `src/data/locales/en.json`, never in code (ACCESSIBILITY.md).
- "Why it exists" is Lucas's approved text, word for word, as in the spec. The new text uses Oxford commas; don't sweep existing text.
- US spelling. No new dependency.
- Work on the `about-rework` branch. Plain commit messages with no AI attribution trailer. Don't push.
- In the PR's "What and why", say how it was checked: the tests, the keyboard in a browser, and that no screen reader or real phone was tried (AGENTS.md).

## Review Focus

1. **The icon link's tap target** must be at least 24 × 24 CSS px (WCAG 2.5.8): an icon at text size is smaller. Test in Task 1's e2e step.
2. **Dark mode, and forced colors (high contrast):** both icons must be drawn in `currentColor`, never a fixed color, or they vanish. Axe in both themes covers contrast; the `currentColor` check is in Task 1's unit test.
3. **A label with quotes or `&`** (a translation like `Feels on Wheels “on” GitHub`) must stay escaped inside `aria-label` and `title`. Unit test in Task 1.
4. **The script still sets the back link's `href`** (`src/main.ts` ~L397, `backLink.href = …`) and treats a click as Back. Adding an SVG child must not break either. Covered by the existing about.spec.ts tests, which must still pass unchanged.
5. **The visible underline:** the icon link must not show a stray underline or underlined gap next to the name. Check by eye in a browser, in both themes.

---

### Task 1: The GitHub icon link and the chevron

**Files:**
- Modify: `build/site.ts` (`aboutLinks`, `linkify`, `renderAbout`)
- Modify: `src/styles/app.css` (the About block, ~L39–56)
- Test: `tests/unit/site.test.ts` (`describe('About page')`), `tests/e2e/about.spec.ts`

**Interfaces:**
- Produces: link keys `github` (= `site.repo`) and `accessibility` (= `` `${site.repo}/blob/main/ACCESSIBILITY.md` ``). `repo` and `license` are removed, since only the removed Source and license section used them. The `{github}` key renders as `<a class="about-icon" href="…" aria-label="LABEL" title="LABEL"><svg aria-hidden="true" focusable="false" …>…</svg></a>`. The back link renders as `<a href="/"><svg class="about-chevron" aria-hidden="true" focusable="false" …>…</svg>Back to the wheel</a>`.

- [ ] **Step 1: Unit tests.** In `describe('About page')`:
  - Update the link map test to `{ github: 'https://github.com/lpolito/feels-on-wheels', accessibility: 'https://github.com/lpolito/feels-on-wheels/blob/main/ACCESSIBILITY.md', contributing: '…/CONTRIBUTING.md', author: 'https://lucaspolito.dev/', home: '/', about: '/about' }`.
  - Change the `linkify` escaping test's `[Repo]({repo})` to `[Guide]({contributing})`, with the same assertion shape.
  - New: `'linkify draws {github} as the GitHub icon, named by its label'`. With `const out = linkify('[Feels on Wheels on GitHub]({github})', links)`: `out` starts with `<a class="about-icon" href="https://github.com/lpolito/feels-on-wheels" aria-label="Feels on Wheels on GitHub" title="Feels on Wheels on GitHub"><svg`, contains `aria-hidden="true"`, `focusable="false"` and `currentColor`, ends with `</svg></a>`, and has no text outside its tags: `out.replace(/<[^>]+>/g, '')` is `''`.
  - New: `'an icon link label is escaped in its attributes'`. `linkify('[A "q" & b]({github})', links)` contains `aria-label="A &quot;q&quot; &amp; b"`.
  - Update `'it ends with the way back to the wheel'` to match `/<a href="\/"><svg class="about-chevron"[^>]*aria-hidden="true"[\s\S]*?<\/svg>Back to the wheel<\/a><\/p>\s*<\/main>$/`.

- [ ] **Step 2: Run them and see the new ones fail.** Run `npx vitest run tests/unit/site.test.ts`. Expected: the link map, icon, escaping and back-link tests fail. `'one h1, then the sections in order'` still passes until Task 2.

- [ ] **Step 3: Implement.** In `build/site.ts`:
  - Add `const LINK_ICONS: Record<string, string>` with `github`: GitHub's mark (the Octicons `mark-github` 16 × 16 path), `viewBox="0 0 16 16"`, `fill="currentColor"`, `aria-hidden="true" focusable="false"`.
  - In `linkify`, a known key found in `LINK_ICONS` returns the icon link from Interfaces. The label is already escaped, so it goes into `aria-label` and `title` as is.
  - In `renderAbout`, the back link gets the chevron SVG before its text: a simple left chevron stroke, `stroke="currentColor" fill="none"`.
  - Update `aboutLinks` per Interfaces.
  - In `app.css`:
    - `#about .about-icon`: no underline, `inline-flex`, centered, at least 24 × 24 px (`min-width`/`min-height: 1.5rem`), a small gap after the name.
    - Its `svg`: about `1.25em`.
    - `#about .about-chevron`: about `0.7em`, a small gap before the text, sitting on the text's middle.
    - The existing `#about a:focus-visible` outline must still apply.

- [ ] **Step 4: Run the unit tests.** `npx vitest run tests/unit/site.test.ts`. Expected: all pass except `'one h1, then the sections in order'`, which Task 2 fixes.

- [ ] **Step 5: e2e test.** Add to `tests/e2e/about.spec.ts`: `'Made by links the repo with the GitHub icon, named for screen readers, with a big enough target'`. On `/about`:
  - `page.getByRole('link', { name: 'Feels on Wheels on GitHub' })` has `href` `https://github.com/lpolito/feels-on-wheels`.
  - Its `boundingBox()` is at least 24 × 24.
  - `backToWheel(page)` has accessible name `Back to the wheel`.

  This test needs Task 2's text, so it lands in Task 2's run.

- [ ] **Step 6: Commit.** `git add build/site.ts src/styles/app.css tests/unit/site.test.ts tests/e2e/about.spec.ts && git commit -m "About: GitHub icon links and a chevron on Back to the wheel"`

### Task 2: The page's text, and the docs

**Files:**
- Modify: `src/data/locales/en.json` (`page.about.sections`)
- Test: `tests/unit/site.test.ts`
- Docs: `docs/ROADMAP.md`, `docs/reference/core-feelings-wheel.md`, `docs/reference/README.md` (only if its credits text names a link that changed), `ACCESSIBILITY.md` (only if a known limitation changes)

**Interfaces:**
- Consumes: link keys `{github}`, `{accessibility}`, `{author}`, `{contributing}` from Task 1.

- [ ] **Step 1: Unit tests.** In `describe('About page')`:
  - The section order test expects `['what', 'how', 'install', 'why', 'made-by', 'credits', 'translate']`.
  - New: `'nothing about AI'`. `html` doesn't match `/Claude|Superpowers|\bAI\b/`.
  - New: `'credits link each work by its title, and Roberts by the archive.org copy'`. For each credit `<li>`: if it starts with `<li><a `, it contains `feelingswheel.com`; otherwise it contains `“<a href="https://`. `html` doesn't contain `href="https://imgur.com`, and does contain `href="https://web.archive.org/web/20180505024944/https://imgur.com/tCWChf6"`.
  - New: `'why it exists ends with the dedication, in its own paragraph'`. The `why` section contains `<p>For A, E, and M.</p>` as its last `<p>`, and contains `accessible, beautiful, fast, and versatile`.
  - New: `'Made by is the name and the GitHub icon'`. The `made-by` section contains `<a href="https://lucaspolito.dev/">Lucas Polito</a>` and `aria-label="Feels on Wheels on GitHub"`.
  - New: `'how to use it claims no more than was tested'`. The `how` section contains `built for screen readers` and `href="https://github.com/lpolito/feels-on-wheels/blob/main/ACCESSIBILITY.md"`, and doesn't contain `with a screen reader.`

- [ ] **Step 2: Run them and see them fail.** `npx vitest run tests/unit/site.test.ts`. Expected: the order and new tests fail.

- [ ] **Step 3: Rewrite `page.about.sections` in `en.json`.** The order and text are exactly the spec's "The page" section:
  - `how`'s second paragraph is the spec's new one.
  - `install` (heading `Install it`) and `why` (heading `Why it exists`, three paragraphs, the last `For A, E, and M.`) are new.
  - `made-by`'s body is `["[Lucas Polito]({author}) [Feels on Wheels on GitHub]({github})"]`.
  - `credits` moves after `made-by`, with the spec's items. Only the link moves to the title in curly quotes, and Roberts's target changes to `https://web.archive.org/web/20180505024944/https://imgur.com/tCWChf6`.
  - `private` and `source` are deleted.
  - Before writing Roberts's link, open it in a browser and confirm the archived page shows the wheel picture. If it doesn't, or can't be reached, stop and ask Lucas.

- [ ] **Step 4: Run every check.** Run `npm test`, `npm run build`, `npm run size`, and `npm run test:e2e`. Expected: all pass, including Task 1's new e2e test and axe in both themes.

- [ ] **Step 5: Look at it.** Run `npm run dev` and open `/about` in light and dark. Tab through the page:
  - Focus reaches the name, the GitHub icon (its outline is visible), the credit titles, and Back to the wheel.
  - Neither icon shows an underline.

- [ ] **Step 6: Docs.**
  - In `docs/ROADMAP.md`:
    - Delete the About page rework idea (its subsection, its table row, and the now-empty "The About page" Ideas group).
    - Delete the Roberts known issue, and its now-empty "The About page" Known issues group.
    - Drop the About page rework from the Before launching bullet.
    - In Help adding it to the home screen, the line about "Private and offline" now points at the Install it section (`/about#install`).
    - Add the Shipped row `| About page rework | Shipped <merge date> | [spec](…), [plan](…) |`. If what shipped differs from the spec, write the differences in `docs/superpowers/specs/2026-11-14-feels-on-wheels-about-rework-changes.md` and add `, [changes](…)` to the row.
    - Repoint any remaining link to `#about-page-rework` or `#the-about-page`.
  - In `docs/reference/core-feelings-wheel.md`, note under the imgur bullet that the image was removed (checked 2026-11-12) and that the app's credit now links the archive.org copy.

- [ ] **Step 7: Commit.** `git add src/data/locales/en.json tests/unit/site.test.ts docs && git commit -m "About: friendlier page with why it exists, install steps and fixed credit links"`

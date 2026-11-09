# Feels on Wheels: Going Public, Step 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the app online as **Feels on Wheels** at `https://lpolito.github.io/feels-on-wheels/` from a new, cleaned, public repo, with licence files, SEO and preview tags, an About page with credits, and a website icon kit kept for later.

**Architecture:** One config file (`site.config.ts`) holds the public URL. A Vite plugin (`build/site-plugin.ts`) wraps pure functions (`build/site.ts`) that write each page's head tags, the About page's body, the manifest, robots.txt and sitemap.xml from that config and from `en.json`'s new `page` strings. Repo work (licence, docs, notes) lands on the private repo's `main`. A history rewrite then pushes a cleaned copy to the new public repo, which deploys with GitHub Actions.

**Tech Stack:** TypeScript 7, Vite 8, Vitest 5, Playwright 1.65 (and `@axe-core/playwright`), GitHub Actions, `git filter-repo`, `gh`.

**Spec:** `docs/superpowers/specs/2026-11-09-feels-on-wheels-going-public-design.md`

## Global Constraints

- The app's name is **Feels on Wheels**; `short_name` **Feels**; tagline "Name what you feel". Code identifiers (`fw-` prefixes, the `fw.theme` storage key) don't change. The wheel switch's "Feelings wheel" and "See {label} on the feelings wheel" don't change.
- The only place the public URL is written is `site.config.ts` (`url: 'https://lpolito.github.io/feels-on-wheels/'`, `indexable: false`, `repo: 'https://github.com/lpolito/feels-on-wheels'`, `author: { name: 'Lucas Polito', url: 'https://lucaspolito.dev/' }`).
- Every string a person reads comes from `src/data/locales/en.json`. Nothing is hard-coded in HTML or TS.
- Built pages use relative URLs only (`base: './'`). Absolute URLs appear only in head tags, JSON-LD, robots.txt and sitemap.xml, built from `site.url`.
- `npm run size` stays within budget (app JS ≤ 25 KB gz, first load ≤ 60 KB gz). The `page` strings never enter the app's JS.
- Commit messages follow the repo's style (`feat:`, `fix:`, `docs:`, `test:`, `build:`, `ci:`) and **carry no AI attribution or `Co-Authored-By` trailer** (Lucas's global instructions).
- Writing in docs and UI copy: plain, short sentences, the project's existing tone. No source is copied verbatim (roadmap content rules).
- Licences: code under PolyForm Noncommercial 1.0.0, content (`src/data/`, `docs/`) under CC BY-NC-SA 4.0, `Copyright (c) 2026 Lucas Polito`.

## Review Focus

1. **The narrowest phones (280–320 px):** the extra ⓘ link mustn't make the toolbar overlap the wheel switch or leave the viewport. `tests/e2e/viewports.spec.ts` already asserts both; Task 6 runs it.
2. **The GitHub subpath (`/feels-on-wheels/`):** no built page may reference a root-absolute path (`href="/…"`, `src="/…"`), or the CSS, manifest or icons 404 there. Task 2 adds the dist check.
3. **Strings with HTML-special characters** (`&`, `<`, `"`, curly quotes) in titles, descriptions and credits must come out escaped in attributes and text. Task 2 and Task 4 test this.
4. **Navigations to About with a query or hash** (`about.html?ref=x`), offline, must get About, not the wheel. Unknown paths still get the wheel. Task 5 tests this.
5. **Blocked storage** (private mode, storage that throws): the About page still renders, in the system theme. Task 6 tests this.

---

### Task 1: Name, site config and page strings

**Files:**
- Create: `site.config.ts`
- Modify: `src/data/locales/en.json` (new top-level `page` object), `src/data/load.ts:2` (named imports), `package.json` (`name`), `tsconfig.json` (`include` adds `site.config.ts`)
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Produces: `site` from `site.config.ts`, typed as `export interface SiteConfig { url: string; indexable: boolean; repo: string; author: { name: string; url: string } }`. Also produces the `page` strings in `en.json`, with the type `PageStrings` exported from `build/site.ts` in Task 2:
  ```ts
  interface PageStrings {
    name: string; shortName: string; title: string; description: string; imageAlt: string; noscript: string;
    about: AboutStrings; // Task 4
  }
  ```

- [ ] **Step 1: Write the failing test** in `tests/unit/content.test.ts`:
  - `test('page strings exist and are not empty')`: reads `en.json`. Asserts `page.name === 'Feels on Wheels'`, `page.shortName === 'Feels'` and `page.title === 'Feels on Wheels: name what you feel'`. Asserts `page.description` has 100 to 160 characters, and `imageAlt` and `noscript` aren't empty.
  - `test('site config has a URL ending in /')`: imports `site`. Asserts `site.url` matches `/^https:\/\/.+\/$/` and `site.indexable === false`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/content.test.ts`. Expected: FAIL (no `page`, no `site.config.ts`).
- [ ] **Step 3: Implement.**
  - Write `site.config.ts` with the values in Global Constraints.
  - Add `page` to `en.json`. `description` is about 150 characters: a free feelings wheel and body sensations wheel that helps you find the word for what you feel, and works offline. `imageAlt` describes Task 3's image. `noscript` is "Feels on Wheels needs JavaScript to draw the wheel." Use an empty `about: {}` until Task 4.
  - In `load.ts`, replace `import en from './locales/en.json'` with `import { meta, ui, feelings, sensations, areas, wheels as wheelNames } from './locales/en.json'` and `const en = { meta, ui, feelings, sensations, areas, wheels: wheelNames };`. Rename only if `wheels` clashes with a local name.
  - Set `package.json` `name` to `feels-on-wheels`.
- [ ] **Step 4: Run** `npx vitest run`. Expected: all pass.
- [ ] **Step 5: Verify the bundle** with `npm run build && npm run size`. Expected: within budget, and `grep -l "name what you feel" dist/assets/*.js` prints nothing.
- [ ] **Step 6: Commit** `feat: Feels on Wheels: site config and page strings; the app's loader leaves page strings out of its bundle`.

### Task 2: Head tags, manifest, robots.txt and sitemap

**Files:**
- Create: `build/site.ts` (pure functions), `build/site-plugin.ts` (Vite wiring), `tests/unit/site.test.ts`
- Modify: `index.html` (title, description and manifest lines replaced by `<!--site:head-->`, plus `<noscript>`), `vite.config.ts` (add `sitePlugin()` before `swPlugin()`), `tests/e2e/offline.spec.ts` (manifest name expectation → `Feels on Wheels`)
- Delete: `public/manifest.webmanifest` (now generated)

**Interfaces:**
- Consumes: `site`, `SiteConfig` and `page` (Task 1).
- Produces, in `build/site.ts`:
  - `export type PageId = 'index' | 'about'`
  - `export function escapeHtml(s: string): string`. Escapes `& < > " '`.
  - `export function headTags(page: PageId, site: SiteConfig, strings: PageStrings): string`
  - `export function webManifest(strings: PageStrings): Record<string, unknown>`
  - `export function robotsTxt(site: SiteConfig): string`
  - `export function sitemapXml(site: SiteConfig): string`
  - `export function pageUrl(page: PageId, site: SiteConfig): string`. Returns `site.url` or `site.url + 'about.html'`.
- Produces, in `build/site-plugin.ts`: `export function sitePlugin(): Plugin`. It replaces `<!--site:head-->` (and `<!--site:about-->`, Task 4) in `transformIndexHtml`, telling pages apart by `ctx.path` (`/about.html` → `'about'`, else `'index'`). It emits `manifest.webmanifest`, `robots.txt` and `sitemap.xml` with `this.emitFile` in `generateBundle`, and serves `/manifest.webmanifest` in dev with a `configureServer` middleware.

- [ ] **Step 1: Write the failing tests** in `tests/unit/site.test.ts`, using a fixture `site` and `strings`:
  - `headTags('index', …)`:
    - contains `<title>Feels on Wheels: name what you feel</title>`;
    - contains `<link rel="canonical" href="https://lpolito.github.io/feels-on-wheels/">`, and `og:url` with the same URL;
    - `og:image` is `https://lpolito.github.io/feels-on-wheels/og-image.png`, with `og:image:width` `1200` and `og:image:height` `630`;
    - `twitter:card` is `summary_large_image`;
    - contains `<link rel="manifest" href="./manifest.webmanifest">`.
  - `headTags('about', …)`: canonical ends with `about.html`, and there's no `application/ld+json`.
  - noindex: `<meta name="robots" content="noindex">` is present when `indexable: false` and absent when `true`.
  - JSON-LD: the `index` page's `application/ld+json` block parses as JSON with:
    - `@type` `WebApplication`, `isAccessibleForFree` `true`, `offers.price` `"0"`;
    - `author.url` `https://lucaspolito.dev/`;
    - `license` `https://github.com/lpolito/feels-on-wheels/blob/main/LICENSE`.
  - Escaping (Review Focus 3): with `title: 'A & B "C"'`, the output contains `A &amp; B &quot;C&quot;` and no raw `"C"`.
  - `webManifest`:
    - `name` `Feels on Wheels`, `short_name` `Feels`, `description` equal to `strings.description`, `id` `./`, `start_url` `./`, `scope` `./`, `display` `standalone`;
    - the four existing icons, unchanged.
  - `robotsTxt`: equals `User-agent: *\nAllow: /\nSitemap: https://lpolito.github.io/feels-on-wheels/sitemap.xml\n`.
  - `sitemapXml`: has exactly two `<loc>`s, `…/feels-on-wheels/` and `…/feels-on-wheels/about.html`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/site.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `build/site.ts`.**
  - `headTags` emits:
    - title, description and canonical;
    - robots, when not indexable;
    - `og:type` `website`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:locale` `en_US`;
    - `og:image` with width, height and alt;
    - `twitter:card` and `twitter:image:alt`;
    - the manifest link;
    - JSON-LD on `index` only: `name`, `url`, `description`, `inLanguage` `en`, `applicationCategory` `LifestyleApplication`, `operatingSystem` `Any`, `isAccessibleForFree`, `offers {@type Offer, price "0", priceCurrency "USD"}`, `author {@type Person}`, `license`.
  - The `about` page's title and description come from `strings.about.title` and `strings.about.description`. Until Task 4, fall back to `name` and `description`.
  - JSON-LD is serialised with `JSON.stringify` and `<` escaped as `<`.
  - The manifest keeps `background_color` and `theme_color` `#ffffff` and today's icons.
- [ ] **Step 4: Implement `build/site-plugin.ts`, and change `index.html` and `vite.config.ts`.**
  - In `index.html`, the `<title>`, description and manifest `<link>` become `<!--site:head-->`.
  - Add `<noscript><p>…</p></noscript>` as the first child of `<body>`. Its text comes in through a second marker, `<!--site:noscript-->`, which the plugin fills with `escapeHtml(page.noscript)`.
  - The plugin reads `en.json` with `readFileSync` on each transform, so dev picks up edits.
- [ ] **Step 5: Run** `npx vitest run`. Expected: all pass.
- [ ] **Step 6: Verify the build (Review Focus 2).**
  - Run `npm run build`.
  - `ls dist` shows `manifest.webmanifest`, `robots.txt` and `sitemap.xml`.
  - `grep -nE '(href|src)="/' dist/*.html` prints nothing. If Vite leaves `/src/styles/*.css` root-absolute in the source HTML, change those links in `index.html` to `./src/styles/…`.
  - `grep -c "manifest.webmanifest" dist/sw.js` is at least 1 (it's precached).
- [ ] **Step 7: Run** `npx playwright test tests/e2e/offline.spec.ts --project=chromium`. Expected: PASS, with the manifest named `Feels on Wheels`.
- [ ] **Step 8: Commit** `feat: head tags, preview tags, JSON-LD, manifest, robots.txt and sitemap from site.config.ts`.

### Task 3: The preview image

**Files:**
- Create: `scripts/make-og-image.mjs`, `public/og-image.png`

**Interfaces:**
- Consumes: `public/icons/icon.svg`, and `page.name` and `page.title` from `en.json`. The tagline is the part of `title` after ": ", capitalised.

- [ ] **Step 1: Write `scripts/make-og-image.mjs`**, following `scripts/make-icons.mjs`:
  - Playwright Chromium, a viewport of 1200×630 and `deviceScaleFactor` 1.
  - Background `#121114`.
  - The icon SVG at 420 px, vertically centred, 80 px from the left.
  - On the right, the name in `#ecebf0` at 88 px, weight 700, and below it "Name what you feel" in `#a9a6b2` at 52 px.
  - The app's font stack (`system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
  - Writes `public/og-image.png`.
  - Its header comment says to rerun it by hand when the name or icon changes.
- [ ] **Step 2: Run** `node scripts/make-og-image.mjs`, then open `public/og-image.png` with the Read tool. Expected: 1200×630; the name and tagline are fully visible and don't overlap the wheel.
- [ ] **Step 3: Commit** `feat: social preview image`.

### Task 4: The About page

**Files:**
- Create: `about.html`, `src/styles/about.css`
- Modify: `build/site.ts` (add `renderAbout`, `linkify`), `build/site-plugin.ts` (fill `<!--site:about-->`), `vite.config.ts` (`build.rollupOptions.input: { index: 'index.html', about: 'about.html' }`), `src/data/locales/en.json` (`page.about`), `docs/reference/core-feelings-wheel.md`, `docs/reference/README.md` (Credits)
- Test: `tests/unit/site.test.ts`

**Interfaces:**
- Consumes: `escapeHtml`, `PageStrings` and `SiteConfig` (Task 2).
- Produces:
  ```ts
  interface AboutSection { id: string; heading: string; body: string[]; items?: string[] }
  interface AboutStrings { title: string; description: string; heading: string; summary: string; back: string; sections: AboutSection[] }
  export function linkify(text: string, links: Record<string, string>): string
  export function renderAbout(about: AboutStrings, site: SiteConfig): string
  ```
  - `linkify`:
    - HTML-escapes `text`, then turns `[label](target)` into `<a href="…">label</a>`;
    - `target` is either `https://…` or `{key}`, where `key` is one of `links`: `repo`, `license` (`${site.repo}/blob/main/LICENSE`), `contributing` (`${site.repo}/blob/main/CONTRIBUTING.md`), `author` (`site.author.url`), or `home` (`./`);
    - an unknown `{key}` throws.
  - `renderAbout` returns:
    - `<main class="about">` with an `<h1>`, then the summary `<p>`;
    - per section, `<section id>` with an `<h2>`, a `<p>` per body line and a `<ul>` of `items`;
    - last, `<p><a href="./">back</a></p>`.

- [ ] **Step 1: Confirm the credits (spec §8.3).**
  - Search for a primary source for Geoffrey Roberts's "The Feel Wheel" (2015) and its seven cores, and check whether feelingswheel.com shows the seven-core wheel with Español and colour toggles.
  - Record what was and wasn't found, with links and today's date, in `docs/reference/core-feelings-wheel.md`.
  - Update `docs/reference/README.md`'s Credits. Remove the "(Name and link to be added.)" placeholder if the site is confirmed, and drop the Drummond and Nummenmaa lines from the shipped list (strength isn't shipped; the body wheel spec doesn't use Nummenmaa).
- [ ] **Step 2: Write the failing tests** in `tests/unit/site.test.ts`:
  - `linkify('[Repo]({repo}) & co', links)` equals `<a href="https://github.com/lpolito/feels-on-wheels">Repo</a> &amp; co`.
  - `linkify('[x]({nope})', links)` throws.
  - Using the real `page.about` from `en.json`, `renderAbout`:
    - has exactly one `<h1>`, and `<h2>`s for the section ids `what`, `how`, `private`, `credits`, `made-by`, `source`, `translate`, in that order;
    - every `<li>` in `#credits` contains `<a href="https://`;
    - the output has no `{` or `}` and no empty `<p></p>` or `<li></li>`;
    - it ends with `<a href="./">` and the `back` text.
  - `headTags('about', …)`'s title equals `page.about.title`.
- [ ] **Step 3: Run** `npx vitest run tests/unit/site.test.ts`. Expected: FAIL.
- [ ] **Step 4: Write `page.about` in `en.json`**, following spec §8.2:
  - `title` "About Feels on Wheels", a ~150-character `description`, `heading` "Feels on Wheels", a one-line `summary`, and `back` "Back to the wheel".
  - Sections with the ids above:
    - `private` says: no accounts, no tracking, nothing you choose leaves your device, install it to use it offline.
    - `credits` has one item per shipped source, each with a link: Willcox (doi:10.1177/036215378201200411), Roberts (with Step 1's wording, linking to his source if found, or else to `docs/reference/core-feelings-wheel.md` on GitHub), the reference site (if confirmed), and Braman (her handout page).
    - `source` carries the one-sentence licence summary: "source-available, not open source", with links to `{repo}` and `{license}`.
    - `translate` links `{contributing}`.
- [ ] **Step 5: Implement `linkify`, `renderAbout`, the `about` branch of the plugin, `about.html` and `about.css`.**
  - `about.html` has the same `<meta charset>`, viewport, `color-scheme` and icon links as `index.html`, then `<!--site:head-->`.
  - Before the stylesheets, this inline script:
    `<script>try{var t=localStorage.getItem('fw.theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>`
  - Links to `./src/styles/tokens.css` and `./src/styles/about.css`. The body is `<!--site:about-->`. No module script.
  - `about.css`:
    - `body` `background: var(--bg); color: var(--fg)`, the app's font stack;
    - `.about` `max-width: 40rem; margin: 0 auto; padding: 2.5rem max(1rem, env(safe-area-inset-left)) 3rem`, `line-height: 1.55`;
    - `a` `color: var(--fg)`, underlined; `:focus-visible` outlined `2px solid var(--focus)`;
    - `h2` `margin-top: 2rem`.
- [ ] **Step 6: Run** `npx vitest run`. Expected: all pass.
- [ ] **Step 7: Verify the build.** `npm run build && ls dist/about.html && grep -c "<h2" dist/about.html` prints 7. The Task 2 Step 6 grep still prints nothing, and `npm run size` passes.
- [ ] **Step 8: Commit** `feat: About page with credits, rendered from the locale at build time; docs: credits confirmed where possible`.

### Task 5: Service worker serves precached pages

**Files:**
- Modify: `src/sw/strategy.ts`, `src/sw/sw.ts:26-29`
- Test: `tests/unit/sw.test.ts`

**Interfaces:**
- Produces: `navigationResponse(cache, candidates: readonly string[], network: () => Promise<Response>): Promise<Response>`. It returns the first cached match among `candidates`, each matched with `{ ignoreVary: true }`. With no match, it returns the network's response, or `Response.error()` when that throws. It still never writes to the cache.

- [ ] **Step 1: Update the existing tests** to pass `['https://x/index.html']`, and add:
  - `test('a precached page is served for its own navigation')`: the cache holds `https://x/about.html`; candidates `['https://x/about.html', 'https://x/index.html']` get the About response.
  - `test('an unknown page falls back to the index')`: candidates `['https://x/nope.html', 'https://x/index.html']` get the index response, and the network isn't called.
  - `test('navigationUrls strips search and hash')`: `navigationUrls('https://x/about.html?ref=a#b', 'https://x/index.html')` equals `['https://x/about.html', 'https://x/index.html']`. `navigationUrls('https://x/', …)` equals `['https://x/', 'https://x/index.html']`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/sw.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Add `export function navigationUrls(requestUrl: string, indexUrl: string): string[]` to `strategy.ts`: the URL without search and hash, then `indexUrl`. In `sw.ts`, call `navigationResponse(cache, navigationUrls(req.url, INDEX), () => fetch(req))`. Update the doc comment.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit -p src/sw`. Expected: pass, no type errors.
- [ ] **Step 5: Commit** `feat(sw): navigations get their own precached page, so About works offline`.

### Task 6: The toolbar's About link, end to end

**Files:**
- Modify: `src/ui/toolbar.ts` (an `<a class="fw-about">` after the theme control), `src/styles/app.css` (next to the `.fw-theme-toggle` rules, ~line 112), `src/data/locales/en.json` (`ui.about`: "About Feels on Wheels")
- Create: `tests/e2e/about.spec.ts`
- Modify: `tests/e2e/offline.spec.ts`

**Interfaces:**
- Consumes: `t('about')`, and `about.html` (Task 4).

- [ ] **Step 1: Write the failing tests** in `tests/e2e/about.spec.ts`:
  - `toolbar link opens About and Back returns`:
    - `page.goto('/')`, then `getByRole('link', { name: 'About Feels on Wheels' }).click()`;
    - expect URL `/about.html` and the h1 `Feels on Wheels`;
    - click `Back to the wheel`, and expect the URL path `/` and `#wheel` visible.
  - `About follows the saved theme`: an init script sets `localStorage['fw.theme']` to `dark`. On `/about.html`, `document.documentElement.dataset.theme === 'dark'` and the body's computed background is `rgb(18, 17, 20)`. Repeat with `light` → `rgb(255, 255, 255)`.
  - `About renders when storage throws` (Review Focus 5): an init script redefines `localStorage` with a getter that throws. The page has an h1, there's no `data-theme`, and no page errors (`page.on('pageerror')` is empty).
  - `About passes axe in both themes`: `new AxeBuilder({ page }).analyze()` violations equal `[]` for `light` and `dark`.
- [ ] **Step 2: Add to `offline.spec.ts`** `About loads offline after the first visit` (skipped on WebKit, like its neighbour). Visit `/` and wait for `navigator.serviceWorker.ready`, reload, go offline, `goto('/about.html?ref=x')`, then expect the h1 `Feels on Wheels` (Review Focus 4).
- [ ] **Step 3: Run** `npx playwright test tests/e2e/about.spec.ts tests/e2e/offline.spec.ts --project=chromium`. Expected: FAIL (no link yet).
- [ ] **Step 4: Implement.**
  - In `toolbar.ts`, an `infoIcon()` builds a 24-unit SVG like `restartIcon()`: a circle `M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z` and the "i" `M12 11v6M12 7.5v.01`.
  - The link has `href="./about.html"`, `aria-label` and `title` set to `t('about')`, and class `fw-about`. Append it after `themeWrap`.
  - CSS: add `fw-toolbar .fw-about` to every existing `fw-toolbar button` rule in `app.css`, so it shares their size, background, border, radius and focus styles. Then add `fw-toolbar .fw-about { width: 44px; padding: 0; display: inline-grid; place-items: center; color: inherit; text-decoration: none; }`.
- [ ] **Step 5: Run** `npx playwright test tests/e2e --project=chromium --project=pixel --project=iphone`. Expected: all pass, including `viewports.spec.ts` (Review Focus 1). If the switch and toolbar overlap at 280 px, reduce the toolbar `gap` at that width before anything else, and say so in the commit.
- [ ] **Step 6: Run the full suite:** `npm test && npm run test:e2e`. Expected: all pass (WebKit offline tests skipped as before).
- [ ] **Step 7: Commit** `feat(ui): About link in the toolbar; test: About end to end, offline and axe`.

### Task 7: Trim the source notes

**Files:**
- Modify: `docs/reference/braman-emotion-sensation-wheel.md`, `docs/reference/drummond-vocabulary-of-emotions.md`, `docs/reference/README.md` ("Adding a source"), `CLAUDE.md`

- [ ] **Step 1: Trim per spec §4.2.**
  - **Braman:** delete the "Word lists" section and every list of her middle words or sensations. Keep the structure table (counts only) and add a line saying the lists were removed before going public, on 2026-11-09.
  - **Drummond:** delete every per-cell word list and the "Words in more than one cell" lists. Keep the counts table, the category-mapping table and the takeaways, with at most a handful of named examples.
- [ ] **Step 2: Rule.** In `docs/reference/README.md`, replace "If the repository goes public, check whether any transcription should come out first" with: "Notes describe a source and may quote a few words as examples. They never transcribe its word list or layout."
- [ ] **Step 3: CLAUDE.md.**
  - Title: `# Feels on Wheels`.
  - Under Sources and credits, add: "Never transcribe a source's word list or layout into the repo, not even in notes."
  - Add a section `## Site URL` with: "`site.config.ts` is the only place the public URL lives. Never hard-code it elsewhere."
- [ ] **Step 4: Verify** `grep -rnE "Foot-tapping|Lip-tremble|Numb hands" docs` prints nothing. Pick 10 words from the old Drummond note that occur nowhere else in the repo (check each with `git grep -c`) and record them in `$CLAUDE_JOB_DIR/tmp/drummond-sentinels.txt` for Task 12. Each `grep -rw` over `docs` now prints nothing.
- [ ] **Step 5: Commit** `docs: trim source notes to descriptions and counts; never transcribe a source's word list`.

### Task 8: Licence, README, contributing

**Files:**
- Create: `LICENSE`, `LICENSES/PolyForm-Noncommercial-1.0.0.md`, `LICENSES/CC-BY-NC-SA-4.0.txt`, `README.md`, `CONTRIBUTING.md`, `.github/pull_request_template.md`, `docs/screenshot.png`

- [ ] **Step 1: Fetch the licence texts unmodified.**
  - `curl -fsSL https://raw.githubusercontent.com/polyformproject/polyform-licenses/1.0.0/PolyForm-Noncommercial-1.0.0.md -o LICENSES/PolyForm-Noncommercial-1.0.0.md`
  - `curl -fsSL https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.txt -o LICENSES/CC-BY-NC-SA-4.0.txt`
  - If either URL 404s, find the canonical source with WebSearch.
  - Check each with `head`: the first lines name the right licence.
- [ ] **Step 2: Write `LICENSE`**, per spec §5.1, in this order:
  - the copyright line;
  - the one-sentence summary;
  - which paths are code and which are content, each pointing to its file in `LICENSES/`;
  - the PolyForm `Required Notice: Copyright Lucas Polito (https://lucaspolito.dev/)` line;
  - third-party rights;
  - "Questions about other uses: open an issue."
- [ ] **Step 3: Take the screenshot.** `npm run build:test && npx vite preview --outDir dist-test --port 4173`, then use Playwright to load `http://localhost:4173/#/core/happy/interested/curious` at 1280×800 in the light theme and save `docs/screenshot.png`. Open it with the Read tool to check the card shows Curious.
- [ ] **Step 4: Write `README.md`** per spec §5.2:
  - the screenshot;
  - the live link (`site.url`);
  - a "Moving to a domain" section copying spec §3.3's six steps.
- [ ] **Step 5: Write `CONTRIBUTING.md` and the PR template** per spec §5.3. Quote the terms paragraph from spec §5.3 word for word in both. The template's checkbox reads `- [ ] I agree to the contribution terms in CONTRIBUTING.md.`
- [ ] **Step 6: Commit** `docs: licence (PolyForm Noncommercial + CC BY-NC-SA), README, contributing guide and PR template`.

### Task 9: Deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the workflow** per spec §6.1:
  - `on: push: branches: [main]` and `workflow_dispatch`;
  - `permissions: contents: read, pages: write, id-token: write`, and `concurrency: { group: pages, cancel-in-progress: false }`;
  - `build` job on `ubuntu-latest`:
    - `actions/checkout@v7`;
    - `actions/setup-node@v7` with `node-version: 26` and `cache: npm`;
    - `npm ci`, `npm test`, `npm run build`, `npm run size`;
    - `actions/configure-pages@v6`, then `actions/upload-pages-artifact@v5` with `path: dist`;
  - `deploy` job: `needs: build`, `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`, `actions/deploy-pages@v5` with `id: deployment`.
- [ ] **Step 2: Lint it.** `npx --yes @action-validator/cli .github/workflows/deploy.yml` (or `actionlint` if installed). Expected: no errors.
- [ ] **Step 3: Commit** `ci: build, test and deploy to GitHub Pages on push to main`.

### Task 10: Website icon kit

**Files:**
- Create: `docs/website-icon/feels-on-wheels.svg`, `docs/website-icon/feels-on-wheels.css`, `docs/website-icon/snippet.html`, `docs/website-icon/preview.html`, `docs/website-icon/README.md`

- [ ] **Step 1: Write the SVG** per spec §9.
  - `viewBox="0 0 512 512"`, with an internal `<mask>`:
    - a white disc r=240 at (256,256), a black hole r=78;
    - black spoke lines 20 wide from the centre to r=250 at 0°, 52.7°, 122.9°, 158.0°, 210.7°, 289.8° and 324.9° (clockwise from 12 o'clock: `x = 256 + d·sin θ`, `y = 256 − d·cos θ`);
    - a black ring stroke 16 wide at r=148.8;
  - then `<rect width="512" height="512" mask="url(#m)"/>`.
  - The brainstorm mockup generator at `$CLAUDE_JOB_DIR/tmp/make-icon-mockup.mjs` (`wheelMask({hole:78, ring:148.8})`) builds exactly this, if it still exists.
- [ ] **Step 2: Write the CSS** per spec §9:
  - `.icon-feels { --icon: url("../icons/feels-on-wheels.svg"); }`
  - `.icon-feels::after { inset: 0; rotate: 0deg; background-size: auto; animation: none; background-image: conic-gradient(#E0559E 0deg 52.7deg, #E0525C 52.7deg 122.9deg, #C77A4F 122.9deg 158deg, #7A70C2 158deg 210.7deg, #E8933A 210.7deg 289.8deg, #5FA383 289.8deg 324.9deg, #8E6BC0 324.9deg 360deg); }`
  - The spin, using the site's own selectors (`@media (hover: hover) { a:hover .icon-feels }`, `a:focus-visible .icon-feels` and `a:active .icon-feels`): `rotate: 360deg; transition: rotate 1.1s cubic-bezier(.2,.8,.25,1)`. At rest: `transition: rotate 0s`.
  - `@media (prefers-reduced-motion: reduce)`: no rotate.
  - `@media (forced-colors: active)`: `.icon-feels::after { display: none }`.
  - A header comment lists the contrast ratios on `#121214`: 5.31, 4.93, 5.64, 4.39, 7.72, 6.28, 4.47.
- [ ] **Step 3: Write `snippet.html`**: `<a href="https://DOMAIN/" aria-label="Feels on Wheels, a feelings wheel by Lucas Polito"><span class="icon icon-feels"></span></a>`, with a comment to replace `DOMAIN`.
- [ ] **Step 4: Write `preview.html`.**
  - It links `https://lucaspolito.dev/css/styles.css` and inlines `feels-on-wheels.css`, with `--icon` overridden to `url("feels-on-wheels.svg")`.
  - It copies the site's `#main.sunset` links row (GitHub, LinkedIn and email `<a>`s) and adds the new link.
  - Open it in Playwright, hover the new icon, and take a screenshot. Expected: a grey wheel at rest; coloured and spun when hovered.
- [ ] **Step 5: Write `README.md`** as agent instructions, the five steps in spec §9 in order, with the exact file paths in `~/dev/lucaspolito.dev` (`icons/`, `css/styles.css` after `.icon-linkedin`, `index.html` `#links` last, README "What's where"), and the commands (`python3 -m http.server 8000`). First line: "Do this only once Feels on Wheels has its own domain. Never link the github.io address."
- [ ] **Step 6: Commit** `docs: website icon kit for lucaspolito.dev (not added there yet)`.

### Task 11: Roadmap, then merge to the private main

**Files:**
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Roadmap.**
  - Step 1's heading becomes `### Step 1: shareable (built, deploying)`, with links to the spec and this plan.
  - The credits line records what Task 4 confirmed. Anything unconfirmed stays in step 2's "Unconfirmed credits" line, and that line is removed if both were confirmed.
- [ ] **Step 2: Run everything:** `npm test && npm run build && npm run size && npm run test:e2e`. Expected: all pass. Report any perf or flaky failure with its output; don't retry it away silently.
- [ ] **Step 3: Commit** `docs: roadmap: going public step 1 built`.
- [ ] **Step 4: Merge to `main`** in the main checkout (`/Users/lucas/dev/feelings-wheel`, which is on `main` and clean): `git merge --no-ff worktree-going-public -m "Merge branch 'worktree-going-public'"`, then `git push origin main` (the private repo).

### Task 12: Rewrite history into the new public repo

**Files:** none in the worktree. Work happens in `$CLAUDE_JOB_DIR/tmp/public`.

- [ ] **Step 1: Install the tool:** `brew install git-filter-repo`, then `git filter-repo --version`.
- [ ] **Step 2: Make a fresh clone:** `git clone --single-branch --branch main git@github.com:lpolito/feelings-wheel.git $CLAUDE_JOB_DIR/tmp/public`.
- [ ] **Step 3: Rewrite.** Save the trimmed notes: copy both files from the clone's `docs/reference/` to `$CLAUDE_JOB_DIR/tmp/trimmed/`. Then, in the clone: `git filter-repo --invert-paths --path docs/reference/braman-emotion-sensation-wheel.md --path docs/reference/drummond-vocabulary-of-emotions.md`.
- [ ] **Step 4: Fix the cited hashes and re-add the notes.**
  - Look up the new hashes of `2210c12`, `e9ae2b4`, `63977fa` and `be1b053` in `.git/filter-repo/commit-map` (old full hash → new full hash; match on prefix).
  - Replace them in `docs/ROADMAP.md` with the new 7-character prefixes.
  - Copy the trimmed notes back.
  - Commit `docs: source notes without transcribed word lists (removed from history before going public)`.
- [ ] **Step 5: Verify, and stop if anything prints.**
  - `git log --all -p | grep -cE "Foot-tapping|Lip-tremble|Numb hands"` prints `0`.
  - For each word in `drummond-sentinels.txt`, `git log --all -p | grep -cw "<word>"` prints `0`.
  - `git log --format='%ad %s' | tail -3` shows the original 2026-11-06 dates.
  - `git log --oneline | wc -l` is close to the original count (within the few commits that only touched the notes).
- [ ] **Step 6: Create the repo and push.**
  - `gh repo create lpolito/feels-on-wheels --public --description "Name what you feel: a fast, accessible feelings wheel and body sensations wheel that works offline." --homepage https://lpolito.github.io/feels-on-wheels/`
  - `gh repo edit lpolito/feels-on-wheels --add-topic feelings-wheel --add-topic emotions --add-topic pwa --add-topic accessibility --add-topic mental-health`
  - In the clone: `git remote add origin git@github.com:lpolito/feels-on-wheels.git && git push -u origin main`.
- [ ] **Step 7: Ask Lucas** whether to repoint his checkout at `/Users/lucas/dev/feelings-wheel`:
  - `git remote rename origin archive`
  - `git remote add origin git@github.com:lpolito/feels-on-wheels.git`
  - `git fetch origin`
  - `git reset --hard origin/main` (the checkout must be clean first)
  - `git branch -u origin/main`
  
  Do it only on a yes.

### Task 13: Turn on Pages and check it live

- [ ] **Step 1: Set the Pages source to Actions:** `gh api -X POST repos/lpolito/feels-on-wheels/pages -f build_type=workflow`. If it already exists, use `-X PUT`.
- [ ] **Step 2: Deploy.** The push in Task 12 triggered the workflow before Pages existed, so rerun it with `gh workflow run deploy.yml -R lpolito/feels-on-wheels`, then `gh run watch -R lpolito/feels-on-wheels --exit-status`. Expected: success.
- [ ] **Step 3: Check live** per spec §6.3, with Playwright against `https://lpolito.github.io/feels-on-wheels/`:
  - the wheel loads;
  - opening a word works, and switching to the body wheel works;
  - the About link opens `about.html`, and "Back to the wheel" returns;
  - after one visit and a reload, both pages load with the context offline;
  - the manifest's `start_url` resolves to `/feels-on-wheels/`.
- [ ] **Step 4: Check the tags.**
  - `curl -s https://lpolito.github.io/feels-on-wheels/ | grep -E 'og:(url|image)"|canonical|noindex'` shows the absolute URLs and `noindex`.
  - `curl -sI https://lpolito.github.io/feels-on-wheels/og-image.png` returns 200.
  - The same checks for `about.html`.
- [ ] **Step 5: Roadmap.** In the public repo's clone, Step 1's heading becomes `### Step 1: shareable (shipped 2026-11-09)`, with the live link. Commit `docs: roadmap: going public step 1 shipped` and push. The deploy runs again; check it with `gh run watch`.

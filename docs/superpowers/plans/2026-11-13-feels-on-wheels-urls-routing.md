# URL redesign (real paths, a small router, a Worker for first visits) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every app state gets a real path (`/happy/playful`, `/body/chest`, `/about`), moving between them never reloads the page, and a small Cloudflare Worker gives first visits the right head tags or a real 404.

**Architecture:** One pure module (`src/state/url.ts`) owns the path format and the list of real paths; the app, the build (sitemap, reserved names) and the Worker all use it. The app becomes one shell (`index.html`) with the wheel and About as two views, switched by a small router of our own (link clicks, `pushState`/`replaceState`, `popstate`). The Worker only runs for paths with no file: it fetches the shell from the assets binding, swaps its head tags as text, and answers 200, 301, 404 or 405.

**Tech Stack:** TypeScript 7, Vite 8, Vitest 5 (+ happy-dom), Playwright 1.65, Cloudflare Workers static assets, Wrangler `4.156.2` via `npx`.

**Spec:** `docs/superpowers/specs/2026-11-13-feels-on-wheels-urls-routing-design.md` (approved 2026-11-13). Section numbers below (§1–§11) are the spec's.

## Global Constraints

- No new runtime dependency and no router library. No new dev dependency: Wrangler runs as `npx -y wrangler@4.156.2`.
- Budgets unchanged: app JS ≤ 25 KB gzipped, first load ≤ 60 KB gzipped (`npm run size`).
- `site.config.ts` is the only place the public URL lives; absolute URLs only in head tags, sitemap and robots.txt. Everything else is root-relative (`/about`, `/body`, `/`).
- Paths are exact and case-sensitive: no trailing slash, no `.html`, ids as in the data. A query is ignored and never canonical; a hash is ignored.
- All new text goes in `src/data/locales/en.json`, never in code. US spelling everywhere. en.json uses straight apostrophes and curly double quotes (“ ”).
- `wrangler.jsonc` keeps `compatibility_date: "2026-11-01"`, `html_handling: "auto-trailing-slash"`, `workers_dev` and `preview_urls`.
- `indexable` stays `false`.
- The spec is frozen. Docs follow `AGENTS.md`: roadmap, `ACCESSIBILITY.md` and credits in the same change.
- Commit messages: plain, no AI attribution trailer (Lucas's global rule).
- Work on branch `urls-routing`; `main` only takes the PR.

## Review Focus

1. **First load at `/about`, then to the wheel.** The wheel mounts while hidden, so it measures a 0 × 0 stage. Going to the wheel must show it at full size, labeled, with no intro spin played while hidden. (Task 6, e2e "first load at /about, then the wheel".)
2. **Odd paths:** `//happy`, `/happy//playful`, `/happy%2Fplayful`, `/%E0%A4%A`, a 500-character path. Each is not found, the quoted word is sane and short, and nothing throws. (Task 1 unit tests, Task 7 Worker tests.)
3. **Queries and old links:** `/happy?fbclid=x` opens Happy; `/#/core/happy` (an old hash link) shows the feelings wheel at rest with no error. (Task 5 e2e.)
4. **Modified clicks on in-app links:** ⌘/Ctrl/Shift/Alt-click, middle click, `target="_blank"` and `download` links go to the browser, never the router. (Task 6 unit test of `inAppLink`.)
5. **Quick Back/Forward between About and the wheel while the wheel is moving:** the right view, title and focus each time, no stale wheel. (Task 6 e2e "Back and Forward across About during a spin".)

---

### Task 1: The path module

**Files:**
- Modify (rewrite): `src/state/url.ts`
- Test (rewrite): `tests/unit/url.test.ts`

**Interfaces:**
- Consumes: `Wheel`, `NodeRef` (`src/data/types.ts`), `nodeRef` (`src/data/node.ts`), `Layout`, `Path` (`src/model/layout.ts`), `State` (`src/state/store.ts`).
- Produces:
  ```ts
  export type Route =
    | { kind: 'wheel'; wheel: string; path: Path | null } // null: the wheel at rest
    | { kind: 'about' }
    | { kind: 'notFound'; wheel: string; word: string };
  export interface RouteTable {
    first: string; // the first wheel's id, served at the root
    wheels: ReadonlyMap<string, ReadonlyMap<Path, NodeRef>>; // in wheel order
    langs: readonly string[]; // prefixed languages; [] today (§9)
  }
  export function routeTable(wheels: readonly Wheel[], langs?: readonly string[]): RouteTable;
  export function parsePath(table: RouteTable, pathname: string): { lang: string | null; route: Route };
  export function formatRoute(table: RouteTable, route: Exclude<Route, { kind: 'notFound' }>, lang?: string | null): string;
  export function allPaths(table: RouteTable): string[]; // '/', '/about', then every wheel route, wheel order
  export function reservedClash(table: RouteTable, outputNames: readonly string[], localeCodes: readonly string[]): string[];
  export function stateFor(layout: Layout, path: Path): State | null; // replaces fromHash
  export function pathOf(layout: Layout, s: State): Path | null; // the opened segment's path, else null
  export const WORD_MAX = 40;
  ```
  `toHash`, `hashWheel` and `fromHash` are removed.

- [ ] **Step 1: Write the failing tests** in `tests/unit/url.test.ts` (load data with `loadData()`, `table = routeTable(wheels)`):

  ```ts
  test('every layout path is a route, and nothing else', () => {
    for (const w of wheels) expect([...table.wheels.get(w.id)!.keys()].sort()).toEqual([...buildLayout(w).byPath.keys()].sort());
  });
  test('round-trips every real path', () => {
    for (const p of allPaths(table)) {
      const { lang, route } = parsePath(table, p);
      expect(lang).toBeNull();
      expect(route.kind).not.toBe('notFound');
      expect(formatRoute(table, route as Exclude<Route, { kind: 'notFound' }>)).toBe(p);
    }
  });
  test('shapes (§1)', () => {
    expect(parsePath(table, '/').route).toEqual({ kind: 'wheel', wheel: 'core', path: null });
    expect(parsePath(table, '/happy/playful').route).toEqual({ kind: 'wheel', wheel: 'core', path: 'happy/playful' });
    expect(parsePath(table, '/body').route).toEqual({ kind: 'wheel', wheel: 'body', path: null });
    expect(parsePath(table, '/body/chest/tight-chest').route).toEqual({ kind: 'wheel', wheel: 'body', path: 'chest/tight-chest' });
    expect(parsePath(table, '/about').route).toEqual({ kind: 'about' });
    expect(allPaths(table).slice(0, 2)).toEqual(['/', '/about']);
    expect(allPaths(table)).toContain('/body');
  });
  test('not found, with the word as typed (§7)', () => {
    expect(parsePath(table, '/happy/plaful').route).toEqual({ kind: 'notFound', wheel: 'core', word: 'plaful' });
    expect(parsePath(table, '/body/chest/tight-chst').route).toEqual({ kind: 'notFound', wheel: 'body', word: 'tight-chst' });
    for (const p of ['/Happy', '/core/happy', '/en/happy', '/about/x', '/happy/', '//happy', '/happy//playful', '/happy%2Fplayful', '/%E0%A4%A', '/index.html'])
      expect(parsePath(table, p).route.kind, p).toBe('notFound');
    expect((parsePath(table, '/%E0%A4%A').route as { word: string }).word).toBe('%E0%A4%A');
    const long = parsePath(table, `/${'x'.repeat(500)}`).route as { word: string };
    expect(long.word).toBe(`${'x'.repeat(WORD_MAX)}…`);
  });
  test('a known language prefix is stripped; English is never prefixed (§9)', () => {
    const t2 = routeTable(wheels, ['es']);
    expect(parsePath(t2, '/es/happy')).toEqual({ lang: 'es', route: { kind: 'wheel', wheel: 'core', path: 'happy' } });
    expect(formatRoute(t2, { kind: 'about' }, 'es')).toBe('/es/about');
    expect(formatRoute(t2, { kind: 'wheel', wheel: 'core', path: null }, 'es')).toBe('/es');
  });
  test('reserved names (§1)', () => {
    expect(reservedClash(table, ['assets', 'icons', 'sw.js', 'index.html'], ['en'])).toEqual([]);
    expect(reservedClash(table, ['happy'], ['en'])).toEqual(['happy']);
    expect(reservedClash(table, [], ['sad'])).toEqual(['sad']);
  });
  test('stateFor / pathOf', () => {
    const l = buildLayout(wheel);
    const s = stateFor(l, 'angry/aggressive/hostile')!;
    expect(s).toEqual({ selected: l.byPath.get('angry/aggressive/hostile'), opened: true, view: { mode: 'ring', ring: 2 } });
    expect(pathOf(l, s)).toBe('angry/aggressive/hostile');
    expect(pathOf(l, { ...s, opened: false })).toBeNull();
    expect(stateFor(l, 'angry/nope')).toBeNull();
  });
  ```

- [ ] **Step 2: Run** `npx vitest run tests/unit/url.test.ts`. Expected: FAIL (`routeTable` is not exported).

- [ ] **Step 3: Implement the interfaces in `src/state/url.ts`.**
  - Paths are built like `buildLayout` builds `Segment.path`: node ids joined with `/` from the center outward.
  - `parsePath`: split on `/` after the leading one. An empty segment anywhere (`//`, a trailing slash) is not found; `/` alone is the first wheel at rest. Decode each segment with `decodeURIComponent`; a decode error, or a decoded segment containing `/`, is not found. Strip a first segment in `table.langs`. Then: no segments is the first wheel at rest; `['about']` is About; a first segment naming another wheel is that wheel (rest, or a path in its map); anything else is looked up in the first wheel's map.
  - Not found: `wheel` is the other wheel if the first segment names one, else `table.first`. `word` is the last non-empty segment (decoded if it decodes, else raw), or the whole pathname if there's none, cut to `WORD_MAX` characters plus `…`.
  - `reservedClash` returns the first wheel's top-level ids that equal any of: another wheel's id, `about`, a locale code, or an output name.

- [ ] **Step 4: Run** `npx vitest run tests/unit/url.test.ts`. Expected: PASS. (`main.ts` won't typecheck until Task 5. Don't run `npm run build` here.)

- [ ] **Step 5: Commit** `git add src/state/url.ts tests/unit/url.test.ts && git commit -m "Path module: real paths, routes and reserved names"`

### Task 2: Titles and descriptions

**Files:**
- Create: `src/meta.ts`
- Modify: `src/data/locales/en.json`, `src/data/types.ts` (`Locale`), `src/data/load.ts` (named import and `validateLocale`), `build/site.ts` (`PageStrings`, `headTags`, `webManifest`, `jsonLd` read the moved strings)
- Test: `tests/unit/meta.test.ts` (new), `tests/unit/content.test.ts`, `tests/unit/site.test.ts`

**Interfaces:**
- Consumes: `Route`, `RouteTable` (Task 1).
- Produces:
  ```ts
  // src/data/types.ts
  export interface Titles {
    home: string; homeDescription: string; about: string; aboutDescription: string;
    route: string; notFound: string; sensationDescription: string; areaDescription: string;
    wheelDescriptions: Record<string, string>; // every wheel but the first
  }
  // Locale gains `titles: Titles`
  // src/meta.ts
  export function routeMeta(route: Route, table: RouteTable, locale: Locale): { title: string; description: string };
  ```

- [ ] **Step 1: Move and add the strings in `en.json`.** Add a top-level `"titles"` group:
  - `home` and `homeDescription`: **moved** from `page.title` and `page.description` (deleted there);
  - `about` and `aboutDescription`: **moved** from `page.about.title` and `page.about.description`;
  - `"route": "{name} · Feels on Wheels"`, `"notFound": "Not found"`;
  - `"sensationDescription": "{sensation}: the feelings it can come with, on the body sensations wheel."`;
  - `"areaDescription": "{area}: what you might notice there, and the feelings it can come with."`;
  - `"wheelDescriptions": { "body": "Start from what you notice in your body to find the word for what you feel." }`.

  Also add to `ui`: `"notFoundTitle": "Feeling not found!"` and `"notFoundText": "There's no “{word}” on the wheel."` (used in Task 5).

- [ ] **Step 2: Write the failing tests** in `tests/unit/meta.test.ts`:

  ```ts
  const m = (p: string) => routeMeta(parsePath(table, p).route, table, locale);
  test('§6 table', () => {
    expect(m('/')).toEqual({ title: 'Feels on Wheels: name what you feel', description: locale.titles.homeDescription });
    expect(m('/happy/playful')).toEqual({ title: 'Playful · Feels on Wheels', description: 'In the mood for fun and lightheartedness.' });
    expect(m('/body/chest/tight-chest/anxious').title).toBe('Anxious · Feels on Wheels');
    expect(m('/body')).toEqual({ title: 'Body sensations wheel · Feels on Wheels', description: locale.titles.wheelDescriptions['body'] });
    expect(m('/body/chest/tight-chest')).toEqual({ title: 'Tight chest · Feels on Wheels', description: 'Tight chest: the feelings it can come with, on the body sensations wheel.' });
    expect(m('/body/chest').description).toBe(`${locale.areas['chest']}: what you might notice there, and the feelings it can come with.`);
    expect(m('/about').title).toBe('About Feels on Wheels');
    expect(m('/nope')).toEqual({ title: 'Not found · Feels on Wheels', description: locale.titles.homeDescription });
  });
  ```
  In `content.test.ts`, the `page.title`/`page.description` checks move to `titles.home`/`titles.homeDescription`, keeping the same values and the 100–160 length bounds. Add: every non-first wheel has a `wheelDescriptions` entry of 100–160 characters. (If the body description above is shorter, Lucas edits the wording; say so in the PR, and lower the bound only for `wheelDescriptions` to 50–160.)

- [ ] **Step 3: Run** `npx vitest run tests/unit/meta.test.ts tests/unit/content.test.ts`. Expected: FAIL.

- [ ] **Step 4: Implement `routeMeta`, the `Locale.titles` type, its validation in `validateLocale`** (every key present; a `wheelDescriptions` entry for every non-first wheel), the named import in `load.ts`, and the `build/site.ts` readers. The title is `titles.route` with `{name}` set to the label (feeling label, sensation label, area label, or `wheels[id].name` at rest). Use the existing `{word}`-style replacement from `i18n.ts`'s `t` (factor a pure `fill(template, vars)` out of it if `meta.ts` can't use the active-locale `t`).

- [ ] **Step 5: Run** `npx vitest run`. Expected: PASS. (No unit test imports `main.ts`, which compiles again in Task 5.)

- [ ] **Step 6: Commit** `git add -A && git commit -m "Titles and descriptions for every route"`

### Task 3: History rule (§4)

**Files:**
- Modify: `src/state/history.ts`
- Test: `tests/unit/history.test.ts`

**Interfaces:**
- Produces: `historyOp(prev: State, next: State, a: Action): 'replace' | 'none'`. `createHistoryWriter` is unchanged. Pushes only come from the router (wheel switches, About; Tasks 5–6).

- [ ] **Step 1: Rewrite the `historyOp` table test:** `restore` → `none`; a select-only change (URL unchanged) → `none`; opening, moving between opened words (`settled`, `step`, `toChild`, `toParent`, `stepOut`), closing, `clear` and `escape` → `replace`. Writer tests stay (URLs in them become paths: `'/angry'`).
- [ ] **Step 2: Run** `npx vitest run tests/unit/history.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `sameHash` becomes `sameUrl`, and `MOVES` goes away. Update the doc comment to cite spec §4.
- [ ] **Step 4: Run** it again. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -am "History: words replace the entry; only switching wheels and About push"`

### Task 4: Root-relative build, head markers, full sitemap, reserved check

**Files:**
- Modify: `vite.config.ts` (`base: '/'`, and update its comment), `build/site.ts` (`headTags`, `aboutLinks`, `sitemapXml`), `build/site-plugin.ts`, `index.html` (`data-route="wheel"` on `<html>`), `src/ui/toolbar.ts` (`about.href = '/about'`), `src/main.ts` (service worker registration)
- Test: `tests/unit/site.test.ts`

**Interfaces:**
- Consumes: `routeTable`, `allPaths`, `reservedClash` (Task 1).
- Produces:
  - `headTags` output is wrapped as `<!--head-->` … `<!--/head-->`, each exactly once. The manifest link is `/manifest.webmanifest`.
  - `aboutLinks(site)`: `home: '/'`, `about: '/about'`.
  - `sitemapXml(site: SiteConfig, paths: readonly string[]): string`, each `<loc>` being `site.url` + the path without its leading `/`.
  - The shell's `<html>` carries `data-route="wheel"` exactly once (Tasks 6–7 rely on that exact string).

- [ ] **Step 1: Failing tests** in `site.test.ts`:
  - the head is wrapped in the markers, each once;
  - the manifest link is `/manifest.webmanifest`;
  - `aboutLinks` gives `/` and `/about`;
  - `sitemapXml(site, allPaths(table))` has one `<loc>` per path, including `https://feelsonwheels.app/`, `…/about`, `…/body` and `…/happy/playful`, with no duplicates.
- [ ] **Step 2: Run** `npx vitest run tests/unit/site.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `sitePlugin` builds the table from `loadData().wheels` for the sitemap.
  - In `writeBundle`, it calls `reservedClash(table, readdirSync(outDir), <locale file names without .json>)` and `this.error`s on any clash.
  - `main.ts` registers `navigator.serviceWorker.register('/sw.js', { scope: '/' })`.
- [ ] **Step 4: Run** `npx vitest run tests/unit/site.test.ts`. Expected: PASS. (The full build waits for Task 5.)
- [ ] **Step 5: Commit** `git commit -am "Root-relative build, head markers, every path in the sitemap, reserved-name check"`

### Task 5: The app on real paths, titles and not found

**Files:**
- Modify: `src/main.ts`, `src/ui/hint.ts`, `src/styles/app.css`
- Test: `tests/unit/hint.test.ts`, and every e2e and perf spec that uses `#/` (`tests/e2e/{wheel,body,viewports,about}.spec.ts`, `tests/e2e/helpers.ts`, `tests/perf/*.spec.ts`), plus new tests in `tests/e2e/routes.spec.ts`

**Interfaces:**
- Consumes: Tasks 1–4. `routeMeta` (Task 2), `historyOp` (Task 3), `ui.notFoundTitle` and `ui.notFoundText` (Task 2).
- Produces:
  - `HintContent` gains `variant?: 'notFound'` and `lead?: string`. `<fw-hint>` reflects the variant as `data-variant="not-found"`. `lead` is plain text rendered before `text` in the same paragraph, never searched for `{link}`, so a typed word like `{link}` can't break the message.
  - In `main.ts`: `applyRoute(route: Route, how: 'push' | 'replace' | 'none'): void`, the one place that shows a route (mounting another wheel when needed, `restore`ing state on the same wheel, setting `document.title`). Task 6 extends it for About.
  - `helpers.open(page, path = '/')`.

- [ ] **Step 1: Failing unit tests** in `hint.test.ts`:
  - with `variant: 'notFound'`, the element has `data-variant="not-found"`, and without one it has none;
  - with `lead: 'There's no “{link}” on the wheel. '` and the usual `text` and `link`, the paragraph reads `There's no “{link}” on the wheel. Tap or spin to explore, or start from body sensations instead.`, with exactly one `a.fw-hint-link`.
- [ ] **Step 2: Migrate the e2e and perf specs to paths.**
  - Mechanical renames: `'#/core/x'` → `'/x'`, `'#/body…'` → `'/body…'`, and `location.hash` checks → `location.pathname` checks (`''` → `'/'`). `open(page, '#/…')` becomes `open(page, '/…')`, with `helpers.open` doing `page.goto(path)`.
  - **Tests that Back steps through words** change to the §4 rule. Opening, moving between, closing and Start over leave `history.length` unchanged and replace the path. The tests to change are the "tap again opens… Back returns" and "arrowing through opened words" tests and "Start over… Back returns to the word" in `wheel.spec.ts`, and "phone: Back from an opened word" (now: Escape closes, and `history.length` is unchanged).
  - **Where a Back only served to close a word** (the "phone: deep link then Back lands on the half-wheel… no intro" test), close with Escape instead, keeping the placement and no-intro checks.
  - Cross-wheel Back/Forward tests in `body.spec.ts` stay as they are; switches still push.
- [ ] **Step 3: New e2e tests** in `tests/e2e/routes.spec.ts`:
  - deep links `/happy/playful` and `/body/chest/tight-chest` open those cells, with `document.title` `Playful · Feels on Wheels` and `Tight chest · Feels on Wheels`;
  - the title follows the route: open a word, switch wheels, then Back;
  - `/happy?fbclid=x` opens Happy (Review Focus 3);
  - `/#/core/happy` shows the feelings wheel at rest with no page errors (Review Focus 3);
  - `/happy/plaful` shows `<fw-hint data-variant="not-found">` with heading `Feeling not found!` and text `There's no “plaful” on the wheel. Tap or spin to explore, or start from body sensations instead.`, the title `Not found · Feels on Wheels`, and the announcer's text containing `Feeling not found!`;
  - `/body/chest/tight-chst` shows not found on the body wheel, with "…or start from feelings instead.";
  - `/%7Blink%7D` shows `There's no “{link}” on the wheel.` literally, with one link;
  - on not found, tapping a word opens it, replaces the path with that word's, and the message never comes back after Start over;
  - axe on not found, in both themes.
- [ ] **Step 4: Run** `npm run test:e2e -- --project=chromium tests/e2e/routes.spec.ts`. Expected: FAIL.
- [ ] **Step 5: Implement in `main.ts`.**
  - `const table = routeTable(data.wheels)`. First load and `popstate` both go through `applyRoute(parsePath(table, location.pathname).route, 'none')`.
  - `urlFor(s)` is `formatRoute(table, { kind: 'wheel', wheel: layout.wheelId, path: pathOf(layout, s) })`; the query is dropped on the first write.
  - The `fw-wheel` handler uses `stateFor` and pushes, as today.
  - `hintContent`'s link `href` is `formatRoute` of the other wheel at rest.
  - Not found: keep `notFound: { word: string } | null`. Set it when the route is `notFound` (mounting that route's wheel at rest, with no intro), and announce `notFoundTitle` and its line. `hintContent` returns the not-found content (title `t('notFoundTitle')`, `lead` `t('notFoundText', { word }) + ' '`, the wheel's usual `text` and link, `variant: 'notFound'`) while it's set and nothing is selected. Clear it on the first `onState` change, replacing the URL with `urlFor`.
  - `document.title = routeMeta(...).title` on every URL write and in `applyRoute`.
  - `app.css`: a visual difference for `fw-hint[data-variant="not-found"]` that holds up in both themes and in forced colors (for example a 3 px inline-start border in `--focus`), with non-text contrast ≥ 3:1.
- [ ] **Step 6: Run** `npm run build && npx vitest run && npm run test:e2e -- --project=chromium && npm run test:e2e -- --project=iphone`. Expected: PASS. (`vite preview` serves the shell for paths without a file, so deep links work before the Worker.)
- [ ] **Step 7: Commit** `git add -A && git commit -m "The app on real paths: titles, not found, and the new history rule"`

### Task 6: About as a view, the router's links, and the service worker

**Files:**
- Create: `src/router.ts`
- Modify: `index.html` (About's `<main>` via `<!--site:about-->` after `#app`, plus `about.html`'s pre-paint theme script), `build/site.ts` (`renderAbout`: `<main class="about" id="about">` and `<h1 tabindex="-1">`), `build/site-plugin.ts` and `vite.config.ts` (one input), `build/sw-plugin.ts` (`PAGE_ADDRESSES`), `src/sw/strategy.ts` (`navigationUrls`), `src/styles/app.css`, `src/main.ts`
- Delete: `about.html`, `src/styles/about.css`
- Test: `tests/unit/router.test.ts` (new), `tests/unit/sw.test.ts`, `tests/unit/site.test.ts`, `tests/e2e/about.spec.ts`, `tests/e2e/offline.spec.ts`, `tests/e2e/routes.spec.ts`

**Interfaces:**
- Consumes: `applyRoute` (Task 5), `formatRoute` and `parsePath` (Task 1).
- Produces:
  ```ts
  // src/router.ts
  export interface ClickInfo { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; defaultPrevented: boolean }
  export interface LinkInfo { href: string; target: string; download: boolean }
  /** The URL to handle in the app, or null to leave the click to the browser. */
  export function inAppLink(click: ClickInfo, link: LinkInfo, pageOrigin: string): URL | null;
  ```
  - About's entry is pushed with `history.state` `{ fwInApp: true }`.
  - `navigationUrls(requestUrl, indexUrl)` returns `[indexUrl]`. The precache is `./` plus the assets, with no page addresses.

- [ ] **Step 1: Failing unit tests.**
  - `router.test.ts`: a plain left click on `/about` gives `URL('…/about')`. A modifier key, a middle click (`button: 1`), `target: '_blank'`, `download: true`, `defaultPrevented`, another origin or a `mailto:` link each give `null` (Review Focus 4).
  - `sw.test.ts`: every navigation, `/about` included, gets the shell. The manifest has no `./about`.
  - `site.test.ts`: `renderAbout` gives `id="about"`, and its `h1` has `tabindex="-1"`.
- [ ] **Step 2: Failing e2e tests.**
  - **`about.spec.ts`** is rewritten for the view:
    - The toolbar link opens About with no reload (checked as below), the URL `/about`, the title `About Feels on Wheels`, and focus on the `h1`.
    - From `/body/chest/tight-chest`, About → "Back to the wheel" lands on the body wheel with Tight chest opened, `history.length` unchanged since About opened, and focus back on the toolbar's About link.
    - A fresh `goto('/about')` → "Back to the wheel" goes to `/`.
    - The link's `href` is the wheel's path you left (`/body/chest/tight-chest`).
    - The theme and axe tests stay. The storage-throws test stays.
  - **`routes.spec.ts`:**
    - **No full reloads:** `page.evaluate(() => { (window as any).__noReload = 1; })`, then go wheel → word (tap) → body (switch) → About (toolbar link) → Back → Back → Forward, checking `__noReload === 1`, the view, and `document.title` after each step.
    - **First load at /about, then the wheel** (Review Focus 1): `goto('/about')`, click "Back to the wheel". The wheel's `__fw.viewport()` matches the stage size, `__fw.labelsByRing()[0] > 0`, and `__fw.moving()` is false within 1 s.
    - **Back and Forward across About during a spin** (Review Focus 5): fling the wheel, open About at once, then Back, Forward, Back. The view and title match the URL each time, and focus is never on `<body>`.
    - With JavaScript disabled (`test.use({ javaScriptEnabled: false })`), `/about` isn't covered here; the Worker sets the About view, and Task 7 covers it.
  - **`offline.spec.ts`:**
    - "About loads offline" opens `/about?ref=x` offline and gets the About view.
    - Add: `/happy/playful` offline opens Playful, and `/nope` offline shows not found.
    - The `/about.html` and `/about/` redirect test stays.
- [ ] **Step 3: Run** `npx vitest run tests/unit/router.test.ts tests/unit/sw.test.ts && npm run test:e2e -- --project=chromium tests/e2e/about.spec.ts tests/e2e/routes.spec.ts`. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - **Views:** `html[data-route="about"] #app` and `html:not([data-route="about"]) #about` get `display: none`. `html, body { overflow: hidden }` applies only when the route isn't about. About's former `about.css` rules are scoped under `#about` (its `body` rules go to `html[data-route="about"] body`).
  - **The global link listener:** a `click` listener on `document` finds `closest('a[href]')`, calls `inAppLink`, and on a URL calls `preventDefault`, then `applyRoute(parsePath(...).route, 'push')`. The hint's and card's own handlers already `preventDefault`.
  - **`applyRoute` for About:** set `data-route`, stop the camera and skip draws while hidden, scroll to the top, set the back link's `href` to `urlFor(store.get())`, and focus the `h1` when arriving by a link or Back/Forward, not on first load. Pushes carry `{ fwInApp: true }`.
  - **Leaving About:** set `data-route="wheel"`, `remeasure(false)`, redraw, and return focus to the element that opened About if it's still connected, else `tree.focusSelected()`.
  - **"Back to the wheel":** a click on `#about .about-back a` with `history.state?.fwInApp` calls `history.back()`; otherwise it's an ordinary in-app link.
  - **Hidden-stage guards:** `remeasure` returns early when the stage measures 0 in either dimension. First load at `/about` mounts the first wheel with `intro = false`.
- [ ] **Step 5: Run** `npm run build && npm run size && npx vitest run && npm run test:e2e`. Expected: PASS, and the size stays within budget.
- [ ] **Step 6: Commit** `git add -A && git commit -m "About as a view: one shell, in-app links, no full reloads"`

### Task 7: The Worker, and end-to-end tests against it

**Files:**
- Create: `src/worker/handler.ts`, `src/worker/worker.ts`, `src/worker/tsconfig.json` (like `src/sw/tsconfig.json`: `lib` `["es2022", "webworker"]`, `resolveJsonModule`)
- Modify: `build/site.ts` (`headTags` takes route meta), `build/site-plugin.ts` (its caller), `wrangler.jsonc`, `package.json` (`build` adds `tsc --noEmit -p src/worker`), `playwright.config.ts`
- Test: `tests/unit/worker.test.ts` (new), `tests/unit/site.test.ts`, `tests/e2e/worker.spec.ts` (new)

**Interfaces:**
- Consumes: `routeTable` and `parsePath` (Task 1), `routeMeta` (Task 2), head markers and `data-route="wheel"` (Task 4), `canonicalPage` (`src/sw/strategy.ts`).
- Produces:
  ```ts
  // build/site.ts
  export interface HeadMeta { title: string; description: string; path: string; jsonLd: boolean; noindex: boolean } // path: '' or 'happy/playful'
  export function headTags(meta: HeadMeta, site: SiteConfig, strings: PageStrings): string;
  // src/worker/handler.ts
  export interface AssetsBinding { fetch(input: Request | URL | string): Promise<Response> }
  export interface WorkerContext { table: RouteTable; locale: Locale; site: SiteConfig; strings: PageStrings }
  export async function handle(req: Request, assets: AssetsBinding, ctx: WorkerContext): Promise<Response>;
  export function replaceHead(html: string, tags: string): string; // throws without both markers
  // src/worker/worker.ts
  export default { fetch(req: Request, env: { ASSETS: AssetsBinding }): Promise<Response> };
  ```
  - `wrangler.jsonc`: `"main": "./src/worker/worker.ts"` and `"assets": { "directory": "./dist/", "binding": "ASSETS", "html_handling": "auto-trailing-slash", "not_found_handling": "none" }`. `run_worker_first` stays unset. Update the comments: the Worker runs only for paths with no file.

- [ ] **Step 1: Failing tests** in `tests/unit/worker.test.ts`. The fake `ASSETS` returns the real built-shell shape: a string with the markers and `data-route="wheel"`, with `content-type: text/html; charset=utf-8`, `cache-control: public, max-age=0, must-revalidate` and `etag: "x"`.

  | Request | Status | Checks |
  |---|---|---|
  | `GET /happy/playful` | 200 | `<title>Playful · Feels on Wheels</title>`; description is the definition; canonical and `og:url` are `https://feelsonwheels.app/happy/playful`; `noindex` present; no `application/ld+json` |
  | `GET /happy/playful?fbclid=1` | 200 | canonical without the query |
  | `GET /about` | 200 | `data-route="about"`; About's title |
  | `GET /body`, `/body/chest/tight-chest`, `/body/chest` | 200 | the §6 titles and descriptions |
  | `GET /happy/` | 301 | `Location` `https://…/happy` |
  | `GET /about.html?x=1` | 301 | `Location` ends `/about?x=1` |
  | `GET /Happy`, `/happy/nope`, `/en/happy`, `//happy`, `/happy%2Fplayful`, `/%E0%A4%A`, a 500-char path | 404 | `Not found · Feels on Wheels`; `noindex`; `data-route="wheel"` |
  | `HEAD /happy` | 200 | empty body; `content-type` `text/html` |
  | `POST /happy` | 405 | `Allow: GET, HEAD` |
  | any 200 or 404 | | `cache-control` copied; no `etag` or `content-length` from the shell |

  Plus: `replaceHead` throws when a marker is missing. In `site.test.ts`, `headTags` with `jsonLd: false, noindex: true` has `noindex` even when `indexable` is true, and has no JSON-LD.
- [ ] **Step 2: Run** `npx vitest run tests/unit/worker.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **`handle`:**
    - It takes a method check, then `canonicalPage(req.url, origin + '/')` for a 301.
    - Then `parsePath` and `routeMeta` give the head, through `headTags` with `path` = the formatted route without its leading `/`, `jsonLd` only for `/`, and `noindex` for not found.
    - Then it fetches the shell (`assets.fetch(new URL('/', req.url))`) and returns it with `replaceHead`, plus `data-route="about"` for About.
  - **`worker.ts`** builds the context once at module scope, from `loadData()`, `en.json`'s `page`, `routeTable(data.wheels)` and `site`.
  - **`playwright.config.ts` `webServer.command`:** `npm run build:test && npx -y wrangler@4.156.2 dev --assets dist-test --port 4173 --ip 127.0.0.1`. If `--assets` doesn't keep the `ASSETS` binding from `wrangler.jsonc`, add `wrangler.test.jsonc` (the same config with `"directory": "./dist-test/"`) and pass `-c wrangler.test.jsonc`.
- [ ] **Step 4: Failing e2e tests** in `tests/e2e/worker.spec.ts`, using the `request` fixture:
  - the statuses and titles of `/happy/playful`, `/body`, `/about`, `/nope` (404), `/happy/` (301, without following redirects) and `/about.html` (301);
  - and, with `javaScriptEnabled: false`, `/about` shows About's heading and the wheel's `#app` is hidden.
- [ ] **Step 5: Run** `npx vitest run && npm run build && npm run test:e2e`. Expected: PASS in all five projects, with the server now `wrangler dev`.
- [ ] **Step 6: Curl check under the production build.** Run `npm run build && npx -y wrangler@4.156.2 dev --port 8787` in the background, then `curl -sI` `/`, `/happy/playful`, `/nope`, `/happy/` and `/index.html`. Expected: 200, 200, 404, 301 and 307.
- [ ] **Step 7: Commit** `git add -A && git commit -m "A Worker for first visits: head tags per route, real 404s, clean redirects"`

### Task 8: Docs and the pull request

**Files:**
- Modify: `docs/ROADMAP.md`, `ACCESSIBILITY.md`, `AGENTS.md` ("Shipping changes"), `README.md` (only if it describes URLs or hosting), `src/data/locales/en.json` (`page.about` only if it says About is a separate page)

- [ ] **Step 1: Roadmap.**
  - In the versions table, the URL redesign row gets this plan's link and "Shipped" once merged. Until then: "Built; in review".
  - In known issues: "Going back on phones" gets a note that Back no longer steps through words (§4) and is open until Lucas confirms. "The About page sometimes takes several moments to open" is marked likely fixed, to confirm by hand on the preview link.
  - The `/about.html` 301 line in before launching: done by the Worker.
- [ ] **Step 2: `ACCESSIBILITY.md`.** Keep known limitations in step with the roadmap. Under Supported environments, nothing changes.
- [ ] **Step 3: `AGENTS.md`.** Shipping says Cloudflare serves the built files, plus a small Worker (`src/worker/`) for paths with no file, and that e2e tests run under `wrangler dev`.
- [ ] **Step 4: Run** `npx vitest run && npm run build && npm run size`. Expected: PASS.
- [ ] **Step 5: Commit, push, open the PR.** `git commit -am "Docs for the URL redesign" && git push -u origin urls-routing`, then `gh pr create`.
  - The PR's "What and why" says how it was checked: unit tests, e2e in five browsers under `wrangler dev`, the keyboard in a browser (About and back, not found, wheel switching, Back/Forward).
  - It also names the hand checks not done: a screen reader, and a real phone on the preview link (Back on iOS, slow About).
  - It ends with the attribution line the harness asks for in PR descriptions.

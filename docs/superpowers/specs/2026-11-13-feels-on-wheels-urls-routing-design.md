# Feels on Wheels: real paths, a small router, and a Worker for first visits

Approved by Lucas on 2026-11-13. A full design: it changes how every address works, before launch, while no links are out in the world.

## Intent

Lucas wants addresses he'd be happy to see and share before the app is launched and indexed, because once links are out every change needs redirects that last for good. Today everything lives in the hash (`#/core/happy/playful`), the feelings wheel's internal id `core` shows in every link, and the addresses are too permissive: once the service worker is installed, any path loads the wheel, and an unknown hash quietly gives the start view (roadmap, [real paths, a small router and cleaner URLs](../../ROADMAP.md#real-paths-a-small-router-and-cleaner-urls)).

What he asked for, in his words where he gave them:

- Clean, real paths, no hash and no `/core/`, and room for languages later.
- "Make sure full page reloads don't happen when navigating between routes." Today About is a separate page and the one real reload; it becomes a view inside the app.
- A word's link "opens the page, with that word opened like normal."
- A shared word's link preview and search result name that word.
- The tiny app stays tiny, "even for many languages": speed, offline, lightweight and performant stay as they are.
- No new dependencies of note; "not 100% opposed to backend, but I loved having a tiny app."

## Goals

- Every state that has a URL today gets a real path: the feelings wheel at `/`, its words at `/happy/playful/…`, the body wheel at `/body` and its cells at `/body/chest/tight-chest/…`, About at `/about`.
- Moving between any of them never reloads the page: links, the wheel switch, the jump between wheels, About and Back/Forward are all handled in the app.
- The first visit to any real path gets HTML whose title, description, canonical URL and preview tags name what's there.
- Any other path is a real 404 for crawlers and first visits, and a "not found" message in the app, online or offline.
- Back never walks through words.
- What a visitor downloads doesn't grow with the number of words or languages.

## Non-goals

- Adding Spanish or any second language, a language switcher, `hreflang` links, or translated slugs. This design only leaves room for them (§9).
- Indexing: `indexable` stays `false`. The `workers.dev` and preview-link `noindex` question stays in [before launching](../../ROADMAP.md#before-launching).
- Keeping old `#/core/…` links working (Lucas, 2026-11-13). They load the feelings wheel at rest.
- The [return to the word you jumped from](../../ROADMAP.md#return-to-the-word-you-jumped-from) control, the [share button](../../ROADMAP.md#share-button) and the [About page rework](../../ROADMAP.md#about-page-rework). About's content is unchanged; only how it's served changes.
- A "Did you mean Playful?" link on not found, for a real word in the wrong place (`/playful`) or one letter off (`plaful`). It's a [roadmap idea](../../ROADMAP.md#did-you-mean-on-not-found) (Lucas, 2026-11-13).
- Putting a word's definition into the first HTML as visible text. Google runs the app and reads the card; previews only read the head.

## Anti-goals

Failures even if it works:

- Any full page reload when moving between routes inside the app.
- A visitor downloading more than today: no per-word or per-language files in the precache, no route table bigger than the wheel data the app already has.
- Any made-up address that comes back as a real page with a 200 to a crawler or a first visit.
- A new runtime dependency, or a router library.
- The app needing the Worker to work once it's loaded or installed.

## Approaches

How the first visit to a word's path gets the right head tags:

1. **Prerendering.** The build writes one HTML file per route (about 285 per language), each with its own tags, all starting the same app. No running code and no daily limit; works on any host; the free plan's 20,000 files per deploy allow about 70 languages. Not chosen: Lucas didn't want hundreds of files whose only job is the first visit, when every later move happens in the app.
2. **A Cloudflare Worker at the edge. Chosen.** The build stays one page. For paths with no file, a small Worker sends that page with the right head tags (200), or a 404. It runs on every request that reaches it, a millisecond or so of CPU, on Workers' free plan (100,000 requests a day; static files stay free and unlimited and never invoke it). Its size limit is 64 MiB on every plan since September 2026, room for over a thousand languages of text. Returning visitors never reach it: the service worker answers them. Costs: a little server code to test, tied to Cloudflare, and past the daily limit first visits to word links fail with Cloudflare's error 1027 until midnight UTC (no bill; `/` and the app's files keep working).
3. **Titles set only in the app, one page for every path.** Generic previews, search sees only the home page, and every made-up path is a 200. Not chosen: it gives up the previews and the strictness Lucas asked for.

## Decisions Lucas made

- **Real paths, our own small router,** no hash (2026-11-12, confirmed 2026-11-13).
- **No full reloads between routes,** About included (2026-11-13).
- **A word's link opens the app with that word open,** and its preview names the word (2026-11-13).
- **The Worker** (approach 2), over prerendering (2026-11-13).
- **The URL shape, unknown addresses, titles in the app, and languages left for later,** as proposed in §1, §5, §6 and §9 (2026-11-13).
- **History:** opening and moving between words replaces the history entry; switching wheels, the jump between wheels, and About each add one (2026-11-13; §4).
- **Not found names the missing word** ("Feeling not found!", then "There's no "plaful" on the wheel." and the start message's line), with no "Did you mean" for now: that's a roadmap idea (2026-11-13; §7).
- **Sensation and area descriptions are templates** with the label first (2026-11-13; §6).
- **About's "Back to the wheel"** returns to the wheel as you left it, acting as the browser's Back, and goes to `/` only when About was the first page loaded (2026-11-13; §3).
- **Offline unknown addresses:** the service worker serves the app, which shows "not found" (2026-11-13; §7).

## Design

### 1. The URL shape

| What | Path |
|---|---|
| The feelings wheel at rest | `/` |
| An opened word on the feelings wheel | `/happy/playful/cheeky` (the same path as today's hash, without `#/core/`) |
| The body wheel at rest | `/body` |
| An opened cell on the body wheel | `/body/chest/tight-chest`, `/body/chest/tight-chest/anxious` |
| About | `/about` |
| A later language | `/es/…`, the same shapes under a prefix; English stays unprefixed (§9) |

- **The first wheel in the wheel list sits at the root,** any other under its id, as the hash does today. Internal ids don't change; `core` just never shows.
- **Paths are case-sensitive and exact.** No trailing slash (`/happy/` redirects to `/happy`, §5), no `.html`, lowercase ids as in the data. `/Happy` is a 404, not a redirect: there's one way to write each address.
- **A query is ignored** (shared links pick up `?fbclid=…`) and never part of the canonical URL. A hash is ignored.
- **Reserved names.** The build fails if a first wheel's top-level feeling id equals a reserved name: another wheel's id, `about`, a locale code in `src/data/locales/`, or any top-level name in the built output (`assets`, `icons`, `sw.js`, `robots.txt`, …). Today's core ids (fearful, angry, disgusted, sad, happy, surprised, bad) are all clear.
- **Words that sit in more than one place keep one path per place.** Overwhelmed is at both `/fearful/anxious/overwhelmed` and `/bad/stressed/overwhelmed`, and many feelings repeat under body sensations. Each path is its own canonical URL: they're different places with different breadcrumbs. (My call.)

One pure module (no DOM) owns the path format: parsing a pathname into a route and formatting a route back, and listing every real path from the wheel data. The app, the Worker and the build all use it, so they can never disagree about what's real. Today's `src/state/url.ts` becomes it.

**The sitemap lists every real path** (about 285 today, a word in two places counted once per place), built from that same list, so search can find each word once `indexable` is turned on. Until then it changes nothing. (My call.)

### 2. The router

Small and our own: a route table from §1, `pushState`/`replaceState`, and two listeners.

- **Routes:** a wheel (at rest or with a cell opened), About, and not found.
- **Links:** a click on a same-origin `<a href>` with no modifier keys, no `target` and no `download` is handled in the app: parse its path, push it, show the route. Everything else (external links, a middle click, ⌘-click, "open in new tab") goes to the browser. Every in-app link keeps a real `href`, so opening one in a new tab works.
- **Back and Forward** (`popstate`) parse the current path and show its route, as `popstate` does with the hash today.
- **Links become root-relative** (`/about`, `/body`, `/`), because relative links break under `/happy/playful`. That includes the start message's link to the other wheel, the toolbar's About link, About's own links (`{home}` and `{about}` in `build/site.ts`), and the noscript message.
- **Vite's `base` becomes `/`,** for the same reason: assets, the manifest and `sw.js` load from the root on every path. The service worker is registered at `/sw.js` with scope `/`.

### 3. About as a view

- About's `<main>` is rendered into the one shell (`index.html`) at build time from `page.about`, as it's rendered into `about.html` today, so its text stays out of the app's JavaScript and costs nothing on the wheel. `about.html` and its Vite input go away; `about.css` joins the app's styles, scoped to About.
- **Which view shows** is set on the document (for example `data-route` on `<html>`) and CSS shows the matching `<main>`. The shell defaults to the wheel; the Worker sets About for `/about` (§5), so About is readable with JavaScript off and to crawlers. The app sets it on every route change.
- **While About shows,** the wheel is hidden but keeps its state, so Back returns to exactly where you were with no redraw from scratch. The wheel must ignore the zero-size resize that hiding it causes, and stop drawing while hidden.
- **The page scrolls on About and not on the wheel** (today `html, body` are `overflow: hidden` for the wheel). Opening About starts at its top.
- **"Back to the wheel"** (`page.about.back`) returns to the wheel exactly as you left it (Lucas, 2026-11-13). When About was opened from inside the app, the link acts as the browser's Back (`history.back()`), so it adds no history entry and lands on the same wheel and word. When About was the first page loaded, there's nothing to go back to, so it goes to `/` like a plain link (a push). Its `href` is the wheel's path as you left it (`/` when About was the first page loaded), so opening it in a new tab still lands there. The router needs to know whether About was opened from inside the app, for example from a flag in the history entry's state.
- **Focus** (WCAG 2.4.3): opening About moves focus to its heading; leaving it returns focus to the control that opened it if it's still there (the toolbar's About link), else to the wheel's tree. The route's title changes too (§6).
- **Theme:** About follows the app's theme as the wheel does; `about.html`'s pre-paint theme script goes with it, or into the shell if the wheel needs one.
- This likely fixes the [slow About](../../ROADMAP.md#the-about-page-1) known issue, since opening it no longer loads a page. Check by hand before closing the issue.

### 4. History

Decided by Lucas (2026-11-13), replacing the rule in `src/state/history.ts`:

- **Replace** the entry for everything within one wheel: opening a word by tap, link or Enter, moving between words, closing a word, Start over.
- **Push** a new entry when switching wheels (the switch, the start message's link, the jump from the card), and when opening About.
- **Leaving About** by its "Back to the wheel" link is a Back, not a push (§3).
- So Back undoes a jump or a wheel switch (landing on the word you were on, since that entry was kept current), leaves About, and otherwise leaves the app. It never steps through words. This covers part of the [going back on phones](../../ROADMAP.md#navigation) known issue; whether it covers all of it is for Lucas to say after using it.
- The 250 ms coalescing of pushes and the swallowed History API errors stay.

### 5. The Worker

`wrangler.jsonc` gains a `main` (the Worker's entry, typechecked by `npm run build` like `src/sw`), and the assets get a binding so the Worker can fetch the shell. `run_worker_first` stays off: Cloudflare serves every real file (`/`, `/assets/…`, `/icons/…`, `sw.js`, …) without invoking the Worker, free. The Worker only sees paths with no file.

For each request it gets:

1. **Not GET or HEAD:** 405.
2. **A non-canonical form of a real path** gets a 301 to the canonical one: a trailing slash (`/happy/` → `/happy`), `/about.html` → `/about`. The query is kept on the redirect. (`/index.html` is already redirected by Cloudflare's `html_handling`.)
3. **A real path (§1):** fetch the shell from the assets binding, replace its head tags with that route's (§6) and, for `/about`, set the About view (§3). Status 200.
4. **Anything else:** the same shell with the not-found head and `noindex`, status 404. The app then shows not found (§7).

- Its responses keep the shell's caching headers, so a new deploy is seen as soon as the shell is.
- The head tags come from the same builder the build uses for `/` (`headTags` in `build/site.ts`, generalized from two pages to any route), with absolute URLs from `site.config.ts` only. JSON-LD stays on `/` only.
- The shell marks where its head tags start and end so the Worker can replace them as text. No `HTMLRewriter` is needed, so the core is a pure function from (request URL, shell HTML) to a response, unit-tested without Cloudflare. (My call; `HTMLRewriter` is fine if the builder finds the text approach brittle.)
- Its text comes from the locale files and wheel data at build time, bundled by Wrangler. For each language it needs only the routes' titles and descriptions and the page strings.
- No new runtime dependency. The `env` type is written by hand (one `ASSETS.fetch`); Cloudflare's type package is optional.

### 6. Titles and descriptions

The same function gives the Worker its head tags and the app its `document.title`, from the locale's strings:

| Route | Title | Description |
|---|---|---|
| `/` | `page.title` (today's "Feels on Wheels: name what you feel") | `page.description` |
| A feeling, on either wheel | "Playful · Feels on Wheels" | its definition |
| `/body` | "Body sensations wheel · Feels on Wheels" | a new body wheel description |
| A sensation | "Tight chest · Feels on Wheels" | a new template, `{sensation}: the feelings it can come with, on the body sensations wheel.` |
| An area | "Chest · Feels on Wheels" | a new template, `{area}: what you might notice there, and the feelings it can come with.` |
| `/about` | `page.about.title` | `page.about.description` |
| Not found | a new "Not found · Feels on Wheels" | the site description |

- **The sensation and area templates put the label first,** used exactly as written (Lucas agreed, 2026-11-13). Mid-sentence, a label would need an article, a lowercase letter or a different form, which varies by language; as a lead-in it never does. So it's two strings per language, not a hand-written description per sensation and area.
- The "·" title format and the new strings' wording are my call, in `en.json` for Lucas to edit.

The app sets the title on every route change so tabs, history entries and screen readers see it. The rest of the head (`og:*`, canonical) only matters on first load, so the app doesn't touch it.

### 7. Unknown addresses

- **First visit or crawler:** the Worker's 404 (§5).
- **In the app** (the router can't parse a path from a first load, a link, or Back): a wheel at rest, with the start message replaced by a not-found message that names what wasn't found (Lucas, 2026-11-13). On `/happy/plaful`:

  ```
  Feeling not found!
  There's no "plaful" on the wheel. Tap or spin to explore, or start from body sensations instead.
  ```

  - **The heading** is "Feeling not found!" on either wheel.
  - **The quoted word** is the last part of the path as typed, decoded (`tight-chst` for `/body/chest/tight-chst`), shortened if it's very long. It's what tells someone the link was wrong, since the wheel behind looks as usual.
  - **The rest of the line** is the start message's own text and link to the other wheel ("…or start from feelings instead" on the body wheel), so the only new strings are the heading and the "There's no "{word}" on the wheel." sentence.
  - **Which wheel:** the one whose name starts the path (`/body/…` shows the body wheel), else the feelings wheel.
  - **It looks different from the start message at a glance,** with a small visual difference such as an icon or accent (contrast-checked in both themes). (My call; the exact look is the builder's.)
  - **Screen readers hear it:** the heading and its line are announced when the page loads or the router lands on not found.
  - Everything else works as usual: tap or spin, and the message goes away like the start message, the card opens, and the address becomes that word's.
- **Service worker:** it serves the cached shell for every page load in its scope, real or not, and the app decides. So once installed, an unknown address shows "not found" offline as well as online, and the service worker needs no copy of the route table. People with it installed get a 200 for a bad address, which nobody sees; crawlers and previews never have a service worker. It keeps redirecting `/about.html`, `/index.html` and trailing slashes to the clean address, as it does today.

### 8. The service worker and offline

- **Precache** the shell (`/`) and the hashed assets, as today, minus the separate About page. `navigationUrls` becomes "the shell" for every page load.
- **Registered at `/sw.js`, scope `/`** (§2).
- **Moving from today's worker:** an installed old worker serves its old hash app for the first load after this deploys, which shows the start view on a new path; the browser then picks up the new `sw.js`, which deletes the old cache on activate. Acceptable: there are few installs, and none at real paths yet.

### 9. Room for languages (not built here)

What this design does so a second language is a contained piece of work later:

- §1's path module accepts an optional language prefix from the set of locale files, with English unprefixed (`/en/…` is a 404).
- The Worker looks up its strings by language, though only English exists.
- What the languages work will still need: loading the visitor's locale by its prefix instead of bundling `en.json` (`src/data/load.ts`), a shell per language or a language-aware shell (About's text and the noscript message are English), precaching only the visitor's language, `hreflang` links, the switcher, and whether slugs are translated.

### 10. Testing

- **Unit:** the path module (every real path round-trips; trailing slashes, case, encoding, queries, reserved names, the language prefix), the history rule, the Worker's handler with a fake assets binding (each status, redirect and head), the head-tag builder, the service worker strategy.
- **End to end:** the Playwright web server becomes `wrangler dev` serving the test build with the Worker, in place of `vite preview`, so deep links, 404 statuses, redirects and head tags are tested as Cloudflare serves them, in all five projects. Wrangler is pinned to one version, the one Workers Builds uses, as a dev dependency or `npx wrangler@<version>`.
- **New end-to-end checks:**
  - No full reloads: set a marker on `window`, then go wheel → word → other wheel → About → Back → Back → Forward through links and history, and check the marker survives and each step shows the right route and title.
  - Back never steps through words; Back after a jump lands on the word you jumped from.
  - About's "Back to the wheel", opened from a word on the body wheel, lands on that word with no new history entry; on a fresh load of `/about`, it goes to `/`.
  - Deep links to a word on each wheel, and to `/about`, open as on a fresh visit; a made-up path shows not found with a 404.
  - Offline (Chromium and Firefox, as today): a word's path, About, and a made-up path.
  - axe on About and on not found, in both themes, as today for About.
- Every existing test that uses `#/…` moves to paths.
- `npm run size` budgets stay as they are. About's markup moves from `about.html` into `index.html`, so first load is about the same.

### 11. Docs in the same change

- **Roadmap:** the idea moves to the versions table with this spec; the "decide the URL structure" step in before launching is done; the `/about.html` 301 question is answered (§5); the going-back and slow-About known issues updated as §3 and §4 say.
- **`ACCESSIBILITY.md`:** known limitations kept in step with the roadmap. The issue form's "the address in your browser … includes the word you had open" stays true.
- **`AGENTS.md`:** Shipping says Cloudflare serves the app with a small Worker for paths with no file.
- **README** if anything there describes the URLs or hosting.
- `site.config.ts` stays the only place the public URL lives.

## Left to the builder

- The route module's exact API, and how the app's `Layout.byPath` and the Worker's list of real paths share it.
- The shell's head markers and how the build fills them.
- How the hidden wheel pauses (§3), and scroll restoration between About and the wheel.
- Whether the Worker uses text replacement or `HTMLRewriter` (§5).
- How Wrangler is pinned (§10), and running `wrangler dev` in CI's macOS runners.
- The order of changes inside the pull request.

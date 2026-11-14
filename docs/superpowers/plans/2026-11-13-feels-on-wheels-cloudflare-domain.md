# Cloudflare and feelsonwheels.app Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the app at `https://feelsonwheels.app/` from Cloudflare Workers static assets, deployed by Workers Builds, still `noindex`, with About at `/about` and the offline cache working under Cloudflare's routing.

**Architecture:** A `wrangler.jsonc` serves the Vite build in `dist/` as static assets, with no Worker script and Cloudflare's default HTML handling. Cloudflare's GitHub integration builds on every push: `main` deploys, other branches upload preview versions. The service worker precaches clean addresses (`./`, `./about`) and refuses redirects. The GitHub Pages deploy workflow is deleted; `ci.yml` stays the merge gate.

**Tech Stack:** Vite, Vitest, Playwright, Wrangler 4 (via `npx`, not a dependency), Cloudflare Workers Builds.

**Spec:** `docs/superpowers/specs/2026-11-13-feels-on-wheels-cloudflare-domain-design.md`, including its "Change after approval" section.

## Global Constraints

- Free only: static assets, no Worker script, Workers Builds free plan.
- `site.url` is `https://feelsonwheels.app/`; `indexable` stays `false`.
- `site.config.ts` stays the only place the URL lives in code. Docs that show the live link are updated to it.
- No new dependencies. Local Cloudflare checks use `npx -y wrangler@4.156.2`, whose newest supported `compatibility_date` is `2026-11-09`; the config uses `2026-11-01`.
- US spelling. Approved specs and plans stay as written.
- `main` is protected: work on `cloudflare-domain`, open a PR.

## Review Focus

1. **No cached page is a redirect.** Under Cloudflare, `/about.html` and `/index.html` redirect; the precache must not list them, and the install must fail rather than store a redirect. Task 1's unit tests and Task 3's `wrangler dev` run.
2. **`/about` loads, online and offline, in every engine.** Task 1's end-to-end tests under `vite preview`, and Task 3's run under `wrangler dev`.
3. **`/about.html` still reaches About** (an old bookmark): Cloudflare redirects it to `/about`; under `vite preview` it is served directly. Task 3's curl check.
4. **`/` serves the wheel and `/sw.js` is JavaScript at the root, unredirected**, so the worker's scope stays `/`. Task 3's curl check.
5. **WebKit offline.** Playwright can't emulate offline with a service worker in WebKit, so the suite skips it there. Stopping the server works instead; Task 3 checks WebKit that way.

---

### Task 1: About at `/about`, and a cache that refuses redirects

**Files:**
- Modify: `build/site.ts:27,107`, `src/ui/toolbar.ts:114`, `src/sw/sw.ts`, `build/sw-plugin.ts` (`precacheManifest`)
- Test: `tests/unit/site.test.ts:44,91,107,113`, `tests/unit/sw.test.ts`, `tests/e2e/about.spec.ts:23,30,57`, `tests/e2e/offline.spec.ts:26`

`build/site-plugin.ts:16` matches Vite's input file `about.html` and stays as it is. `vite.config.ts`'s input stays `about.html`: the file is still built as `dist/about.html`; only its address changes.

**Interfaces:**
- Produces: `precacheManifest(files)` returns `files` with `./` first, `./about` for `about.html`, and no `./index.html`. The page's address for About is `about` (relative `./about`, absolute `${site.url}about`).

- [ ] **Step 1: Change the tests first.**
  - `site.test.ts`: the About canonical is `…/about`, the sitemap's second `<loc>` is `…/about`, the links fixture and `linkify` expectation use `./about`.
  - `sw.test.ts`, in the precache test: given built files `index.html`, `about.html`, `assets/a.js`, the result is `['./', './about', './assets/a.js']`. In the navigation tests, the shell key is `https://x/` and About's is `https://x/about`.
  - e2e: `about.spec.ts` and `offline.spec.ts` go to `/about` (`/about?ref=x` in the offline test).
- [ ] **Step 2: Run them.** `npx vitest run tests/unit/site.test.ts tests/unit/sw.test.ts`. Expected: FAIL on the About URL and the precache list.
- [ ] **Step 3: Implement.**
  - `build/site.ts`: About's page URL is `${site.url}about`; its link is `./about`.
  - `src/ui/toolbar.ts`: `about.href = './about'`.
  - `build/sw-plugin.ts` `precacheManifest`: drop `index.html` (covered by `./`) and list `about.html` as `./about`. Keep the version hash over every file as today.
  - `src/sw/sw.ts`: `INDEX` is the scope itself (`self.registration.scope`). Install fetches each precache URL and fails the install if any response is `redirected` or not `ok`, instead of `cache.addAll`.
- [ ] **Step 4: Run the checks.** `npm test && npm run build`, then `grep -o '\["\./"[^]]*\]' dist/sw.js`. Expected: pass; the list starts `"./","./about",` and has no `.html`.
- [ ] **Step 5: End-to-end.** `npx playwright test tests/e2e`. Expected: all pass in all five projects.
- [ ] **Step 6: Commit.**

### Task 2: Point the site at feelsonwheels.app

**Files:**
- Modify: `site.config.ts:15`, `tests/unit/content.test.ts:71-74`

- [ ] **Step 1: Change the test** `site config has a URL ending in /` to assert `expect(site.url).toBe('https://feelsonwheels.app/')`, keeping `indexable` `false`.
- [ ] **Step 2: Run it.** `npx vitest run tests/unit/content.test.ts`. Expected: FAIL on the URL.
- [ ] **Step 3: Set `url: 'https://feelsonwheels.app/'`** in `site.config.ts`. The `indexable` comment says false until launch, not until the domain.
- [ ] **Step 4: Run the checks.** `npm test && npm run build`, then `grep -o 'https://feelsonwheels.app/[^"<]*' dist/index.html dist/about.html dist/robots.txt dist/sitemap.xml`. Expected: pass; canonical, `og:url`, `og:image`, robots.txt's sitemap and both `<loc>`s use the domain, About's as `https://feelsonwheels.app/about`; `noindex` is still in both pages.
- [ ] **Step 5: Commit.**

### Task 3: Serve the build from Cloudflare

**Files:**
- Create: `wrangler.jsonc`, `.node-version`
- Modify: `.gitignore` (add `.wrangler/`)
- Delete: `.github/workflows/deploy.yml`
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Produces: a Worker named `feels-on-wheels`. Task 5's dashboard project name must match it.

- [ ] **Step 1: Write the failing test** in `tests/unit/content.test.ts`:

```ts
test('wrangler serves dist/ as static files with Cloudflare's default HTML handling', () => {
  const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  expect(config.name).toBe('feels-on-wheels');
  expect(config.main).toBeUndefined();
  expect(config.assets).toEqual({ directory: './dist/', html_handling: 'auto-trailing-slash', not_found_handling: 'none' });
});
```

- [ ] **Step 2: Run it.** Expected: FAIL, `wrangler.jsonc` not found.
- [ ] **Step 3: Write `wrangler.jsonc`** with `name`, `compatibility_date: "2026-11-01"`, `assets` as tested, `workers_dev: true`, `preview_urls: true`. Comments on their own lines: `/about` serves `about.html` and the `.html` addresses redirect (why the service worker precaches clean addresses); unknown paths are a plain 404 until the URL redesign.
- [ ] **Step 4: The rest.** `.node-version` containing `26`; `.wrangler/` in `.gitignore`; `git rm .github/workflows/deploy.yml`.
- [ ] **Step 5: Run the checks.** `npm test && npm run build && npm run size`. Expected: all pass.
- [ ] **Step 6: Curl check under `wrangler dev`.** `npx -y wrangler@4.156.2 dev --port 8787` in the background, then `curl -s -o /dev/null -w '%{http_code} %{content_type} %{redirect_url}\n'`:
  - `/` → `200 text/html`
  - `/about` → `200 text/html`
  - `/about.html` → `307` to `/about`
  - `/sw.js` → `200 text/javascript`, no redirect
  - `/manifest.webmanifest` → `200`
  - `/nope` → `404`
- [ ] **Step 7: End-to-end under `wrangler dev`.** `npm run build:test`; serve `dist-test` on port 4173 with wrangler (`--assets dist-test`, or a temporary config in the scratchpad pointed at it); `npx playwright test tests/e2e --project=chromium --project=firefox`. Playwright reuses the running server locally. Expected: all pass. Then, with the same server, the WebKit check: load `/`, wait for the worker to control the page, stop the server, load `/` and `/about`. Expected: the wheel (130 tree items) and About's heading. Stop the server.
- [ ] **Step 8: Commit.**

### Task 4: Docs

**Files:**
- Modify: `AGENTS.md` (Shipping changes), `README.md:5,15,37,54`, `SECURITY.md:11`, `.github/ISSUE_TEMPLATE/config.yml:4`, `.github/ISSUE_TEMPLATE/bug.yml:17`, `docs/ROADMAP.md`

- [ ] **Step 1: Live URL.** Replace `https://lpolito.github.io/feels-on-wheels/` with `https://feelsonwheels.app/` in the README, `SECURITY.md` and both issue templates.
- [ ] **Step 2: How it ships.** `AGENTS.md` and README: Cloudflare's GitHub integration deploys every push to `main` (skipping docs-only changes by its build watch paths) and posts a preview link on each PR; CI is the merge gate and checks the size budget. Name `wrangler.jsonc`, not `deploy.yml`.
- [ ] **Step 3: Roadmap.**
  - Versions table: a row "Cloudflare, feelsonwheels.app and About at `/about`", Shipped 2026-11-13, linking this spec and plan; the step-1 row's "Live at" now says it moved.
  - Ideas: "Cloudflare instead of GitHub Pages" is done; drop its row and section, keeping what still matters for the URL redesign (Cloudflare serves paths without a file, `_headers`/`_redirects`, many domains) under Real paths.
  - Real paths: About is at `/about` now; replace "Old `#/core/…` links must keep working either way" with Lucas's decision (2026-11-13) that they don't. Unknown paths still load the wheel once the worker is installed.
  - Known issues: the WebKit offline gap in the end-to-end suite (checked by hand in Task 3).
  - Before launching: remove the trademark check (Lucas decided against it, 2026-11-13); mark the host decided and the domain move done, leaving `indexable: true`, Search Console, the icon on lucaspolito.dev, and the rest. Add: decide whether the `workers.dev` address and preview links should say `noindex` once the domain is indexable, and whether `/about.html` should redirect with a 301 instead of Cloudflare's 307.
- [ ] **Step 4: Check.** `grep -rn "github.io\|deploy.yml\|GitHub Pages\|about.html" --exclude-dir={node_modules,dist,dist-test,.git} . | grep -v docs/superpowers`. Expected: only history in the roadmap, `vite.config.ts`'s input, `build/site-plugin.ts`, and the test fixture's old URL in `tests/unit/site.test.ts`.
- [ ] **Step 5: Commit.**

### Task 5: Ship it

- [ ] **Step 1: Push and open the PR.** Its "What and why" says how it was checked: unit tests, the five-browser end-to-end suite, the `wrangler dev` curl checks and end-to-end run, and WebKit offline with the server stopped; no screen reader or real phone yet.
- [ ] **Step 2: Lucas merges** once CI passes.
- [ ] **Step 3: Lucas connects Cloudflare** (after the merge, so the first build of `main` finds `wrangler.jsonc`): Workers & Pages → Create → Import a repository → install the Cloudflare GitHub app on only `lpolito/feels-on-wheels` → project name `feels-on-wheels`, build command `npm run build`, deploy command `npx wrangler deploy`, non-production branch command `npx wrangler versions upload`. Build watch paths: include `*`, exclude `docs/*` and `*.md`.
- [ ] **Step 4: Lucas attaches the domain:** the Worker's Domains & Routes → custom domains `feelsonwheels.app` and `www.feelsonwheels.app`; a redirect rule from `www` to the bare domain, keeping path and query.
- [ ] **Step 5: Lucas turns off GitHub Pages** in the repo's settings.
- [ ] **Step 6: Check the live site.** Task 3's curl checks against `https://feelsonwheels.app/`, plus `https://www.feelsonwheels.app/about` → redirect to the bare domain. Then, with Lucas's OK, `gh repo edit --homepage https://feelsonwheels.app/`.
- [ ] **Step 7: Lucas checks offline on his iPhone:** open the site in Safari and add it to the home screen; open the home-screen app, open About, close it; turn on airplane mode; open it again, open a word and About. Both load.

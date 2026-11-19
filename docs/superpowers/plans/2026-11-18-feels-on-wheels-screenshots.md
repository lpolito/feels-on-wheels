# Screenshots of every layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Playwright suite that captures every screen on 19 real device sizes and uploads it to Chromatic when a PR asks for it.

**Architecture:** A separate Playwright config and folder (`tests/screenshots/`) reuse the end-to-end server (test build under `wrangler dev`). Each device is its own `describe`, so each Chromatic test holds one capture. A small Node check reads the archives before upload and fails on the three mistakes the spike found. A label-gated workflow runs it on macOS and uploads with the project token from a secret.

**Tech Stack:** Playwright 1.65, `@chromatic-com/playwright` 1.0.0, `chromatic` 18.15.0 (both pinned exactly, as the repo's other dev dependencies), GitHub Actions on `macos-latest`, Node 26.

**Spec:** `docs/superpowers/specs/2026-11-18-feels-on-wheels-screenshots-design.md`

## Global Constraints

- Light theme only; Chromium only.
- Devices and sizes exactly as the spec's table (19 sizes); every capture at `deviceScaleFactor: 2`.
- Screens and paths exactly as the spec's table; About and not found only on iPhone 15, iPad Air 11" upright, and Laptop. 120 snapshots a run.
- No code in `src/` changes for this. No test-only code paths in the app.
- The project token is never written into the repo; it comes from `CHROMATIC_PROJECT_TOKEN`.
- The workflow is not part of `ci.yml` and not a required check; it runs only on PRs labeled `screenshots` or by hand.
- US spelling in code, comments and docs.

## Review Focus

- **The app still moving at capture** (a wheel springing to rest on a slow runner): expect a settled picture. Task 1's test waits for `idle` and `settled` and fonts before stripping scripts.
- **A size captured under the wrong test** (two devices sharing a test name, or a device added to a project instead of a `describe`): expect one archive per name. Task 1's check fails when a stories file lists more than one mode.
- **The app's script surviving into the archive** (a new inline script, a script added later in `<body>`): expect none. Task 1's check fails on any `script` node.
- **A blurry wheel** (someone drops `deviceScaleFactor`): expect a 2× canvas. Task 1's check compares each canvas to twice its file's viewport.
- **A PR from a fork, or the secret missing**: expect the job to fail with a clear message, not upload anything. Task 2's workflow checks the token before uploading.

---

### Task 1: The screenshot suite and its archive check

**Files:**
- Modify: `package.json` (dev dependencies, scripts), `package-lock.json`, `.gitignore`, `playwright.config.ts` (ignore `tests/screenshots`)
- Create: `playwright.screenshots.config.ts`, `tests/screenshots/devices.ts`, `tests/screenshots/screens.spec.ts`, `scripts/check-screenshots.mjs`

**Interfaces:**
- Produces: `npm run screenshots` (runs the suite, writes `test-results/chromatic-archives/`), `npm run screenshots:check` (exits 1 with one line per problem), and the archive layout `npx chromatic --playwright` uploads.
- `tests/screenshots/devices.ts` exports `interface Device { name: string; width: number; height: number; touch: boolean }`, `DEVICES: Device[]` (19 entries, names as in the spec: "iPhone SE (3rd gen) upright", "iPhone SE (3rd gen) sideways", …, "iPad Air 11\" half of Split View", "Laptop", "Desktop"), `interface Screen { name: string; path: string; only?: string[] }` and `SCREENS: Screen[]` (8 entries; `only` lists device names for About and not found).

- [ ] **Step 1: Install the packages**

Run: `npm i -D -E chromatic@18.15.0 @chromatic-com/playwright@1.0.0`
Expected: both in `devDependencies` without `^`.

- [ ] **Step 2: Write the archive check `scripts/check-screenshots.mjs`**

Reads `test-results/chromatic-archives/` and prints each problem, exiting 1 if any:
- no archive folder: "No screenshots: run npm run screenshots first";
- the number of `archive/*.snapshot.json` files isn't 120;
- a `*.stories.json` whose story has more than one key in `parameters.chromatic.modes` ("<file>: more than one size under one test name");
- any serialized node with `tagName === 'script'` ("<file>: has a script");
- a `canvas` node whose `width`/`height` attributes aren't twice the `wNhM` in its file name, skipped for About files, where the wheel isn't shown ("<file>: canvas 780×1688, expected 2× 390×844").

Add `"screenshots:check": "node scripts/check-screenshots.mjs"` to `package.json`.

- [ ] **Step 3: Run the check to see it fail**

Run: `npm run screenshots:check`
Expected: exit 1, "No screenshots: run npm run screenshots first".

- [ ] **Step 4: Write `playwright.screenshots.config.ts`, `devices.ts` and `screens.spec.ts`**

- Config: spread the main config, `testDir: 'tests/screenshots'`, `retries: 0`, one project `{ name: 'chromium' }` (Chromium, no device). Add `testIgnore: 'screenshots/**'` to `playwright.config.ts` so a bare `npx playwright test` never runs it.
- Spec: `import { test } from '@chromatic-com/playwright'` and `open`, `settled` from `../e2e/helpers`. For each device, `test.describe(device.name, …)` with `test.use({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: touch, hasTouch: touch })`; inside, one `test(screen.name, …)` per screen whose `only` is absent or includes the device. Each test: `open(page, path)` for wheel paths, `page.goto('/about')` for About; then `settled(page)`, `page.evaluate(() => document.fonts.ready)`, then remove every `script` element. Comment the three spike lessons where they're applied (one describe per device, scripts removed, 2×), pointing at the spec.
- Add `"screenshots": "playwright test -c playwright.screenshots.config.ts"`, and `build-archive.log` to `.gitignore` (Chromatic writes it in the project folder).

- [ ] **Step 5: Run the suite and the check**

Run: `npm run screenshots && npm run screenshots:check`
Expected: 120 passed; the check prints nothing and exits 0.

- [ ] **Step 6: Make sure the check catches the spike's mistakes**

Temporarily drop `deviceScaleFactor: 2`, rerun, and expect canvas lines from the check; then temporarily remove the script-stripping line and expect "has a script". Restore both and rerun to green.

- [ ] **Step 7: Make sure the end-to-end suite is untouched**

Run: `npx playwright test tests/e2e --project=chromium` and `npm test`
Expected: both pass, and no test from `tests/screenshots` is listed.

- [ ] **Step 8: Upload once by hand and look**

Run: `CHROMATIC_PROJECT_TOKEN=<from Lucas> npx chromatic --playwright --exit-zero-on-changes`
Expected: "Tested 120 tests; captured 120 snapshots". Open a phone, an iPad sideways and the split-view snapshot in Chromatic: each is its own size, settled, with tap wording on touch devices.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .gitignore playwright.config.ts playwright.screenshots.config.ts tests/screenshots scripts/check-screenshots.mjs
git commit -m "Screenshots of every screen on 19 devices, for Chromatic"
```

### Task 2: The workflow, docs and roadmap

**Files:**
- Create: `.github/workflows/screenshots.yml`
- Modify: `CONTRIBUTING.md` (Code section), `docs/ROADMAP.md` (the Shipped row's status), `AGENTS.md` (a short Screenshots section)

**Interfaces:**
- Consumes: `npm run screenshots`, `npm run screenshots:check` from Task 1.

- [ ] **Step 1: Write `.github/workflows/screenshots.yml`**

- Name `Screenshots`; triggers `pull_request` with `types: [labeled, synchronize, opened, reopened]` and `workflow_dispatch`.
- One job `screenshots` on `macos-latest`, `if: github.event_name == 'workflow_dispatch' || contains(github.event.pull_request.labels.*.name, 'screenshots')`; `permissions: contents: read`; concurrency group per ref, cancel in progress.
- Steps: `actions/checkout@v7` with `fetch-depth: 0` (Chromatic reads git history for baselines); `actions/setup-node@v7` (Node 26, npm cache); `npm ci`; `npx playwright install --with-deps chromium`; `npm run screenshots`; `npm run screenshots:check`; a step that fails with "Add the CHROMATIC_PROJECT_TOKEN secret" when `env.CHROMATIC_PROJECT_TOKEN` is empty; `npx chromatic --playwright --exit-zero-on-changes` with `CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}`.
- A header comment: what it's for, that it's label-gated for the free plan's 5,000 snapshots a month (120 a run), and that it's not a required check.

- [ ] **Step 2: Validate the workflow**

Run: `actionlint .github/workflows/screenshots.yml` if it's installed; otherwise the PR's first labeled run is the check.
Expected: no errors.

- [ ] **Step 3: Docs**

- `CONTRIBUTING.md`, Code: one bullet: to see the app on every device size, add the `screenshots` label to a PR (or run `npm run screenshots` and `npx chromatic --playwright` with a token); results are in Chromatic, linked from the PR's checks.
- `AGENTS.md`: a short "Screenshots" section: the suite, the label, the budget (about 40 runs a month), and that a session can run it locally with the token from `CHROMATIC_PROJECT_TOKEN` to look at layouts instead of taking screenshots by hand.
- `docs/ROADMAP.md`: the Shipped row's status becomes "Shipped <date>" when this merges.

- [ ] **Step 4: Ask Lucas for the two repo settings**

He adds the `CHROMATIC_PROJECT_TOKEN` secret and creates the `screenshots` label (`gh label create screenshots --description "Run the Chromatic screenshots"`), or says Claude may run that `gh` command. Claude doesn't set the secret.

- [ ] **Step 5: Commit, push, open the PR, and label it**

Commit the workflow and docs, push, and open the PR. Once the label exists, add it; expect the `Screenshots` job to pass and Chromatic to report its build on the PR. On the first merge after that, check that main's next labeled PR compares against this PR's accepted snapshots (spec: squash merges); if it doesn't, add a `push: branches: [main]` trigger with `--auto-accept-changes main`.

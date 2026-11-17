# Body wheel rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the body wheel's areas, sensations, and feelings with the approved §3 lists. Redo every feeling's "You might notice" to match, and publish the research behind it and how the words were decided.

**Architecture:** This is a content change. The wheel's shape lives in `src/data/wheels/body.json`, its words in `src/data/locales/en.json`, and "You might notice" in `src/data/feelings.json`; renderer, layout, and routing code don't change. These three files and the area color tokens change together in one task, because the loader rejects any id that's missing from one of them. Lucas sees the wheel built before anything else is done.

**Tech Stack:** TypeScript, Vite, JSON data, Vitest (happy-dom), Playwright under `wrangler dev`, `scripts/make-og-image.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-design.md`, with `docs/superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-changes.md`, which Task 1 creates.

## Global Constraints

- §3 of the spec is the source of truth for every area, sensation, id, and feeling, in its order. Nothing is trimmed or reworded without Lucas (§8). Any change he makes goes in the changes file.
- Every feeling on the body wheel is a word on the feelings wheel. Each sensation has 2 or 3 feelings.
- Ids follow labels, except `warm-chest`, which keeps its id under the label "Warm / full chest" (§2).
- Area hues keep their light and dark values; only the token names change (§6): `head` keeps head's, `throat` takes breath's, `shoulders` takes face's, `hands` takes arms', `chest`, `stomach`, and `whole-body` keep theirs, and `urges` takes posture's.
- **AI stays off the About page.** Lucas, 2026-11-16, overriding spec §9: the About paragraph doesn't say the wheel was made with AI; the README section does. The "nothing about AI" test in `tests/unit/site.test.ts` stays.
- Old addresses aren't forwarded. A link to a removed sensation shows not found.
- No text is hard-coded: strings go in `src/data/locales/en.json`.
- No conditionals in the app that change its behavior only for tests.
- US spelling, and serial commas in prose. Never name a source without linking its note. Never transcribe a source's word list.
- Work on the `body-wheel-rework-spec` branch and open a PR; never push to `main`. Commit messages carry no AI attribution trailer.
- Unit tests: `npx vitest run`. Type check and build: `npm run build`. End-to-end: `npx playwright test` (five browsers; use `--project=chromium` while iterating). Size budget: `npm run size`.

## Review Focus

- **An old link to a removed sensation** (`/body/posture/shrinking/insecure`, `/body/face`) shows not found on the body wheel, not an error or the wrong word (Task 1, "old body addresses are not found").
- **Sharing a new area** (`/body/urges`, `/body/hands/sweaty-palms`) shows that area's preview image, not the default (Task 3, og cases).
- **A screen reader on an urge** hears "Scared. In Urges, Want to run." (Task 1, "describe reads an urge's path").
- **The keyboard tree** has a treeitem for every cell, 8 + 51 + 144 = 203 (Task 1, "the body tree has 203 treeitems").
- **The longest breadcrumb at 320 px** stays on one line and stays a working, focusable link (Task 1, the updated "card at 320 px" e2e tests).

---

### Task 1: The new body wheel data

**Files:**
- Modify: `src/data/wheels/body.json` (every area and sensation; `start` stays `whole-body`)
- Modify: `src/data/locales/en.json`: `areas`, `sensations` (old ids removed), and `titles.areaDescription`
- Modify: `src/data/feelings.json` (a first draft of every feeling's `sensations`; Task 4 reviews it by hand)
- Modify: `src/styles/tokens.css` (area tokens renamed, in all three theme blocks)
- Create: `docs/superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-changes.md`
- Test: `tests/unit/data.test.ts`, `tests/unit/content.test.ts`, `tests/unit/card.test.ts`, `tests/unit/colors.test.ts`, `tests/unit/wheel-render.test.ts`, `tests/unit/meta.test.ts`, `tests/unit/worker.test.ts`, `tests/unit/a11y.test.ts`, `tests/unit/url.test.ts`, `tests/e2e/body.spec.ts`, `tests/e2e/wheel.spec.ts`

**Interfaces:**
- Consumes: the loader's existing shape (`WheelNode { area | sensation | feeling, hue?, children? }`; `locale.sensations: Record<id, string>`; `locale.areas: Record<id, string>`).
- Produces: the area ids `head`, `throat`, `shoulders`, `hands`, `chest`, `stomach`, `whole-body`, `urges`; the 51 sensation ids of §3; and the hue tokens `--hue-<area id>`. Later tasks use all of these.

- [ ] **Step 1: Write the failing tests.**
  - **`tests/unit/data.test.ts`:** replace `AREAS` with this list, and rename the order test to "body wheel has 8 areas and 51 sensations, in spec §3 order", with `toBe(51)`:

```ts
const AREAS: [string, string[]][] = [
  ['head', ['headache', 'foggy-head', 'lightheaded', 'hot-face', 'tight-jaw']],
  ['throat', ['lump-in-throat', 'heart-in-throat', 'tight-throat', 'dry-mouth', 'gagging']],
  ['shoulders', ['tense-shoulders', 'weight-on-shoulders']],
  ['hands', ['tight-fists', 'shaky-hands', 'sweaty-palms', 'cold-hands']],
  ['chest', ['racing-heart', 'tight-chest', 'short-breath', 'hollow-chest', 'heavy-heart', 'warm-chest']],
  ['stomach', ['knot-in-stomach', 'sinking-feeling', 'butterflies', 'queasy']],
  ['whole-body', ['restless', 'buzzing', 'chills', 'frozen', 'skin-crawling', 'heaviness', 'drained', 'numb-empty', 'light-body', 'relaxed', 'feeling-tall', 'weak-knees']],
  ['urges', ['want-to-run', 'want-to-hide', 'want-to-lash-out', 'want-to-back-away', 'want-to-fix-it', 'want-to-be-close', 'want-to-be-alone', 'want-to-give-up', 'want-to-numb-out', 'want-to-sleep', 'want-to-cry', 'want-to-get-even', 'want-to-control-it']],
];
```

  - **`tests/unit/data.test.ts`, also:**
    - add "body wheel has 144 feeling cells": the sum of every sensation's `children.length` is 144;
    - add "area labels": `locale.areas` deep-equals `{ head: 'Head / face', throat: 'Throat / mouth', shoulders: 'Shoulders', hands: 'Hands', chest: 'Chest', stomach: 'Stomach', 'whole-body': 'Whole body', urges: 'Urges' }`;
    - add "the body wheel still starts on Whole body": `body.start === 'whole-body'`.
  - **`tests/unit/content.test.ts`:**
    - the vocabulary test becomes "sensation vocabulary is 40–60 ids and every id is used at least once", bounds 40 and 60;
    - replace "smiling includes happy" with "want to cry leaves out sad": `feelingsUnder('want-to-cry')` equals `['frustrated', 'overwhelmed', 'thankful']`;
    - add "warm / full chest keeps its id": `feelingsUnder('warm-chest')` equals `['loving', 'thankful', 'proud']` and `locale.sensations['warm-chest']` is `'Warm / full chest'`.
  - **`tests/unit/card.test.ts`:**
    - the area card's chest rows become `['racing-heart', 'tight-chest', 'short-breath', 'hollow-chest', 'heavy-heart', 'warm-chest']`;
    - `head/wide-eyes/interested` becomes `whole-body/light-body/joyful`, with the expected text `locale.feelings['joyful']`, still "A happy feeling.";
    - `posture/shrinking/humiliated` becomes `head/hot-face/humiliated`, still "An angry feeling.".
  - **`tests/unit/colors.test.ts`:** `AREA_HUES = ['head', 'throat', 'shoulders', 'hands', 'chest', 'stomach', 'whole-body', 'urges']`.
  - **`tests/unit/wheel-render.test.ts`:** in `bodyPalette`, rename the keys by the §6 mapping and keep each value: `throat: '#387078'`, `shoulders: '#5c4221'`, `hands: '#546286'`, `urges: '#775064'`.
  - **`tests/unit/meta.test.ts` and `tests/unit/worker.test.ts`:** the area description reads `Chest: what you might notice, and the feelings it can come with.`
  - **`tests/unit/a11y.test.ts`, in `body wheel (v2)`:**
    - add "describe reads an urge's path": `describeSeg(bodyLayout, bodyLayout.byPath.get('urges/want-to-run/scared')!)` is `'Scared. In Urges, Want to run.'`;
    - add "the body tree has 203 treeitems": after `createA11yTree(root, bodyLayout, dispatch, startWord)`, `items()` has length 203.
  - **`tests/unit/url.test.ts`:** add "old body addresses are not found": for each of `/body/posture`, `/body/posture/shrinking/insecure`, `/body/face/smiling`, and `/body/head/wide-eyes`, `parsePath(table, p).route` has `kind: 'notFound'` and `wheel: 'body'`.
  - **`tests/e2e/body.spec.ts`:**
    - `AREAS = /^(head|throat|shoulders|hands|chest|stomach|whole-body|urges)$/`;
    - the chest rows become `['Racing heart', 'Tight chest', 'Short breath', 'Hollow chest', 'Heavy heart', 'Warm / full chest']`, each followed by `' ›'`;
    - `/body/head/wide-eyes/interested` becomes `/body/whole-body/light-body/joyful` (the core link still opens `/happy`);
    - `LONGEST` becomes `/body/shoulders/weight-on-shoulders/overwhelmed`, and the crumb text it expects becomes `'Weight on shoulders'`.
  - **`tests/e2e/wheel.spec.ts`:** replace `/body/head/wide-eyes` with `/body/shoulders/weight-on-shoulders`, which has the longest sensation label, and `/body/arms/sweaty-palms` with `/body/hands/sweaty-palms`.

- [ ] **Step 2: Run the unit tests and see them fail.**

Run: `npx vitest run`
Expected: FAIL in data, content, card, colors, meta, worker, a11y, and url tests (unknown ids, wrong labels, 40 ≠ 51).

- [ ] **Step 3: Write the data.**
  - **`body.json`:** §3 in order. Each area node is `{ "area": id, "hue": id, "children": [...] }`, each sensation `{ "sensation": id, "children": [{ "feeling": id }, …] }`, and a feeling's id is its label lowercased and hyphenated (`let-down`, `out-of-control`).
  - **`en.json` `areas` and `sensations`:** labels exactly as §3 writes them. Remove every old id.
  - **`titles.areaDescription`:** `"{area}: what you might notice, and the feelings it can come with."`
  - **`tokens.css`:** rename `--hue-face` to `--hue-shoulders`, `--hue-breath` to `--hue-throat`, `--hue-arms` to `--hue-hands`, and `--hue-posture` to `--hue-urges`, in all three blocks. Values unchanged.

- [ ] **Step 4: Draft `feelings.json` with a throwaway script in the scratch directory (not committed).** For each of the 126 feelings, in this order:
  1. List the sensations the new body wheel offers it, in §3 order, so it agrees with the body wheel (§5).
  2. Add the feeling's old sensations, mapped through §4 and skipping any already listed. Where §4 splits an old sensation, its parenthesized feelings decide which way it goes; where a feeling isn't named, use the first option. Drop old sensations §4 says have nothing left: Wide eyes for interested and amazed; Raised eyebrows for curious and skeptical.
  3. Keep the first 4. If fewer than 2 are left, stop and list those feelings for Task 4 to fill by hand. Don't invent any.

  The content tests need 2–4 per feeling and every one of the 51 sensations used, so fill any short lists before Step 5. A reviewer can see these quick fills, and Task 4 reviews every list.

- [ ] **Step 5: Start the changes file** with three entries:
  - the About page keeps AI out (Lucas, 2026-11-16), and the README section says it instead;
  - "You might notice" is capped at 4 by `content.test.ts`, so feelings with more than 4 body-wheel sensations (Anxious, Scared, Overwhelmed, Nervous, Excited, Repelled) list the 4 Task 4 judges most typical;
  - anything Step 4 couldn't fill.

- [ ] **Step 6: Run the unit tests and the build.**

Run: `npx vitest run && npm run build`
Expected: all pass. The build validates the data.

- [ ] **Step 7: Run the body and wheel end-to-end tests.**

Run: `npx playwright test tests/e2e/body.spec.ts tests/e2e/wheel.spec.ts --project=chromium`
Expected: PASS. The crumb test at 320 px expects the last crumb to shorten (`[true, false]`). If "Weight on shoulders" fits at 320 px, assert `[true, true]` and keep the focus and click checks on the last crumb. Note it in the changes file: the shortening case no longer occurs with real content.

- [ ] **Step 8: Commit.**

```bash
git add src/data src/styles/tokens.css tests docs/superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-changes.md
git commit -m "Body wheel rework: the new areas, sensations, and feelings, and a first draft of You might notice"
```

---

### Task 2: Lucas sees it built (gate)

Spec §8: nothing is trimmed until Lucas has seen the wheel. No code is written in this task until he answers.

**Files:**
- Modify (only as Lucas decides): `src/data/wheels/body.json`, `src/data/locales/en.json`, `src/styles/tokens.css`, `tests/e2e/viewports.spec.ts`, and the changes file.

**Interfaces:**
- Consumes: Task 1's data.
- Produces: Lucas's decisions, in the changes file.

- [ ] **Step 1: Run the viewport sweep.**

Run: `npx playwright test tests/e2e/viewports.spec.ts --project=chromium`
Record:
  - which `BODY_UNLABELLED` sizes now draw labels (the test fails there, saying to drop them);
  - any new size where the body wheel rests with no labels;
  - every changed label count.

- [ ] **Step 2: Look at the wheel and take screenshots.** Open the app (`preview_start`, or `npm run dev`) on `/body` and capture:
  - a 393 × 851 phone, in light and dark;
  - the same phone sideways, 852 × 393;
  - a desktop window;
  - the 320 px card on the longest crumb.

  Check by eye whether Whole body and Urges, which now sit side by side, look too alike in either theme (§6).

- [ ] **Step 3: Show Lucas,** with the screenshots, the sweep's findings, and whether the two wheels' resting views now split in more windows (the outer cells went from 105 to 144). Wait for his decisions. Don't propose trims he hasn't asked for.

- [ ] **Step 4: Apply only what he decides.** Each change goes in the changes file in his words. If an area or sensation changes, update Task 1's tests to match.
  - **Hue swaps:** values move between tokens, and the values themselves never change.
  - **The viewport sweep:** remove sizes from `BODY_UNLABELLED` that now draw labels. Add a size only with a comment saying Lucas accepted it.

- [ ] **Step 5: Run the unit tests and the sweep.**

Run: `npx vitest run && npx playwright test tests/e2e/viewports.spec.ts --project=chromium`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A src tests docs/superpowers/specs
git commit -m "Body wheel rework: Lucas's calls after seeing it built"
```

---

### Task 3: Link previews

**Files:**
- Modify: `public/og/` (regenerated: `body-face.png`, `body-breath.png`, `body-arms.png`, and `body-posture.png` go; `body-throat.png`, `body-shoulders.png`, `body-hands.png`, and `body-urges.png` arrive)
- Test: `tests/unit/og.test.ts`

**Interfaces:**
- Consumes: Task 1's area ids and tokens.
- Produces: nothing new.

- [ ] **Step 1: Write the failing test.** Add to the route-to-image cases: `['/body/urges', 'og/body-urges.png']`, `['/body/hands/sweaty-palms', 'og/body-hands.png']`, and `['/body/throat/lump-in-throat/grief', 'og/body-throat.png']`. Add a test, "every body area has its image on disk": for each area id in the body wheel, `public/og/body-<id>.png` exists, and no other `body-*.png` does.

- [ ] **Step 2: Run it and see it fail.**

Run: `npx vitest run tests/unit/og.test.ts`
Expected: FAIL. The new files don't exist yet, and the old ones are still there.

- [ ] **Step 3: Regenerate the images.**

Run: `node scripts/make-og-image.mjs`
Expected: the script prints 15 images (7 core feelings and 8 areas). It clears `public/og/` first, so the old area images go.

- [ ] **Step 4: Run the tests.**

Run: `npx vitest run tests/unit/og.test.ts`
Expected: PASS. `/body`'s own image is still `body-whole-body.png`.

- [ ] **Step 5: Commit.**

```bash
git add public/og tests/unit/og.test.ts
git commit -m "Link previews for the new body areas"
```

---

### Task 4: "You might notice," by hand, and the content review

**Files:**
- Modify: `src/data/feelings.json`
- Modify: `docs/content-review.md` (every feeling's italic sensations line, and the Body wheel section)
- Modify: the changes file, if needed

**Interfaces:**
- Consumes: Task 1's sensation ids and labels.
- Produces: the final "You might notice" for all 126 feelings.

- [ ] **Step 1: Review every feeling's list against §5.**
  - **Count:** 2–4 each, about 3. No duplicates.
  - **Agreement:** a sensation the body wheel offers for the feeling is listed, unless the cap of 4 forces a choice. Then keep the most typical, and say which in the changes file.
  - **New sensations:** they come in where they fit better than a mapped one. These are Lightheaded, Tight throat, Dry mouth, Weight on shoulders, Chills, Heavy heart, Sinking feeling, Skin crawling, Weak knees, and the urges.
  - **The feeling decides** where an old sensation split in §4.
  - **Consistency:** a feeling's list must not contradict its own definition.

- [ ] **Step 2: Rewrite `docs/content-review.md`.**
  - **Each feeling's italic line:** its labels in order, from the data, joined with ` · `. Use a scratch script to print them; don't retype them.
  - **The Body wheel section:** rewrite from §3, one `###` per area and one `- **Sensation**: Feelings` line per sensation. Replace the intro's sentence that the links "don't have to match" with: these are drafted to agree with "You might notice", though nothing enforces it.

- [ ] **Step 3: Run the tests.**

Run: `npx vitest run tests/unit/content.test.ts tests/unit/data.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit.**

```bash
git add src/data/feelings.json docs/content-review.md docs/superpowers/specs
git commit -m "You might notice, redone by hand to agree with the body wheel"
```

---

### Task 5: The wheels' rules live with the data

**Files:**
- Create: `src/data/wheels/README.md`
- Create: `src/data/wheels/AGENTS.md`
- Modify: `AGENTS.md` (a new "Wheel content" section)
- Modify: `docs/ROADMAP.md` (the Content rules section becomes a link)
- Modify: `CONTRIBUTING.md:22`, `docs/reference/README.md:30`, and `docs/reference/braman-emotion-sensation-wheel.md:30` (links to `ROADMAP.md#content-rules` point to the new README)

**Interfaces:**
- Consumes: spec §1, §2, and §10.
- Produces: `src/data/wheels/README.md#…` anchors that later docs may link to.

- [ ] **Step 1: Write `src/data/wheels/README.md`** in these sections, as rules rather than decisions, without the spec's history:
  1. **Both wheels:** the four content rules now in the roadmap's Content rules.
  2. **The body wheel:** spec §1 and §2 as rules:
     - areas and their order;
     - Whole body and body scan coverage;
     - the eyes-closed test, linking `docs/reference/craig-interoception.md`;
     - what Urges hold, "Want to …", and each core feeling's typical urges, with the two left out on purpose;
     - the label and idiom rules;
     - the feelings rules: every common path, obvious paths, the room rule;
     - "Backed by";
     - distinct sensations within an area;
     - ids;
     - "You might notice" drafted to agree, without enforcement.
  3. **The feelings wheel:** a placeholder saying its rules come with the opinionated feelings wheel idea, linking `docs/ROADMAP.md#an-opinionated-feelings-wheel`.
  4. **Which files it covers:** `src/data/wheels/*.json`, `src/data/feelings.json`, and `feelings`, `areas`, and `sensations` in `src/data/locales/en.json`.
  5. **How to check a change:**
     - every body wheel feeling is on the feelings wheel;
     - 2 or 3 feelings per sensation;
     - each core feeling is reachable from several areas;
     - every word says what backs it, with the spec's §3 as the current record.
  6. **For reference, not a rule:** how to list the feelings wheel's words that have no path on the body wheel.

  Every source it names links its note in `docs/reference/`.

- [ ] **Step 2: Write `src/data/wheels/AGENTS.md`** in three lines: read `README.md` before changing any file it covers, follow it, and update it in the same change when a rule changes.

- [ ] **Step 3: Add the root `AGENTS.md` section "Wheel content".** It says the wheels' content rules live in `src/data/wheels/README.md`, cover files outside that folder too (it names them), and win over a spec when the two disagree.

- [ ] **Step 4: Repoint the roadmap and the links.** Replace the roadmap's Content rules list with one sentence linking `../src/data/wheels/README.md`, and keep the `#content-rules` heading so old links still land. Repoint the three files listed above.

- [ ] **Step 5: Check the links.**

Run: `grep -rn "ROADMAP.md#content-rules" --include=*.md . | grep -v node_modules | grep -v docs/superpowers/`
Expected: no output.

Then check that every relative link in the new README resolves: run a scratch script over `src/data/wheels/README.md` and `AGENTS.md`. Expected: no missing targets.

- [ ] **Step 6: Commit.**

```bash
git add src/data/wheels/README.md src/data/wheels/AGENTS.md AGENTS.md docs/ROADMAP.md CONTRIBUTING.md docs/reference
git commit -m "The wheels' content rules live next to the wheel files"
```

---

### Task 6: The research, in public

**Files:**
- Modify: `README.md` (a new section, "Research behind the body wheel", after "What went into it"; the Credits section)
- Modify: `src/data/locales/en.json` (`page.about.sections[credits]`: a paragraph and the new items)
- Modify: `build/site.ts` (`aboutLinks`: `issues` and `research`)
- Modify: `docs/reference/README.md` (move the rework's sources from "Not credited until the app uses them" to the credited list)
- Test: `tests/unit/site.test.ts`

**Interfaces:**
- Consumes: spec §3's Backed by column, the Research section, and §9; and every reference note.
- Produces: the README anchor `#research-behind-the-body-wheel`, which `aboutLinks.research` points to.

- [ ] **Step 1: Write the failing tests** in `tests/unit/site.test.ts`:
  - "aboutLinks has issues and research": `aboutLinks(site).issues` is `${site.repo}/issues`, and `aboutLinks(site).research` is `${site.repo}#research-behind-the-body-wheel`.
  - "credits invite corrections and link the research": `section('credits')` contains `href="https://github.com/lpolito/feels-on-wheels/issues"` and `href="https://github.com/lpolito/feels-on-wheels#research-behind-the-body-wheel"`. It contains "not a clinical" and doesn't match `/\bAI\b|Claude/`.
  - "credits list the body wheel's research": `section('credits')` has at least 19 `<li>` items (4 today plus 15), and every one passes the existing title-link check.

- [ ] **Step 2: Run them and see them fail.**

Run: `npx vitest run tests/unit/site.test.ts`
Expected: FAIL. The keys are unknown and the item count is 4.

- [ ] **Step 3: Add the two keys to `aboutLinks`.**

- [ ] **Step 4: Write the About text** in `page.about.sections[credits]`.
  - **The paragraph:** add this after the existing intro paragraph. It's Lucas's to change at review:

    > The body sensations wheel also draws on research into where people feel emotions in their body, and what feelings pull them to do. Every sensation and urge on it says what it rests on, and a few rest on common speech or one person's experience rather than research. It was put together by someone without formal training in psychology, and it isn't a clinical or diagnostic tool. If a word seems wrong or missing, [open an issue]({issues}). [How the body wheel was made]({research}).

  - **The items:** one per source in the spec's §9 Credits list, in that order, each in the existing format: `Author, “[Title](https://…)”, Venue, Year: what it's for.` Use the link in the source's note. Where a note has no link to the work itself (a book), link the publisher's page for it after checking it loads, and add that link to the note. Never link to a copy of a copyrighted handout.

- [ ] **Step 5: Write the README section, "Research behind the body wheel".** It's written for anyone, following spec §9, and claims nothing beyond §3's Backed by column:
  - **Why the areas are what they are:** places plus Urges, and what counts as a sensation, with the eyes-closed test and interoception.
  - **What each source found:** a sentence or two each, linking its note.
  - **What isn't research:** which words rest on common speech or Lucas's experience.
  - **"How it was decided":** the seven points in §9, which say plainly that Claude did the research and drafting and that Lucas reviewed every word without formal training. That fits the README's existing "Made with AI, with love".
  - **Corrections:** an invitation to open an issue, especially for therapists and researchers.

  In the README's Credits, add that the app also draws on research for the body wheel, linking the section.

- [ ] **Step 6: Update `docs/reference/README.md`'s Credits.** The 15 rework sources move from "Not credited until the app uses them" to the credited list. Drummond stays where it is.

- [ ] **Step 7: Run the tests and the build.**

Run: `npx vitest run tests/unit/site.test.ts && npm run build && npm run size`
Expected: PASS, and the size stays within the 60 KB budget. The About page is built at build time and isn't part of the first-visit download, but check anyway.

- [ ] **Step 8: Run the About end-to-end test.**

Run: `npx playwright test tests/e2e/about.spec.ts --project=chromium`
Expected: PASS, including its axe check.

- [ ] **Step 9: Commit.**

```bash
git add README.md src/data/locales/en.json build/site.ts docs/reference tests/unit/site.test.ts
git commit -m "The body wheel's research, and how it was decided, in plain words"
```

---

### Task 7: Known issues, the roadmap, and accessibility notes

**Files:**
- Modify: `ACCESSIBILITY.md` (known limitations)
- Modify: `docs/ROADMAP.md` (the Shipped table, the idea entry, and known issues)
- Modify: the changes file

**Interfaces:**
- Consumes: Task 2's sweep findings.
- Produces: nothing new.

- [ ] **Step 1: Update the known issues.** Use Task 2's sweep and what you saw at 320 px and on the phone, in both `ACCESSIBILITY.md` and the roadmap's Layout and labels:
  - **"An opened word's long label spills past its cell"** (`ACCESSIBILITY.md:70` names "Hollow feeling in your chest"): open `/body/shoulders/weight-on-shoulders` and `/body/urges/want-to-control-it` at 393 × 851. If neither spills, remove the issue from both files. If one does, use it as the example.
  - **"Small windows … without labels":** remove it if Task 2 emptied `BODY_UNLABELLED`; otherwise update the sizes.
  - **"The two wheels can rest in different views":** update its numbers, which go from 105 to 144 outer cells and from about 450 px to the radius the sweep shows.

- [ ] **Step 2: Update the roadmap for the shipped change.**
  - **Shipped table:** add a row linking the spec, this plan, and *changes*.
  - **The idea:** delete the "Rework the body wheel's areas and sensations" subsection and its row in the Ideas table.
  - **Links to the deleted heading:** repoint every `#rework-the-body-wheels-areas-and-sensations` link to the Shipped row or the spec, including the ones in "An opinionated feelings wheel" and the reference notes.
  - **Open work:** move anything still open into the idea it belongs to, such as the definitions and sensations review in Before launching.

- [ ] **Step 3: Check the links.**

Run: `grep -rn "rework-the-body-wheels-areas-and-sensations" --include=*.md . | grep -v node_modules | grep -v docs/superpowers/`
Expected: no output.

- [ ] **Step 4: Run everything.**

Run: `npx vitest run && npm run build && npm run size && npx playwright test`
Expected: all pass, in all five browsers.

- [ ] **Step 5: Commit, push, and open the PR.**

```bash
git add ACCESSIBILITY.md docs
git commit -m "Known issues and the roadmap after the body wheel rework"
git push origin body-wheel-rework-spec
```

Open the PR with `gh pr create`. In its "What and why", say how it was checked:
- **Tests:** unit and end-to-end in five browsers, and axe.
- **By hand:** the keyboard on the body wheel in a browser, and which hand checks weren't done (a screen reader, a real phone).
- **Not yet:** whether Lucas has looked at the README and About text.

Bind the PR with the ccd_pr tools.

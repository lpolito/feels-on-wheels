# An opinionated feelings wheel: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the opinionated feelings wheel already on the branch: its rules into `src/data/README.md`, its checks into data tests and local scripts, its sources credited, its icons redrawn by a script, and the docs updated, so a follow-up PR can delete `docs/opinionated-wheel/`.

**Architecture:** The wheel's data (`src/data/`) is already final and the unit tests already follow it. This plan adds data tests for the content rules, moves the dataset-based checks to `scripts/wheel-words/`, adds two generator scripts (content review and icons), and rewrites the docs. Two pull requests: this one (everything), and a docs-only one after it merges that deletes the working folder.

**Tech Stack:** TypeScript, Vitest, Playwright (e2e under `wrangler dev`), Node ESM scripts loading app modules through Vite (`scripts/make-og-image.mjs` is the pattern), Python 3 for the local dataset checks.

**Spec:** `docs/superpowers/specs/2026-11-26-feels-on-wheels-opinionated-wheel-design.md` (approved 2026-11-26). Read it before any task; section numbers below are its.

## Global Constraints

- US spelling everywhere (color, center, gray, behavior); serial (Oxford) commas in prose.
- Never transcribe a source's word list or layout into the repo, not even in notes; quote a few words at most.
- Never name a source without linking its note (root `AGENTS.md`, "Sources and credits").
- Datasets (NRC VAD, Warriner, Glasgow, SWOW, Baron-Cohen full text) never enter the repo. `SWOW-EN18.zip` in the repo root stays uncommitted.
- `site.config.ts` is the only place the public URL lives.
- Commit messages: no `Co-Authored-By` or other AI trailer (Lucas's global rule). Branch `opinionated-wheel-rules`; never push to `main`.
- Don't add the `screenshots` label or run Chromatic.
- Don't change any word, definition, "You might notice", or wheel order: the content is settled. A failing check means a bug in the check, or a question for Lucas.
- Quoted words from Lucas stay as he said them.

## Review Focus

1. **Base forms in the Once and Definitions tests:** "Loved" and "Love" must count as one word, while "Energetic" and "energy", or "Hurt" inside "hurtful", must not clash. Pinned in Task 2's tests.
2. **The icon's wedges must match the wheel:** six wedges sized by each core's outer-word count, in `core.json` order, starting at 12 o'clock and running clockwise, as the hand-drawn icon did. A sizing or order slip looks plausible and is wrong. Pinned in Task 5's test.
3. **The local scripts without datasets:** running `check.py` with `WHEEL_DATA` unset or pointing at an empty folder must print which file is missing and where to get it, not a stack trace. Pinned in Task 3.
4. **`docs/content-review.md` must come out byte-identical** from the new script on today's data, so the script reproduces the reviewed layout rather than inventing one. Pinned in Task 4.
5. **Phone e2e taps must hit cells on screen:** on the portrait half-wheel only the right half shows, with Happy at 3 o'clock, so Sad (opposite Happy) is off-screen at rest. Pinned in Task 1 by running the `pixel` and `iphone` projects.

---

### Task 1: The phone e2e tests

30 tests fail on `pixel` and `iphone` only (930 pass across the five projects). Most tap `sad`, which is off-screen at rest on the portrait half-wheel (Review Focus 5). Two fail on `window.__fw.moving` being undefined, likely a navigation left mid-flight by an earlier failed step; recheck them after the tap fix.

**Files:**
- Modify: `tests/e2e/order.spec.ts`, `tests/e2e/routes.spec.ts`, `tests/e2e/wheel.spec.ts` (the failing tests listed by `npx playwright test tests/e2e --project=pixel --project=iphone`)

- [ ] **Step 1: List the failures.** Run `npx playwright test tests/e2e --project=pixel --project=iphone --reporter=line`. Expected: 30 failed.
- [ ] **Step 2: Fix each failing test.** Where a test taps a core that is off-screen on the half-wheel, tap one that's on screen: `angry` or `scared`, the cores beside Happy. Keep each test's meaning: if a test needs two different cores, use both. Update the expected titles, URLs, and paths to match. Don't change the app.
- [ ] **Step 3: Run the phones.** Same command. Expected: 0 failed.
- [ ] **Step 4: Run all five projects.** `npx playwright test tests/e2e --reporter=line`. Expected: 0 failed (offline tests are skipped in WebKit, as before).
- [ ] **Step 5: Commit.** `git commit -am "Opinionated wheel: phone e2e tests tap cores that are on screen"`

### Task 2: Data tests for the content rules (spec §3)

**Files:**
- Create: `tests/unit/wheel-rules.ts` (pure check functions, used only by the tests)
- Modify: `src/data/types.ts` (`Feeling`), `src/data/feelings.json`, `tests/unit/data.test.ts`

**Interfaces:**
- Produces, in `tests/unit/wheel-rules.ts`, each returning one message per fault, naming the word and the rule (an empty array means it passes):
  - `baseForm(word: string, others: ReadonlySet<string>): string`: lowercase; strips a final `ed` or `d` only when the rest is in `others` (Loved → love when "love" is a label). Matches `base_key` in `check.py`.
  - `onceFaults(wheel: Wheel, labels: Record<string, string>): string[]`
  - `layoutFaults(wheel: Wheel): string[]`
  - `happenedFaults(wheel: Wheel, feelings: FeelingsDict): string[]`
  - `definitionFaults(wheel: Wheel, locale: Locale): string[]`
- Produces in `types.ts`: `Feeling.whatHappened?: true`.

- [ ] **Step 1: Write the failing tests** in `data.test.ts`, in a new `describe('feelings wheel rules (opinionated wheel spec §3)')`:
  - `test('once: no label twice, comparing base forms, except a word under two cores')`: `expect(onceFaults(wheel, labels)).toEqual([])`, where `labels` maps each id to `locale.feelings[id].label`. Then on a clone with `loved` added under Love → Affection (label "Loved"), expect one fault mentioning `Loved`. On a clone with `betrayed` added a third time under Sad → Lonely (the same core as Sad → Hurt), expect one fault.
  - `test('layout: every middle word has 2 or 3 outer words')`: `[]` on the real wheel; one fault naming `annoyed` on a clone where Annoyed has 4 children, and one naming `jealous` on a clone where Jealous has 1.
  - `test('what happened: every tagged feeling is on the outer ring')`: `[]` on the real data; one fault naming `hurt` on a clone of `feelings` where `hurt` (a middle word) is tagged. Also `expect(Object.keys(feelings).filter((id) => feelings[id]!.whatHappened).sort()).toEqual([...])` with the 24 ids from spec §1 (abandoned, accepted, betrayed, cared-for, cheated, flattered, forgiven, honored, humiliated, insulted, left-out, misunderstood, pressured, provoked, reassured, rejected, safe, trapped, understood, unappreciated, used, valued, vindicated, violated).
  - `test('definitions: no card uses its own label or a sibling’s, comparing base forms')`: `[]` on the real locale; one fault for a clone where `annoyed`'s definition is "Feeling annoyed."; one for a clone where `provoked`'s definition contains "irritable" (a sibling's label); none for a clone where `rejected`'s definition is "A sense of betrayal." ("betrayal" contains its sibling Betrayed's stem but is a longer word) or contains "hurt" (its parent's label, which is allowed).
  - `test('base forms: Love and Loved are one word, Energetic and energy are not')`: `baseForm('Loved', new Set(['love']))` is `'love'`; `baseForm('Loved', new Set())` is `'loved'`.
- [ ] **Step 2: Run them.** `npx vitest run tests/unit/data.test.ts`. Expected: FAIL (module and field don't exist).
- [ ] **Step 3: Add `whatHappened?: true` to `Feeling`,** and `"whatHappened": true` to the 24 feelings in `feelings.json`. The loader already ignores unknown fields; check `validateWheel` and `validateLocale` don't need a change.
- [ ] **Step 4: Implement the five functions** in `tests/unit/wheel-rules.ts`:
  - `onceFaults`: collect every position's label in base form (the `others` set is all labels, lowercased). A base form at two or more positions is a fault unless every position is under a different core and either all share one id, or they're different ids. That allows Betrayed, Empty, and Disgusted, and nothing else.
  - `definitionFaults`: port `docs/opinionated-wheel/scripts/definitions.py`: words are `[a-z]+` runs, stemmed by stripping one of `ing`, `ed`, `d`, `s` when 3 or more letters remain; a definition fails if a label's stemmed word sequence appears in its stemmed words. Siblings are the children of the same parent, and the six cores are siblings of each other. Apply `baseForm` before stemming so Love and Loved match (spec §3's fix).
- [ ] **Step 5: Run them.** Same command. Expected: PASS. If a real word fails, stop: it's either a bug in the check or a question for Lucas, never a reason to change a word.
- [ ] **Step 6: Run everything.** `npx vitest run && npx tsc --noEmit`. Expected: all pass.
- [ ] **Step 7: Commit.** `git add -A src/data tests/unit && git commit -m "Opinionated wheel: data tests for the feelings wheel's rules, and the what-happened tags"`

### Task 3: The local dataset checks move to `scripts/wheel-words/` (spec §3)

**Files:**
- Move (`git mv`): `docs/opinionated-wheel/scripts/{check.py,lex.py,ngrams.py,ngram-cache.json}` → `scripts/wheel-words/`
- Delete: `docs/opinionated-wheel/scripts/{app-wheel.py,compare.py,definitions.py,check-report.txt}`
- Create: `scripts/wheel-words/README.md`
- Modify: `.gitignore` if it names the old path (it ignores `__pycache__`)

**Interfaces:**
- Produces in `check.py`: `load_wheel() -> dict`, returning `{"cores": [{"label": str, "middle": [{"label": str, "outer": [str]}]}]}` built from `src/data/wheels/core.json` and the labels in `src/data/locales/en.json`, so the rest of `check.py` keeps the shape it reads today.

- [ ] **Step 1: Move and delete the files** as listed. `situations.json` stays in `docs/opinionated-wheel/scripts/` until the follow-up PR deletes the folder.
- [ ] **Step 2: Point the scripts at the app's data.** In `check.py`: replace reading `derived-wheel.json` with `load_wheel()`; remove the situations check and every reference to `situations.json`; move the "Considered and left out" vocabulary, which it reads from `derived-wheel.md` today, into a `CONSIDERED` constant in `check.py` (copy the words it extracts now, so the flags don't change); change the docstring and comments that say a flag's reason goes in `derived-wheel.md` to say it goes in the change that clears it; fix `REPO`/`ROOT` paths for the new location. In `lex.py`, the default `DATA` path and its comment pointing at `learnings.md` change to point at `scripts/wheel-words/README.md`.
- [ ] **Step 3: Fail clearly without the datasets.** Each loader in `lex.py` checks its file exists and, if not, exits with: `missing <path>: set WHEEL_DATA to the folder of downloaded datasets (see scripts/wheel-words/README.md)`. Test: `WHEEL_DATA=/nonexistent python3 -I scripts/wheel-words/check.py` prints that line for the first missing file and exits 1.
- [ ] **Step 4: Write `scripts/wheel-words/README.md`:** what the scripts check (the spec §3 list, and that the CI checks are in `tests/unit/data.test.ts`), how to run them (`WHEEL_DATA=/path python3 -I scripts/wheel-words/check.py`), and a table of datasets with their download URL, the path under `WHEEL_DATA` each loader reads, and their terms. The URLs and paths are in `docs/opinionated-wheel/handoff.md` ("Data") and `learnings.md` ("Data"). The terms come from the reference notes Task 7 writes, so link each note.
- [ ] **Step 5: Run it, if the datasets are on this machine** (ask Lucas for the `WHEEL_DATA` folder; if there is none, skip and say so in the PR). Expected: exit 0, and the same flags as `docs/opinionated-wheel/scripts/check-report.txt` at the commit before this task, less the situations lines.
- [ ] **Step 6: Commit.** `git add -A scripts docs/opinionated-wheel/scripts .gitignore && git commit -m "Opinionated wheel: the dataset checks move to scripts/wheel-words and read the app's data"`

### Task 4: `scripts/make-content-review.mjs` (spec §3)

**Files:**
- Create: `scripts/make-content-review.mjs`
- Modify: `src/data/AGENTS.md` (step 4 names the script), `src/data/README.md` ("How to check a change" names it)

- [ ] **Step 1: Write the script.** Load the data through Vite as `make-og-image.mjs` does (`loadData` from `/src/data/load.ts`) and write `docs/content-review.md` in today's layout: the title and intro paragraph as they are; per core a `## Core` heading and nested bullets (`- **Label**: definition.  ` then the "You might notice" phrases in italics, joined by ` · `, indented under it); a word in two places listed once, where it first appears; then `## Body wheel`, one `### Area` heading per area, as today. Read today's file for the exact spacing and the Body wheel section's format.
- [ ] **Step 2: Check it reproduces today's file** (Review Focus 4). `node scripts/make-content-review.mjs && git diff --exit-code docs/content-review.md`. Expected: exit 0, no diff.
- [ ] **Step 3: Name it in `src/data/AGENTS.md` step 4** ("rebuild `docs/content-review.md` with `node scripts/make-content-review.mjs`") and in the README's "How to check a change".
- [ ] **Step 4: Commit.** `git add scripts/make-content-review.mjs src/data && git commit -m "Content review: a script rebuilds it from the data"`

### Task 5: Icons drawn from the wheel (spec §4)

**Files:**
- Modify: `scripts/make-icons.mjs`, `public/icons/icon.svg` and its PNGs, `docs/website-icon/{feels-on-wheels.svg,feels-on-wheels.css,README.md}`, root `AGENTS.md`
- Create: `tests/unit/icons.test.ts`

**Interfaces:**
- Produces, exported from a small module the script and test share, `scripts/icon-wedges.mjs`: `iconWedges(wheel: Wheel): { hue: string; start: number; end: number }[]`, angles in degrees clockwise from 12 o'clock, one per core in `core.json` order, each spanning `360 × (its outer-word count) / (all outer words)`.

- [ ] **Step 1: Write the failing test** `tests/unit/icons.test.ts`:
  - `iconWedges(loadData().wheel)` has hues `['happy', 'angry', 'love', 'sad', 'bad', 'scared']`, starts at 0, ends at 360, each `end` equals the next `start`, and Happy's span is `360 * 30 / 111` (to 6 places).
  - `public/icons/icon.svg` has 6 wedge paths and 6 spoke lines, and its fills are the light theme's `--hue-*` values in that order (read from `src/styles/tokens.css` `:root {`).
  - `docs/website-icon/feels-on-wheels.css` has a conic gradient of 6 stops at the wedges' angles, in the dark theme's colors.
- [ ] **Step 2: Run it.** `npx vitest run tests/unit/icons.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `make-icons.mjs` first loads the wheel (Vite, as `make-og-image.mjs`) and the tokens (light for the app icon, dark for the website icon, read as `make-og-image.mjs` reads them), then writes:
  - `public/icons/icon.svg` in today's design: wedges between radius 78 and 240 on a 512 box, white spokes 8 wide, and the inner ring line (`r="148.8"`, white, width 6, opacity .55);
  - `docs/website-icon/feels-on-wheels.svg`: today's mask silhouette with six spokes (width 20, to radius 250), keeping its comment, with the angles updated;
  - `docs/website-icon/feels-on-wheels.css`: today's file with the gradient stops and the header comment's color list and contrast ratios against `#121214` recomputed, named Happy, Angry, Love, Sad, Bad, and Scared. The script exits 1 if any ratio is under 3.
  
  Then it renders the PNGs as today. Run `node scripts/make-icons.mjs`.
- [ ] **Step 4: Run the test.** Expected: PASS. Open `docs/website-icon/preview.html` as its README says and check the colors sit on the wedges and it spins.
- [ ] **Step 5: Docs.** `docs/website-icon/README.md`: "seven" becomes "six", and a line says the SVG and CSS are drawn by `node scripts/make-icons.mjs`. Root `AGENTS.md` gets an "Icons" section beside "Social preview images": when the cores, their order, or their colors change, run `node scripts/make-icons.mjs` and commit `public/icons/` and `docs/website-icon/` in the same change. Update the roadmap's Before launching line about the icon ("seven colors" → "six").
- [ ] **Step 6: Commit.** `git add -A scripts public/icons docs/website-icon tests/unit/icons.test.ts AGENTS.md docs/ROADMAP.md && git commit -m "Icons: drawn from the wheel, with the six cores in their new colors"`

### Task 6: The rules move into `src/data/README.md` (spec §2)

**Files:**
- Modify: `src/data/README.md` ("The feelings wheel" section, "How to check a change"), `src/data/AGENTS.md`

- [ ] **Step 1: Write the feelings wheel's rules** into the README's "The feelings wheel" section, replacing its placeholder, from `docs/opinionated-wheel/rules.md`, as the spec §2 lists: who it's for and the north star; the always rules; the five questions; the design notes (cores, the catch-all, the what-happened guide table, words for what happened to you, mixed feelings, order); the definition rules in full with their examples; the translations rule (no two positions in one language share a translation), kept for when a language comes; a checks table saying which run in CI (`tests/unit/data.test.ts`) and which locally (`scripts/wheel-words/`), and the flags. Leave out the research table, the considered-and-dropped list, the old-rule history, and links into `docs/opinionated-wheel/` (link the spec instead). Write each word's reason as spec §2 says: a new or changed word says why in the change that makes it. Keep Lucas's quoted words as they are.
- [ ] **Step 2: Add the people checks** to "How to check a change": fix the cards a reader flags rather than rewriting the wheel; have someone who didn't write a change read it cold; after a large change, run the user's-eyes check (spec §2's wording).
- [ ] **Step 3: Update the README's intro** (its specs line) to name this spec beside the body wheel rework's, and remove "Its rules come with the opinionated feelings wheel idea. Until then, its words are the ones it has."
- [ ] **Step 4: `src/data/AGENTS.md`:** step 1 gains a line for the feelings wheel (check each word you add, move, or reword against the README's five questions and definition rules); step 4 runs the data tests and, when words change, `scripts/wheel-words/check.py`.
- [ ] **Step 5: Check links.** Every relative link in the two files resolves: `grep -o '](\.\.*/[^)]*)' src/data/README.md src/data/AGENTS.md` and check each path exists.
- [ ] **Step 6: Commit.** `git commit -am "Content rules: the feelings wheel's rules move into src/data/README.md"`

### Task 7: Sources and credits (spec §5)

**Files:**
- Create: one note per source in `docs/reference/` (names like `shaver-emotion-prototypes.md`, `baron-cohen-emotion-vocabulary.md`, which the spec already links; pick the rest in the same style)
- Modify: `docs/reference/README.md` (table and Credits), `docs/reference/goetz-compassion.md`, `docs/reference/core-feelings-wheel.md`, root `README.md` (Credits, and a new "Research behind the feelings wheel"), `src/data/locales/en.json` (`page.about` credits paragraph), the spec (only its links to notes, if a file name differs)

- [ ] **Step 1: Confirm the list.** Start from spec §5's list and check it against `rules.md`, `learnings.md`, and `docs/opinionated-wheel/research/*.md`, by spec §5's rule (a source the rules, the spec, or a recorded decision rests on). Write the final list in the PR description.
- [ ] **Step 2: Write each note** in `docs/reference/README.md`'s format: what it is, author, date, link, usage terms if stated, what we take from it, and what's unverified, marked so. Use the research reports for the claims and check each against its source (a cold subagent per batch, as `learnings.md` advises). NRC VAD's note says why it's credited in the README and not on the About page (spec §5). No word lists.
- [ ] **Step 3: Credits.** Add each to `docs/reference/README.md`'s table and Credits, and to the root README's Credits, with links to the notes. Extend `goetz-compassion.md` for compassion against pity. Change Roberts's note and Credits entry to the past tense (the seven-core wheel the first version's words were based on).
- [ ] **Step 4: The About page.** Replace the first paragraph of `page.about`'s credits section in `en.json` with spec §5's approved wording, verbatim. Keep the other paragraphs and their `{credits}` link.
- [ ] **Step 5: The root README.** Add "Research behind the feelings wheel" before "Research behind the body wheel", in the same shape (how it's built, what the research found, what isn't research, how it was decided, then the Wheel content issue link), linking the new notes. Plain language; no jargon ("pleasant or unpleasant", not "valence").
- [ ] **Step 6: Check.** `npx vitest run` (the About page and site tests cover `page.about`) and `npm run build`. Expected: pass. Every source named in the spec, the two READMEs, and `src/data/README.md` links its note: check by reading each.
- [ ] **Step 7: Commit.** `git add -A docs/reference README.md src/data/locales/en.json docs/superpowers/specs && git commit -m "Sources: notes and credits for the feelings wheel's research"`

### Task 8: Roadmap, accessibility, and the link previews (spec §7)

**Files:**
- Modify: `docs/ROADMAP.md`, `ACCESSIBILITY.md`, `public/og/*.png`

- [ ] **Step 1: Measure.** With `npm run dev` and the in-app browser, on a 375 × 667 viewport and at 1280 × 800, check the outer ring's cell heights at rest on the feelings wheel (`window.__fw` exposes segment geometry; or compute from `src/camera.ts`'s `segHeight` in a scratch test). Record which views put outer cells under 24 px.
- [ ] **Step 2: `ACCESSIBILITY.md`.** Reword the "small to tap before you've opened anything" limitation for what Step 1 found (now the feelings wheel too, if so). Nothing else changes: opened rings stay over 24 px.
- [ ] **Step 3: The roadmap.** Add a Shipped row: "An opinionated feelings wheel" with [spec](...) and [plan](...) links, in the table's format. Delete the idea's subsection and its table row. Add a new idea under The wheels' content, "Open questions in the feelings wheel", with "I feel bad for them" and Jealous beside Envious, as spec §6 words them, plus "run the user's-eyes check" (spec §2). In "Narrower feelings on the body wheel's card", replace the Hesitant under Repelled example with one from today's wheel (a middle word on the body wheel with outer words under it, such as Overwhelmed). In Before launching, narrow the review item to the "You might notice" phrases (Lucas reviewed every definition twice on 2026-11-25). Repoint any links to the deleted heading.
- [ ] **Step 4: Link previews.** `node scripts/make-og-image.mjs`; `npx vitest run tests/unit/og.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add -A docs/ROADMAP.md ACCESSIBILITY.md public/og && git commit -m "Opinionated wheel: roadmap, accessibility, and link previews"`

### Task 9: Verify and open the PR

- [ ] **Step 1: Everything green.** `npx vitest run`, `npm run build`, `npm run size`, `npx playwright test tests/e2e --reporter=line`, and `npm run test:perf`. Expected: all pass (the perf leak check is known to be flaky about 1 run in 10; rerun once if it fails).
- [ ] **Step 2: Look at it.** In the in-app browser: the wheel at rest, a word opened on a phone viewport, the body wheel's Racing heart, the About page's credits, both themes. Screenshot for the PR.
- [ ] **Step 3: Push and open the PR** with `gh pr create` from `opinionated-wheel-rules` into `main`. Title: "An opinionated feelings wheel". The "What and why" says what changed for people (new cores, words, cards, colors, order; old word addresses not forwarded) and, per `AGENTS.md`'s Accessibility rule, how it was checked: the tests, the keyboard in a browser, and which hand checks weren't done (a screen reader, a real phone). List the sources added (Task 7 Step 1) and whether Task 3 Step 5 ran.
- [ ] **Step 4: Follow up after it merges** (a separate PR, docs only, branched from the new `main`): delete `docs/opinionated-wheel/`, and repoint every link to it (the spec, `learnings`/`handoff` mentions in other docs, `.gitignore` entries) to `https://github.com/lpolito/feels-on-wheels/tree/<last main commit with the folder>/docs/opinionated-wheel/...`. Check with `grep -rn "opinionated-wheel/" --include=*.md . | grep -v "tree/"`: expected no hits.

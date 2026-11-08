# Feelings Wheel v2 (Body Sensations Wheel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second wheel that starts from the body (areas → sensations → feelings), a "Feelings | Body" switch, a start-message link between wheels, and a card built from sections. Nothing should assume exactly two wheels.

**Architecture:**
- Data first: node kinds, the wheel list, `body.json`, locale (Task 1).
- Then the layout's generic nodes and the colour rule (Task 2), and the area hues (Task 3).
- The card's sections (Task 4) and the two new controls (Task 5) are self-contained components.
- Task 6 turns `main.ts`'s single wheel into a mountable one and wires switching, URLs and history.
- Task 7 adds the end-to-end checks and the docs.

**Tech Stack:** unchanged. Vite 8.3.6, TypeScript 7.0.2, Vitest 5.1.0 with happy-dom 21.0.4, Playwright 1.65.0 with @axe-core/playwright 4.14.0.

**Spec:** `docs/superpowers/specs/2026-11-08-feelings-wheel-v2-body-wheel-design.md`. Read it all before starting. It builds on v1.3 (`2026-11-07-feelings-wheel-v1.3-design.md`).

## Global Constraints

**Carried over from v1.3** (its plan's Global Constraints still apply):
- no runtime dependencies, no framework, no shadow DOM;
- every string through `t()` or the locale;
- WCAG 2.2 AA; reduced motion honoured;
- storage access in try/catch;
- size budgets: app JS ≤ 25 KB gzipped, first load ≤ 60 KB gzipped (`npm run size`);
- commits straight to `main`, with no `Co-Authored-By` or AI trailer;
- everything listed under v1.3's "Do not undo".

**Strings** (`en.json`):
- `ui` added:
  - `couldBe` = "Could be"
  - `couldAlsoBe` = "Could also be"
  - `seeOnWheel` = "See {label} on the feelings wheel"
  - `wheelSwitch` = "Wheel"
- `ui` removed: `hint` and `wheelLabel` (they move into `wheels`).
- New `areas`:
  - `head` "Head and eyes"
  - `face` "Face and jaw"
  - `chest` "Chest"
  - `breath` "Breath and throat"
  - `stomach` "Stomach"
  - `arms` "Shoulders, arms and hands"
  - `whole-body` "Whole body"
  - `posture` "Posture and urges"
- New `wheels`:
  - `core`: `switch` "Feelings", `name` "Feelings wheel", `hint` "How are you feeling? Tap or spin to explore, or {link}.", `hintLink` "start from body sensations instead".
  - `body`: `switch` "Body", `name` "Body sensations wheel", `hint` "What do you notice in your body? Tap or spin to explore, or {link}.", `hintLink` "start from feelings instead".

**Values:**
- 2–3 feelings per sensation.
- Area hues: each area's fitted lit fill is at least **0.06** OKLab distance from every other hue's (feeling or area), in both themes.

**Fixed decisions:**
- **Switching always starts fresh.** It pushes history; on phones the intro plays unless reduced motion is on.
- **Repeated core feelings** (*overwhelmed*, *inferior*, *embarrassed*, *disappointed*) use their first position in the core wheel's depth-first order.

## Review Focus

1. **Back/Forward across wheels.** Open *Chest › Racing heart*, switch to Feelings, press Back: the body wheel returns with *Racing heart* opened. Forward returns to the feelings wheel's start view. Test in Task 6.
2. **Switching while the wheel is still spinning.** After a fling, switch at once: the new wheel starts with nothing selected and stays that way. No `settled` from the old wheel's camera reaches the new store. Test in Task 6.
3. **Keyboard right after switching.** With focus on the switch, Tab reaches the new wheel's tree, and arrow keys move through body areas, not feelings. Test in Task 6.
4. **Theme toggled on the body wheel.** The fills rebuild with the area hues and the body wheel's ring count, with no missing-hue errors. Light, dark and forced colours all render. Test in Task 6.
5. **A bad hash.** `#/body/nowhere` and `#/nowhere` both load the feelings wheel's start view. Test in Task 6.
6. **Switching back and forth many times.** Only the current wheel's objects stay alive. A listener that captures an old store, layout or controller directly, instead of going through the current bindings, would keep a whole wheel in memory per switch. Test in Task 6.

---

## File Map

| File | Change | Task |
|---|---|---|
| `src/data/types.ts`, `src/data/load.ts`, `src/data/wheels/index.ts` (new), `src/data/wheels/body.json` (new), `src/data/locales/en.json`, `docs/content-review.md` | Node kinds, the wheel list, body data, locale | 1 |
| `src/model/layout.ts`, `src/i18n.ts`, `src/render/wheel.ts`, `src/a11y/tree.ts`, `src/camera.ts` (if it reads `feelingId`) | `Segment.node`, `nodeLabel`, the hue rule, home positions | 2 |
| `src/styles/tokens.css`, `src/render/colors.ts` | Area hues; the palette reads hue names from the wheels | 3 |
| `src/ui/card.ts`, `src/styles/app.css` | Sections model, per-row ink, the jump link | 4 |
| `src/ui/hint.ts`, `src/ui/wheel-switch.ts` (new), `src/styles/app.css`, `index.html` | Message with a link; the switch | 5 |
| `src/state/url.ts`, `src/main.ts`, `tests/fw-window.d.ts`, `tests/perf/switch.spec.ts` (new) | Mountable wheel, switching, URLs, history, leak probe | 6 |
| `tests/e2e/body.spec.ts` (new), `docs/ROADMAP.md`, `docs/reference/README.md` | End-to-end, axe, gates, docs | 7 |

---

### Task 1: Node kinds, the wheel list and the body wheel's data

**Files:**
- Modify: `src/data/types.ts`, `src/data/load.ts`, `src/data/locales/en.json`, `docs/content-review.md`.
- Create: `src/data/wheels/index.ts`, `src/data/wheels/body.json`.
- Tests: `tests/unit/data.test.ts`, `tests/unit/content.test.ts`; any unit test that indexes with `n.feeling`.

**Interfaces (produces):**
```ts
// types.ts
export type AreaId = string;
export type NodeKind = 'feeling' | 'sensation' | 'area';
export interface NodeRef { kind: NodeKind; id: string }
/** Exactly one of feeling / sensation / area (checked by validateWheel). */
export interface WheelNode { feeling?: FeelingId; sensation?: SensationId; area?: AreaId; hue?: string; children?: WheelNode[] }
export interface WheelText { switch: string; name: string; hint: string; hintLink: string }
export interface Locale { /* existing fields */ areas: Record<AreaId, string>; wheels: Record<string, WheelText> }

// load.ts
export function nodeRef(n: WheelNode): NodeRef;
export function validateWheel(w: unknown, dict: FeelingsDict, ids: { sensations: Set<string>; areas: Set<string> }): Wheel;
export function loadData(): {
  wheels: Wheel[];               // switch order: core, body
  suggests: Record<string, string>; // wheel id → the wheel its start message links to
  wheel: Wheel;                  // wheels[0], kept so existing callers keep working
  feelings: FeelingsDict; locale: Locale;
};

// wheels/index.ts
export const wheelSources: { wheel: unknown; suggests: string }[]; // [{core.json, 'body'}, {body.json, 'core'}]
```
- `validateWheel` takes the area and sensation id sets from the locale's `areas` and `sensations` keys. `loadData` validates every wheel, checks the wheel ids are unique, then validates the locale.
- `validateLocale` also checks that every wheel id has a `wheels` entry with all four strings, and that every area and sensation used by any wheel has a label.

- [ ] **Step 1: Tests.**
  - `data.test.ts`:
    - Change the existing core-wheel tests to use `nodeRef(n).id`.
    - `body wheel has 8 areas and 40 sensations, in spec §3.2 order`: centre ids are `['head','face','chest','breath','stomach','arms','whole-body','posture']`, and each area's sensation ids equal the spec's table.
    - `body wheel: every sensation has 2 or 3 feeling children, each a known feeling`.
    - `validateWheel rejects a node with no kind, with two kinds, an unknown area, an unknown sensation, an unknown feeling, hue off the centre, a centre without hue` (one `DataError` case each).
    - `loadData rejects duplicate wheel ids`.
    - `validateLocale rejects a missing wheels entry and a missing area label`.
  - `content.test.ts`: `racing heart leads to scared, mad and excited`; `smiling includes happy`.
- [ ] **Step 2:** `npx vitest run tests/unit/data.test.ts tests/unit/content.test.ts` → FAIL.
- [ ] **Step 3:** Implement the types, `nodeRef` and the validators. Add the locale's `areas`, `wheels` and new `ui` strings from Global Constraints. Keep `ui.hint` and `ui.wheelLabel` for now: Task 2 removes `wheelLabel` and Task 6 removes `hint`, each with its last caller.
- [ ] **Step 4: Draft `body.json`.**
  - Ring radii: copy `core.json`'s.
  - Each centre node has `"hue"` equal to its area id.
  - Seeds:
    - `racing-heart`: scared, mad, excited
    - `tight-chest`: anxious, overwhelmed, resentful
    - `hollow-chest`: lonely, hurt, empty
    - `warm-chest`: loving, thankful, content
    - `smiling`: happy, playful, proud
  - Draft the rest by these rules:
    - 2 or 3 per sensation;
    - any feeling id from `feelings.json`, at any ring;
    - three only where the sensation honestly splits across different core feelings;
    - prefer words specific enough to mean something.
- [ ] **Step 5:** In `docs/content-review.md`, add a "Body wheel" section. List each area, then each sensation with its feelings, in wheel order, with an unchecked box per sensation like the existing entries.
- [ ] **Step 6:** `npx tsc --noEmit && npm test` → PASS. The UI still renders only the core wheel at this point.
- [ ] **Step 7:** Commit `feat(data): node kinds, the wheel list and the body wheel's data`.

---

### Task 2: Generic segments, labels and the hue rule

**Files:**
- Modify: `src/model/layout.ts`, `src/i18n.ts`, `src/render/wheel.ts`, `src/a11y/tree.ts`, `src/ui/card.ts` (the `label(seg.feelingId)` calls only), and any other `feelingId` reader (`grep -rn feelingId src`).
- Tests: `tests/unit/layout.test.ts`, `tests/unit/a11y.test.ts`.

**Interfaces:**
- Consumes: `nodeRef`, `NodeRef` (Task 1).
- Produces:
```ts
// layout.ts
export interface Segment { /* feelingId removed */ node: NodeRef; /* rest unchanged */ }
export interface Home { path: Path; hue: string }
/** First position of each feeling in a wheel's depth-first order. Built from the first wheel. */
export function homes(core: Layout): Map<FeelingId, Home>;
/** Without `home`, hues inherit as today. With it, feeling nodes take home.get(id).hue (spec §5.1). */
export function buildLayout(wheel: Wheel, home?: Map<FeelingId, Home>): Layout;

// i18n.ts
export function nodeLabel(n: NodeRef): string; // feeling → feelings[id].label, sensation → sensations[id], area → areas[id]
export function wheelText(id: string): WheelText;
```
- Paths keep joining node ids with `/`.

- [ ] **Step 1: Tests.**
  - `layout.test.ts`:
    - `core wheel hues are unchanged with homes`: every segment of `buildLayout(core, homes(buildLayout(core)))` has the same `hue` as `buildLayout(core)`.
    - `body wheel: areas and sensations take the area hue, feelings their core hue`: `chest` and `chest/racing-heart` have hue `chest`; `chest/racing-heart/scared` has `fearful`, `…/mad` has `angry`, `…/excited` has `surprised`.
    - `homes uses the first position for repeated feelings`: `overwhelmed` → `fearful/anxious/overwhelmed`, hue `fearful`; also `inferior`, `embarrassed` and `disappointed` → their first paths.
    - `body paths join node ids`: `byPath.get('chest/racing-heart/scared')` is defined.
  - `a11y.test.ts`: `describe(bodyLayout, idx('chest/racing-heart/scared'))` is "Scared. In Chest, Racing heart.". The tree's `aria-label` is `wheelText(layout.wheelId).name`.
- [ ] **Step 2:** `npx vitest run tests/unit/layout.test.ts tests/unit/a11y.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
  - Replace every `label(x.feelingId)` with `nodeLabel(x.node)`.
  - The tree's root label becomes `wheelText(layout.wheelId).name`. Remove `ui.wheelLabel` from `en.json`.
  - Card code that reads `feelings[seg.feelingId]` uses `seg.node.id` when `seg.node.kind === 'feeling'`.
- [ ] **Step 4:** `npx tsc --noEmit && npm test` → PASS.
- [ ] **Step 5:** Commit `feat: segments carry a node kind; feeling cells take their core feeling's hue`.

---

### Task 3: Area hues

**Files:**
- Modify: `src/styles/tokens.css` (all three blocks: light `:root`, the dark media block, `:root[data-theme="dark"]`), `src/render/colors.ts`.
- Test: `tests/unit/colors.test.ts`.

**Interfaces:**
- Produces: `readPalette(el: Element, hueNames: string[]): Palette`. `HUE_NAMES` is removed.
- Callers pass every centre node's `hue` across all wheels: `wheels.flatMap((w) => w.children.map((n) => n.hue!))`. Forced colours map every name to `Canvas`, as today.

- [ ] **Step 1: Tests** (`colors.test.ts`; the existing `block()` helper reads every `--hue-*`):
  - `area hues exist in light and dark for every body area` (the 8 ids, in both themes).
  - `every hue's fitted fills carry white labels`: the existing contrast checks now loop over all 15 hues, including the ring shades from `buildFillTable`.
  - `area hues are distinct`: for each theme, every area hue's `fitWhite` result is at least 0.06 OKLab distance from every other hue's. Write a small `oklab(hex)` helper in the test file; the matrix is in `shade()`.
- [ ] **Step 2:** `npx vitest run tests/unit/colors.test.ts` → FAIL.
- [ ] **Step 3:** Pick the 8 hues.
  - Start from the companion mockups' set: `#2F6F8F`, `#8C4A6B`, `#A0452E`, `#3D7A6A`, `#8A6A1F`, `#4F5FA0`, `#6A4F8F`, `#5A7A35`, in area order.
  - **Replace any that fail the distance test.** `#A0452E` is likely too close to Disgusted's `#A4532A`, and `#6A4F8F` to Bad's `#5E3A87`.
  - Dark variants are lighter, like the feeling hues' dark values.
  - Change `readPalette` to take the names.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: eight area hues, read from the wheels`.

---

### Task 4: The card is built from sections

**Files:** Modify `src/ui/card.ts`, `src/styles/app.css`. Test `tests/unit/card.test.ts`.

**Interfaces:**
- Consumes: `Segment.node`, `Home`, `homes()` (Task 2).
- Produces:
```ts
export type Row = { index: number; label: string; hue: string };
export type Section =
  | { kind: 'text'; text: string }
  | { kind: 'list'; heading: string; items: string[] }
  | { kind: 'links'; heading: string; rows: Row[] }
  | { kind: 'jump'; label: string; wheel: string; path: Path };
export type CardModel =
  | { kind: 'none' }
  | { kind: 'selected'; index: number; title: string; hue: string }
  | { kind: 'opened'; index: number; title: string; hue: string; crumbs: Row[]; sections: Section[] };
/** `jump` is given only on wheels other than the first. */
export function cardModel(layout: Layout, feelings: FeelingsDict, s: State,
  jump?: { wheel: string; home: Map<FeelingId, Home> }): CardModel;
```
- The jump button dispatches `fw-wheel` with `detail: { wheel, path }` (bubbles). Task 5's controls dispatch the same event without `path`.
- Section rules (spec §6.2), by node kind and parent kind:
  - **area:** `links(narrowDown, children)`.
  - **sensation:** `links(couldBe, children)`.
  - **feeling**, in this order:
    1. `text(definition)`;
    2. `list(youMightNotice)`, if it has any sensations;
    3. `links(narrowDown, children)`, if it has children;
    4. if it has no children: `links(closeTo, siblings)` when the parent is a feeling, or `links(couldAlsoBe, siblings)` when the parent is a sensation;
    5. `jump` with `label = t('seeOnWheel', { label })`, when `jump` is given and the home exists.
- In `#bodyFor`, rows of a `links` section set `--ink` from their own `hue` through `#inks`. Breadcrumbs keep the card's ink.

- [ ] **Step 1: Tests** (`card.test.ts`; add a body layout built with `homes(coreLayout)`):
  - Rewrite the existing opened-card tests to the sections shape. The core cards' content is unchanged: `angry/aggressive/hostile` gives `[text, list, links(Close to, [Provoked])]`; `angry` gives `[text, list, links(Narrow it down, 8 rows)]`.
  - `area card: one Narrow it down section with its sensations` (`chest` → 4 rows, hue `chest`).
  - `sensation card: one Could be section` (`chest/racing-heart` → Scared, Mad, Excited with hues fearful, angry, surprised).
  - `feeling under a sensation`: `chest/racing-heart/scared` gives text, list, `links(Could also be, [Mad, Excited])` and `jump { label: 'See Scared on the feelings wheel', wheel: 'core', path: 'fearful/scared' }`. Crumbs are Chest and Racing heart.
  - `no jump section on the first wheel`.
  - `the jump button dispatches fw-wheel with wheel and path` (happy-dom; render the card, click, assert the event detail).
- [ ] **Step 2:** `npx vitest run tests/unit/card.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
  - `#bodyFor` loops over the sections with no wheel or ring checks.
  - The jump button gets `className: 'fw-jump'`, styled like a row link with a trailing " ›".
  - `unfoldedHeightFor(model)` keeps working on the new model.
- [ ] **Step 4:** `npx tsc --noEmit && npm test` → PASS.
- [ ] **Step 5:** Commit `feat(card): sections; Could be, Could also be and the jump to the feelings wheel`.

---

### Task 5: The start message's link and the wheel switch

**Files:**
- Modify: `src/ui/hint.ts`, `src/styles/app.css`, `index.html`.
- Create: `src/ui/wheel-switch.ts`.
- Tests: `tests/unit/hint.test.ts`, `tests/unit/wheel-switch.test.ts` (new).

**Interfaces:**
- Produces:
```ts
// hint.ts: replaces `text`
export type HintContent = { text: string; link?: { label: string; wheel: string } } | null;
// FwHint: set content(v: HintContent); focusLink(): void
// `text` contains "{link}", which renders as a <button class="fw-hint-link"> with `link.label`.
// Clicking it dispatches `fw-wheel` { wheel } (bubbles).

// wheel-switch.ts: <fw-wheel-switch>
// set wheels(list: { id: string; label: string }[]); set current(id: string)
// role="group", aria-label t('wheelSwitch'); one <button aria-pressed> per wheel.
// A click on a non-current button dispatches `fw-wheel` { wheel: id } (bubbles). A click on the current one does nothing.
```
- **Placement:** `index.html` puts `<fw-wheel-switch>` as `#app`'s first child, so it comes first in the tab order.
- **CSS:**
  - Absolutely positioned at `top: max(1rem, env(safe-area-inset-top)); left: max(1rem, env(safe-area-inset-left))`, `z-index: 3`.
  - Buttons are at least 44px tall, with the same surface and border as the toolbar's buttons. The pressed one is filled with `--fg` on `--bg` text.
  - In forced colours, the pressed button uses `Highlight`/`HighlightText`.

- [ ] **Step 1: Tests.**
  - `hint.test.ts`: `renders text around a link button`; `clicking the link dispatches fw-wheel with the target`; `null hides it`; `focusLink focuses the button`.
  - `wheel-switch.test.ts`: `one button per wheel, in order, with aria-pressed on the current one`; `clicking another wheel dispatches fw-wheel`; `clicking the current wheel dispatches nothing`; `setting current moves aria-pressed without rebuilding the buttons` (the same button elements, so focus stays put).
- [ ] **Step 2:** `npx vitest run tests/unit/hint.test.ts tests/unit/wheel-switch.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(ui): the wheel switch and the start message's link`.

---

### Task 6: Switching wheels in the app

**Files:**
- Modify: `src/state/url.ts`, `src/main.ts`, `tests/fw-window.d.ts`.
- Tests: `tests/unit/url.test.ts`, `tests/e2e/body.spec.ts` (new; Task 7 adds more to it), `tests/perf/switch.spec.ts` (new).

**Interfaces:**
- Consumes: everything above.
- Produces:
```ts
// url.ts
/** `first` false: the base URL is `#/<wheel id>` instead of ''. */
export function toHash(layout: Layout, s: State, first = true): string;
/** The wheel id a hash names, when it's one of `ids`; otherwise null. */
export function hashWheel(hash: string, ids: string[]): string | null;
```
- **`main.ts` becomes mountable.**
  - Per-wheel objects live in `let` bindings, set by `mount(id: string, initial: State, intro: boolean)`: `layout`, `store`, `camera`, `controller`, `renderer`, `tree`, `lit`/`prevLit`, and the card's `jump` context.
  - `mount`:
    - stops the previous camera;
    - creates a **new** camera controller (the controller's `onSettle` subscriptions can't be removed) and registers `onFrame` on it;
    - replaces `#a11y-tree` with a fresh empty element before `createA11yTree`, which drops the old listeners;
    - subscribes the new store with the existing subscriber;
    - calls `refreshColors()` so the fill table matches the new ring count;
    - renders the UI and sets the switch's `current`.
  - The sprite cache, gestures, keydown routing, resize observer, theme and the test hook stay single. They reach the current objects through the `let` bindings.
- **On `fw-wheel` `{ wheel, path? }`:**
  - Mount that wheel. With `path`, mount it with that word opened (`fromHash` of `#/<wheel>/<path>`), without the intro. Otherwise mount it with `initialState`, with the intro on phones.
  - Push `toHash(...)`, or the base URL for the first wheel.
  - Announce: with `path`, `announceFor(layout, initialState, state)`; otherwise `wheelText(id).name`.
  - Focus:
    - from the switch, it stays on the switch (it isn't rebuilt);
    - from the hint link, `hint.focusLink()`;
    - from the jump link, the card's toggle.
- **popstate and first load:**
  - `hashWheel(location.hash, ids)` picks the wheel; when it isn't a known id, use the first wheel and its start view.
  - On popstate, if the wheel differs from the current one, mount it with `fromHash(...) ?? initialState` and no intro. Otherwise, restore as today.
- **History writes** use `toHash(layout, s, layout.wheelId === firstId)`.
- **The hint's content:** `{ text: wheelText(id).hint, link: { label: wheelText(id).hintLink, wheel: suggests[id] } }` when nothing is selected. Remove `ui.hint` from `en.json`; update `wheel.spec.ts`'s message assertions to the new core text.
- **The test hook** gains `wheel: () => layout.wheelId`. The other entries read the current bindings.
- **Leak probe (test builds only):** `mount` adds a `WeakRef` to each new layout and each new store to a list. The hook gains `liveWheels: () => number`, which counts the refs still alive. The hook itself must not hold strong references to old layouts or stores.

- [ ] **Step 1: Unit tests** (`url.test.ts`):
  - `body base URL is #/body`;
  - `body opened round-trip` (`#/body/chest/racing-heart/scared`);
  - `the core base URL stays empty`;
  - `hashWheel` returns `body`, `core`, and null for `#/nowhere` and `''`.
- [ ] **Step 2: E2E tests** (`body.spec.ts`, desktop and phone projects as `wheel.spec.ts` sets them up):
  - `switch to Body: nothing selected, body message, URL #/body, focus stays on the Body button`.
  - `the message link switches to Body and back`.
  - `Review Focus 1: Back and Forward across wheels`.
  - `Review Focus 2: fling then switch: the body wheel stays unselected`.
  - `Review Focus 3: Tab from the switch reaches the tree; ArrowDown moves through areas` (the selected path starts with an area id).
  - `Review Focus 4: theme toggled on the body wheel` (no console errors; the `drawTimes` count grows).
  - `Review Focus 5: #/body/nowhere and #/nowhere load the feelings wheel's start view`.
  - `deep link #/body/chest/racing-heart/scared opens it on load` (phone: the word sits above the card, as in v1.3 §4.2).
- [ ] **Step 2b: Leak test** (`tests/perf/switch.spec.ts`, Chromium only: `test.skip(browserName !== 'chromium')`):
  - `Review Focus 6: 20 switches leave only the current wheel alive`.
  - Open `/`, open *Chest › Racing heart* on the body wheel once (so the card, tree and camera have all been used), then click the switch 20 times, ending on Body, waiting for `idle` after each.
  - Then, through a CDP session, call `HeapProfiler.collectGarbage` twice, in separate `page.evaluate` turns, so `WeakRef`s from the last job can clear.
  - Expect `liveWheels()` to be 2: the current layout and its store.
- [ ] **Step 3:** `npm run build:test && npm run test:e2e -- tests/e2e/body.spec.ts` → FAIL; `npx playwright test tests/perf/switch.spec.ts --project=chromium --workers=1` → FAIL.
- [ ] **Step 4:** Implement.
- [ ] **Step 5:** `npx tsc --noEmit && npm test && npm run build:test && npm run test:e2e` → PASS, including all of `wheel.spec.ts` unchanged. Then `npx playwright test tests/perf/switch.spec.ts --project=chromium --workers=1` → PASS.
- [ ] **Step 6:** Commit `feat: switch between the feelings and body wheels`.

---

### Task 7: The body wheel end to end, gates and docs

**Files:** Modify `tests/e2e/body.spec.ts`, `docs/ROADMAP.md`, `docs/reference/README.md`.

- [ ] **Step 1: E2E** (`body.spec.ts`):
  - `Chest → Racing heart → Scared` by taps:
    - the cards show, in turn, Narrow it down (4 rows); Could be (Scared, Mad, Excited); then definition, You might notice, Could also be (Mad, Excited) and "See Scared on the feelings wheel".
    - Breadcrumbs read Chest › Racing heart.
  - `the jump link opens Fearful › Scared on the feelings wheel; Back returns to the body wheel with Scared opened`.
  - `axe on the body wheel`, light and dark: nothing selected, an area selected, *Scared* opened. Copy `wheel.spec.ts`'s waits for the unfold and the message fade.
- [ ] **Step 1b: Visual check of the area labels.**
  - `fitLabel` hides a label that can't fit rather than truncating it.
  - Run `npm run dev`, open each of the 8 areas on desktop (1280×800) and on an iPhone 13 viewport, and confirm every area label is drawn.
  - If one disappears, shorten it in `en.json` (e.g. "Shoulders, arms and hands" → "Arms and hands") and note the change in `content-review.md` (spec §3.2).
- [ ] **Step 2:** `npm run build:test && npm run test:e2e` → PASS. Then `npm run test:perf` → PASS, after adding a body-wheel variant of the spin test (`open(page, '#/body')`).
- [ ] **Step 3:** `npm run build && npm run size` → within both budgets.
- [ ] **Step 4: Docs.**
  - `ROADMAP.md`: the v2 row's status becomes "Shipped".
  - `reference/README.md`: the Braman credit becomes "the idea of a feelings wheel that includes body sensations", with "*(Once the sensations wheel ships.)*" removed.
- [ ] **Step 5:** Commit `test: the body wheel end to end; docs: v2 shipped`.

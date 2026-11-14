# History rule (back to main's) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Picking a word or a place adds a history entry and moving by direction replaces it, as on `main`, on top of the URL redesign's real paths.

**Architecture:** `historyOp` goes back to `main`'s `MOVES` table and returns `'push' | 'replace' | 'none'`. `onState` in `src/main.ts` writes pushes again, except that the first change on not found still replaces. Nothing else in the router changes.

**Tech Stack:** TypeScript, Vitest, Playwright under `npx -y wrangler@4.156.2 dev`.

**Spec:** `docs/superpowers/specs/2026-11-14-feels-on-wheels-history-rule-design.md` (approved 2026-11-14). It replaces §4 of `docs/superpowers/specs/2026-11-13-feels-on-wheels-urls-routing-design.md`.

## Global Constraints

- `main`'s rule exactly: `restore`, or no change of address → `none`. Both states opened and the action in `MOVES` (`settled`, `step`, `toChild`, `toParent`, `stepOut`) → `replace`. Anything else → `push`.
- The first change on "Feeling not found!" replaces the mistyped address, even when `historyOp` says push.
- Unchanged: wheel switches and the jump push; About pushes with `{ fwInApp: true }`; "Back to the wheel" acts as Back; pushes within 250 ms merge unless they carry state; History API errors are swallowed.
- No new dependency. US spelling. Plain commit messages with no AI attribution trailer. Work on `urls-routing`; don't push.

## Review Focus

1. **The first tap from not found** opens the word, replaces the mistyped address and leaves `history.length` unchanged.
2. **A double tap on a word on the whole wheel** opens it with exactly one new entry (the first tap only selects, which changes no address).
3. **A shared link, then closing:** a fresh load of `/happy/playful`, then Escape, then Back reopens Playful.
4. **A word opened by a tap, then About, then "Back to the wheel":** lands on that word. Back again returns to the whole wheel.
5. **Phone, a swipe on a ring** (the `pixel` and `iphone` projects): moves to the parent or child with `history.length` unchanged. A pinch in on a word adds one entry.

---

### Task 1: Restore the rule, its tests, and the docs

**Files:**
- Modify: `src/state/history.ts`, `src/main.ts` (`onState`, ~L297–314)
- Test: `tests/unit/history.test.ts`, plus `tests/e2e/wheel.spec.ts`, `body.spec.ts`, `about.spec.ts` and `routes.spec.ts` (every `history.length` check: wheel.spec ~L27, 45, 183, 646; about.spec ~L35; routes.spec ~L99, 245)
- Docs: `docs/ROADMAP.md`, `ACCESSIBILITY.md` (only if a known limitation mentions Back)

**Interfaces:**
- Produces: `historyOp(prev: State, next: State, a: Action): 'push' | 'replace' | 'none'`, with the doc comment citing the history-rule spec.

- [ ] **Step 1: Unit tests.** Restore `main`'s two `historyOp` tests (`git show 456c23a:tests/unit/history.test.ts`, the `describe('historyOp')` block) with paths instead of hashes. Its assertions are the rule:

  ```ts
  expect(op(initialState, { type: 'select', segment: idx('angry') })).toBe('none');
  expect(op(sel, { type: 'select', segment: idx('angry') })).toBe('push');
  expect(op(sel, { type: 'open', segment: idx('sad') })).toBe('push');
  expect(op(opn, { type: 'settled', segment: idx('sad') })).toBe('replace');
  expect(op(opn, { type: 'close' })).toBe('push');
  expect(op(sel, { type: 'restore', state: opn })).toBe('none');
  expect(op(opn, { type: 'step', delta: 1 })).toBe('replace');
  expect(op(opn, { type: 'toChild' })).toBe('replace');
  expect(op(outer, { type: 'toParent' })).toBe('replace');
  expect(op(outer, { type: 'stepOut' })).toBe('replace');
  expect(op(opn, { type: 'open', segment: idx('sad') })).toBe('push');
  expect(op(sel, { type: 'activate' })).toBe('push');
  expect(op(opn, { type: 'toParent' })).toBe('push'); // ← on a core word closes it
  ```
  Keep the Task 6 writer test that a push with state is never merged.

- [ ] **Step 2: End-to-end tests follow the rule.**
  - Where Task 5 rewrote a test to "Escape closes, `history.length` unchanged", restore `main`'s version (`git show 456c23a:tests/e2e/wheel.spec.ts`), using paths: opening adds an entry, Back returns to the whole wheel with the word still selected, and Start over then Back returns to the word. Keep any check Task 5 added on top.
  - Keep the "arrowing through opened words keeps one history entry" test as it is.
  - Update `routes.spec`'s no-reload walk and `about.spec`'s back-link test for a tap that now adds an entry. The checks on `__noReload`, the view, the title and focus stay.
  - Add the five Review Focus tests above to `routes.spec.ts`, with the swipe and pinch test in the phone projects only (`test.skip` on non-touch projects).

- [ ] **Step 3: Run** `npx vitest run tests/unit/history.test.ts` and `npx playwright test tests/e2e/routes.spec.ts tests/e2e/wheel.spec.ts --project=chromium`. Expected: FAIL.

- [ ] **Step 4: Implement.**
  - `historyOp` gets `main`'s `MOVES` set and return type back.
  - In `onState`: when `leftNotFound`, write `'replace'`; otherwise write whatever `historyOp` returns, unless it's `'none'`. Nothing is written while About shows, as now.

- [ ] **Step 5: Docs.**
  - **`docs/ROADMAP.md`, the URL redesign row's "Changes from the spec":** add "§4: replaced by the [history rule](superpowers/specs/2026-11-14-feels-on-wheels-history-rule-design.md), back to `main`'s: picking a word or a place adds an entry, and moving by direction replaces it."
  - **The "Going back on phones" known issue:** rewrite it in Lucas's words. Swiping back doesn't work at all on the wheel, because it takes every touch, so the browser's Back button is the only way back. An app installed to the iPhone home screen has no Back at all. Lucas (2026-11-14): better history rules for phones wait on an in-app back button.
  - **The "Return to the word you jumped from" idea:** update its mention of §4.
  - **`ACCESSIBILITY.md`:** keep its known limitations in step.

- [ ] **Step 6: Run everything.** `npm run build`, `npm run size`, `npx vitest run`, `npm run test:e2e` (all five projects). Expected: all pass.

- [ ] **Step 7: Commit.** `git add -A && git commit -m "History: picking a word or a place adds an entry again; moving by direction replaces"`

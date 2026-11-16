# The wheel and the card: start on Happy, Back to the word you jumped from, and breadcrumb colors

Date: 2026-11-15. A small change: the roadmap's three "The wheel and the card" ideas, shipped together. The underline idea is dropped and replaced by the breadcrumb fix in §3.

## Why

- **Start:** the wheel always opens on Fearful, an unfortunate first word to see every time.
- **Back to:** after jumping from the body wheel to the feelings wheel, the only way back is the browser's Back, which is awkward on phones and missing in the installed app ([going back on phones](../../ROADMAP.md#navigation)).
- **Breadcrumbs:** on the body wheel, an opened feeling's breadcrumbs (its area and sensation) light up in the opened word's color on hover instead of their own.

## 1. Start on Happy, at 3 o'clock

- The feelings wheel starts on Happy instead of Fearful.
- **Phones (half-wheel and side views):** the intro spin lands with Happy at 3 o'clock, where Fearful rests today (`halfRestRotation`). With reduced motion, it starts there without the spin, as today.
- **Desktop (whole wheel):** the same resting rotation as phones, with the start word at 3 o'clock, but no spin. Today desktop starts at `DEFAULT_ROTATION`, with Fearful at 12 o'clock and another core word at 3 o'clock; that constant goes away. This also makes the keys' starting word (the core at 3 o'clock, question-first spec) the one the wheel visibly rests on.
- **The body wheel** starts on Whole body at 3 o'clock, instead of Head.
- These are the wedges the base link previews already show pointing right, at 3 o'clock (`OG_BASE` in `src/og.ts`: Happy for `/`, Whole body for `/body`), so a wheel's preview and its start match.
- The start word comes from the wheel file: a `start` field naming one of its core words (`"start": "happy"` in `core.json`, `"start": "whole-body"` in `body.json`), checked when the data loads. `OG_BASE` goes away, and the previews read each wheel's `start` instead, so the two can't drift apart.
- Unchanged: deep links and jumps open their word; Start over, closing, and returning from About keep the rotation they have.

### Tests

- Tests that assume Fearful at rest move to Happy: the phone test that expects Fearful centered after the intro (`wheel.spec.ts:612`), and the controller tests that use `DEFAULT_ROTATION` (`controller.test.ts:917`).
- Desktop tests that assume Fearful at 12 o'clock now find the start word at 3 o'clock.
- New: on both wheels, a phone's intro lands on the wheel's start word at 3 o'clock, and desktop rests with it there. Unit tests for the `start` field (it must name a core word) and for the previews still choosing Happy and Whole body.
- The viewport sweep counts labels at rest in tiny windows, and the words resting there change. Run it, and update any count that changes as an expected result of the new start.

## 2. Back to the word you jumped from

- After a jump from another wheel to the first wheel (the card's "See … on the feelings wheel" link, or the core-feeling link in the definition), a small pill shows just above the opened card, in the card's column (`#float`): **"Back to {word}"**, naming the word you jumped from, with a back chevron.
- Tapping it takes you back to the wheel and word you came from, with its card open again.
- It goes away the moment you navigate: another word (tapped on the wheel, picked from the card, or landed on by a spin), closing the card, switching wheels, Start over, About, or Back. Changing the theme or sharing leaves it in place. It lives only in memory, so a reload drops it too.
- It's a real link to the word's address, so ⌘-click and Copy Link work like the card's other links. A plain click goes back in history, since the jump added the entry it came from (the same as About's "Back to the wheel").
- It comes before the card in focus order. After tapping it, focus goes to the reopened card's toggle.
- Its look follows the toolbar's buttons (a pill, the surface color, the panel edge), and forced colors keep the system's button colors.
- **The opened word's placement doesn't change.** It's a small pill; the opened-word and card-height math (`openedYForHeight`) stays as it is. If it covers the opened word at the smallest phone size, that goes in the known issues.
- Only the jump to the first wheel exists today, so that's the only direction. The emoji wheel will have to decide its own.

## 3. Breadcrumbs in their own feeling's color

- Each breadcrumb takes its own feeling's ink on hover and focus, as the "Narrow it down" and "Close to" rows already do: in `card.ts`, the breadcrumbs use `#inkedLink` instead of `#link`.
- On the body wheel, an opened feeling's area and sensation breadcrumbs then light up in the area's color, not the feeling's. On the feelings wheel, breadcrumbs already share their core's hue, so nothing visible changes there.
- No underline color changes anywhere. The underline idea is dropped.

## Approaches

### Why the start isn't random

Lucas first chose a random core word on every visit, so no one sees the same word first every time. It was dropped because every way to keep the tests deterministic with it was bad:

- **A test-only hook the app reads** (`window.__fwStart`, or a `fw-start` key in localStorage preloaded by Playwright's `storageState`): code in the shipped app that exists only to change its behavior for tests.
- **Swapping in the old fixed start behind the test build's `TEST` flag:** the test build would behave differently from the shipped one. Today `TEST` only adds instrumentation (draw timings, leak-check references, the `__fw` hook), never different behavior.
- **An address option** (`?start=happy`): a public URL feature only for tests, and shareable.
- **Stubbing `Math.random` before each page loads:** Playwright has no config option for init scripts and no hook that runs before every test in every file, so every spec would have to know to import `test` from a shared fixture.
- **Tests that pass wherever the wheel starts:** no hooks, but a test that breaks for some starts fails only now and then, and the viewport sweep's label counts would vary from run to run.

The rule behind it, for future changes: no conditionals or mechanisms in the app that alter its behavior only to support tests. A gentler fixed start fixes the first-word problem without any of them.

### The other parts

- **Where Back to goes:** Lucas chose a pill above the opened card. The toolbar's second slot is already Share or Start over, and a control inside the card would scroll away with its body.
- **Making room for the pill on phones:** considered counting its height in the opened-word placement. Lucas chose not to: it's small enough as it is.

## Not in this change

- A random or daily start (see above).
- Underlines in each feeling's color, and colored row dividers.
- A way back for anything but the jump (an in-app back button for phones in general).

## Left to the builder

- How `halfRestRotation` generalizes from the first core word to the wheel's `start`, and where `start` is validated.
- The pill's exact spacing, the chevron icon, and the locale key's name (`backTo`: "Back to {label}").
- How the pill hears about navigation (store changes, `fw-wheel`, popstate, About), as long as every case in §2 dismisses it.
- When it ships: the roadmap (Shipped row, delete the three ideas and point the emoji wheel's link elsewhere), and `ACCESSIBILITY.md`'s known limitations for going back on phones.

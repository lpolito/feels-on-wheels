# Screenshots of every layout, in Chromatic

Approved by Lucas on 2026-11-18. Designed with him that day, after a spike that uploaded four builds to Chromatic. Choices are his unless marked as Claude's call. It builds the roadmap idea [Snapshots across devices and window sizes](../../ROADMAP.md#snapshots-across-devices-and-window-sizes).

## Why

Lucas only sees how the app looks at other screen sizes when Claude takes screenshots by hand. He wants to flip through every layout the app has (phones and tablets upright and sideways, laptops, desktops) whenever he likes, and Claude wants the same pictures to check its own work. The point is the layouts. Catching changes between runs comes with Chromatic, but it isn't why this exists.

## Goals, non-goals, anti-goals

- **Goal:** one picture of each screen at each layout the app has, in Chromatic, where Lucas can browse them and compare against the last accepted run.
- **Goal:** Claude can take and read the same pictures from a session.
- **Non-goal:** dark mode. Light only (Lucas, 2026-11-18).
- **Non-goal:** other browsers. Chromatic captures from Chromium only, so these are Chromium pictures at each size, not Safari on an iPhone. The end-to-end tests keep covering the five browsers.
- **Non-goal:** sending the end-to-end suite to Chromatic. The screenshots are their own small suite, and they check nothing beyond "it loaded and settled".
- **Anti-goal:** pictures taken while the wheel is still moving or the layout is still settling. Lucas found this in the spike's first builds; a picture that doesn't match what someone sees is worse than none.
- **Anti-goal:** running out of Chromatic's free plan (5,000 snapshots a month).
- **Anti-goal:** code in the app that exists only for the screenshots (no test-only code paths).

## Approaches

Considered:

1. **Chromatic's Playwright integration** (chosen by Lucas). Playwright opens each screen, and Chromatic stores the page (its HTML, CSS, assets, and the wheel's canvas as an image), draws it in its own Chrome, and keeps the pictures with a review screen and comparisons against the last accepted run. The cost: text outside the canvas is drawn again on Chromatic's Linux machines, likely in a wider fallback font than real devices use (see [Wide fallback fonts](../../ROADMAP.md#layout-and-labels)), so the tightest layouts can look more cramped there than on a phone. Lucas chose it anyway, to see how bad it is; at the spike's five sizes, everything still fit.
2. **Our own screenshots**, taken by Playwright on macOS in Chromium, Firefox and WebKit, kept as a gallery. Exact fonts and real engines, free, and readable by Claude without a sign-in, but no hosted review screen and no comparisons.
3. **Playwright's `toHaveScreenshot`**, with the pictures committed to the repo. Pixel comparisons on every run, but pictures in git, which change with every layout tweak and differ between machines.

## What gets captured

### Sizes: real devices

The sizes are real devices, held both ways (Lucas, 2026-11-18). What started this was an iPad: Lucas saw it get a desktop-like layout where a phone-like one would suit it better, and judging that needs the iPad's own size, not a size picked to sit on one side of a rule. (The layout he wants is its own idea: [Half-wheel on tablets, card on the right](../../ROADMAP.md#half-wheel-on-tablets-card-on-the-right).)

| Device | Upright | Sideways |
|---|---|---|
| iPhone SE (3rd gen) | 375 × 667 | 667 × 375 |
| iPhone 15 | 393 × 659 | 734 × 343 |
| iPhone 15 Pro Max | 430 × 739 | 814 × 380 |
| Pixel 7 | 412 × 839 | 863 × 360 |
| iPad mini | 744 × 1133 | 1133 × 744 |
| iPad Air 11" | 820 × 1180 | 1180 × 820 |
| iPad Pro 13" | 1032 × 1376 | 1376 × 1032 |
| Galaxy Tab S9 | 640 × 1024 | 1024 × 640 |
| iPad Air 11", half of Split View | 590 × 820 | |
| Laptop | 1440 × 900 | |
| Desktop | 1920 × 1080 | |

That's 19 sizes. Where Playwright has the device, its size is used: for iPhones and Pixels that's the part of the screen the page gets, after the browser's own bars. iPad mini, iPad Air and iPad Pro 13" aren't in Playwright's list, so they use the full screen size in CSS pixels, which is a little taller than Safari leaves the page. Phones and tablets are captured as touch screens (the message uses its tap wording), the laptop and desktop with a mouse. (Claude's call: which devices. They're the common ones from each family; Lucas adds any he wants to see.)

For reading the pictures, the layout rules they land on (Claude's reading of the code on `main` after #19, 2026-11-18):

- **Where the card goes.** Portrait puts the card under the wheel, sideways puts it in a column on the right. Portrait is: taller than wide, or under 720 px wide and at least 480 px tall, or under 560 px wide (`isPortrait`, `src/camera.ts`). So every iPad held sideways gets the side column, like a desktop.
- **How the wheel rests.** In portrait, the half-wheel or the whole wheel, by whether the outer labels would be at least 12 px tall; since #19 one rule decides for both wheels, using the smaller of their outer cells (`restView`, `useHalfWheel`, `shouldStartZoomed`). Sideways and under 480 px tall, the wheel rests on its core ring beside the card (`side`); taller sideways windows rest on the whole wheel.
- **The toolbar.** Under 26rem (416 px), Start over shows only its icon. Under 360 px, the switch and toolbar tighten up (`src/styles/app.css`).

### Screens

| Screen | Path | Sizes |
|---|---|---|
| Feelings wheel at rest | `/` | all |
| Body wheel at rest | `/body` | all |
| A core feeling opened | `/angry` | all |
| A deeper feeling opened | `/happy/playful` | all |
| A body area opened | `/body/chest` | all |
| A sensation opened | `/body/chest/tight-chest` | all |
| About | `/about` | iPhone 15, iPad Air 11" upright, laptop |
| Not found | `/happy/plaful` | iPhone 15, iPad Air 11" upright, laptop |

About and not found change little between sizes, so three sizes each are enough (Claude's call). That's 19 × 6 + 2 × 3 = **120 snapshots a run**.

## When it runs

**On request only** (Claude's call, from the budget). At 120 snapshots a run, the free plan's 5,000 a month is about 40 runs.

- **On a PR:** only when it has a `screenshots` label, or when started by hand from the Actions tab. Adding the label starts a run; each later push to that PR runs again while the label is on, so the label comes off once the pictures have been looked at.
- **No run on main.** Chromatic follows git history, so what's accepted on a PR's build becomes the baseline for main once it merges, without a run of its own. PRs here are squash-merged, which Chromatic can only follow because the project is linked to the GitHub repo (it is, since the spike); the builder checks this on the first merge and adds a run on main if it doesn't hold. A PR without the label simply isn't compared.
- **From a session:** Claude can run the same two commands locally with the token in an environment variable, and read the pictures in Chromatic's review screen.

The run isn't a required check; a change shown in Chromatic doesn't block merging. If the budget runs tight, the first things to cut are the Pixel and the Galaxy Tab (closest to an iPhone and an iPad), then the second depth of opened words.

The project token lives in a GitHub Actions secret, `CHROMATIC_PROJECT_TOKEN`, which Lucas adds. It's never written into the repo.

## What the spike taught (for the builder)

The spike (four builds on 2026-11-18) found three things that make the pictures wrong if missed:

1. **One test per size.** With one test name captured at several sizes (Playwright projects), Chromatic's loader (`@chromatic-com/playwright` 1.0.0) asks for each size's capture, misses it, and shows the default size's capture instead: on the phone, a squeezed desktop wheel with mouse wording. Each size needs its own test name (a `describe` per size with `test.use({ viewport })`, for example).
2. **Remove the script tags before the snapshot.** The stored page keeps the app's script, which Chromatic runs again in its own browser, mid-resize, drawing a different wheel. Removing the `<script>` elements after the app has settled keeps the page as captured. This happens in the test, not the app.
3. **Capture at 2×.** Chromatic draws its pictures at twice the size, so capturing at `deviceScaleFactor: 2` keeps the wheel's canvas sharp.

Also: wait for the wheel to stop (`window.__fw.moving()`) and for CSS transitions to end before the snapshot, as the end-to-end helpers already do. Each run uploads about 20 MB, mostly the wheel images.

## Where it lives

- `tests/screenshots/` for the suite, with its own Playwright config that reuses the main one's server (the test build under `wrangler dev`), so `npm run test:e2e` never runs it.
- `npm run screenshots` runs the suite; `npx chromatic --playwright` uploads it.
- A `screenshots` job in its own workflow (not `ci.yml`, so it can't become a required check), on macOS like the end-to-end tests.
- `CONTRIBUTING.md` says how to run it and how to see the results.

## Related

- [Check every test is worth keeping](../../ROADMAP.md#check-every-test-is-worth-keeping) asks whether "a single snapshot" could replace the content tests. That means a saved copy of the wheel's data, not screenshots. Separately, the viewport sweep (`tests/e2e/viewports.spec.ts`) keeps checking that nothing overlaps; the screenshots show what it can't say.
- #19 (merged 2026-11-18) changed how many screens look; the spike's builds predate it, so the first run of this suite becomes the baseline.

## Left to the builder

- Which body area and sensation look most typical, if Chest › Tight chest doesn't.
- Whether to also snapshot a selected (not opened) word, if it looks different enough from rest.
- The workflow's exact triggers and Chromatic flags, within the rules above.

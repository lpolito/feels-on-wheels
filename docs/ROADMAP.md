# Roadmap: Feels on Wheels

The living list of what's built, what's next, and what's still an idea. Specs are frozen once approved; this file is not. Update it when a spec is approved, when a change ships, and whenever new or later work comes up, so nothing lives only in a chat.

**Aim:** every way to identify an emotion, in a fast, accessible, lightweight feelings wheel that works offline, installs as an app, and supports light and dark mode. Built for Lucas first and meant to go public later.

## Shipped

Each change is used before the next one is designed. When Lucas picks an idea to build, it moves into this table, named by what it does. Older rows keep the version numbers they shipped with. Where what shipped differs from its spec, the differences are in a changes file next to the spec, linked as *changes*. The feedback behind each shipped change is in its spec, and in the git history for v1.3.1.

| Change | Status | Spec and plan |
|---|---|---|
| v1: Core wheel | Shipped | [spec](superpowers/specs/2026-11-06-feelings-wheel-v1-design.md), [plan](superpowers/plans/2026-11-06-feelings-wheel-v1.md) |
| v1.1: Selected and opened states, card redesign | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.1-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.1.md) |
| v1.2: Fixes and polish from using v1.1 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.2-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.2.md) |
| v1.3: Layout, card and controls polish from using v1.2 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.3-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.3.md) |
| v1.3.1: Small fixes from using v1.3 | Shipped | No spec or plan. Commits 3fb060e, def355a, b340a1a. |
| v2: Body sensations wheel | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2-body-wheel-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2-body-wheel.md) |
| v2.1: Polish from using v2 (card headings, heartbeat, sliding switch, context-ring labels, sideways phones, body colors) | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2.1-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2.1.md), [changes](superpowers/specs/2026-11-08-feelings-wheel-v2.1-changes.md) |
| v2.2: Polish from using v2.1 (wheel under the card's column, one-line breadcrumbs, halo dot, core feeling on the body wheel, message heading, no wheel chevron) | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2.2-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2.2.md) |
| v2.2.1: Sideways phones with the notch on the left: the opened word keeps 1rem clear of the notch, not the screen's edge | Shipped | No spec or plan. Fixes the known issue found using v2.2: the camera's left margin now starts after `safe-area-inset-left`. Commits on main after 9fc8944. |
| Going public, step 1: shareable | Shipped 2026-11-09 | [spec](superpowers/specs/2026-11-09-feels-on-wheels-going-public-design.md), [plan](superpowers/plans/2026-11-09-feels-on-wheels-going-public.md) |
| Going public: Cloudflare, feelsonwheels.app and About at `/about` | Shipped 2026-11-13 | [spec](superpowers/specs/2026-11-13-feels-on-wheels-cloudflare-domain-design.md), [plan](superpowers/plans/2026-11-13-feels-on-wheels-cloudflare-domain.md), [changes](superpowers/specs/2026-11-13-feels-on-wheels-cloudflare-domain-changes.md) |
| <a id="real-paths-a-small-router-and-cleaner-urls"></a>URLs: real paths, a small router, and a Worker for first visits | Shipped 2026-11-14 | [spec](superpowers/specs/2026-11-13-feels-on-wheels-urls-routing-design.md), [plan](superpowers/plans/2026-11-13-feels-on-wheels-urls-routing.md), [changes](superpowers/specs/2026-11-13-feels-on-wheels-urls-routing-changes.md) |
| <a id="about-page-rework"></a><a id="the-about-page-1"></a>About page rework: why it exists with a sign-off, install steps, the GitHub icon and fixed credit links | Shipped 2026-11-14 | [spec](superpowers/specs/2026-11-14-feels-on-wheels-about-rework-design.md), [plan](superpowers/plans/2026-11-14-feels-on-wheels-about-rework.md), [changes](superpowers/specs/2026-11-14-feels-on-wheels-about-rework-changes.md) |
| Keys turn the wheel, no focus ring after a tap, real links on the card, new tabs on About, and tap the opened word to close it | Shipped 2026-11-14 | [spec](superpowers/specs/2026-11-14-feels-on-wheels-keys-and-focus-design.md), [plan](superpowers/plans/2026-11-14-feels-on-wheels-keys-and-focus.md), [changes](superpowers/specs/2026-11-14-feels-on-wheels-keys-and-focus-changes.md) |
| Share buttons, About in the start message, and per-feeling link previews | Shipped 2026-11-15 | [spec](superpowers/specs/2026-11-15-feels-on-wheels-share-and-preview-design.md), [plan](superpowers/plans/2026-11-15-feels-on-wheels-share-and-preview.md), [changes](superpowers/specs/2026-11-15-feels-on-wheels-share-and-preview-changes.md) |
| Question first in page order, Tab onto the wheel selects nothing, a ring around the focused wheel, and the instruction by device | Shipped 2026-11-15 | [spec](superpowers/specs/2026-11-15-feels-on-wheels-question-first-design.md), [plan](superpowers/plans/2026-11-15-feels-on-wheels-question-first.md), [changes](superpowers/specs/2026-11-15-feels-on-wheels-question-first-changes.md) |
| <a id="the-wheel-and-the-card"></a><a id="a-different-word-to-start-on"></a><a id="return-to-the-word-you-jumped-from"></a><a id="feeling-links-underlined-in-their-feelings-color"></a>Start on Happy and Whole body at 3 o'clock, Back to the word you jumped from, and breadcrumbs in their own color | In progress | [spec](superpowers/specs/2026-11-15-feels-on-wheels-wheel-and-card-design.md) |

## Ideas

Not in any order; none is chosen yet. They're grouped by what they touch, and ideas in one group are worth designing together. Strength was briefly v2 before it was shelved, so older docs and commits call it v2; v2 is now the body sensations wheel.

| Idea | Group | Status |
|---|---|---|
| [Wizard](#wizard) | [New ways to identify an emotion](#new-ways-to-identify-an-emotion) | Idea |
| [Emoji wheel](#emoji-wheel) | New ways to identify an emotion | Planned |
| [Strength](#strength) | New ways to identify an emotion | Shelved (2026-11-08) |
| [Wheels for kids](#wheels-for-kids) | New ways to identify an emotion | Idea |
| [Rework the body wheel's areas and sensations](#rework-the-body-wheels-areas-and-sensations) | [The body wheel's content](#the-body-wheels-content) | Idea |
| [Languages](#languages) | [URLs, routing and hosting](#urls-routing-and-hosting) | Planned |
| ["Did you mean" on not found](#did-you-mean-on-not-found) | URLs, routing and hosting | Idea |
| [Start over on not found](#start-over-on-not-found) | URLs, routing and hosting | Idea |

These are what Lucas asked for. Each idea's brainstorm starts here. The sources named below are described in [reference/](reference/README.md).

### New ways to identify an emotion

Each of these is a big change of its own, not polish to what's there.

#### Wizard

- A guided flow that helps you land on a specific word already in the wheel.
- Lucas's idea, mentioned 2026-11-08 when shelving strength. Not yet described further; ask him before designing it.
- May cover the need [strength](#strength) was meant for.

#### Emoji wheel

- Very simplified: core feelings and a few middle-ring ones, because there are only so many emoji.
- The data is ready: `Feeling.emoji` is already an optional field.
- After v2, another wheel is a wheel file, an entry in the wheel list and its locale strings; the switch, URLs, colors and card handle it (v2 spec §7).
- A third wheel is when the [Back to pill](superpowers/specs/2026-11-15-feels-on-wheels-wheel-and-card-design.md#2-back-to-the-word-you-jumped-from) has to work across more than two wheels, and the switch's third option meets the [wide fallback fonts](#layout-and-labels) known issue.

#### Strength

Shelved on 2026-11-08 during its first brainstorm: Lucas doesn't see it as needed right now. The [wizard](#wizard) may cover the same need by helping land on words already in the wheel. If strength comes back, start from these notes.

- **Purpose, if revived:** naming *how much* of a feeling already found (irked, then irritated, then seething), not entering the wheel by intensity or adding Drummond's whole vocabulary.
- **Where it was heading:** Drummond's columns fit the wheel's middle ring better than its core feelings (*lonely* is Loneliness, *guilty* is Remorse, *hurt* is Hurt, *depressed* is Depression, *confused* is Confusion, *mad* is Anger, *scared* is Fear, *trusting* is Caring). Mapping to core feelings would put four columns under Sad. Still undecided: core only, a ladder per middle word (outer words showing their parent's), or a ladder per word.

What Lucas first asked for:

- A toggle for strong, medium and light, like Tom Drummond's [Vocabulary of Emotions](reference/drummond-vocabulary-of-emotions.md).
- The panel lists a feeling's words at each strength.
- **Open question:** Drummond's chart has 10 categories (Happiness, Caring, Depression, Inadequateness, Fear, Confusion, Hurt, Anger, Loneliness, Remorse) that don't match the wheel's 7 core feelings. Its design has to decide whether to map them onto the wheel, give them their own wheel, or only tag the wheel's existing words.
- **Data model:** the optional `Feeling.strength` field (one value per word) isn't enough. In Drummond's chart, 22 words have different strengths in different categories (*Resentful* is Anger medium and Anger light), so strength has to live on a word within a category or a wheel position.

#### Wheels for kids

- Simplified wheels for kids, Lucas's idea, 2026-11-14: fewer nested rings, and more approachable words and definitions, ones kids might use themselves.
- Three sizes, all with kids in mind: a super simple wheel of one tier, plus two- and three-tier ones.
- To decide when designing:
  - whether they're kid versions of both the feelings and body wheels, or of the feelings wheel only;
  - where the kids' wheels go in the wheel switch, which already struggles to fit a third option (the [wide fallback fonts](#layout-and-labels) known issue), and how you pick one of the three sizes;
  - whether a one-tier wheel still opens a card, and what's on it;
  - their URLs, and whether a kids' word links to the same word on the grown-up wheel;
  - where the words come from, since any new source gets a [reference note](reference/README.md) and a credit.
- Overlaps with the [emoji wheel](#emoji-wheel), which is also a simplified wheel; worth designing them together.

### The body wheel's content

#### Rework the body wheel's areas and sensations

Lucas, 2026-11-14: the body wheel needs reworking to be more consistent.

- **The areas mix two kinds of thing.** Some are specific body parts (head, face, chest, stomach, arms) and some are general areas or ways of holding yourself (breath, whole body, posture). Should they be one or the other?
- **Some sensations aren't sensations, but actions,** such as smiling, a gasp, clenched fists, turning away and shrinking, next to felt ones like a racing heart or a knot in your stomach. Some also sit oddly under their area (tense shoulders under arms, a lump in your throat under breath).
- To decide when designing: one rule for what an area is and one for what a sensation is, what happens to the words that don't fit (dropped, reworded as a feeling, or a place of their own), and how URLs to moved or renamed sensations keep working.
- Meets the [definitions and sensations review](#before-launching) in [content-review.md](content-review.md), so it's worth doing before or with it.

### URLs, routing and hosting

What's left after the [URL redesign](superpowers/specs/2026-11-13-feels-on-wheels-urls-routing-design.md), which settled the URL structure: [languages](#languages) fill the room it leaves for them, and ["Did you mean"](#did-you-mean-on-not-found) and [Start over](#start-over-on-not-found) build on its not-found message.

#### "Did you mean" on not found

- On the not-found message, a "Did you mean Playful?" link when the address's last part is a real word in the wrong place (`/playful`, `/sad/playful`) or one letter off from one (`plaful`). Lucas, 2026-11-13, left out of the [URL redesign](superpowers/specs/2026-11-13-feels-on-wheels-urls-routing-design.md) to keep it small.
- Without it, not found names the word ("There's no "plaful" on the wheel.") and points to the other wheel.
- To decide when designing: how close counts as a typo, and which place to suggest when the word sits in more than one.

#### Start over on not found

- Lucas, 2026-11-14: the not-found message shows the Start over button. Tapping it replaces the mistyped address (a history replace, not a new entry) with the nearest base wheel: `/body` for an address under the body wheel, `/` otherwise.
- Today Start over shows only while a word is selected, and not found shows the whole wheel with nothing selected, so the button is hidden; the only way on is the message's link to the other wheel, or picking a word.
- To decide when designing: what "nearest" means for an address that names no wheel, where focus goes after it, and whether it meets ["Did you mean"](#did-you-mean-on-not-found) on the same message.

#### Languages

- Spanish first (the [reference site](reference/core-feelings-wheel.md#the-reference-site) had an Español toggle, and Braman publishes a Spanish wheel), plus a language switcher.
- Adding a language means adding one locale file; no text is hard-coded.
- To decide when designing: stable English slugs in every language (`/es/happy/…`) or translated ones (`/es/feliz/…`). The URL shape (a `/es/` prefix, English unprefixed) is set by the [URL redesign spec](superpowers/specs/2026-11-13-feels-on-wheels-urls-routing-design.md) §9.
- The link preview's alt text lowercases the wheel's name in code (`src/og.ts`: "the feelings wheel"), which is wrong for languages that capitalize nouns, such as German. To decide when designing: a separate lowercase name per wheel in the locale, or alt text written whole per wheel.

## Known issues

Still open. None blocks the next change. The ones that get in someone's way are also listed, in plain words, under known limitations in [ACCESSIBILITY.md](../ACCESSIBILITY.md#known-limitations); keep the two in step.

### Phones: turning and zooming

These may share a cause: the browser's own zoom or text inflation, which the app doesn't account for. Worth looking at together.

- **Turning the phone makes the card's text huge.** Found 2026-11-12: going from portrait to sideways and back leaves the description text very large, possibly only when a word is open as it turns. Likely cause: Safari on iOS enlarges text when the phone turns unless told not to. `about.css` sets `-webkit-text-size-adjust: 100%`, but `app.css` doesn't. Likely fix: the same in `app.css`. No fix chosen yet.
- **After turning the phone several times, taps land in the wrong place.** Found 2026-11-12: words stopped opening and closing, and a tap on a word acted on another. Swiping back fixed it. Not yet known whether it's the app or the browser. Worth checking first: a leftover page zoom from turning, and whether the app's mapping from a tap to a word uses a stale position of the wheel.
- **Double-tapping the toolbar's or the card's labels zooms the page.** Found 2026-11-09 using v2.2.1, mostly on phones while tapping through the theme choices: a quick second tap lands on the label that shows the choice (`.fw-theme-label`, v1.3 §6.2) and the browser zooms into it. The "Link copied" labels under the toolbar's and the card's Share (`.fw-share-label`, [share change](superpowers/specs/2026-11-15-feels-on-wheels-share-and-preview-design.md)) follow the same rule, so they likely do the same. Pinching out doesn't undo it on iOS (Lucas, 2026-11-12), likely because the wheel's canvas takes every pinch for itself (`touch-action: none`); the only way back is double-tapping the label again while it's showing, and once the label goes, that's gone too. Each label takes taps while shown, so a tap on it never reaches the wheel beneath, and as plain text it gets the browser's double-tap-to-zoom; the button beside it doesn't. Likely fix: `touch-action: manipulation` on the labels (or the toolbar and the card's bar), which turns off double-tap zoom there while leaving pinch zoom alone. No fix chosen yet.

### Layout and labels

- **Wide fallback fonts don't fit the tightest layouts.** Found 2026-11-09 when the end-to-end tests first ran on GitHub's Ubuntu runners, whose `system-ui` font is DejaVu Sans, much wider than the system fonts on Apple, Android and Windows devices. With it:
  - the wheel switch and toolbar overlap on 280 px screens;
  - the switch's planned third option no longer fits at 320 px;
  - the feelings wheel rests with no core labels in 500 × 300 and 400 × 350 windows.

  This only affects Linux desktops with a wide default font, at window sizes few people use. The tests now run on macOS runners. A likely fix is measuring the switch's and labels' real widths rather than assuming a font. No fix chosen yet.
- **An opened word's long label spills past its cell.** Found 2026-11-09 using v2.2.1, on the body wheel's long words (Chest › Hollow feeling in your chest, Warmth in your chest): when opened, the label runs past both ends of the lifted cell. The renderer fits the label to the cell's normal box at the regular weight (600), then draws it 1.15× larger (`LIFT_LABEL`) and bold (800), while the lifted cell only grows 10 px at each end (`LIFT_RADIAL_PX`). Short words have room to spare; a label that already fills its box grows by about 15% plus bold's extra width, far more than 20 px. Likely fix: fit the opened label in the lifted box at its bold weight and capped at 1.15×, so it grows only as much as it fits. No fix chosen yet.
- **Portrait phones, inner tier opened: the outer ring runs off the right edge.** v2.1 made its labels draw (10 px floor on context rings) but left the camera alone, so some outer labels are cut off at the screen's edge. Lucas wanted to try that first (v2.1 spec §1, out of scope); moving the wheel left is the fix if it bothers him.
- **Tiny, short windows show the body wheel unlabeled at rest.** At about 560 × 320 and smaller (split screen, 500 × 300), the whole-wheel view is too small for any area label ("Breath and throat"), so the body wheel rests without labels until you open something. The feelings wheel's short words still fit. It was like this before v2.1; the viewport sweep (`tests/e2e/viewports.spec.ts`) pins it so a fix shows up there.
- **Very short phones.** When the card cap's safeguard is active, the opened word can sit under the toolbar: v1.3 spec §4.2 measures the gap from the stage's top, not the toolbar's bottom. (v1.3 review)

### Navigation

- **Going back on phones.** Swiping back doesn't work at all on the wheel: it takes every touch, so the browser's Back button is the only way back. An app installed to the iPhone home screen has no Back at all. Lucas (2026-11-14): better history rules for phones wait on an in-app back button. History follows the [history rule](superpowers/specs/2026-11-14-feels-on-wheels-history-rule-design.md): picking a word or a place adds an entry, moving by direction replaces it. Related: the [Back to pill](superpowers/specs/2026-11-15-feels-on-wheels-wheel-and-card-design.md#2-back-to-the-word-you-jumped-from) (in progress) is a way back without the browser's Back, for the jump between wheels only.
- **With VoiceOver on iPhone, the wheel's words can't be reached.** Lucas tried it on 2026-11-15, after the [question-first change](superpowers/specs/2026-11-15-feels-on-wheels-question-first-design.md): swiping through the page kept repeating the headings or whatever had focus, and never got to a word on the wheel, so he couldn't select one. He's new to VoiceOver, so it isn't yet known how much is the app and how much is how it was used; it needs someone who uses VoiceOver daily, or a careful walk-through. Likely causes, worth checking together:
  - the tree is visually hidden (`.visually-hidden`: 1 px, clipped), and VoiceOver on iPhone moves by what it finds on screen, so it may skip a 1 px element or struggle to land in it;
  - VoiceOver on iPhone and TalkBack barely support `role="tree"`;
  - they act on an item by double-tapping it, which sends a click, and the tree's words listen only for keys (`src/a11y/tree.ts` has no click handling), so even a reached word likely can't be selected.

  TalkBack hasn't been tried. No fix chosen yet.

### Link previews

- **A not-found address shows no link preview.** Found by Lucas 2026-11-15, after the [share change](superpowers/specs/2026-11-15-feels-on-wheels-share-and-preview-design.md): pasting `/aboutss` or `/angry/mads` into a chat shows no card. The page does have its preview tags: checked on the live site that day, it has `og:title` "Not found · Feels on Wheels", the home description and `og:image` `core-happy.png`. But the Worker answers with a 404 status (`src/worker/handler.ts`, URL redesign §7), and most link-preview fetchers (iMessage, Slack, Discord, Facebook) drop previews for error responses. To decide when designing: whether a mistyped link should preview at all; if so, whether not found keeps its 404 for search engines (it already says `noindex`) and how previews can still be shown, or whether the Worker returns 200 for not found. No fix chosen yet.

### Code and tests

- **The perf leak check is flaky.** `tests/perf/switch.spec.ts` sometimes counts 3 live wheels instead of 2 after 20 switches: about 1 run in 10, on main before v2.1 too, so it's garbage-collection timing rather than a leak. Worth a sturdier check (more GC turns, or a retry) before trusting a failure.
- **The end-to-end suite skips offline in WebKit.** Playwright can't emulate offline with a service worker there, so the offline tests run only in Chromium and Firefox. Checked by hand on 2026-11-13 by stopping the server instead: the wheel and About loaded from the cache. A test that stops or blocks the server would cover it.
- **Opened-word position lives in two places.** `main.ts` keeps its own copy of the phone's opened-word position and syncs it into the controller in three places; the controller could own it. (v1.3 review)
- **The card's heading size watcher isn't disconnected when the card hides.** Harmless. (v1.3 review)

## Before launching

<a id="before-going-public"></a>

The app is called **Feels on Wheels** (decided 2026-11-09). Going public happens in two steps: first shareable, then launched. Step 1 [shipped](#shipped) on 2026-11-09. Step 2 is what's left before announcing it and letting search engines index it. The host and the domain (2026-11-13) and the URL structure (2026-11-14) are done; the rest isn't started.

- **Lucas reviews the definitions and sensations** in [content-review.md](content-review.md). This was moved out of v1.1.
- **Draft text for Lucas to edit:** the body wheel's preview description ("Start from what you notice in your body to find the word for what you feel.") is a draft, and it's shorter than the 100 to 160 characters the home description uses.
- **Let search engines in:** set `indexable: true` in `site.config.ts` (removes `noindex`), deploy, and re-check the link previews.
  - Decide first whether the `workers.dev` address and the preview links should say `noindex` once the domain is indexable, since they serve the same pages.
- **Optional, after letting search engines in:** add the site to Google Search Console and Bing Webmaster Tools and submit the sitemap.
- **Add the icon to lucaspolito.dev**, linking the domain, not github.io. Follow `docs/website-icon/README.md`. Chosen 2026-11-09: the app icon's silhouette, gray like the site's other icons; on hover it takes the wheel's seven colors and spins once, settling.
- **Known issues and ideas:** decide which to finish before announcing it. Help adding it to the home screen and a dark home-screen icon were dropped (2026-11-15).

## Content rules

- There are only so many ways to describe a feeling or a body sensation, so overlap with existing wheels and word lists is unavoidable and fine.
- Don't copy any source verbatim, and don't reproduce a source's full layout or word list wholesale.
- Definitions are short, plain-language prose (see v1 spec §3.4).
- Credit every source we draw on, in [reference/](reference/README.md) and on the app's credits page, whether or not a license requires it.

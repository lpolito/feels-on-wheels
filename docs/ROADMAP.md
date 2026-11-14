# Roadmap: Feels on Wheels

The living list of what's built, what's next, and what's still an idea. Specs are frozen once approved; this file is not. Update it when a spec is approved, when a change ships, and whenever new or later work comes up, so nothing lives only in a chat.

**Aim:** every way to identify an emotion, in a fast, accessible, lightweight feelings wheel that works offline, installs as an app, and supports light and dark mode. Built for Lucas first and meant to go public later.

## Shipped

Each change is used before the next one is designed. When Lucas picks an idea to build, it moves into this table, named by what it does. Older rows keep the version numbers they shipped with. The feedback behind each shipped change is in its spec, and in the git history for v1.3.1.

| Change | Status | Spec and plan | Changes from the spec |
|---|---|---|---|
| v1: Core wheel | Shipped | [spec](superpowers/specs/2026-11-06-feelings-wheel-v1-design.md), [plan](superpowers/plans/2026-11-06-feelings-wheel-v1.md) | |
| v1.1: Selected and opened states, card redesign | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.1-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.1.md) | |
| v1.2: Fixes and polish from using v1.1 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.2-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.2.md) | |
| v1.3: Layout, card and controls polish from using v1.2 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.3-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.3.md) | |
| v1.3.1: Small fixes from using v1.3 | Shipped | No spec or plan | Commits 3fb060e, def355a, b340a1a. |
| v2: Body sensations wheel | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2-body-wheel-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2-body-wheel.md) | |
| v2.1: Polish from using v2 (card headings, heartbeat, sliding switch, context-ring labels, sideways phones, body colors) | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2.1-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2.1.md) | §6.1: the sideways layout also needs 560 px of width, so small split-screen windows keep the portrait layout instead of a column too thin for the card. |
| v2.2: Polish from using v2.1 (wheel under the card's column, one-line breadcrumbs, halo dot, core feeling on the body wheel, message heading, no wheel chevron) | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2.2-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2.2.md) | |
| v2.2.1: Sideways phones with the notch on the left: the opened word keeps 1rem clear of the notch, not the screen's edge | Shipped | No spec or plan | The fix for the known issue found using v2.2: the camera's left margin now starts after `safe-area-inset-left`. Commits on main after 9fc8944. |
| Going public, step 1: shareable | Shipped 2026-11-09 | [spec](superpowers/specs/2026-11-09-feels-on-wheels-going-public-design.md), [plan](superpowers/plans/2026-11-09-feels-on-wheels-going-public.md) | |
| Going public: Cloudflare, feelsonwheels.app and About at `/about` | Shipped 2026-11-13 | [spec](superpowers/specs/2026-11-13-feels-on-wheels-cloudflare-domain-design.md), [plan](superpowers/plans/2026-11-13-feels-on-wheels-cloudflare-domain.md) | About moved to `/about` after approval, so the offline cache works on Cloudflare (the spec's last section). |
| URLs: real paths, a small router, and a Worker for first visits | Shipped 2026-11-14 | [spec](superpowers/specs/2026-11-13-feels-on-wheels-urls-routing-design.md), [plan](superpowers/plans/2026-11-13-feels-on-wheels-urls-routing.md) | §8: the service worker takes over as soon as it installs, so devices with the old one don't get a blank page on a word's link. §7: it serves a real file (robots.txt, the sitemap) at its own address, and the app only for everything else. §1: a percent-encoded address means the same as the plain one (`/%62ody` is `/body`). §4: replaced by the [history rule](superpowers/specs/2026-11-14-feels-on-wheels-history-rule-design.md) ([plan](superpowers/plans/2026-11-14-feels-on-wheels-history-rule.md)), back to `main`'s: picking a word or a place adds an entry, and moving by direction replaces it. |

## Ideas

Not in any order; none is chosen yet. They're grouped by what they touch, and ideas in one group are worth designing together. Strength was briefly v2 before it was shelved, so older docs and commits call it v2; v2 is now the body sensations wheel.

| Idea | Group | Status |
|---|---|---|
| [Wizard](#wizard) | [New ways to identify an emotion](#new-ways-to-identify-an-emotion) | Idea |
| [Emoji wheel](#emoji-wheel) | New ways to identify an emotion | Planned |
| [Strength](#strength) | New ways to identify an emotion | Shelved (2026-11-08) |
| [Wheels for kids](#wheels-for-kids) | New ways to identify an emotion | Idea |
| [Rework the body wheel's areas and sensations](#rework-the-body-wheels-areas-and-sensations) | [The body wheel's content](#the-body-wheels-content) | Idea |
| [Tap the opened word to close it](#tap-the-opened-word-to-close-it) | [The wheel and the card](#the-wheel-and-the-card) | Idea |
| [A different word to start on](#a-different-word-to-start-on) | The wheel and the card | Idea |
| [Return to the word you jumped from](#return-to-the-word-you-jumped-from) | The wheel and the card | Idea |
| [Feeling links underlined in their feeling's color](#feeling-links-underlined-in-their-feelings-color) | The wheel and the card | Idea |
| [About in the start message](#about-in-the-start-message) | [The toolbar, sharing and installing](#the-toolbar-sharing-and-installing) | Idea |
| [Share button](#share-button) | The toolbar, sharing and installing | Idea |
| [Help adding it to the home screen](#help-adding-it-to-the-home-screen) | The toolbar, sharing and installing | Idea |
| [A dark home-screen icon](#a-dark-home-screen-icon) | The toolbar, sharing and installing | Idea |
| [About page rework](#about-page-rework) | [The About page](#the-about-page) | Idea |
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
- A third wheel is when [return to the word you jumped from](#return-to-the-word-you-jumped-from) has to work across more than two wheels, and the switch's third option meets the [wide fallback fonts](#layout-and-labels) known issue.

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

### The wheel and the card

Polish to what's there; these could ship together as one change.

#### Tap the opened word to close it

- Tapping the opened word's wedge on the wheel closes its card. Lucas's idea, 2026-11-12.
- To decide when designing: whether closing leaves the word selected (one step back) or goes back to the whole wheel, whether a click and the keyboard do the same, and how it meets the phone's half-wheel, where the opened word sits at the aim.

#### A different word to start on

- Lucas's idea, 2026-11-12: the wheel always opens on Fearful, which is an unfortunate first word to see. Could it start somewhere random?
- Why today: the wheel always starts at the same rotation (`DEFAULT_ROTATION` in `src/controller.ts`), with the first core feeling, Fearful, at 12 o'clock as on the reference wheel. So the phone's half-wheel always rests on the same words, and the body wheel on the same area.
- To decide when designing:
  - random on every visit, a gentler fixed start, or something in between (a different word each day);
  - whether the intro spin lands on it;
  - the end-to-end and viewport tests expect a fixed start, so they need a way to pin it.

#### Return to the word you jumped from

- After jumping from the body wheel to the feelings wheel (the "See … on the feelings wheel" link, or v2.2's core-feeling link in the definition), a "Return to …" control takes you back to the body wheel with the card you came from open again.
- Lucas's idea, 2026-11-09. Where it goes is open: on the opened card, as a toolbar button like Start over, or something else.
- Today the only way back is the browser's Back (the jump pushes history, v2 §4.2), which is the awkward gesture in the [going back on phones](#navigation) known issue. The jump still pushes history under the [history rule](superpowers/specs/2026-11-14-feels-on-wheels-history-rule-design.md), so Back returns from it; this idea would add a way back that doesn't need the browser's Back.
- To decide when designing: what the control says ("Back to Wide eyes"?), when it disappears (after moving on, switching wheels by hand, or Start over), and whether it also works the other way, or for the emoji wheel once there are three wheels.

#### Feeling links underlined in their feeling's color

- Every link to a feeling is underlined in that feeling's color, wherever it appears, for consistency: breadcrumbs, the "Narrow it down" and "Could be feeling" rows, the "Close to" and "Could also be feeling" words, v2.2's core-feeling link in the definition, and the jump to the feelings wheel.
- Lucas's idea, 2026-11-09.
- Today (v2.2.1): feeling links are underlined in a 45% tint of the text color, and take their feeling's ink (`--ink`, from `colors.ts` `inkFor`) only on hover or focus. The rows have no underline, only a gray divider below. Breadcrumbs don't carry their own feeling's ink: on hover they take the opened word's.
- To decide when designing:
  - the ink (contrast-checked against the card, so it shows in both themes) or the wheel's own fill (truer to the wheel, but some are too dark or light to see on the card);
  - whether the rows' dividers take the color too, or they get underlines;
  - what areas and sensations do, since they're links too but not feelings;
  - forced colors, where links keep the system's link color.

### The toolbar, sharing and installing

These all compete for the same few places (the toolbar, the start message, the About page), so design them together.

#### About in the start message

- Lucas's idea, 2026-11-12: move the About link from the toolbar into the start message ("the message", v2.2), to free up room and so the phone's toolbar buttons never change place or order. Today on phones About gives way to Start over while a word is selected (going-public spec).
- The freed toolbar slot could hold the [share button](#share-button).
- To decide when designing: how to reach About once the start message is gone (after the first word is opened), since the toolbar link is the only other way; and whether the noscript message's About link changes.

#### Share button

- A share button somewhere. Lucas's idea, 2026-11-12.
- Likely the Web Share API (`navigator.share`) where there is one, phones especially, and copying the link where there isn't.
- To decide when designing:
  - where it goes (toolbar, opened card, About page);
  - whether it shares the app or the opened word. Sharing a word shares its URL, which the [URL redesign](superpowers/specs/2026-11-13-feels-on-wheels-urls-routing-design.md) settles; with its real paths, a shared word gets its own link preview.

#### Help adding it to the home screen

- Lucas's idea, 2026-11-12: Add to Home Screen is buried on iOS, so make it easier, with instructions or a link to how.
- Today the About page has one sentence on it ("Private and offline").
- What's possible: Safari on iOS has no install prompt a page can trigger, so there it can only be instructions (Share, then Add to Home Screen). Chrome and Edge on Android and desktop fire `beforeinstallprompt`, so there it can be a real Install button.
- To decide when designing: where it shows (About, the start message, a one-time hint), how to tell it's already installed (`display-mode: standalone`) so it doesn't nag. Installs at the old github.io address didn't carry over to feelsonwheels.app.

#### A dark home-screen icon

- Lucas's idea, 2026-11-12: an icon that's dark when the phone is in dark mode.
- To research when designing; nothing is checked yet. As far as known, there's no standard way for a web app to give its home-screen icon a dark version: the manifest's icons and `apple-touch-icon` take one image each. What might come close: newer iOS can darken or tint home-screen icons itself, and Android can draw a themed icon from a `monochrome` icon in the manifest. The browser-tab icon (`icon.svg`) can already follow dark mode with a media query inside the SVG.
- Today the manifest's `theme_color` and `background_color` are both white (`build/site.ts`).

### The About page

#### About page rework

**What's on the page** (Lucas, 2026-11-13): make it friendlier by keeping only what a visitor cares about.

- **Keep:** what it's for, how to use it, the credits, Made by, and Help translate.
- **Keep the install steps** from "Private and offline" (install from the browser's menu, or Add to Home Screen on an iPhone or iPad): installing isn't discoverable, and it's a nice thing to find.
- **Drop:** the "Source and license" section, and the rest of "Private and offline" ("who cares"). What they say stays in the README, where it belongs (its License section, and the Private and Offline bullets). Nothing about AI on the page: the "Made with AI, with love" headline from 2026-11-12 went in the README's "Built with AI" section instead (2026-11-13).
- **Link the GitHub repo with a small GitHub icon,** likely in Made by, in place of the source section's link.
- To decide when designing: where the install steps go once their section is gone ("How to use it", or their own short section), and how they meet [help adding it to the home screen](#help-adding-it-to-the-home-screen); and the icon's accessible name, since it's a link with no visible text.

Lucas's ideas, 2026-11-12:

- **Why it exists,** in Lucas's words (a draft to edit before it goes on the page): the original feelings wheel helped immensely in his own therapy. He had a hard time identifying his emotions and thought he was incapable of it. After a lot of work and mindfulness, and having actual words for the emotions, he was able to. He used to look at [feelingswheel.com](reference/core-feelings-wheel.md#the-reference-site) almost daily, and wanted to make an accessible, beautiful, fast and versatile version for others to enjoy.
- **A dedication** to A, E and M. Where it goes is open.
- **The credit links feel off.** Each source's author name links to the work, and Roberts's link goes to an imgur post whose image is gone ([known issue](#the-about-page-1)). To decide: what to link (the work, its title, or the [reference notes](reference/README.md)), and whether to use the archive.org copy already in [core-feelings-wheel.md](reference/core-feelings-wheel.md).
- **A floating back button,** so you don't have to scroll to the bottom to get back to the wheel.
- **A left chevron** on "Back to the wheel". Likely the same control as the floating one.
- **Say no more than has been tested.** "How to use it" says "Everything works with a keyboard and with a screen reader", but no screen reader has been tried by hand yet ([ACCESSIBILITY.md](../ACCESSIBILITY.md#supported-environments), 2026-11-12). Soften it, or link ACCESSIBILITY.md, until one has.
- With [About in the start message](#about-in-the-start-message), more people arrive at About from the start, so the way back matters more.
- Worth doing before [launching](#before-launching).

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

## Known issues

Still open. None blocks the next change. The ones that get in someone's way are also listed, in plain words, under known limitations in [ACCESSIBILITY.md](../ACCESSIBILITY.md#known-limitations); keep the two in step.

### Phones: turning and zooming

These may share a cause: the browser's own zoom or text inflation, which the app doesn't account for. Worth looking at together.

- **Turning the phone makes the card's text huge.** Found 2026-11-12: going from portrait to sideways and back leaves the description text very large, possibly only when a word is open as it turns. Likely cause: Safari on iOS enlarges text when the phone turns unless told not to. `about.css` sets `-webkit-text-size-adjust: 100%`, but `app.css` doesn't. Likely fix: the same in `app.css`. No fix chosen yet.
- **After turning the phone several times, taps land in the wrong place.** Found 2026-11-12: words stopped opening and closing, and a tap on a word acted on another. Swiping back fixed it. Not yet known whether it's the app or the browser. Worth checking first: a leftover page zoom from turning, and whether the app's mapping from a tap to a word uses a stale position of the wheel.
- **Double-tapping the theme label zooms the page.** Found 2026-11-09 using v2.2.1, mostly on phones while tapping through the theme choices: a quick second tap lands on the label that shows the choice (`.fw-theme-label`, v1.3 §6.2) and the browser zooms into it. Pinching out doesn't undo it on iOS (Lucas, 2026-11-12), likely because the wheel's canvas takes every pinch for itself (`touch-action: none`); the only way back is double-tapping the label again while it's showing, and once the label goes, that's gone too. The label takes taps while shown, so a tap on it never reaches the wheel beneath, and as plain text it gets the browser's double-tap-to-zoom; the button beside it doesn't. Likely fix: `touch-action: manipulation` on the label (or the toolbar), which turns off double-tap zoom there while leaving pinch zoom alone. No fix chosen yet.

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

- **Going back on phones.** Swiping back doesn't work at all on the wheel: it takes every touch, so the browser's Back button is the only way back. An app installed to the iPhone home screen has no Back at all. Lucas (2026-11-14): better history rules for phones wait on an in-app back button. History follows the [history rule](superpowers/specs/2026-11-14-feels-on-wheels-history-rule-design.md): picking a word or a place adds an entry, moving by direction replaces it. Related: [return to the word you jumped from](#return-to-the-word-you-jumped-from).
- **Keyboard selection on the phone's half-wheel.** Choosing a word by keyboard or the accessible tree can select one on the hidden left half without turning the wheel to show it. Lucas wants to try it before deciding whether the wheel should turn to show it.

### The About page

- **Roberts's credit link shows nothing.** Found 2026-11-12: the imgur post's image now redirects to imgur's "removed" picture (checked 2026-11-12), so the credit links to an empty post. [core-feelings-wheel.md](reference/core-feelings-wheel.md) still says it was online on 2026-11-09 and has an archive.org copy; update the note when the link is fixed. Part of the [About page rework](#about-page-rework).

### Code and tests

- **The perf leak check is flaky.** `tests/perf/switch.spec.ts` sometimes counts 3 live wheels instead of 2 after 20 switches: about 1 run in 10, on main before v2.1 too, so it's garbage-collection timing rather than a leak. Worth a sturdier check (more GC turns, or a retry) before trusting a failure.
- **The end-to-end suite skips offline in WebKit.** Playwright can't emulate offline with a service worker there, so the offline tests run only in Chromium and Firefox. Checked by hand on 2026-11-13 by stopping the server instead: the wheel and About loaded from the cache. A test that stops or blocks the server would cover it.
- **Opened-word position lives in two places.** `main.ts` keeps its own copy of the phone's opened-word position and syncs it into the controller in three places; the controller could own it. (v1.3 review)
- **The card's heading size watcher isn't disconnected when the card hides.** Harmless. (v1.3 review)

## Before launching

The app is called **Feels on Wheels** (decided 2026-11-09). Going public happens in two steps: first shareable, then launched. Step 1 [shipped](#shipped) on 2026-11-09. Step 2 is what's left before announcing it and letting search engines index it. The host and the domain (2026-11-13) and the URL structure (2026-11-14) are done; the rest isn't started.

- **Lucas reviews the definitions and sensations** in [content-review.md](content-review.md). This was moved out of v1.1.
- **Draft text for Lucas to edit:** the body wheel's preview description ("Start from what you notice in your body to find the word for what you feel.") is a draft, and it's shorter than the 100 to 160 characters the home description uses.
- **Let search engines in:** set `indexable: true` in `site.config.ts` (removes `noindex`), deploy, and re-check the link previews.
  - Decide first whether the `workers.dev` address and the preview links should say `noindex` once the domain is indexable, since they serve the same pages.
- **Optional, after letting search engines in:** add the site to Google Search Console and Bing Webmaster Tools and submit the sitemap.
- **Add the icon to lucaspolito.dev**, linking the domain, not github.io. Follow `docs/website-icon/README.md`. Chosen 2026-11-09: the app icon's silhouette, gray like the site's other icons; on hover it takes the wheel's seven colors and spins once, settling.
- **Known issues and ideas:** decide which to finish before announcing it. The [About page rework](#about-page-rework), [share button](#share-button) and [help adding it to the home screen](#help-adding-it-to-the-home-screen) are the ones a first visitor would notice.

## Content rules

- There are only so many ways to describe a feeling or a body sensation, so overlap with existing wheels and word lists is unavoidable and fine.
- Don't copy any source verbatim, and don't reproduce a source's full layout or word list wholesale.
- Definitions are short, plain-language prose (see v1 spec §3.4).
- Credit every source we draw on, in [reference/](reference/README.md) and on the app's credits page, whether or not a license requires it.

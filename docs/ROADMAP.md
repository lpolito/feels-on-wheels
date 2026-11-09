# Roadmap: Feels on Wheels

The living list of what's built, what's next, and what's still an idea. Specs are frozen once approved; this file is not. Update it when a spec is approved, when a version ships, and whenever new or later work comes up, so nothing lives only in a chat.

**Aim:** every way to identify an emotion, in a fast, accessible, lightweight feelings wheel that works offline, installs as an app, and supports light and dark mode. Built for Lucas first and meant to go public later.

## Versions

Each version is used before the next one is designed. Point releases (v1.1) rework what's there after using it. Whole versions add a new way to identify an emotion. The feedback behind each shipped version is in its spec, and in the git history for v1.3.1.

Ideas don't have version numbers. When Lucas picks one to build, it takes the next whole version number (the next one is v3) and moves into this table.

| Version | Status | Spec and plan |
|---|---|---|
| v1: Core wheel | Shipped | [spec](superpowers/specs/2026-11-06-feelings-wheel-v1-design.md), [plan](superpowers/plans/2026-11-06-feelings-wheel-v1.md) |
| v1.1: Selected and opened states, card redesign | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.1-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.1.md) |
| v1.2: Fixes and polish from using v1.1 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.2-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.2.md) |
| v1.3: Layout, card and controls polish from using v1.2 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.3-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.3.md) |
| v1.3.1: Small fixes from using v1.3 | Shipped | No spec; commits 2210c12, e9ae2b4, 63977fa |
| v2: Body sensations wheel | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2-body-wheel-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2-body-wheel.md) |
| v2.1: Polish from using v2 (card headings, heartbeat, sliding switch, context-ring labels, sideways phones, body colours) | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2.1-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2.1.md). One change from the spec's §6.1: the sideways layout also needs 560 px of width, so small split-screen windows keep the portrait layout instead of a column too thin for the card. |
| v2.2: Polish from using v2.1 (wheel under the card's column, one-line breadcrumbs, halo dot, core feeling on the body wheel, message heading, no wheel chevron) | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2.2-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2.2.md) |
| v2.2.1: Sideways phones with the notch on the left: the opened word keeps 1rem clear of the notch, not the screen's edge | Shipped | No spec; the fix for the known issue found using v2.2 (the camera's left margin now starts after `safe-area-inset-left`). Commits on main after be1b053. |

## Ideas

Not in any order; none is chosen yet. Strength was briefly v2 before it was shelved, so older docs and commits call it v2; v2 is now the body sensations wheel.

| Idea | Status |
|---|---|
| [Wizard](#wizard) | Idea |
| [Strength](#strength) | Shelved (2026-11-08) |
| [Emoji wheel](#emoji-wheel) | Planned |
| [Languages](#languages) | Planned |
| [Return to the word you jumped from](#return-to-the-word-you-jumped-from) | Idea |
| [Feeling links underlined in their feeling's colour](#feeling-links-underlined-in-their-feelings-colour) | Idea |

These are what Lucas asked for. Each idea's brainstorm starts here. The sources named below are described in [reference/](reference/README.md).

### Strength

Shelved on 2026-11-08 during its first brainstorm: Lucas doesn't see it as needed right now. The [wizard](#wizard) may cover the same need by helping land on words already in the wheel. If strength comes back, start from these notes.

- **Purpose, if revived:** naming *how much* of a feeling already found (irked, then irritated, then seething), not entering the wheel by intensity or adding Drummond's whole vocabulary.
- **Where it was heading:** Drummond's columns fit the wheel's middle ring better than its core feelings (*lonely* is Loneliness, *guilty* is Remorse, *hurt* is Hurt, *depressed* is Depression, *confused* is Confusion, *mad* is Anger, *scared* is Fear, *trusting* is Caring). Mapping to core feelings would put four columns under Sad. Still undecided: core only, a ladder per middle word (outer words showing their parent's), or a ladder per word.

What Lucas first asked for:

- A toggle for strong, medium and light, like Tom Drummond's [Vocabulary of Emotions](reference/drummond-vocabulary-of-emotions.md).
- The panel lists a feeling's words at each strength.
- **Open question:** Drummond's chart has 10 categories (Happiness, Caring, Depression, Inadequateness, Fear, Confusion, Hurt, Anger, Loneliness, Remorse) that don't match the wheel's 7 core feelings. Its design has to decide whether to map them onto the wheel, give them their own wheel, or only tag the wheel's existing words.
- **Data model:** the optional `Feeling.strength` field (one value per word) isn't enough. In Drummond's chart, 22 words have different strengths in different categories (*Resentful* is Anger medium and Anger light), so strength has to live on a word within a category or a wheel position.

### Wizard

- A guided flow that helps you land on a specific word already in the wheel.
- Lucas's idea, mentioned 2026-11-08 when shelving strength. Not yet described further; ask him before designing it.

### Emoji wheel

- Very simplified: core feelings and a few middle-ring ones, because there are only so many emoji.
- The data is ready: `Feeling.emoji` is already an optional field.
- After v2, another wheel is a wheel file, an entry in the wheel list and its locale strings; the switch, URLs, colours and card handle it (v2 spec §7).

### Languages

- Spanish first (the [reference site](reference/core-feelings-wheel.md#the-reference-site) had an Español toggle, and Braman publishes a Spanish wheel), plus a language switcher.
- Adding a language means adding one locale file; no text is hard-coded.

### Return to the word you jumped from

- After jumping from the body wheel to the feelings wheel (the "See … on the feelings wheel" link, or v2.2's core-feeling link in the definition), a "Return to …" control takes you back to the body wheel with the card you came from open again.
- Lucas's idea, 2026-11-09. Where it goes is open: on the opened card, as a toolbar button like Start over, or something else.
- Today the only way back is the browser's Back (the jump pushes history, v2 §4.2), which is the awkward gesture in the [going back on phones](#known-issues) known issue. This idea may cover part of that.
- To decide when designing: what the control says ("Back to Wide eyes"?), when it disappears (after moving on, switching wheels by hand, or Start over), and whether it also works the other way, or for the emoji wheel once there are three wheels.

### Feeling links underlined in their feeling's colour

- Every link to a feeling is underlined in that feeling's colour, wherever it appears, for consistency: breadcrumbs, the "Narrow it down" and "Could be feeling" rows, the "Close to" and "Could also be feeling" words, v2.2's core-feeling link in the definition, and the jump to the feelings wheel.
- Lucas's idea, 2026-11-09.
- Today (v2.2.1): feeling links are underlined in a 45% tint of the text colour, and take their feeling's ink (`--ink`, from `colors.ts` `inkFor`) only on hover or focus. The rows have no underline, only a grey divider below. Breadcrumbs don't carry their own feeling's ink: on hover they take the opened word's.
- To decide when designing:
  - the ink (contrast-checked against the card, so it shows in both themes) or the wheel's own fill (truer to the wheel, but some are too dark or light to see on the card);
  - whether the rows' dividers take the colour too, or they get underlines;
  - what areas and sensations do, since they're links too but not feelings;
  - forced colours, where links keep the system's link colour.

## Known issues

Still open after v2.2.1. None blocks the next version.

- **An opened word's long label spills past its cell.** Found 2026-11-09 using v2.2.1, on the body wheel's long words (Chest › Hollow feeling in your chest, Warmth in your chest): when opened, the label runs past both ends of the lifted cell. The renderer fits the label to the cell's normal box at the regular weight (600), then draws it 1.15× larger (`LIFT_LABEL`) and bold (800), while the lifted cell only grows 10 px at each end (`LIFT_RADIAL_PX`). Short words have room to spare; a label that already fills its box grows by about 15% plus bold's extra width, far more than 20 px. Likely fix: fit the opened label in the lifted box at its bold weight and capped at 1.15×, so it grows only as much as it fits. No fix chosen yet.
- **Double-tapping the theme label zooms the page.** Found 2026-11-09 using v2.2.1, mostly on phones while tapping through the theme choices: a quick second tap lands on the label that shows the choice (`.fw-theme-label`, v1.3 §6.2) and the browser zooms into it. Once the label goes, it's hard to double-tap back out. The label takes taps while shown, so a tap on it never reaches the wheel beneath, and as plain text it gets the browser's double-tap-to-zoom; the button beside it doesn't. Likely fix: `touch-action: manipulation` on the label (or the toolbar), which turns off double-tap zoom there while leaving pinch zoom alone. No fix chosen yet.
- **Going back on phones.** Swiping back steps through earlier words, which doesn't fit a wheel that's itself swiped to navigate. Lucas raised it while using v2.1; no fix chosen yet, and v2.2 leaves it alone.
- **Portrait phones, inner tier opened: the outer ring runs off the right edge.** v2.1 made its labels draw (10 px floor on context rings) but left the camera alone, so some outer labels are cut off at the screen's edge. Lucas wanted to try that first (v2.1 spec §1, out of scope); moving the wheel left is the fix if it bothers him.
- **Tiny, short windows show the body wheel unlabelled at rest.** At about 560 × 320 and smaller (split screen, 500 × 300), the whole-wheel view is too small for any area label ("Breath and throat"), so the body wheel rests without labels until you open something. The feelings wheel's short words still fit. It was like this before v2.1; the viewport sweep (`tests/e2e/viewports.spec.ts`) pins it so a fix shows up there.
- **The perf leak check is flaky.** `tests/perf/switch.spec.ts` sometimes counts 3 live wheels instead of 2 after 20 switches: about 1 run in 10, on main before v2.1 too, so it's garbage-collection timing rather than a leak. Worth a sturdier check (more GC turns, or a retry) before trusting a failure.
- **Keyboard selection on the phone's half-wheel.** Choosing a word by keyboard or the accessible tree can select one on the hidden left half without turning the wheel to show it. Lucas wants to try it before deciding whether the wheel should turn to show it.
- **Opened-word position lives in two places.** `main.ts` keeps its own copy of the phone's opened-word position and syncs it into the controller in three places; the controller could own it. (v1.3 review)
- **The card's heading size watcher isn't disconnected when the card hides.** Harmless. (v1.3 review)
- **Very short phones.** When the card cap's safeguard is active, the opened word can sit under the toolbar: v1.3 spec §4.2 measures the gap from the stage's top, not the toolbar's bottom. (v1.3 review)

## Before going public

The app is called **Feels on Wheels** (decided 2026-11-09). Going public happens in two steps: first shareable, then launched.

### Step 1: shareable (spec written)

[Spec](superpowers/specs/2026-11-09-feels-on-wheels-going-public-design.md). Online at `lpolito.github.io/feels-on-wheels/` so Lucas can share it and use it across devices, but not announced or indexed. It covers:

- **The name:** Feels on Wheels, everywhere a person sees it. Lucas leaned towards "Wheels of Feels", but it's one letter from [wheeloffeels.com](https://wheeloffeels.com), a live commercial emotion-wheel app (Julian Dev, LLC), so people hearing it would find theirs. No app or site used "Feels on Wheels" as of 2026-11-09. feelsonwheels.app was unregistered; feelsonwheels.com is parked for sale; the .org and .net are taken.
- **A new public repo**, `lpolito/feels-on-wheels`, with history rewritten to drop the Braman and Drummond word-list transcriptions. The private `lpolito/feelings-wheel` stays as a backup.
- **Licence:** PolyForm Noncommercial 1.0.0 for code, CC BY-NC-SA 4.0 for content. Source-available, not open source: nobody may sell it. Contributors license their work under the same terms and let Lucas relicense it.
- A README, CONTRIBUTING.md and a PR template.
- A GitHub Pages deploy, the SEO and social preview tags, a preview image, robots.txt and a sitemap. All absolute URLs come from one setting, `site.config.ts`.
- An **About page** with the credits, linked from the toolbar. Its draft text is in [reference/README.md](reference/README.md#credits).
- An **icon kit for lucaspolito.dev** in `docs/website-icon/`, not added to the site yet.

### Step 2: before launching it

Still open. Nothing here is started.

- **Lucas reviews the definitions and sensations** in [content-review.md](content-review.md). This was moved out of v1.1.
- **Trademark check** on "Feels on Wheels" (USPTO search) before buying a domain. The name was only checked against web, app-store and domain lookups.
- **Move to a domain** (spec §3.3; Lucas wants a real domain before linking it from his site). feelsonwheels.app is the likely one:
  - set `site.url` in `site.config.ts` (this changes the canonical URL, `og:url`, `og:image`, the JSON-LD, robots.txt and the sitemap) and `indexable: true` (removes `noindex`);
  - add `public/CNAME`, set the custom domain and "Enforce HTTPS" in the repo's Pages settings, and point DNS at GitHub Pages;
  - update the repo's homepage (`gh repo edit --homepage`);
  - deploy and re-check the link previews.
  - Installs and saved themes at the github.io address don't carry over.
- **Optional, after the move:** add the site to Google Search Console and Bing Webmaster Tools and submit the sitemap.
- **Add the icon to lucaspolito.dev**, linking the domain, not github.io. Follow `docs/website-icon/README.md`. Chosen 2026-11-09: the app icon's silhouette, grey like the site's other icons; on hover it takes the wheel's seven colours and spins once, settling.
- **Unconfirmed credits:** any the step 1 research couldn't confirm (the Roberts attribution, the reference site).
- **The old private repo:** archive or delete `lpolito/feelings-wheel` once the public one is settled.
- **Known issues:** decide whether any should be fixed before announcing it.

## Content rules

- There are only so many ways to describe a feeling or a body sensation, so overlap with existing wheels and word lists is unavoidable and fine.
- Don't copy any source verbatim, and don't reproduce a source's full layout or word list wholesale.
- Definitions are short, plain-language prose (see v1 spec §3.4).
- Credit every source we draw on, in [reference/](reference/README.md) and on the app's credits page, whether or not a licence requires it.

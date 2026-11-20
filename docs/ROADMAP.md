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
| <a id="the-wheel-and-the-card"></a><a id="a-different-word-to-start-on"></a><a id="return-to-the-word-you-jumped-from"></a><a id="feeling-links-underlined-in-their-feelings-color"></a>Start on Happy and Whole body at 3 o'clock, Back to the word you jumped from, and breadcrumbs in their own color | Shipped 2026-11-15 | [spec](superpowers/specs/2026-11-15-feels-on-wheels-wheel-and-card-design.md), [plan](superpowers/plans/2026-11-15-feels-on-wheels-wheel-and-card.md), [changes](superpowers/specs/2026-11-15-feels-on-wheels-wheel-and-card-changes.md) |
| <a id="rework-the-body-wheels-areas-and-sensations"></a>Body wheel rework: places head to toe, Urges, two strings per sensation, and its research in public | Shipped 2026-11-16 | [spec](superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-design.md), [plan](superpowers/plans/2026-11-16-feels-on-wheels-body-wheel-rework.md), [changes](superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-changes.md) |
| Known issues: card text that keeps its size when the phone turns, no double-tap zoom on labels, one rest view for both wheels, opened rings that fit the screen, opened labels that fit their cell, a wheel that keeps its axis while it turns, labels that never disappear, and an opened wedge centered below the controls | Shipped 2026-11-18 | [spec](superpowers/specs/2026-11-18-feels-on-wheels-known-issues-design.md), [plan](superpowers/plans/2026-11-18-feels-on-wheels-known-issues.md), [round-two plan](superpowers/plans/2026-11-18-feels-on-wheels-known-issues-round-2.md), [round-three plan](superpowers/plans/2026-11-18-feels-on-wheels-known-issues-round-3.md), [changes](superpowers/specs/2026-11-18-feels-on-wheels-known-issues-changes.md) |
| <a id="snapshots-across-devices-and-window-sizes"></a>Screenshots of every layout on real phones, tablets and computers, in Chromatic | Shipped 2026-11-18 | [spec](superpowers/specs/2026-11-18-feels-on-wheels-screenshots-design.md), [plan](superpowers/plans/2026-11-18-feels-on-wheels-screenshots.md), [changes](superpowers/specs/2026-11-18-feels-on-wheels-screenshots-changes.md) |
| Sideways tablets and computers: the core word stays in view with a middle word open, and opening a core word zooms in a little more | Shipped 2026-11-19 | [spec](superpowers/specs/2026-11-18-feels-on-wheels-sideways-zoom-design.md), [plan](superpowers/plans/2026-11-19-feels-on-wheels-sideways-zoom.md), [changes](superpowers/specs/2026-11-18-feels-on-wheels-sideways-zoom-changes.md) |

## Ideas

Not in any order; none is chosen yet. They're grouped by what they touch, and ideas in one group are worth designing together. Strength was briefly v2 before it was shelved, so older docs and commits call it v2; v2 is now the body sensations wheel.

| Idea | Group | Status |
|---|---|---|
| [Wizard](#wizard) | [New ways to identify an emotion](#new-ways-to-identify-an-emotion) | Idea |
| [Emoji wheel](#emoji-wheel) | New ways to identify an emotion | Planned |
| [Strength](#strength) | New ways to identify an emotion | Shelved (2026-11-08) |
| [Wheels for kids](#wheels-for-kids) | New ways to identify an emotion | Idea |
| [Search for a word](#search-for-a-word) | New ways to identify an emotion | Idea |
| [An opinionated feelings wheel](#an-opinionated-feelings-wheel) | [The wheels' content](#the-wheels-content) | Brainstorming |
| [Languages](#languages) | [URLs, routing and hosting](#urls-routing-and-hosting) | Planned |
| ["Did you mean" on not found](#did-you-mean-on-not-found) | URLs, routing and hosting | Idea |
| [Start over on not found](#start-over-on-not-found) | URLs, routing and hosting | Idea |
| [Check every test is worth keeping](#check-every-test-is-worth-keeping) | [Tests](#tests) | Idea |

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
- A third wheel is when the [Back to pill](superpowers/specs/2026-11-15-feels-on-wheels-wheel-and-card-design.md#2-back-to-the-word-you-jumped-from) has to work across more than two wheels, and the switch's third option meets the [wide fallback fonts](#low-priority-or-not-fixing) known issue.

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
  - where the kids' wheels go in the wheel switch, which already struggles to fit a third option (the [wide fallback fonts](#low-priority-or-not-fixing) known issue), and how you pick one of the three sizes;
  - whether a one-tier wheel still opens a card, and what's on it;
  - their URLs, and whether a kids' word links to the same word on the grown-up wheel;
  - where the words come from, since any new source gets a [reference note](reference/README.md) and a credit.
- Overlaps with the [emoji wheel](#emoji-wheel), which is also a simplified wheel; worth designing them together.
- A check for which words fit each age, from the opinionated wheel's brainstorm (2026-11-19): a published study of which feeling words children know, by age band (Baron-Cohen et al. 2010, UK, about 336 words; it counts a word as known when 75% of the band knew it). Words off its list need another check. See the [data notes](opinionated-wheel/learnings.md#data).

#### Search for a word

- Lucas, 2026-11-23: "I often want to find a word quickly and cannot." Type a word and jump to it on the wheel, with fuzzy matching so a typo or a partial word still finds it.
- Meets ["Did you mean" on not found](#did-you-mean-on-not-found), which needs the same matching of a mistyped word to a real one.
- To decide when designing: where the search box lives on phones and computers, whether it searches both wheels (feelings and body sensations), whether it matches definitions or only labels, what it shows for a word that's on the wheel twice, and how it works with the keyboard and screen readers.

<a id="the-body-wheels-content"></a>

### The wheels' content

What the wheels say: their words, definitions, and how feelings relate to sensations. Whatever is decided here gets written down as rules beside the data (`src/data/README.md`, with an `AGENTS.md` there that loads it), not only in a spec.

#### An opinionated feelings wheel

- Lucas, 2026-11-15: the feelings wheel should be opinionated about the words it uses, their definitions, and how feelings relate to sensations. Today it largely repeats other wheels (mostly [Roberts's seven-core wheel](reference/core-feelings-wheel.md)), which isn't necessary.
- Its rules go in `src/data/README.md` next to the body wheel's, so every later edit follows them.
- **A word for accepting your situation.** Lucas, 2026-11-16: not fighting reality, going with the flow. The wheel's Accepted means being welcomed by others, so the body wheel's Nothing much uses Content and Peaceful for now (rework [changes](superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-changes.md#flat); [radical acceptance](reference/linehan-dbt-model-of-emotions.md), [equanimity](reference/desbordes-equanimity.md)).
- **Words that sit oddly under their parent,** such as Hesitant under Repelled, Embarrassed under Disapproving, and Inferior under Depressed (Lucas, 2026-11-16). The body wheel's rule about a word and its parent depends on this nesting.
- **Brainstormed 2026-11-19 and 2026-11-20.** The rules for which words the wheel has and where they go are settled, and a candidate wheel was built from those rules alone: 6 cores (Happy, Love, Sad, Scared, Angry, Bad) and about 165 words, keeping about half of today's. Everything is in [opinionated-wheel/](opinionated-wheel/):
  - [the rules](opinionated-wheel/rules.md) and the research behind them;
  - [the candidate wheel](opinionated-wheel/derived-wheel.md);
  - [what the process taught](opinionated-wheel/learnings.md), including every decision Lucas made;
  - [the handoff](opinionated-wheel/handoff.md) for the next session: scrutinize the rules, rule on the cores, then comb the words.
- Settled along the way: the accepting word is At peace (under Happy → Calm), and the odd nestings are what rules 6 and 7 fix. Colors, link previews, and URLs don't weigh in the choices, and links to removed or moved words aren't a concern (Lucas, 2026-11-19).
- Still to decide: definitions and "You might notice" for the new words, drawing on the [bodily maps research](reference/nummenmaa-bodily-maps.md); the body wheel's paths (rule 15); and reference notes and credits for the new sources (rule 16).
- Meets [Strength](#strength), [Wheels for kids](#wheels-for-kids), [Languages](#languages), and the [definitions and sensations review](#before-launching), which all depend on which words the wheel has. Builds on the rules the [body wheel rework](superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-design.md) set in [src/data/README.md](../src/data/README.md).

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

### Tests

#### Check every test is worth keeping

- Lucas, 2026-11-16: the test suites are huge and keep growing, about 9,000 lines across 45 unit and end-to-end files. Go through them and keep only the tests that earn their place.
- Found during the body wheel rework: some tests just restate the content (the body wheel's full list of sensations, exact cell counts, the exact feelings under one sensation). They duplicate `body.json` word for word and have to be edited with every content change, without catching anything. Tests that check rules (every feeling is on the feelings wheel, 2 or 3 feelings per sensation) or behavior (with any valid path) are worth more.
- To decide when designing: what a test has to protect to stay, whether a single snapshot replaces the content tests, how much end-to-end coverage each of the five browsers needs, and whether to write the bar down for future changes, since the plans' test-first steps add tests with every change.

## Known issues

Still open. None blocks the next change. The ones that get in someone's way are also listed, in plain words, under known limitations in [ACCESSIBILITY.md](../ACCESSIBILITY.md#known-limitations); keep the two in step.

### Layout and labels

- **The card's "Narrow it down" links wrap to two lines on landscape phones.** Found by Lucas 2026-11-18 in the [screenshots](superpowers/specs/2026-11-18-feels-on-wheels-screenshots-design.md) (iPhone 15 and iPhone 15 Pro Max, landscape, Chest opened): in the narrow side column, two links per row (`.fw-rows`, `grid-template-columns: 1fr 1fr` in `src/styles/app.css`) leave each too little room, so "Racing heart" and "Short breath" break onto two lines. Lucas: they shouldn't wrap; one link per line, scrolling to see more. Chromatic draws this text in a wider font than iPhones use, so a real phone may wrap fewer of them, but the column is the same width. To decide when designing: when the card switches to one column (always, or only when two would wrap), and how scrolling the list fits with the card's height cap. No fix chosen yet.
- **Labels jump while a word opens.** Found by Lucas on his phone 2026-11-18, also on `main`. When a word opens, the size where labels wrap to two lines switches from 8 to 12 px at once, because it follows the app's mode, while the cells grow with the camera's zoom over about a second. A label between those sizes wraps to two lines at about double its size, then goes back to one line partway through the zoom: "Whole body" on the body wheel at 393 × 650 goes from 9.5 px, to 20.5 px on two lines, to 12 px. No fix chosen yet.
- **At rest, the outer cells are smaller than WCAG AA's 24 px tap target.** Found 2026-11-18 while sorting these known issues ([spec](superpowers/specs/2026-11-18-feels-on-wheels-known-issues-design.md)). At rest, tapping an outer cell selects that word, so each cell is a tap target, and at common sizes it's under WCAG 2.2 AA's 24 px (success criterion 2.5.8): on the half-wheel at 390 × 844 the outer cells are about 23 px tall on the feelings wheel and 15 px on the body wheel; on the whole wheel at 1440 × 900, about 27 px and 18 px. The cells touch, so the spacing exception doesn't apply. The "equivalent control" exception might: open a middle-ring word first (two taps), and every outer cell is then at least 24 px tall. Opening a core word isn't enough (its outer cells stay about 20 px). But reaching an outer word that way takes three taps instead of one. The cells are this small so the whole wheel fits, so a fix needs its own design. No fix chosen yet.

### Navigation

- **With a word opened, dragging turns the wheel at the opened ring's speed, wherever you grab.** Found by Lucas 2026-11-23. Grab inside the opened ring, toward the center, and the wheel turns slower than the pointer; grab outside it, toward the edge, and it turns faster. With nothing opened, the wheel follows the pointer's angle around the center, so the spot you grabbed stays under it. The cause: once a word is opened, `src/controller.ts` (`case 'drag'`) turns the wheel by the pointer's vertical movement divided by the opened ring's radius (`rotateBy(i.dy / radiusPx(ring))`), not by the radius where you grabbed, and its fling on release (`dragEnd`) does the same. To decide when designing: divide by the grabbed point's distance from the center, or follow the pointer's angle as the whole wheel does. No fix chosen yet.
- **Going back on phones.** Swiping back doesn't work at all on the wheel: it takes every touch, so the browser's Back button is the only way back. An app installed to the iPhone home screen has no Back at all. Lucas (2026-11-14): better history rules for phones wait on an in-app back button. History follows the [history rule](superpowers/specs/2026-11-14-feels-on-wheels-history-rule-design.md): picking a word or a place adds an entry, moving by direction replaces it. Related: the [Back to pill](superpowers/specs/2026-11-15-feels-on-wheels-wheel-and-card-design.md#2-back-to-the-word-you-jumped-from) is a way back without the browser's Back, for the jump between wheels only.
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

### Low priority or not fixing

Looked at on 2026-11-18 ([spec](superpowers/specs/2026-11-18-feels-on-wheels-known-issues-design.md)) and set aside, each with what was found and why. They're still true, so they stay listed.

- **After turning the phone several times, taps land on the wrong word.** Low priority. Found 2026-11-12. Not reproduced: after seven turns in the iOS Simulator, taps hit the right word upright and sideways, and `src/input/gestures.ts` reads the canvas's position on every touch-down, so a stale position isn't the cause. Most likely it was leftover page zoom from the card's text inflating and from double-tap zoom on the labels, both fixed on 2026-11-18. Watch for it.
- **Wide fallback fonts don't fit the tightest layouts.** Not fixing. Found 2026-11-09 on GitHub's Ubuntu runners, whose `system-ui` font is DejaVu Sans, much wider than Apple's, Android's, and Windows's. With Verdana standing in for it, the wheel switch and the toolbar overlap by 3 px at 280 px wide; from 300 px up there's room. Linux only, at one width; the tests run on macOS runners. Whether the switch's third option fits gets settled when a third wheel is designed.
- **Portrait phones, inner tier opened: the outer ring runs off the right edge.** Not fixing. Reproduced at 390 × 844 with Happy opened: Inspired, Sensitive, and Thankful are cut off. The outer ring is only context there, and the card lists its words under "Narrow it down."

## Before launching

<a id="before-going-public"></a>

The app is called **Feels on Wheels** (decided 2026-11-09). Going public happens in two steps: first shareable, then launched. Step 1 [shipped](#shipped) on 2026-11-09. Step 2 is what's left before announcing it and letting search engines index it. The host and the domain (2026-11-13) and the URL structure (2026-11-14) are done; the rest isn't started.

- **Lucas reviews the definitions and sensations** in [content-review.md](content-review.md). This was moved out of v1.1. Since the body wheel rework, it also shows each card's "You might notice" phrases and the body wheel as it is, all rebuilt from the data, so the phrases drafted in the rework get reviewed here too.
- **Draft text for Lucas to edit:** the body wheel's preview description ("Start from what you notice in your body to find the word for what you feel.") is a draft, and it's shorter than the 100 to 160 characters the home description uses.
- **Let search engines in:** set `indexable: true` in `site.config.ts` (removes `noindex`), deploy, and re-check the link previews.
  - Decide first whether the `workers.dev` address and the preview links should say `noindex` once the domain is indexable, since they serve the same pages.
- **Optional, after letting search engines in:** add the site to Google Search Console and Bing Webmaster Tools and submit the sitemap.
- **Add the icon to lucaspolito.dev**, linking the domain, not github.io. Follow `docs/website-icon/README.md`. Chosen 2026-11-09: the app icon's silhouette, gray like the site's other icons; on hover it takes the wheel's seven colors and spins once, settling.
- **Known issues and ideas:** decide which to finish before announcing it. Help adding it to the home screen and a dark home-screen icon were dropped (2026-11-15).

## Content rules

The rules for what the wheels say, for both wheels and in detail for the body wheel, live beside the data in [src/data/README.md](../src/data/README.md).

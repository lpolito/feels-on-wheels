# Roadmap: Feels on Wheels

The living list of what's built, what's next, and what's still an idea. Specs are frozen once approved; this file is not. Update it when a spec is approved, when a version ships, and whenever new or later work comes up, so nothing lives only in a chat.

**Aim:** every way to identify an emotion, in a fast, accessible, lightweight feelings wheel that works offline, installs as an app, and supports light and dark mode. Built for Lucas first and meant to go public later.

## Versions

Each version is used before the next one is designed. Point releases (v1.1) rework what's there after using it. Whole versions add a new way to identify an emotion. The feedback behind each shipped version is in its spec, and in the git history for v1.3.1.

Ideas don't have version numbers. When Lucas picks one to build, it moves into this table: a new way to identify an emotion takes the next whole version (v3), and polish to what's there takes the next point release (v2.3).

| Version | Status | Spec and plan |
|---|---|---|
| v1: Core wheel | Shipped | [spec](superpowers/specs/2026-11-06-feelings-wheel-v1-design.md), [plan](superpowers/plans/2026-11-06-feelings-wheel-v1.md) |
| v1.1: Selected and opened states, card redesign | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.1-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.1.md) |
| v1.2: Fixes and polish from using v1.1 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.2-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.2.md) |
| v1.3: Layout, card and controls polish from using v1.2 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.3-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.3.md) |
| v1.3.1: Small fixes from using v1.3 | Shipped | No spec; commits 3fb060e, def355a, b340a1a |
| v2: Body sensations wheel | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2-body-wheel-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2-body-wheel.md) |
| v2.1: Polish from using v2 (card headings, heartbeat, sliding switch, context-ring labels, sideways phones, body colors) | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2.1-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2.1.md). One change from the spec's §6.1: the sideways layout also needs 560 px of width, so small split-screen windows keep the portrait layout instead of a column too thin for the card. |
| v2.2: Polish from using v2.1 (wheel under the card's column, one-line breadcrumbs, halo dot, core feeling on the body wheel, message heading, no wheel chevron) | Shipped | [spec](superpowers/specs/2026-11-08-feelings-wheel-v2.2-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2.2.md) |
| v2.2.1: Sideways phones with the notch on the left: the opened word keeps 1rem clear of the notch, not the screen's edge | Shipped | No spec; the fix for the known issue found using v2.2 (the camera's left margin now starts after `safe-area-inset-left`). Commits on main after 9fc8944. |
| Going public, step 1: shareable | Shipped 2026-11-09 | [spec](superpowers/specs/2026-11-09-feels-on-wheels-going-public-design.md), [plan](superpowers/plans/2026-11-09-feels-on-wheels-going-public.md). Live at <https://lpolito.github.io/feels-on-wheels/>, not announced or indexed. What's left is in [before launching](#before-launching). |

## Ideas

Not in any order; none is chosen yet. They're grouped by what they touch, and ideas in one group are worth designing together. Strength was briefly v2 before it was shelved, so older docs and commits call it v2; v2 is now the body sensations wheel.

| Idea | Group | Status |
|---|---|---|
| [Wizard](#wizard) | [New ways to identify an emotion](#new-ways-to-identify-an-emotion) | Idea |
| [Emoji wheel](#emoji-wheel) | New ways to identify an emotion | Planned |
| [Strength](#strength) | New ways to identify an emotion | Shelved (2026-11-08) |
| [Tap the opened word to close it](#tap-the-opened-word-to-close-it) | [The wheel and the card](#the-wheel-and-the-card) | Idea |
| [A different word to start on](#a-different-word-to-start-on) | The wheel and the card | Idea |
| [Return to the word you jumped from](#return-to-the-word-you-jumped-from) | The wheel and the card | Idea |
| [Feeling links underlined in their feeling's color](#feeling-links-underlined-in-their-feelings-color) | The wheel and the card | Idea |
| [About in the start message](#about-in-the-start-message) | [The toolbar, sharing and installing](#the-toolbar-sharing-and-installing) | Idea |
| [Share button](#share-button) | The toolbar, sharing and installing | Idea |
| [Help adding it to the home screen](#help-adding-it-to-the-home-screen) | The toolbar, sharing and installing | Idea |
| [A dark home-screen icon](#a-dark-home-screen-icon) | The toolbar, sharing and installing | Idea |
| [About page rework](#about-page-rework) | [The About page](#the-about-page) | Idea |
| [Real paths, a small router and cleaner URLs](#real-paths-a-small-router-and-cleaner-urls) | [URLs, routing and hosting](#urls-routing-and-hosting) | Idea; decide before launch |
| [Cloudflare instead of GitHub Pages](#cloudflare-instead-of-github-pages) | URLs, routing and hosting | Idea; decide before launch |
| [Languages](#languages) | URLs, routing and hosting | Planned |
| [ACCESSIBILITY.md](#accessibilitymd) | [Project docs](#project-docs) | Idea |

These are what Lucas asked for. Each idea's brainstorm starts here. The sources named below are described in [reference/](reference/README.md).

### New ways to identify an emotion

Each of these is a whole version.

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

### The wheel and the card

Polish to what's there; these could ship together as a point release.

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
- Today the only way back is the browser's Back (the jump pushes history, v2 §4.2), which is the awkward gesture in the [going back on phones](#navigation) known issue. This idea may cover part of that, and so may how [real paths](#real-paths-a-small-router-and-cleaner-urls) treat history.
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
  - whether it shares the app or the opened word. Sharing a word shares its URL, so it's worth having the [URL structure](#real-paths-a-small-router-and-cleaner-urls) settled first; with real paths, a shared word could get its own link preview.

#### Help adding it to the home screen

- Lucas's idea, 2026-11-12: Add to Home Screen is buried on iOS, so make it easier, with instructions or a link to how.
- Today the About page has one sentence on it ("Private and offline").
- What's possible: Safari on iOS has no install prompt a page can trigger, so there it can only be instructions (Share, then Add to Home Screen). Chrome and Edge on Android and desktop fire `beforeinstallprompt`, so there it can be a real Install button.
- To decide when designing: where it shows (About, the start message, a one-time hint), how to tell it's already installed (`display-mode: standalone`) so it doesn't nag, and whether it ships with the [domain move](#before-launching), since installs at the github.io address don't carry over.

#### A dark home-screen icon

- Lucas's idea, 2026-11-12: an icon that's dark when the phone is in dark mode.
- To research when designing; nothing is checked yet. As far as known, there's no standard way for a web app to give its home-screen icon a dark version: the manifest's icons and `apple-touch-icon` take one image each. What might come close: newer iOS can darken or tint home-screen icons itself, and Android can draw a themed icon from a `monochrome` icon in the manifest. The browser-tab icon (`icon.svg`) can already follow dark mode with a media query inside the SVG.
- Today the manifest's `theme_color` and `background_color` are both white (`build/site.ts`).

### The About page

#### About page rework

Lucas's ideas, 2026-11-12:

- **A headline:** "Made with AI, with love." Probably for the "Made by" section; confirm where.
- **Why it exists,** in Lucas's words (a draft to edit before it goes on the page): the original feelings wheel helped immensely in his own therapy. He had a hard time identifying his emotions and thought he was incapable of it. After a lot of work and mindfulness, and having actual words for the emotions, he was able to. He used to look at [feelingswheel.com](reference/core-feelings-wheel.md#the-reference-site) almost daily, and wanted to make an accessible, beautiful, fast and versatile version for others to enjoy.
- **A dedication** to A, E and M. Where it goes is open.
- **The credit links feel off.** Each source's author name links to the work, and Roberts's link goes to an imgur post whose image is gone ([known issue](#the-about-page-1)). To decide: what to link (the work, its title, or the [reference notes](reference/README.md)), and whether to use the archive.org copy already in [core-feelings-wheel.md](reference/core-feelings-wheel.md).
- **A floating back button,** so you don't have to scroll to the bottom to get back to the wheel.
- **A left chevron** on "Back to the wheel". Likely the same control as the floating one.
- With [About in the start message](#about-in-the-start-message), more people arrive at About from the start, so the way back matters more.
- Worth doing before [launching](#before-launching), with the [slow open](#the-about-page-1) known issue.

### URLs, routing and hosting

Decide these together, and before launch: once links are shared and indexed, every change needs redirects that last for good. Moving to a domain is the natural moment. [Languages](#languages) depend on the URL structure, and the [share button](#share-button) and [going back on phones](#navigation) are shaped by it.

#### Real paths, a small router and cleaner URLs

Lucas's ideas: he doesn't like the `/core/` prefix and wants room for languages (2026-11-09). On 2026-11-12: he doesn't like the URLs at all, they're too permissive; he doesn't want to see `about.html` in the address bar, only `/about`; and modern apps don't need hash routing, so why does this one lean on it? Could a small router of our own replace it, without a backend and while keeping dependencies near zero?

- **Today (v2.2.1):** everything is in the hash. The feelings wheel at rest has none. An opened word is `#/core/happy/playful/…`, and the body wheel is `#/body` or `#/body/…`. `core` is the feelings wheel's internal id (`src/state/url.ts`, v2 spec §4.3). About is a separate page, `about.html`.
- **Why the hash:** GitHub Pages only serves files. `/happy/playful` has no file, so it 404s unless a `404.html` hands the path to the app (which answers with a 404 status, bad for search) or the build writes a page for every word. The hash needs no server help.
- **Why it's permissive** (seen in the code, to confirm in the browser):
  - the service worker answers any page request in its scope with the app's shell when it hasn't cached that exact page (`navigationUrls` in `src/sw/strategy.ts`), so once it's installed, any path under the app loads the wheel;
  - an unknown hash gives the start view rather than a not-found, and any query is ignored (`fromHash`).
- **`/about` is not the same problem.** As a real file (`about/index.html`), the address bar shows `/about/`, and it works on GitHub Pages today, no router or backend needed. Without the trailing slash, GitHub Pages redirects `/about` to `/about/`. Its relative links (`./icons/…`, `./src/…`) and the service worker's list of pages would move with it, and `about.html` should redirect.
- **No backend is needed for real paths either.** The History API (`pushState`, `popstate`) gives clean paths in the browser; what's needed is a host that serves the app for paths without a file, or a static page per word written at build time. The second also gives every feeling its own indexable page, with its definition as the description, a big win for search. A router for this app is a small table of paths and two listeners, small enough to write ourselves.
- To decide when designing:
  - **Dropping `core`:** the feelings wheel's words at `/happy/…` and other wheels under their own name (`/body/…`). That needs a rule so a wheel's name can never be a core feeling's id. Or each wheel gets a public name (`feelings`, `body`) separate from its internal id.
  - **Hash or real paths,** and which host ([Cloudflare](#cloudflare-instead-of-github-pages) changes the answer).
  - **What unknown URLs do:** a real not-found page with a link to the wheel, or the start view.
  - **Where the language goes:**
    - A **path prefix** (`/es/…`) works on one domain and on any static host, and is what search engines handle best (with `hreflang` links between languages).
    - A **subdomain** (`es.feelsonwheels.app`) needs DNS per language. GitHub Pages allows one custom domain per repo, so it's a poor fit there.
    - A **query** (`?lang=es`) or a choice saved only on the device is invisible to search.
  - **Slugs:** stable English ids in every language (`/es/happy/…`) or translated ones (`/es/feliz/…`).
  - **History:** whether opening a word still pushes history the way it does today (v2 §4.2), and how that meets the [going back on phones](#navigation) known issue.
  - Old `#/core/…` links must keep working either way.

#### Cloudflare instead of GitHub Pages

- Lucas's question, 2026-11-12: the domain will be registered at Cloudflare, which Lucas already uses for a lot. Should the site be hosted there too?
- What it would change (to confirm when designing; Cloudflare now also offers static sites on Workers, so check which it recommends):
  - it can serve the app for paths without a file, so real paths need no `404.html` workaround;
  - `_headers` and `_redirects` files allow security and cache headers and permanent redirects (`about.html` to `/about/`), which GitHub Pages can't do. Old `#/core/…` links still need the app to redirect them, since the hash never reaches a server;
  - a preview deploy for every pull request;
  - any number of custom domains, so language subdomains become possible;
  - DNS and hosting in one place.
- What moving costs: a new deploy workflow in place of the GitHub Pages one, and updating the shipping rules in `AGENTS.md` and the [domain move](#before-launching) steps.

#### Languages

- Spanish first (the [reference site](reference/core-feelings-wheel.md#the-reference-site) had an Español toggle, and Braman publishes a Spanish wheel), plus a language switcher.
- Adding a language means adding one locale file; no text is hard-coded.
- Where the language lives in the URL is decided with [real paths](#real-paths-a-small-router-and-cleaner-urls).

### Project docs

#### ACCESSIBILITY.md

- Lucas's idea, 2026-11-12: an `ACCESSIBILITY.md` that sets out what the app commits to. GitHub's community files settings suggest one ("Additional community file: Accessibility"), pointing to the [Open Source Accessibility toolkit's template](https://github.com/open-source-accessibility/accessibility-toolkit/blob/main/ACCESSIBILITY.md). Start from its outline:
  - **Why accessibility matters here** and who it's for, in plain language, for someone reading it after hitting a barrier.
  - **Priorities:** keyboard, screen readers, reduced motion, forced colors, text size, both themes. WCAG 2.2 AA is the target, worded as a goal, not a conformance claim: the template says to claim conformance only after an evaluation that names its scope, date, method and evaluator.
  - **Contributor expectations:** what the checks already enforce (axe in the end-to-end tests, the five browsers in CI) and what a user-facing change should show in its PR. The PR template and CONTRIBUTING.md would point to it.
  - **Reporting a barrier:** an issue form of its own beside the bug, idea and language forms, asking for the task, URL, browser, system and assistive technology, with screenshots optional and no disability disclosure asked for. Severity levels only if they'll be used.
  - **How we respond and who owns it:** Lucas, with commitments he can keep as one person.
  - **Supported environments:** only what's actually been tested, with versions; the rest marked untested.
  - **Known limitations,** described as what a person runs into, linking the matching [known issues](#known-issues) (for example the [keyboard selection on the phone's half-wheel](#navigation)).
  - **Feedback** on the statement itself.
- The About page says "Everything works with a keyboard and with a screen reader"; the two should agree.

## Known issues

Still open after v2.2.1. None blocks the next version.

### Phones: turning and zooming

These may share a cause: the browser's own zoom or text inflation, which the app doesn't account for. Worth looking at together.

- **Turning the phone makes the card's text huge.** Found 2026-11-12: going from portrait to sideways and back leaves the description text very large, possibly only when a word is open as it turns. Likely cause: Safari on iOS enlarges text when the phone turns unless told not to. `about.css` sets `-webkit-text-size-adjust: 100%`, but `app.css` doesn't. Likely fix: the same in `app.css`. No fix chosen yet.
- **After turning the phone several times, taps land in the wrong place.** Found 2026-11-12: words stopped opening and closing, and a tap on a word acted on another. Swiping back fixed it. Not yet known whether it's the app or the browser. Worth checking first: a leftover page zoom from turning, and whether the app's mapping from a tap to a word uses a stale position of the wheel.
- **Double-tapping the theme label zooms the page.** Found 2026-11-09 using v2.2.1, mostly on phones while tapping through the theme choices: a quick second tap lands on the label that shows the choice (`.fw-theme-label`, v1.3 §6.2) and the browser zooms into it. Once the label goes, it's hard to double-tap back out. The label takes taps while shown, so a tap on it never reaches the wheel beneath, and as plain text it gets the browser's double-tap-to-zoom; the button beside it doesn't. Likely fix: `touch-action: manipulation` on the label (or the toolbar), which turns off double-tap zoom there while leaving pinch zoom alone. No fix chosen yet.

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

- **Going back on phones.** Swiping back steps through earlier words, which doesn't fit a wheel that's itself swiped to navigate. Lucas raised it while using v2.1; no fix chosen yet, and v2.2 leaves it alone. Related: [return to the word you jumped from](#return-to-the-word-you-jumped-from) and the history question in [real paths](#real-paths-a-small-router-and-cleaner-urls).
- **Keyboard selection on the phone's half-wheel.** Choosing a word by keyboard or the accessible tree can select one on the hidden left half without turning the wheel to show it. Lucas wants to try it before deciding whether the wheel should turn to show it.

### The About page

- **The About page sometimes takes several moments to open.** Found 2026-11-12, tapping the About icon. About is a separate page (`about.html`), so opening it is a full page load rather than a view inside the app. Not yet measured whether the wait is the service worker, the network or the page itself.
- **Roberts's credit link shows nothing.** Found 2026-11-12: the imgur post's image now redirects to imgur's "removed" picture (checked 2026-11-12), so the credit links to an empty post. [core-feelings-wheel.md](reference/core-feelings-wheel.md) still says it was online on 2026-11-09 and has an archive.org copy; update the note when the link is fixed. Part of the [About page rework](#about-page-rework).

### Code and tests

- **The perf leak check is flaky.** `tests/perf/switch.spec.ts` sometimes counts 3 live wheels instead of 2 after 20 switches: about 1 run in 10, on main before v2.1 too, so it's garbage-collection timing rather than a leak. Worth a sturdier check (more GC turns, or a retry) before trusting a failure.
- **Opened-word position lives in two places.** `main.ts` keeps its own copy of the phone's opened-word position and syncs it into the controller in three places; the controller could own it. (v1.3 review)
- **The card's heading size watcher isn't disconnected when the card hides.** Harmless. (v1.3 review)

## Before launching

The app is called **Feels on Wheels** (decided 2026-11-09). Going public happens in two steps: first shareable, then launched. Step 1 [shipped](#versions) on 2026-11-09. Step 2 is what's left before announcing it and letting search engines index it. Nothing here is started.

- **Lucas reviews the definitions and sensations** in [content-review.md](content-review.md). This was moved out of v1.1.
- **Trademark check** on "Feels on Wheels" (USPTO search) before buying a domain. The name was only checked against web, app-store and domain lookups.
- **Decide the host and the URL structure** together: [Cloudflare instead of GitHub Pages](#cloudflare-instead-of-github-pages) and [real paths, a small router and cleaner URLs](#real-paths-a-small-router-and-cleaner-urls), while no links are out in the world.
- **Move to a domain** (going-public spec §3.3; Lucas wants a real domain before linking it from his site). feelsonwheels.app is the likely one (unregistered on 2026-11-09), registered at Cloudflare:
  - set `site.url` in `site.config.ts` (this changes the canonical URL, `og:url`, `og:image`, the JSON-LD, robots.txt and the sitemap) and `indexable: true` (removes `noindex`);
  - on GitHub Pages: add `public/CNAME`, set the custom domain and "Enforce HTTPS" in the repo's Pages settings, and point DNS at GitHub Pages. On Cloudflare: add the domain to the project instead;
  - update the repo's homepage (`gh repo edit --homepage`);
  - deploy and re-check the link previews.
  - Installs and saved themes at the github.io address don't carry over.
- **Optional, after the move:** add the site to Google Search Console and Bing Webmaster Tools and submit the sitemap.
- **Add the icon to lucaspolito.dev**, linking the domain, not github.io. Follow `docs/website-icon/README.md`. Chosen 2026-11-09: the app icon's silhouette, gray like the site's other icons; on hover it takes the wheel's seven colors and spins once, settling.
- **The old private repo:** archive or delete `lpolito/feelings-wheel` once the public one is settled.
- **Known issues and ideas:** decide which to finish before announcing it. The [About page rework](#about-page-rework), [share button](#share-button) and [help adding it to the home screen](#help-adding-it-to-the-home-screen) are the ones a first visitor would notice.

## Content rules

- There are only so many ways to describe a feeling or a body sensation, so overlap with existing wheels and word lists is unavoidable and fine.
- Don't copy any source verbatim, and don't reproduce a source's full layout or word list wholesale.
- Definitions are short, plain-language prose (see v1 spec §3.4).
- Credit every source we draw on, in [reference/](reference/README.md) and on the app's credits page, whether or not a license requires it.

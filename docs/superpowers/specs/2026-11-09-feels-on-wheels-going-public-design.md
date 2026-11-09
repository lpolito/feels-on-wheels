# Feels on Wheels: going public, step 1 (shareable): Design

Date: 2026-11-09
Status: approved in conversation, awaiting written-spec review
Builds on: the app as of v2.2.1. Nothing about the wheels changes. The roadmap's [Before going public](../../ROADMAP.md#before-going-public) list is where this came from, and it tracks what's left after this spec.

## 1. Why

Lucas wants the app online so he can share it and use it across devices. It doesn't need to be "launched" yet: no announcement, no domain, no search ranking. Everything done now should still be right when it does launch, so moving to a real domain later is a few settings, not a rework.

What he asked for:

- Deploy it, at least to GitHub Pages.
- Do the "Before going public" list, except reviewing the definitions.
- A name. He leaned towards "Wheels of Feels".
- Good SEO and social previews, ready for later.
- An icon for his site, lucaspolito.dev, in that site's style, that goes full colour on hover. **Not added to his site yet**: it waits for a real domain.
- Licensing that fits: nobody makes money from it, the source is public because it's interesting to read, and ideas and new languages are welcome.

### Out of scope

- Reviewing the definitions and sensations (`docs/content-review.md`).
- Buying a domain, and switching to it.
- Adding the icon to lucaspolito.dev.
- A trademark search on the name.
- Running the end-to-end tests in CI.
- New languages, and the known issues in the roadmap.

All of these stay tracked in the roadmap (§10).

## 2. Decisions

| Topic | Decision |
|---|---|
| Name | **Feels on Wheels.** "Wheels of Feels" was one letter from wheeloffeels.com, a live commercial emotion-wheel app (Julian Dev, LLC); people hearing the name would search and find that. No app or site uses "Feels on Wheels". §3 |
| Address | `https://lpolito.github.io/feels-on-wheels/` for now, with `noindex`. One config value moves it later; feelsonwheels.app was unregistered on 2026-11-09. §3.2 |
| Repo | A **new public repo, `lpolito/feels-on-wheels`**, with history rewritten to remove two source transcriptions. The current private `lpolito/feelings-wheel` stays untouched as a backup. §4 |
| Code licence | PolyForm Noncommercial 1.0.0. §5 |
| Content licence | CC BY-NC-SA 4.0 for everything in `src/data/` and `docs/`. §5 |
| Contributions | Licensed under the repo's licences, **plus a grant letting Lucas relicense** them (more openly, or commercially himself). §5.3 |
| Deploy | GitHub Actions: unit tests, build, deploy to Pages on every push to `main`. §6 |
| Credits | A separate, static **About page**, with its text from the locale file, linked from an ⓘ in the toolbar. §8 |
| Website icon | The app icon's silhouette, grey at rest; on hover it takes the wheel's seven colours and spins once, settling. Kept in `docs/website-icon/` with agent instructions. §9 |

## 3. Name and address

### 3.1 The name

- The app is **Feels on Wheels** everywhere a person sees its name:
  - `<title>` and the preview tags (§7);
  - the manifest's `name`, with `short_name` **Feels** for the home-screen label;
  - the About page, the README and the repo's description;
  - `package.json`'s `name` (`feels-on-wheels`).
- **Unchanged:** the wheel switch's "Feelings wheel" (`wheels.core.name` in `en.json`) and "See {label} on the feelings wheel". They name one of the app's wheels, not the app.
- The name strings live in `en.json` (§7.1), so a translation can keep or translate the name.
- Code identifiers (`fw-` prefixes, `fw.theme` storage key) stay. Renaming them would only churn the code and reset everyone's saved theme.

### 3.2 One place for the address

`site.config.ts` at the repo root:

```ts
export const site = {
  /** The app's public URL, ending in "/". */
  url: 'https://lpolito.github.io/feels-on-wheels/',
  /** false until the app is on its own domain: pages say noindex. */
  indexable: false,
  repo: 'https://github.com/lpolito/feels-on-wheels',
  author: { name: 'Lucas Polito', url: 'https://lucaspolito.dev/' },
};
```

- The build reads it for every absolute URL: canonical, `og:url`, `og:image`, the JSON-LD, the sitemap and robots.txt. Nothing else in the repo hard-codes the address.
- The app itself keeps using relative URLs (`base: './'`), so it runs at any path.
- **While `indexable` is false**, both pages carry `<meta name="robots" content="noindex">`:
  - Shared links still unfurl with the full preview, because preview scrapers ignore `noindex`.
  - Search engines don't build ranking at an address the app will leave.
  - robots.txt doesn't block crawling. A crawler has to read the page to see `noindex`.

### 3.3 Moving to a domain later

A "Moving to a domain" section in the README lists the steps. The roadmap tracks them too (§10).

1. Buy the domain. Check the trademark first (§10).
2. Set `site.url` to it and `indexable: true`.
3. Add `public/CNAME` with the bare domain, and set the custom domain and "Enforce HTTPS" in the repo's Pages settings. Point DNS at GitHub Pages.
4. Update the repo's homepage (`gh repo edit --homepage`).
5. Deploy and check the preview tags with `curl` and a link-preview checker.
6. Then follow `docs/website-icon/README.md`.

Installs and saved themes at the github.io address don't carry over: they're tied to their origin. That's acceptable while the app hasn't been announced.

## 4. Cleaning the repo before it goes public

### 4.1 Why

`docs/reference/braman-emotion-sensation-wheel.md` transcribes Lindsay Braman's whole wheel (6 emotions, 36 words, 72 sensations), from a photo of the disk she sells. `drummond-vocabulary-of-emotions.md` transcribes Tom Drummond's whole chart (444 entries).

- Single words and short phrases aren't protected. A source's selection and arrangement can be, and a full transcription copies it.
- Braman says plainly that "republishing my art without permission to do so is copyright infringement".
- The realistic worst case isn't a lawsuit. It's a DMCA notice, which makes GitHub disable the whole repo, live site included, until the content is removed from history.
- The project's [content rules](../../ROADMAP.md#content-rules) already forbid shipping either list. This applies the same rule to the docs.

### 4.2 Trimming the notes

- Each note keeps:
  - what the source is, who made it, and when;
  - its links, and its stated usage terms;
  - the structure counts (the tables of how many words per column);
  - the takeaways for this project.
- Each note loses:
  - **Braman:** the word lists (the "Word lists" section and every sensation or middle-word list);
  - **Drummond:** the per-cell word lists and the "Words in more than one cell" lists.
- Examples that make a takeaway clear stay as a handful of named words, as the roadmap already does ("*Resentful* is Hurt medium, Anger medium and Anger light").
- `docs/reference/README.md`'s line "If the repository goes public, check whether any transcription should come out first" becomes a rule: notes describe a source and quote at most a few words; they never transcribe its word list.

### 4.3 Rewriting history

The order matters, because the rewrite changes every commit hash.

1. All of this spec's repo changes land on `main` of the private repo first (§11 lists them).
2. In a fresh clone in a scratch directory, `git filter-repo --invert-paths` removes both notes' paths from every commit. One final commit adds the trimmed notes back.
   - Every other file and commit is unchanged.
   - Author and committer dates and messages are kept.
   - Commits that only touched those notes and end up empty are dropped.
3. **Verify.** No commit's tree contains these phrases: Braman's sensations ("Foot-tapping", "Lip-tremble", "Numb hands") and Drummond's per-cell words (a sample of 10 words that appear only in his lists). `git log --all -p` piped through `grep` returns nothing.
4. Use filter-repo's `commit-map` to update the commit hashes the roadmap cites (`2210c12`, `e9ae2b4`, `63977fa` and `be1b053`) in the same final commit.
5. Create `lpolito/feels-on-wheels` (public), with its description, homepage (`site.url`) and topics (`feelings-wheel`, `emotions`, `pwa`, `accessibility`, `mental-health`). Push `main` only: no other branches, no tags.
6. **Ask Lucas before repointing his local checkout.** His local `main` has the old hashes. The plan offers to rename the old remote to `archive`, add the new one as `origin` and reset local `main` to it.

`lpolito/feelings-wheel` stays private and untouched.

## 5. Licence, copyright and contributors

This isn't legal advice. It's the standard, widely used way to do what Lucas described.

### 5.1 Files

- **`LICENSE`**, short and in plain words:
  - `Copyright (c) 2026 Lucas Polito`.
  - **Code** (everything outside `src/data/` and `docs/`) is under PolyForm Noncommercial 1.0.0. The PolyForm `Required Notice: Copyright Lucas Polito (https://lucaspolito.dev/)` line is included.
  - **Content** (`src/data/`: wheel layouts, words, definitions, sensations and translations; and `docs/`) is under CC BY-NC-SA 4.0.
  - Third-party fonts, tools and the sources in `docs/reference/` keep their own rights. These licences cover only this project's own work.
  - One sentence: this is **source-available, not open source**. Non-commercial use, copying, changing and translating are welcome. Selling it, running ads on a copy, or shipping a paid app isn't.
- **`LICENSES/PolyForm-Noncommercial-1.0.0.md`** and **`LICENSES/CC-BY-NC-SA-4.0.txt`**: the full, unmodified texts from polyformproject.org and creativecommons.org.

### 5.2 README.md

- What the app is and who it's for, in two or three sentences, with the live link.
- A screenshot (`docs/screenshot.png`, the feelings wheel with a word opened, light theme).
- **Licence** in one paragraph: what's allowed, what isn't, and why it's source-available.
- **Running it:** `npm ci`, `npm run dev`, `npm test`, `npm run test:e2e`, `npm run build`, `npm run size`.
- **Adding a language:** one locale file. Points to CONTRIBUTING.md.
- **Ideas and the roadmap:** `docs/ROADMAP.md`; open an issue to suggest one.
- **Moving to a domain** (§3.3).
- **Credits:** points to the About page and `docs/reference/`.

### 5.3 CONTRIBUTING.md and the PR template

- **Ideas:** open an issue. Lucas decides what goes on the roadmap.
- **Languages:**
  - what to translate (`ui`, every feeling's label and definition, the sensations, the page strings);
  - the [content rules](../../ROADMAP.md#content-rules), and plain language over literal translation;
  - check with an issue first, so two people don't translate the same language.
- **Code:** run `npm test` and `npm run test:e2e` before opening a PR. Follow the existing style.
- **Terms**, quoted in the PR template:
  > By contributing, you agree that your contribution is licensed under this repository's licences (PolyForm Noncommercial 1.0.0 for code, CC BY-NC-SA 4.0 for content), and you grant Lucas Polito a perpetual, worldwide, irrevocable, royalty-free licence to use, change and relicense your contribution under any terms, including commercial ones. You keep the copyright on your work, and you confirm you have the right to contribute it.
- **`.github/pull_request_template.md`:** a short "What and why", plus a required checkbox for the terms above.

## 6. Deploy

### 6.1 The workflow

`.github/workflows/deploy.yml`:

- Runs on every push to `main`, and by hand (`workflow_dispatch`).
- **Build job:**
  - checkout;
  - `actions/setup-node` with the Node major used locally, plus the npm cache;
  - `npm ci`, `npm test`, `npm run build`, `npm run size`;
  - `actions/configure-pages`, then `actions/upload-pages-artifact` with `dist/`.
- **Deploy job:** `actions/deploy-pages`, with `pages: write` and `id-token: write`, and concurrency group `pages`.
- Action versions are pinned to their current major. The plan checks them.
- End-to-end and perf tests stay local. They use five browsers and are slow, and the perf leak check is known to be flaky.

### 6.2 Pages settings

`gh api` sets the Pages source to "GitHub Actions" on the new repo.

### 6.3 Check it live

On `https://lpolito.github.io/feels-on-wheels/`:

- The app loads and both wheels work.
- `about.html` loads and links back.
- The service worker installs. After one visit, both pages load offline.
- The manifest's `start_url` and `scope` resolve under the subpath, and the app installs.
- `curl` of both pages shows the §7 tags with absolute URLs, and `og-image.png` returns 200.

## 7. Web presence

### 7.1 Page strings

New keys in `en.json`, under `page`:

- `name` ("Feels on Wheels") and `shortName` ("Feels").
- `title` ("Feels on Wheels: name what you feel").
- `description`: one sentence of about 150 characters. It says what the app is: a free feelings wheel and body sensations wheel that helps you find the word for what you feel, and works offline.
- `imageAlt`: describes the preview image.
- `about.*` (§8.2).

The app's loader (`src/data/load.ts`) imports only the keys the app uses (`meta`, `ui`, `feelings` and the rest it reads today), using Vite's named JSON exports. That keeps `page` out of the app's JS. `npm run size` must stay within budget.

### 7.2 What goes in each page's `<head>`

A build plugin, `build/site-plugin.ts`, injects the tags from `site.config.ts` and `page` strings into both `index.html` and `about.html` via `transformIndexHtml`. It works in dev and build. Pure functions do the work, so they can be unit tested.

- `<title>` and `<meta name="description">`.
- `<link rel="canonical">`: `site.url` for the wheel, `site.url + 'about.html'` for About.
- `<meta name="robots" content="noindex">` while `indexable` is false.
- Open Graph:
  - `og:type` website, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:locale` (`en_US`);
  - `og:image` (absolute), with `og:image:width` 1200, `og:image:height` 630 and `og:image:alt`.
- Twitter: `twitter:card` `summary_large_image` and `twitter:image:alt`. The rest fall back to Open Graph.
- On the wheel's page only, JSON-LD `WebApplication`:
  - `name`, `url`, `description`, `inLanguage`;
  - `applicationCategory` `LifestyleApplication` and `operatingSystem` "Any";
  - `isAccessibleForFree: true` and `offers` (price 0);
  - `author` (Person, Lucas Polito, lucaspolito.dev);
  - `license` (the LICENSE file on GitHub).
- `<noscript>` on the wheel's page: "Feels on Wheels needs JavaScript to draw the wheel." (`page.noscript`), with a link to About.

### 7.3 The preview image

- `public/og-image.png`, 1200×630.
- `scripts/make-og-image.mjs` renders it with Playwright, the way `scripts/make-icons.mjs` does. Rerun it by hand when the name or icon changes.
- Content, on the app's dark background (`#121114`):
  - the app icon (`public/icons/icon.svg`) large on the left;
  - "Feels on Wheels" and the tagline "Name what you feel" on the right, in the app's font stack.
- Readable at the small size chat apps show. Text is at least 64 px tall in the image.

### 7.4 robots.txt and sitemap.xml

`build/site-plugin.ts` emits both at build time from `site.url`:

- **robots.txt:** `User-agent: *`, `Allow: /`, `Sitemap: <site.url>sitemap.xml`.
- **sitemap.xml:** the wheel and About.

At `lpolito.github.io/feels-on-wheels/`, crawlers only read robots.txt at the host's root, so this file only takes effect on a domain. It's built now so the move is just a config change.

### 7.5 Manifest

- `name` and `short_name` per §3.1, and `description` from `page.description`.
- An `id` (`./`).
- The build plugin fills the manifest from `en.json`, so the name isn't hard-coded in two places.

## 8. The About page

### 8.1 How it's built

- `about.html` at the repo root is a second Vite input (`build.rollupOptions.input`).
- It's static HTML. `build/site-plugin.ts` renders its body from `page.about` at build (and in dev). No JS ships for it except a tiny inline script before paint.
- Styles: `tokens.css` plus a small `about.css`.
  - A readable column, 40rem max, with a 1rem gutter on phones.
  - The app's font stack.
  - Links in `--fg` with an underline; focus rings use `--focus`.
- **Theme:** an inline script in `<head>` reads `localStorage['fw.theme']` (in try/catch) and sets `data-theme`, the same way the app applies it. With no saved choice, it follows the system. The page has no theme control.

### 8.2 What it says

All text comes from `page.about`:

1. **Feels on Wheels** (h1) and a one-line summary.
2. **What it's for:** naming a feeling precisely helps you understand it and talk about it. The wheel goes from a few core feelings to many specific words. The body wheel starts from what you notice in your body.
3. **How to use it:** tap or click a feeling to narrow it down, open a word to read what it means, switch wheels at the top. Works with a keyboard and screen readers.
4. **Private and offline:** no accounts, no tracking. Nothing you choose leaves your device. Install it from your browser's menu to use it offline.
5. **Credits:** one entry per source the shipped content draws on, following `docs/reference/README.md`'s Credits list (§8.3). Each has the author, the work, the year, a link, and a short "what we took".
6. **Made by Lucas Polito**, linking lucaspolito.dev.
7. **Source and licence:** links to the repo and LICENSE, and the one-sentence licence summary.
8. **Help translate:** a link to CONTRIBUTING.md.
9. A link back: "Back to the wheel" (`./`).

### 8.3 Confirming the credits first

- Before writing the credits, try to confirm two things in `docs/reference/core-feelings-wheel.md`:
  - that the seven-core wheel is Geoffrey Roberts's (2015);
  - that feelingswheel.com is the reference site.
- Update the note with what's found.
- Wording on the page follows what's confirmed: "by Geoffrey Roberts" if confirmed, "usually credited to Geoffrey Roberts" if not.
- Drummond isn't credited, because strength isn't shipped. Nummenmaa et al. are credited only if the body wheel's notes or spec say they used it. The plan checks.

### 8.4 The link to it

- An **ⓘ link** (an `<a href="./about.html">`, not a button) in the toolbar, next to the theme control. It has the same 44 px target and icon style.
- Accessible name: "About Feels on Wheels" (`ui.about`). It has a `title` with the same text.
- It sits in the toolbar's tab order after the theme control.

### 8.5 Offline

`src/sw/strategy.ts`'s `navigationResponse` changes:

- **Before:** a navigation always gets the cached `index.html`.
- **After:** it gets the cached page matching the navigation's URL (path only, ignoring search and hash) if one was precached. Otherwise it gets `index.html`, as before.
- The precache already includes every built file, so `about.html` is in it.
- The "never write a newer page into this worker's cache" rule is unchanged.

## 9. Website icon kit

For lucaspolito.dev, **not added there yet**. Everything lives in `docs/website-icon/`:

- **`feels-on-wheels.svg`:** the silhouette, used as a CSS mask, exactly as the site's other icons are.
  - Based on `public/icons/icon.svg`: a 240 radius disc with a 78 radius hole.
  - Seven spoke gaps (20 units wide) at the wheel's own wedge boundaries (0°, 52.7°, 122.9°, 158.0°, 210.7°, 289.8° and 324.9°, clockwise from 12 o'clock).
  - A 16-unit ring gap at radius 148.8.
- **`feels-on-wheels.css`:** the rules to add to the site's `css/styles.css`, in its style.
  - `.icon-feels` sets `--icon`.
  - Its `::after` drops the gradient's inset and rotation, and takes a hard-stop `conic-gradient` of the app's dark-theme core colours, aligned with the wedges: Fearful `#E0559E`, Angry `#E0525C`, Disgusted `#C77A4F`, Sad `#7A70C2`, Happy `#E8933A`, Surprised `#5FA383`, Bad `#8E6BC0`. Every colour clears the site's 3:1 rule on `#121214`; the lowest is Sad at 4.39:1.
  - **Hover** (under `@media (hover: hover)`), `:focus-visible` and `:active` all do the same:
    - the colours fade in over 150 ms, like the site's other icons;
    - the icon turns one full turn in 1.1 s with `cubic-bezier(.2, .8, .25, 1)` and settles;
    - on leaving, it returns without animating, so it can spin again next time.
  - **Reduced motion:** no spin; the colours still fade in.
  - **Forced colours:** no colour layer; the site's existing `LinkText` rule shows the silhouette.
- **`snippet.html`:** the `<a>` to add to `#links`. Its `href` is a placeholder for the domain, and its `aria-label` is "Feels on Wheels, a feelings wheel by Lucas Polito". No `rel="me"`.
- **`preview.html`:** a stand-alone copy of the site's links row with the new icon, to check it in a browser. It loads the site's live `styles.css` and icons from lucaspolito.dev.
- **`README.md`,** written as instructions an agent can follow:
  1. **When:** only once the app is on its own domain (§3.3). Never link the github.io address.
  2. Copy the SVG into `~/dev/lucaspolito.dev/icons/`, add the CSS after `.icon-linkedin`, and add the link as the last item in `#links` unless Lucas says otherwise.
  3. Check four icons fit at 320 px wide. With the site's sizes, 4 × 3.5rem plus 3 × 1.5rem gaps is 296 px.
  4. Check hover, keyboard focus, reduced motion and forced colours. The contrast ratios are listed.
  5. Update that repo's README ("What's where"). Note that Cloudflare caches CSS for up to 4 hours. Pushing that repo's `main` deploys it.

## 10. What's left before "going public" for real

The roadmap's [Before going public](../../ROADMAP.md#before-going-public) is rewritten in the same change as this spec, so it lists what this spec does and what stays open:

- Lucas reviews the definitions and sensations (`docs/content-review.md`).
- Trademark check on "Feels on Wheels" (USPTO search) before buying a domain.
- Buy feelsonwheels.app (or another domain) and move to it (§3.3): `site.url`, `indexable: true`, `public/CNAME`, Pages custom domain and HTTPS, DNS, repo homepage, then re-check the previews.
- Optional, after the move: add the site to Google Search Console and Bing Webmaster Tools and submit the sitemap.
- Add the icon to lucaspolito.dev (`docs/website-icon/README.md`), linking the domain.
- Any credit §8.3 couldn't confirm.
- Decide what to do with the private `lpolito/feelings-wheel` (archive or delete) once the public repo is settled.
- Decide whether any known issue should be fixed before announcing it.

## 11. Testing

**Unit (Vitest):**

- `build/site-plugin.ts`:
  - The head tags for each page. Canonical, `og:url` and `og:image` are absolute and start with `site.url`.
  - `noindex` is present exactly when `indexable` is false.
  - The JSON-LD parses.
  - robots.txt and sitemap.xml contents.
- **The About render:**
  - every credit has a link;
  - no `{placeholder}` or empty string is left;
  - headings are in order.
- **The manifest** takes its name from `en.json`.
- **`navigationResponse`:**
  - a precached `about.html` navigation gets `about.html`;
  - one with `?x=1` does too;
  - an unknown path gets `index.html`;
  - the existing cases still pass.
- **Content:** `page` strings exist and aren't empty.

**End to end (Playwright, existing projects):**

- The toolbar's About link opens About. "Back to the wheel" returns to it.
- About follows the saved theme (dark and light).
- axe passes on About in both themes.
- Offline: after a first visit, About loads with the network off. This extends `offline.spec.ts`.
- The viewport sweep still passes with the extra toolbar link, from 280 px phones up.

**Build:** `npm run size` stays in budget, and `dist/` contains `about.html`, `robots.txt`, `sitemap.xml` and `og-image.png`.

**Live (§6.3):** checked by hand after the first deploy.

**History (§4.3):** the phrase check returns nothing.

## 12. Docs

- `docs/ROADMAP.md`:
  - "Before going public" rewritten (§10);
  - the aim line and title use the name;
  - links to this spec and its plan.
- `docs/reference/README.md`: the transcription rule (§4.2), and Credits updated with what §8.3 finds.
- `docs/reference/core-feelings-wheel.md`: §8.3's findings.
- `CLAUDE.md`:
  - the project's name;
  - "never transcribe a source's word list";
  - the site config is the only place for the public URL.

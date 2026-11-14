# Feels on Wheels: Cloudflare and feelsonwheels.app

Approved by Lucas on 2026-11-13. A short design: the move is small, and most of it was settled in conversation.

## Intent

Lucas bought feelsonwheels.app at Cloudflare and wants the app on it. Moving to the domain isn't the same as launching it. The commitments that are hard to undo are search engines indexing the app and linking it from lucaspolito.dev, and both stay for later. So the app moves now, stays `noindex`, and isn't announced.

## Goals

- The app is served at `https://feelsonwheels.app/`, deployed by Cloudflare on every merge to `main`.
- Every pull request gets a preview link.
- It costs nothing beyond the domain.

## Non-goals

- Indexing (`indexable` stays `false`), linking from lucaspolito.dev, and announcing it.
- The URL redesign ([real paths, a small router and cleaner URLs](../../ROADMAP.md#real-paths-a-small-router-and-cleaner-urls)).
- Forwarding from the old github.io address. Lucas decided (2026-11-13) it simply stops working.

## Decisions Lucas made

- **No forwarding** from `lpolito.github.io/feels-on-wheels/`.
- **Old hash links don't need to keep working** when the URLs are redesigned. The roadmap's "old `#/core/…` links must keep working" no longer holds.
- **No trademark check.**
- **Free only.** Cloudflare Workers' static assets are free and unlimited; Workers Builds' free plan has 3,000 build minutes a month.

## Approaches

1. **Workers Builds (Cloudflare's GitHub integration).** Cloudflare's GitHub app builds and deploys on each push to `main`, and comments a preview link on each pull request. No Cloudflare token in GitHub. Some settings live in Cloudflare's dashboard. **Chosen:** previews come for free, and `main` already only takes pull requests that passed CI, so the deploy doesn't need to wait for tests.
2. **Wrangler from GitHub Actions.** Keeps everything in `deploy.yml` and lets the deploy wait for tests, but needs an API token as a GitHub secret, and previews would be hand-written. Not chosen; switching later is small.
3. **Cloudflare Pages.** Cloudflare now steers new static sites to Workers static assets, which have more features at the same price. Not chosen.

## Design

- **`wrangler.jsonc`** names the Worker and serves the built `dist/` as static assets. Unknown paths get a plain 404 for now; the URL redesign decides what they should do.
- **Wrangler** is pinned as a dev dependency, so Cloudflare's builds and local checks use the same version.
- **`site.config.ts`:** `url` becomes `https://feelsonwheels.app/`; `indexable` stays `false`.
- **`deploy.yml`** is deleted. `ci.yml` is unchanged.
- **Docs-only changes don't deploy**, as today: Cloudflare's build watch paths exclude `docs/**` and top-level `*.md`.
- **Docs:** `AGENTS.md` (shipping), the README, `SECURITY.md` and the issue templates (the live URL), and the roadmap (the move done, Lucas's decisions recorded).
- **Lucas, by hand** (his account's permissions): install Cloudflare's GitHub app on the repo and create the Worker from it, set the build settings, attach `feelsonwheels.app` and redirect `www` to it, turn off GitHub Pages, and update the repo's homepage.

## Change after approval: About moves to `/about` (Lucas, 2026-11-13)

Testing the build under `wrangler dev` showed the offline cache breaks on Cloudflare:

- Cloudflare's default `html_handling` (`auto-trailing-slash`) answers `/about.html` with a 307 to `/about`, and `/index.html` with a 307 to `/`.
- The service worker precaches `./about.html` and `./index.html`, so it stores those redirects. Chromium refuses a redirected response for a page load, so after one visit About and every address that falls back to the shell fail to load, online and offline.
- `html_handling: "none"` avoids the redirects but makes `/` a 404.

So About moves to `/about` now, which is the address Lucas wanted anyway (roadmap, 2026-11-12):

- Cloudflare's default handling stays: `/about` serves `about.html`, and `/about.html` redirects to it. Vite's dev and preview servers also serve `/about`.
- Every link to About, its canonical URL and the sitemap use `about`, not `about.html`.
- The service worker precaches `./` and `./about` instead of `./index.html` and `./about.html`, uses `./` as the shell, and never stores a redirected response: if one comes back, the install fails, so the previous worker keeps serving.
- Wrangler isn't a dev dependency after all: Workers Builds runs `npx wrangler deploy` without it, and local checks use `npx wrangler@<version>`.

## Left to the builder

- The order of the hand steps, so Cloudflare's first build of `main` finds `wrangler.jsonc`.
- Which Node version Cloudflare's builds use, matching CI's Node 26 if it can.

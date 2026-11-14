# Feels on Wheels

## Roadmap

`docs/ROADMAP.md` is the living list of versions, their status, and ideas for later.

- Read it before brainstorming or planning a new version.
- Update it in the same change when a spec is approved, a version ships, or Lucas mentions new or later work, so nothing lives only in a chat.
- Specs (`docs/superpowers/specs/`) are frozen once approved. Link to them from the roadmap instead of copying the version list into each spec.

## Accessibility

- Changes to what people see or do follow the contributor expectations in `ACCESSIBILITY.md`. In the PR's "What and why", say how the change was checked: the tests, the keyboard in a browser, and which hand checks (a screen reader, a real phone) weren't done.
- When a version ships or a known issue is found or fixed, update the known limitations in `ACCESSIBILITY.md` in the same change.

## Shipping changes

`main` is protected: changes reach it only through a pull request, and the `CI` workflow's checks (`checks` and `e2e` in five browsers) must pass to merge. Merging deploys the live site, unless the PR only changes `docs/` or top-level Markdown files: Cloudflare's GitHub integration builds and deploys it (`wrangler.jsonc`, with the build settings in Cloudflare's dashboard) as the built files plus a small Worker (`src/worker/`) that runs only for paths with no file, and posts a preview link on each PR. The end-to-end tests run under `wrangler dev`, so they use the same Worker. Work on a branch, push it, and open a PR; never push to `main`.

## Sources and credits

`docs/reference/` has a note for every outside source the project draws on (wheels, word lists, research), plus the text of the app's credits.

- When a spec, the roadmap or the content uses a new source, add a note there, add it to the Credits list in `docs/reference/README.md`, and credit it on the About page (`page.about` in `src/data/locales/en.json`).
- Never name a source without linking its note.
- Never transcribe a source's word list or layout into the repo, not even in notes. Quote a few words as examples at most.

## Site URL

`site.config.ts` is the only place the public URL lives. Never hard-code it elsewhere; the build fills canonical URLs, preview tags, robots.txt and the sitemap from it.

## Spelling

Use US spelling everywhere: app text, docs, code and comments (color, license, center, gray, behavior, toward). Approved specs and plans stay as written.

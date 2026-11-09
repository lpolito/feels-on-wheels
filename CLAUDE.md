# Feels on Wheels

## Roadmap

`docs/ROADMAP.md` is the living list of versions, their status, and ideas for later.

- Read it before brainstorming or planning a new version.
- Update it in the same change when a spec is approved, a version ships, or Lucas mentions new or later work, so nothing lives only in a chat.
- Specs (`docs/superpowers/specs/`) are frozen once approved. Link to them from the roadmap instead of copying the version list into each spec.

## Sources and credits

`docs/reference/` has a note for every outside source the project draws on (wheels, word lists, research), plus the text of the app's credits.

- When a spec, the roadmap or the content uses a new source, add a note there, add it to the Credits list in `docs/reference/README.md`, and credit it on the About page (`page.about` in `src/data/locales/en.json`).
- Never name a source without linking its note.
- Never transcribe a source's word list or layout into the repo, not even in notes. Quote a few words as examples at most.

## Site URL

`site.config.ts` is the only place the public URL lives. Never hard-code it elsewhere; the build fills canonical URLs, preview tags, robots.txt and the sitemap from it.

## Spelling

Use US spelling everywhere: app text, docs, code and comments (color, license, center, gray, behavior, toward). Approved specs and plans stay as written.

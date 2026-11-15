# Changes from the spec

Where *Share buttons, About in the start message, and per-feeling link previews* as shipped differs from its approved [spec](2026-11-15-feels-on-wheels-share-and-preview-design.md). The spec stays as it was approved.

- **The preview image files are named by the wheels' own ids** (`og/core-happy.png`, `og/body-whole-body.png`), not `feelings-happy.png` as §5 suggested, so the names come straight from the wheel data.
- **"Link copied" shows just below its button**, not literally beside it. The toolbar's button and the card's share one style. On a 375 px phone the card's label can briefly cover the end of the definition's first line for its 1.5 seconds.
- **A bug found while restoring an end-to-end test, fixed in this change though the spec didn't cover it:** entering About by Back or Forward while the wheel was still spinning let the spin's landing overwrite About's own history entry with the landed word, so Forward went to a word's address instead of `/about`. About now takes over before the spin lands (`showAbout` in `src/main.ts`).
- **The image script draws each simplified cell's color from the real segment** at its middle angle, using each segment's own shade ring, so the body wheel's outer ring matches the app's shading of borrowed feelings. This is slightly different from the approved mock, which sampled pixels.

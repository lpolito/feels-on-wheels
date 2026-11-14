# The core feelings wheel and the reference site

The source for the app's core wheel (`src/data/wheels/core.json`) and the interaction Lucas wanted to improve on.

## Lineage

- **Gloria Willcox, "The Feeling Wheel" (1982).** *Transactional Analysis Journal* 12(4), 274–276. The usual origin of feelings wheels: a few core feelings in the center, more specific words further out. Its six cores are Mad, Sad, Scared, Joyful, Powerful and Peaceful.
- **Geoffrey Roberts, "I Feel – Emotional Word Wheel – The Feel Wheel" (2015).** A widely shared variation rooted in Willcox's wheel, and the seven-core version with Happy, Surprised, Bad, Fearful, Angry, Disgusted and Sad.
  - Posted on imgur on March 5, 2015: <https://imgur.com/tCWChf6> (still online on 2026-11-09; the image was removed by 2026-11-12). Archived at <https://web.archive.org/web/20180505024944/https://imgur.com/tCWChf6>, which the app's credit links since the About page rework (2026-11-14).
  - Confirmed on 2026-11-09 by two independent sources. [datavizblog.com](https://datavizblog.com/2020/03/20/the-feel-wheel-how-are-all-of-you-doing-out-there/) cites the imgur post and quotes Roberts. The [reference site](#the-reference-site) credits him: "Wheel content based on Geoffrey Roberts' Feel Wheel."
  - In the quoted text, Roberts says the first wheel in this style was Dr. Gloria Willcox's, in the early 1980s. He also says the wheel he based his on may have been by a teacher named Kaitlin Robb. That isn't confirmed, and sources spell the name differently, so we don't credit it.
- A later remix on Observable ([ajwwong/feelings-wheel](https://observablehq.com/@ajwwong/feelings-wheel)) points out that some of its outer words aren't feelings but judgments about other people's behavior, e.g. *Disrespected*.

## The reference site

An interactive web version of the seven-core wheel. Lucas shared screenshots in the first brainstorming session (2026-11-06). On 2026-11-08 he named <https://feelingswheel.com/> as the site that inspired the app.

- **Confirmed 2026-11-09.** The live site still blocks automated visits, so an Internet Archive copy from 2026-07-14 was checked instead: <http://web.archive.org/web/20260714032040/https://www.feelingswheel.com/>.
  - It has the same Reset button and "New colors" / "Original" toggles as the screenshots.
  - Its page title is "Feelings Wheel — a free tool to help you name what you're feeling".
  - It credits "Wheel content based on Geoffrey Roberts' Feel Wheel".
  - It names no author on the page. It calls itself "a free resource for anybody who might find it useful" and isn't run for profit.
  - The Español toggle wasn't visible in the archived page's HTML, probably because a script draws it.

What it does:

- Shows the wheel as one large SVG with three rings: 7 core feelings, 41 middle and 82 outer words. Labels run outward along each spoke, so the left half reads upside down.
- **Tap a feeling to trace its path.** A tooltip shows the path ("Surprised → Startled → Shocked"). After tapping, the path stays in full color, everything else fades, and the path appears as chips across the top (Angry → Aggressive → Provoked).
- Has a **Reset** button in the center to clear the selection.
- Offers toggles for **New colors / Original** color schemes and **Español**.

What Lucas wanted different:

- It crashes Firefox on his computer (it's fine in Firefox on iOS). This is why the app draws on a canvas instead of one big SVG; see the v1 spec's key decisions.
- No Reset button in the middle.
- A zoomed view where one ring fills the screen and the chosen word sits level, snapping to the nearest word as the wheel turns.
- A definition card, body sensations, and words at each strength for the chosen feeling.

## Takeaways for this project

1. The wheel's words come from this widely shared seven-core version, not from Willcox's original. Credit both.
2. Some outer words are judgments of others (Disrespected, Ridiculed, Betrayed, Persecuted) rather than feelings. Worth keeping in mind when writing definitions; the definition can name the feeling underneath.
3. A few words appear twice on the wheel (Overwhelmed, Embarrassed, Inferior, Disappointed). The app gives each position its own id but one shared definition.

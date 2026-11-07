# The core feelings wheel and the reference site

The source for the app's core wheel (`src/data/wheels/core.json`) and the interaction Lucas wanted to improve on.

## Lineage

- **Gloria Willcox, "The Feeling Wheel" (1982).** *Transactional Analysis Journal* 12(4), 274–276. The usual origin of feelings wheels: a few core feelings in the centre, more specific words further out. Its six cores are Mad, Sad, Scared, Joyful, Powerful and Peaceful.
- **Geoffrey Roberts, "The Feel Wheel" (2015).** A widely shared variation rooted in Willcox's wheel. The seven-core version with Happy, Surprised, Bad, Fearful, Angry, Disgusted and Sad is usually credited to Roberts, but this wasn't confirmed against a primary source. The original high-resolution image is reportedly no longer online.
- A later remix on Observable ([ajwwong/feelings-wheel](https://observablehq.com/@ajwwong/feelings-wheel)) points out that some of its outer words aren't feelings but judgements about other people's behaviour, e.g. *Disrespected*.

## The reference site

An interactive web version of the seven-core wheel. Lucas shared screenshots in the first brainstorming session (2026-11-06); **its URL wasn't recorded**, so add it here if known.

What it does:

- Shows the wheel as one large SVG with three rings: 7 core feelings, 41 middle and 82 outer words. Labels run outward along each spoke, so the left half reads upside down.
- **Tap a feeling to trace its path.** A tooltip shows the path ("Surprised → Startled → Shocked"). After tapping, the path stays in full colour, everything else fades, and the path appears as chips across the top (Angry → Aggressive → Provoked).
- Has a **Reset** button in the centre to clear the selection.
- Offers toggles for **New colors / Original** colour schemes and **Español**.

What Lucas wanted different:

- It crashes Firefox on his computer (it's fine in Firefox on iOS). This is why the app draws on a canvas instead of one big SVG; see the v1 spec's key decisions.
- No Reset button in the middle.
- A zoomed view where one ring fills the screen and the chosen word sits level, snapping to the nearest word as the wheel turns.
- A definition card, body sensations, and words at each strength for the chosen feeling.

## Takeaways for this project

1. The wheel's words come from this widely shared seven-core version, not from Willcox's original. Credit both.
2. Some outer words are judgements of others (Disrespected, Ridiculed, Betrayed, Persecuted) rather than feelings. Worth keeping in mind when writing definitions; the definition can name the feeling underneath.
3. A few words appear twice on the wheel (Overwhelmed, Embarrassed, Inferior, Disappointed). The app gives each position its own id but one shared definition.

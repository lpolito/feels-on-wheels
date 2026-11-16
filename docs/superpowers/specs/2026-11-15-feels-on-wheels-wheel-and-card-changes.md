# Changes from the spec: the wheel and the card

What differs from [the spec](2026-11-15-feels-on-wheels-wheel-and-card-design.md).

## The Back to pill's text (§2)

- **Spec:** "Back to {word}", naming the word you jumped from.
- **Now:** "Back to the body wheel". Decided while planning (2026-11-15): every word you can jump from is a feeling on the body wheel, and "See Scared on the feelings wheel" lands on Scared itself, so "Back to Scared" would show while you're already looking at Scared. The card you left still opens again.
- The text is per wheel, a `backTo` string in each wheel's locale text (required on every wheel but the first), so no wheel name is lowercased in code (the [languages](../../ROADMAP.md#languages) idea's concern).

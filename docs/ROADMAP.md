# Roadmap

The living list of what's built, what's next, and what's still an idea. Specs are frozen once approved; this file is not. Update it when a spec is approved, when a version ships, and whenever new or later work comes up, so nothing lives only in a chat.

**Aim:** every way to identify an emotion, in a fast, accessible, lightweight feelings wheel that works offline, installs as an app, and supports light and dark mode. Built for Lucas first and meant to go public later.

## Versions

Each version is used before the next one is designed. Point releases (v1.1) rework what's there after using it. Whole versions add a new way to identify an emotion.

| Version | Status | Spec and plan |
|---|---|---|
| v1: Core wheel | Shipped | [spec](superpowers/specs/2026-11-06-feelings-wheel-v1-design.md), [plan](superpowers/plans/2026-11-06-feelings-wheel-v1.md) |
| v1.1: Selected and opened states, card redesign | In progress | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.1-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.1.md) |
| v2: Strength | Next | Not designed yet |
| v3: Body sensations wheel | Planned | Not designed yet |
| v4: Emoji wheel | Planned | Not designed yet |
| v5: Languages | Planned | Not designed yet |

## Notes for later versions

These are what Lucas asked for. Each version's brainstorm starts here.

### v2: Strength

- A toggle for strong, medium and light, like Tom Drummond's "Vocabulary of Emotions" table (North Seattle Community College).
- The panel lists a feeling's words at each strength.
- **Open question:** Drummond's table has 10 categories (Happiness, Caring, Depression, Inadequateness, Fear, Confusion, Hurt, Anger, Loneliness, Remorse) that don't match the wheel's 7 core feelings. The v2 design has to decide whether to map them onto the wheel, give them their own wheel, or only tag the wheel's existing words.
- The data is ready: `Feeling.strength` is already an optional field.

### v3: Body sensations wheel

- Modelled on Lindsay Braman's Emotion-Sensation Wheel: core feelings, then feelings, then an outer ring of body sensations.
- Uses the same renderer and gestures as the core wheel; only the wheel file is new.
- The wording follows the content rules below.

### v4: Emoji wheel

- Very simplified: core feelings and a few middle-ring ones, because there are only so many emoji.
- The data is ready: `Feeling.emoji` is already an optional field.

### v5: Languages

- Spanish first (the reference wheel had an Español toggle), plus a language switcher.
- Adding a language means adding one locale file; no text is hard-coded.

## Before going public

- Lucas reviews the definitions and sensations in [content-review.md](content-review.md). This was moved out of v1.1.

## Content rules

- There are only so many ways to describe a feeling or a body sensation, so overlap with existing wheels and word lists is unavoidable and fine.
- Don't copy any source verbatim, and don't reproduce a source's full layout or word list wholesale.
- Definitions are short, plain-language prose (see v1 spec §3.4).

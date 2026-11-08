# Roadmap

The living list of what's built, what's next, and what's still an idea. Specs are frozen once approved; this file is not. Update it when a spec is approved, when a version ships, and whenever new or later work comes up, so nothing lives only in a chat.

**Aim:** every way to identify an emotion, in a fast, accessible, lightweight feelings wheel that works offline, installs as an app, and supports light and dark mode. Built for Lucas first and meant to go public later.

## Versions

Each version is used before the next one is designed. Point releases (v1.1) rework what's there after using it. Whole versions add a new way to identify an emotion. The feedback behind each shipped version is in its spec, and in the git history for v1.3.1.

| Version | Status | Spec and plan |
|---|---|---|
| v1: Core wheel | Shipped | [spec](superpowers/specs/2026-11-06-feelings-wheel-v1-design.md), [plan](superpowers/plans/2026-11-06-feelings-wheel-v1.md) |
| v1.1: Selected and opened states, card redesign | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.1-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.1.md) |
| v1.2: Fixes and polish from using v1.1 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.2-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.2.md) |
| v1.3: Layout, card and controls polish from using v1.2 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.3-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.3.md) |
| v1.3.1: Small fixes from using v1.3 | Shipped | No spec; commits 2210c12, e9ae2b4, 63977fa |
| v2: Strength | Shelved (2026-11-08) | Not designed; see the notes below |
| Wizard | Idea, no version yet | Not designed yet |
| v3: Body sensations wheel | Planned | Not designed yet |
| v4: Emoji wheel | Planned | Not designed yet |
| v5: Languages | Planned | Not designed yet |

## Notes for later versions

These are what Lucas asked for. Each version's brainstorm starts here. The sources named below are described in [reference/](reference/README.md).

### v2: Strength (shelved)

Shelved on 2026-11-08 during its first brainstorm: Lucas doesn't see it as needed right now. The [wizard](#wizard) may cover the same need by helping land on words already in the wheel. If strength comes back, start from these notes.

- **Purpose, if revived:** naming *how much* of a feeling already found (irked, then irritated, then seething), not entering the wheel by intensity or adding Drummond's whole vocabulary.
- **Where it was heading:** Drummond's columns fit the wheel's middle ring better than its core feelings (*lonely* is Loneliness, *guilty* is Remorse, *hurt* is Hurt, *depressed* is Depression, *confused* is Confusion, *mad* is Anger, *scared* is Fear, *trusting* is Caring). Mapping to core feelings would put four columns under Sad. Still undecided: core only, a ladder per middle word (outer words showing their parent's), or a ladder per word.

What Lucas first asked for:

- A toggle for strong, medium and light, like Tom Drummond's [Vocabulary of Emotions](reference/drummond-vocabulary-of-emotions.md).
- The panel lists a feeling's words at each strength.
- **Open question:** Drummond's chart has 10 categories (Happiness, Caring, Depression, Inadequateness, Fear, Confusion, Hurt, Anger, Loneliness, Remorse) that don't match the wheel's 7 core feelings. The v2 design has to decide whether to map them onto the wheel, give them their own wheel, or only tag the wheel's existing words.
- **Data model:** the optional `Feeling.strength` field (one value per word) isn't enough. In Drummond's chart, 22 words have different strengths in different categories (*Resentful* is Anger medium and Anger light), so strength has to live on a word within a category or a wheel position.

### Wizard

- A guided flow that helps you land on a specific word already in the wheel.
- Lucas's idea, mentioned 2026-11-08 when shelving v2. Not yet described further; ask him before designing it.

### v3: Body sensations wheel

- Modelled on Lindsay Braman's [Emotion-Sensation Wheel](reference/braman-emotion-sensation-wheel.md): core feelings, then feelings, then an outer ring of body sensations.
- On her wheel each sensation belongs to one feeling. In our data, sensations are a shared list many feelings point to, so a sensations wheel needs one parent per outer cell.
- Uses the same renderer and gestures as the core wheel; only the wheel file is new.
- The wording follows the content rules below.

### v4: Emoji wheel

- Very simplified: core feelings and a few middle-ring ones, because there are only so many emoji.
- The data is ready: `Feeling.emoji` is already an optional field.

### v5: Languages

- Spanish first (the [reference site](reference/core-feelings-wheel.md#the-reference-site) had an Español toggle, and Braman publishes a Spanish wheel), plus a language switcher.
- Adding a language means adding one locale file; no text is hard-coded.

## Known issues

Still open after v1.3.1. None blocks the next version.

- **Keyboard selection on the phone's half-wheel.** Choosing a word by keyboard or the accessible tree can select one on the hidden left half without turning the wheel to show it. Lucas wants to try it before deciding whether the wheel should turn to show it.
- **Opened-word position lives in two places.** `main.ts` keeps its own copy of the phone's opened-word position and syncs it into the controller in three places; the controller could own it. (v1.3 review)
- **The card's heading size watcher isn't disconnected when the card hides.** Harmless. (v1.3 review)
- **Very short phones.** When the card cap's safeguard is active, the opened word can sit under the toolbar: v1.3 spec §4.2 measures the gap from the stage's top, not the toolbar's bottom. (v1.3 review)

## Before going public

- Lucas reviews the definitions and sensations in [content-review.md](content-review.md). This was moved out of v1.1.
- A credits or thanks page in the app, crediting every source the content draws on. The draft text is in [reference/README.md](reference/README.md#credits). Confirm the unverified attributions there (Roberts, the reference site) first.

## Content rules

- There are only so many ways to describe a feeling or a body sensation, so overlap with existing wheels and word lists is unavoidable and fine.
- Don't copy any source verbatim, and don't reproduce a source's full layout or word list wholesale.
- Definitions are short, plain-language prose (see v1 spec §3.4).
- Credit every source we draw on, in [reference/](reference/README.md) and on the app's credits page, whether or not a licence requires it.

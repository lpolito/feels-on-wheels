# Feelings Wheel v2: Body sensations wheel

Date: 2026-11-08
Status: approved in conversation, awaiting written-spec review
Builds on: `docs/superpowers/specs/2026-11-07-feelings-wheel-v1.3-design.md` (v1.3) and the v1.3.1 fixes recorded in `docs/ROADMAP.md`. Everything there still holds unless this document replaces it.

## 1. Why v2

The core wheel starts from feeling words. For someone who can't yet name what they feel, the body is often easier: a tight jaw or a hollow chest is concrete. v2 adds a **second wheel that starts from the body**: pick where you notice something, then what you notice, and the wheel offers the feelings it might be.

- **Model:** Lindsay Braman's [Emotion-Sensation Wheel](../../reference/braman-emotion-sensation-wheel.md), which adds body sensations to a feelings wheel. Ours turns hers inside out: the body is in the centre and feelings are on the edge, so the drill-down runs in the direction you'd look (body first).
- **Use:** one sensation at a time. You follow the strongest thing you notice inward. Combining several sensations is not part of v2.
- **Success:** going from "my chest is racing" to a short list of candidate feelings takes a few taps, faster than scanning the core wheel.

### Out of scope

- Carrying a selection across when switching wheels (§4.2).
- Links from the core wheel's "You might notice" into the body wheel.
- New sensations beyond the existing 40, and descriptions for areas or sensations.
- Picking several sensations at once (that's closer to the [wizard](../../ROADMAP.md#wizard) idea).
- The open issues under "Known issues" in the roadmap.

## 2. Decisions

| Topic | Decision |
|---|---|
| Shape | Inside out: body areas → sensations → feelings. §3.1 |
| Body areas | 8, holding all 40 existing sensations. §3.2 |
| Feelings per sensation | 2–3, any word from the core wheel (core, middle or outer). §3.3 |
| Link to "You might notice" | None. The body wheel's links are its own and may differ from the feelings' cards. §3.3 |
| Colour | Each area has its own hue for itself and its sensations; each feeling cell has its own core feeling's hue. §5 |
| Switching wheels | A labelled switch, top left, plus a link in the start message. Switching always starts fresh. §4 |
| Card | Built from an ordered list of sections. New headings "Could be" and "Could also be"; a link to the feeling on the feelings wheel. §6 |
| More wheels later | Nothing assumes exactly two wheels: the wheels come from a list, and node kinds, colour, card sections and URLs are generic. §7 |

## 3. The body wheel

### 3.1 Rings

| Ring | Holds | Count |
|---|---|---|
| Centre | Body areas | 8 |
| Middle | Sensations, each under exactly one area | 40 |
| Outer | Feelings, 2–3 under each sensation | about 100 |

A feeling may appear under several sensations (*racing heart* and *tight chest* can both lead to *anxious*). An area or sensation appears once.

### 3.2 Areas and their sensations

The sensation ids and labels are the existing shared ones in `locales/en.json`.

| Area id | Label | Sensations |
|---|---|---|
| `head` | Head and eyes | `headache`, `foggy-head`, `tired-eyes`, `wide-eyes`, `raised-eyebrows`, `tearful` |
| `face` | Face and jaw | `hot-face`, `blushing`, `scrunched-face`, `clenched-jaw`, `smiling` |
| `chest` | Chest | `racing-heart`, `tight-chest`, `hollow-chest`, `warm-chest` |
| `breath` | Breath and throat | `shallow-breath`, `deep-breath`, `gasp`, `lump-in-throat` |
| `stomach` | Stomach | `knot-in-stomach`, `nausea`, `butterflies` |
| `arms` | Shoulders, arms and hands | `tense-shoulders`, `heavy-limbs`, `clenched-fists`, `sweaty-palms`, `cold-hands`, `trembling` |
| `whole-body` | Whole body | `restless`, `fidgety`, `frozen`, `low-energy`, `numbness`, `light-body`, `buzzing`, `relaxed-muscles` |
| `posture` | Posture and urges | `slumped`, `open-posture`, `turning-away`, `shrinking` |

The order above is the wheel's clockwise order from 12 o'clock. Area labels may be shortened during implementation if they don't fit the centre ring; any change is listed in `docs/content-review.md`.

### 3.3 Feelings under each sensation

- **2 or 3 per sensation.** Three where a sensation honestly splits across very different feelings (*racing heart*: scared, mad, excited); two where it doesn't.
- **Any word from the core wheel**, at any ring, whichever fits best: *smiling* leads to *happy*, a core word.
- **Drafted during implementation and reviewed by Lucas.** The draft goes into `docs/content-review.md` under a new "Body wheel" section, as part of the existing pre-public review.
- **No rule ties them to `feelings.json`.** A feeling under *butterflies* doesn't have to list *butterflies* in its "You might notice", and nothing checks it.

## 4. Switching wheels

### 4.1 The controls

- **The switch:** a two-part control at the top left on every screen, **"Feelings | Body"**, with the current wheel filled in. One button per wheel, in the wheel list's order (§7.1). Each button is at least 44 px tall, uses `aria-pressed`, and sits in a group labelled with `t('wheelSwitch')` ("Wheel"). It floats over the wheel like the toolbar does and comes first in the tab order.
- **The start message** (v1.3 §3.1) gains a link, and each wheel has its own:
  - Feelings wheel: "How are you feeling? Tap or spin to explore, or *start from body sensations instead*."
  - Body wheel: "What do you notice in your body? Tap or spin to explore, or *start from feelings instead*."
  - The italic part is a link that switches wheels. The message still shows exactly when nothing is selected. `FwHint` becomes text plus an optional link instead of plain text.

### 4.2 What switching does

- **Always starts fresh.** The other wheel opens with nothing selected and its start message showing. Nothing carries across.
- **The view** is the same start view as a fresh load: the whole wheel on desktop, the half-wheel on phones. On phones the spin-in intro plays, as it does on load, unless reduced motion is on.
- **History:** switching pushes the other wheel's base URL (§4.3), so Back returns to where you were on the previous wheel, including an opened word.
- **Focus** stays on the switch button that was pressed. The announcer says the new wheel's name ("Body sensations wheel").
- **Doing nothing:** pressing the current wheel's button does nothing.

### 4.3 URLs

- The hash already starts with the wheel id (`#/core/fearful/scared`). The body wheel uses the same pattern with area and sensation ids in the path: `#/body/chest/racing-heart/scared`.
- **New:** a wheel other than the first has a base URL of `#/<wheel id>` (`#/body`) when nothing is opened. The first wheel's base URL stays empty.
- **Loading or Back/Forward** reads the wheel id first, swaps to that wheel if it isn't showing, then restores the opened word as today. An unknown wheel id or path falls back to the first wheel's start view.
- With no hash, the app opens the feelings wheel.

## 5. Colour

### 5.1 One rule for every cell

- A **feeling** cell takes the hue of that feeling's core feeling on the feelings wheel.
- An **area** cell takes its own hue (`hue` in the wheel file, as core feelings do today).
- A **sensation** cell takes its area's hue.

On the feelings wheel this gives exactly today's colours, since there a feeling's core is always its ancestor. A unit test pins that.

**Feelings that appear twice on the core wheel** (*overwhelmed*, *inferior*, *embarrassed*, *disappointed*): their **first position in the core wheel's order** decides their colour on other wheels and where the feelings-wheel link goes (§6.2).

### 5.2 Area hues

- 8 new tokens in `tokens.css`, `--hue-<area id>`, for light and dark (system and `data-theme`), like the feeling hues.
- **They must look distinct from the 7 feeling hues** and from each other, so an area never reads as an emotion. They go through the same white-label fitting (`fitWhite`) and ring shading as the feeling hues, so labels keep v1's contrast.
- `readPalette` reads the hue names from the loaded wheels instead of the fixed `HUE_NAMES` list.
- Forced-colours mode is unchanged: every cell is `Canvas`.

## 6. The card

### 6.1 Built from sections

Today `cardModel()` fills fixed fields and `#bodyFor()` shows each one only when it has content. v2 changes the opened card's model to an **ordered list of sections**. All decisions about which sections appear live in `cardModel()`; `#bodyFor()` renders whatever list it gets, in order, with no checks for wheel or ring.

```ts
type Row = { index: number; label: string; hue: string };
type Section =
  | { kind: 'text'; text: string }                     // a definition
  | { kind: 'list'; heading: string; items: string[] } // You might notice
  | { kind: 'links'; heading: string; rows: Row[] }    // Narrow it down, Could be, Close to, Could also be
  | { kind: 'jump'; label: string; hash: string };     // See Scared on the feelings wheel ›
```

Rows in "Could be" and "Could also be" use their own feeling's ink, so *Scared*, *Mad* and *Excited* each show in their own colour. Every other row keeps today's styling.

### 6.2 What each node shows when opened

The rules follow the kind of node and its parent, not the wheel:

| Node | Sections, in order |
|---|---|
| Area | **Narrow it down:** its sensations |
| Sensation | **Could be:** its feelings |
| Feeling under a feeling (the core wheel) | Unchanged: definition, You might notice, Narrow it down, Close to |
| Feeling under a sensation | Definition; You might notice; **Could also be:** the other feelings under the same sensation; a jump link, "See Scared on the feelings wheel ›" |

- **The jump link** goes to the feeling's position on the first wheel (§5.1 for repeated feelings) and pushes history, so Back returns to the body wheel. It appears on any feeling whose wheel isn't the first.
- **Breadcrumbs** list ancestors as today: *Chest › Racing heart*.
- **Selected (folded) cards**, the dot and the accessible tree's names and announcements work the same for every node kind ("Scared. In Chest, Racing heart.").

## 7. Data and code

### 7.1 Data

- **`src/data/wheels/body.json`** has the same shape as `core.json`. A node has exactly one of `feeling`, `sensation` or `area`, plus `hue` on centre nodes and optional `children`:
  ```json
  { "area": "chest", "hue": "chest", "children": [
    { "sensation": "racing-heart", "children": [
      { "feeling": "scared" }, { "feeling": "mad" }, { "feeling": "excited" } ] } ] }
  ```
  Its ring radii are its own and may differ from the core wheel's.
- **The wheel list**, `src/data/wheels/index.ts`, holds the wheels in switch order (`core`, `body`) and, for each, which wheel its start message links to.
- **`validateWheel`** checks that each node has exactly one kind, that each id exists in its list (feelings in `feelings.json`, sensations and areas in the locale), that `hue` sits only on centre nodes, and that every centre node has one. Wheel ids must be unique.
- **The locale** gains:
  - `areas`: id → label;
  - per wheel: the switch label ("Feelings", "Body"), a name ("Feelings wheel", "Body sensations wheel"), the start message and its link text;
  - UI strings: `couldBe` ("Could be"), `couldAlsoBe` ("Could also be"), `seeOnWheel` ("See {label} on the {wheel} ›"), `wheelSwitch` ("Wheel").
  - `validateLocale` checks every wheel's areas and sensations have labels.

### 7.2 Code

- **Layout:** `Segment.feelingId` becomes `node: { kind: 'feeling' | 'sensation' | 'area'; id: string }`. Paths join node ids as today. Hue follows §5.1, using a feeling → first-core lookup built from the first wheel.
- **i18n:** one `nodeLabel(node)` replaces the direct `label(feelingId)` calls in the renderer, accessible tree and card.
- **Startup:** both wheels load and validate at start. The current wheel's layout, sprite cache, fill table, accessible tree and camera are rebuilt on a switch. The store resets to `initialState`.
- **New element** `fw-wheel-switch` for the switch. `FwHint` takes `{ text, link? }`.
- **Unchanged:** gestures, keyboard controls, the phone half-wheel and opened-word placement, the theme toggle, Start over, and the service worker (both wheels are bundled).

## 8. Testing

**Unit**
- `validateWheel` accepts `body.json` and rejects a node with no kind or two kinds, unknown area, sensation or feeling ids, and `hue` off the centre ring.
- Layout: every core-wheel segment's hue is unchanged; body feeling cells take their core feeling's hue; repeated feelings use their first position.
- URL: `#/body`, `#/body/chest/racing-heart/scared` and the jump link's hash round-trip; unknown wheel ids fall back.
- Card model: an area gives one "Narrow it down" section; a sensation gives one "Could be" section; a feeling under a sensation gives definition, You might notice, "Could also be" and a jump link to the right core path; core-wheel cards are unchanged.
- Colours: the 8 area hues meet the label contrast in both themes and are distinct from the feeling hues.
- Content: every area and sensation has a label, and every sensation on the body wheel has 2 or 3 feelings.

**End-to-end**
- The switch and the start-message link each change wheels, start fresh and push history; Back returns to the previous wheel and word.
- Chest → Racing heart → Scared shows the cards in §6.2; the jump link opens *Fearful › Scared* on the feelings wheel; Back returns.
- Loading `#/body/chest/racing-heart/scared` opens it directly.
- Axe on the body wheel, light and dark, with nothing selected and with a word opened.
- Bundle size (`npm run size`) and the spin perf tests pass with the body wheel showing.

## 9. Docs

- The roadmap moves the body sensations wheel from Ideas into the version table as v2, linking this spec and its plan.
- `docs/content-review.md` gains the body wheel's areas and sensation → feeling draft.
- The Braman credit in `docs/reference/README.md` changes from "the idea of an outer ring of body sensations" to "the idea of a feelings wheel that includes body sensations", since ours puts them in the middle.

# Body wheel rework: places, urges, and short labels

Date: 2026-11-15. Status: **draft, not yet reviewed by Lucas.** Written from the brainstorm on 2026-11-15; the word lists in §3 are a first draft for him to edit. A project: new areas, sensations and feelings, new labels, and every feeling's "You might notice" redone.

Builds on the [v2 body wheel spec](2026-11-08-feelings-wheel-v2-body-wheel-design.md) and the [wheel and card spec](2026-11-15-feels-on-wheels-wheel-and-card-design.md). Everything there still holds unless this replaces it. The roadmap idea is [Rework the body wheel's areas and sensations](../../ROADMAP.md#rework-the-body-wheels-areas-and-sensations).

## Why

You come to the body wheel with something in your body and narrow down what it could be, or you can't quite name a feeling but know it hits your body somewhere. Today the wheel gets in the way of that:

- **The areas mix kinds of thing.** Some are places (head, chest, stomach), one is a process (breath), and one is a way of holding yourself plus urges (posture and urges).
- **Some sensations aren't felt, but seen or done:** smiling, raised eyebrows, a scrunched-up face, turning away, shrinking.
- **Some sit oddly:** tense shoulders under arms, a lump in your throat under breath.
- **Labels are long** ("Hollow feeling in your chest", "Butterflies in your stomach"), which makes them hard to fit on the wheel and in other languages. Two known issues come from them: the [opened word's long label spills past its cell](../../ROADMAP.md#layout-and-labels), and tiny windows show the body wheel with no labels at rest.

Success: every area is a place you could point to, or Urges; every sensation is something you'd notice in yourself; the labels are short enough to read at a glance; and every feeling the wheel offers is a word on the feelings wheel.

## Decisions

| Topic | Decision |
|---|---|
| Frame | A body map plus Urges: seven places head to toe and Whole body, then one area that isn't a place, Urges. Lucas chose it over a pure body map; he identifies heavily with urges. §1 |
| Areas | 8: Head / face, Throat / mouth, Shoulders / back, Arms / hands, Chest, Stomach, Whole body, Urges. Falls back to 7 if they don't fit (§8). |
| What's a sensation | Something you feel from the inside: you'd notice it with your eyes closed and nobody watching. Urges are what you feel pulled to do. §1 |
| Labels | Areas are one word, or "A / B" for neighboring places you'd point at together. Sensations are short and make sense on their own, because they also appear in "You might notice". §2 |
| Feelings | 2 or 3 per sensation, all words on the feelings wheel, mostly from its middle ring, with opposite feelings where a sensation honestly splits. §2 |
| "You might notice" | Redone for all 126 feelings with the new sensations. Drafted to agree with the body wheel, but nothing enforces it. §5 |
| Old addresses | Not forwarded. A link to a removed sensation shows not found. |
| Colors | The 8 area hues stay; their tokens are renamed for the new areas. §6 |
| Where the rules live | In a README next to the wheel files, with an `AGENTS.md` there pointing to it, so the rules stay with the data after this spec is frozen. §10 |

## 1. Two kinds of area

### Places

An area is a place you could point to. The places run head to toe, in a body scan's order, then Whole body:

1. Head / face
2. Throat / mouth
3. Shoulders / back
4. Arms / hands
5. Chest
6. Stomach
7. Whole body

**Whole body** is a place on purpose: it holds what you feel all over or can't place, such as buzzing, heavy, numb, or restless.

A sensation under a place passes one test: **you'd notice it with your eyes closed and nobody watching.** What others see (smiling, raised eyebrows, wide eyes, a scrunched-up face) fails it and either becomes the felt version or goes. What you're pulled to do (turning away, shrinking) moves to Urges.

### Urges

**Urges** is the one area that isn't a place. It holds what you feel pulled to do: run, hide, lash out, cry, be close. Many people notice the urge before they can name the feeling, and the research backs urges as part of an emotion (Frijda's action tendencies; see [Research](#research-behind-it)). Putting them in one named area keeps the places honest.

Urge labels read **"Want to …"** ("Want to hide"), not "Urge to …", so they're short and read naturally in "You might notice".

## 2. Wording rules

- **Areas:** one word, or "A / B" only for two neighboring places you'd point at together. "Head / face" yes; "Breath / throat" no, since breath is something you do, not a place.
- **Sensations:** aim for one to three words, plain over idiom, and readable on their own: "Tight chest", not "Tight". Idioms everyone knows stay (butterflies, a lump in your throat); idioms that don't travel to other languages ("cold feet") don't come in.
- **Feelings:** 2 or 3 per sensation, from the feelings wheel. Prefer its middle ring, the most usable level; outer words where they're the honest fit. Where a sensation can mean opposite things, offer both (a racing heart can be scared or excited): the same body signal reads as different feelings in different contexts, which is why this ring exists.
- **Ids** follow the label (`hollow-chest`, `want-to-hide`). Kept sensations keep their ids.

## 3. The wheel

Clockwise from 12 o'clock, in the order of §1. The wheel still starts on Whole body at 3 o'clock (wheel and card spec §1); the rotation that puts it there follows from the new order.

Counts: 8 areas, 49 sensations, 131 feeling cells (today: 8, 40, 105). Of the feeling cells, 71 are middle-ring words, 58 outer and 2 core. Every core feeling is reachable from at least 5 areas: Fearful 8, Angry 7, Sad 7, Surprised 7, Happy 6, Bad 6, Disgusted 5.

### Head / face (`head`)

| Sensation | Id | Could be |
|---|---|---|
| Headache | `headache` | Stressed, Frustrated, Overwhelmed |
| Foggy head | `foggy-head` | Confused, Tired, Depressed |
| Mind goes blank | `mind-goes-blank` | Startled, Overwhelmed, Embarrassed |
| Teary eyes | `teary-eyes` | Sad, Hurt, Thankful |
| Hot face | `hot-face` | Mad, Embarrassed, Ashamed |
| Tight jaw | `tight-jaw` | Mad, Resentful, Stressed |

### Throat / mouth (`throat`)

| Sensation | Id | Could be |
|---|---|---|
| Lump in throat | `lump-in-throat` | Hurt, Grief, Thankful |
| Tight throat | `tight-throat` | Anxious, Frightened |
| Dry mouth | `dry-mouth` | Nervous, Scared |
| Gagging | `gagging` | Repelled, Revolted |

### Shoulders / back (`shoulders`)

| Sensation | Id | Could be |
|---|---|---|
| Tense shoulders | `tense-shoulders` | Stressed, Anxious, Frustrated |
| Weight on shoulders | `weight-on-shoulders` | Pressured, Overwhelmed, Powerless |
| Hunched shoulders | `hunched-shoulders` | Insecure, Inferior |
| Standing tall | `standing-tall` | Proud, Confident, Courageous |
| Chills | `chills` | Frightened, Awe, Inspired |

### Arms / hands (`arms`)

| Sensation | Id | Could be |
|---|---|---|
| Tight fists | `tight-fists` | Mad, Frustrated |
| Shaky hands | `shaky-hands` | Scared, Furious, Excited |
| Sweaty palms | `sweaty-palms` | Nervous, Excited |
| Cold hands | `cold-hands` | Scared, Nervous |

### Chest (`chest`)

| Sensation | Id | Could be |
|---|---|---|
| Racing heart | `racing-heart` | Scared, Mad, Excited |
| Tight chest | `tight-chest` | Anxious, Overwhelmed, Resentful |
| Short breath | `short-breath` | Anxious, Stressed |
| Gasp | `gasp` | Startled, Scared, Amazed |
| Hollow chest | `hollow-chest` | Lonely, Hurt, Empty |
| Heavy heart | `heavy-heart` | Guilty, Let Down, Depressed |
| Warm chest | `warm-chest` | Loving, Thankful, Content |

### Stomach (`stomach`)

| Sensation | Id | Could be |
|---|---|---|
| Knot in stomach | `knot-in-stomach` | Anxious, Guilty, Betrayed |
| Sinking feeling | `sinking-feeling` | Let Down, Dismayed, Worried |
| Butterflies | `butterflies` | Nervous, Excited |
| Queasy | `queasy` | Repelled, Anxious |
| No appetite | `no-appetite` | Depressed, Stressed |

### Whole body (`whole-body`)

| Sensation | Id | Could be |
|---|---|---|
| Restless | `restless` | Anxious, Bored, Eager |
| Buzzing | `buzzing` | Excited, Inspired, Anxious |
| Frozen | `frozen` | Scared, Shocked, Powerless |
| Skin crawling | `skin-crawling` | Repelled, Horrified, Violated |
| Heavy body | `heavy-body` | Depressed, Weak, Helpless |
| Drained | `drained` | Tired, Apathetic |
| Numbness | `numbness` | Numb, Empty, Shocked |
| Light body | `light-body` | Free, Joyful |
| Relaxed | `relaxed` | Peaceful, Trusting |

"Numbness" stays a noun so it doesn't read "Numb › Numb" on the card.

### Urges (`urges`)

| Sensation | Id | Could be |
|---|---|---|
| Want to run | `want-to-run` | Scared, Threatened |
| Want to hide | `want-to-hide` | Ashamed, Exposed, Insecure |
| Want to lash out | `want-to-lash-out` | Furious, Hostile, Provoked |
| Want to back away | `want-to-back-away` | Repelled, Horrified, Hesitant |
| Want to cry | `want-to-cry` | Sad, Hurt, Frustrated |
| Want to be close | `want-to-be-close` | Loving, Lonely, Intimate |
| Want to laugh | `want-to-laugh` | Playful, Joyful |
| Want to look closer | `want-to-look-closer` | Curious, Amazed, Skeptical |
| Want to sleep | `want-to-sleep` | Tired, Bored, Depressed |

These loosely follow Frijda's kinds of urge: avoiding (run, hide), fighting (lash out), rejecting (back away), being with (be close), attending (look closer), and giving up or shutting down (sleep).

## 4. Where the old sensations went

For "You might notice" (§5) and for review. Where an old sensation splits, the feeling decides which way it goes.

| Old sensation | Becomes |
|---|---|
| Headache, Foggy head, Racing heart, Tight chest, Gasp, Knot in your stomach, Butterflies in your stomach, Tense shoulders, Sweaty palms, Cold hands, Restless, Frozen, Numbness, Buzzing energy, Warmth in your chest, Hollow feeling in your chest, Light, floaty body, Lump in your throat | The same sensation, with its shorter label where it has one |
| Hot or flushed face, Blushing | Hot face |
| Clenched jaw | Tight jaw |
| Tearful | Teary eyes |
| Shallow breathing | Short breath |
| Queasy stomach | Queasy |
| Clenched fists | Tight fists |
| Trembling or shaky | Shaky hands |
| Fidgety | Restless |
| Heavy arms and legs | Heavy body |
| Low energy, Tired eyes | Drained |
| Relaxed muscles, Slow, deep breathing | Relaxed |
| Urge to shrink or hide | Want to hide |
| Slumped posture | Hunched shoulders (insecure, inferior, ashamed) or Heavy body (tired, depressed) |
| Open, upright posture | Standing tall (proud, confident, powerful) or Relaxed (accepted, trusting) |
| Urge to turn away | Want to back away (disgust) or Want to hide (shame, rejection) |
| Wide eyes | Gasp (startled, amazed), Frozen (scared), or Want to look closer (interested) |
| Raised eyebrows | Want to look closer (curious, skeptical) or Gasp (startled) |
| Smiling | Want to laugh (playful, cheeky), Warm chest (happy, content), or Light body (joyful) |
| Scrunched-up face | Gagging or Want to back away (disgust), Tight jaw (annoyed) |

The new sensations with no old one (Mind goes blank, Tight throat, Dry mouth, Gagging, Weight on shoulders, Chills, Heavy heart, Sinking feeling, No appetite, Skin crawling, and most urges) go into "You might notice" where they fit.

## 5. "You might notice"

- All 126 feelings in `src/data/feelings.json` get their sensations redone with the new ids: first by the mapping in §4, then by hand where a feeling ended up with fewer than 2, a duplicate, or a new sensation fits better. About 3 per feeling, as today.
- **Drafted to agree with the body wheel:** where the body wheel says a sensation can be a feeling, that feeling's "You might notice" lists the sensation. Nothing checks it, and the two may drift later on purpose. This replaces v2 §3.3's "the body wheel's links are its own", in spirit only: still no rule.
- **Reviewed through `docs/content-review.md`:** each feeling's italic sensations line is rewritten, so the change's diff of that file is the before and after for every feeling's "You might notice". Its Body wheel section is rewritten from §3.

## 6. Colors

- The 8 area hues keep their light and dark values; the tokens are renamed for the new area ids. Proposed, keeping each place's color where it has one: `head` keeps head's, `throat` takes breath's, `shoulders` takes face's, `arms`, `chest`, `stomach` and `whole-body` keep theirs, and `urges` takes posture's.
- The new order changes which hues sit next to each other. Whole body and Urges sit side by side, as Whole body and Posture do today. If two neighbors look too alike, the builder may swap assignments; the values don't change.
- The color tests (`tests/unit/colors.test.ts`) check contrast and distinctness for the new names.

## 7. Text that names an area

- **`titles.areaDescription`** ("{area}: what you might notice there, and the feelings it can come with.") reads wrong for Urges ("Urges: what you might notice there"). It becomes "{area}: what you might notice, and the feelings it can come with.", for every area.
- **Spoken paths** ("Scared. In Chest, Racing heart.") read "In Urges, Want to run." That's acceptable and stays.
- **The wheel's name** stays "Body sensations wheel", and its question stays "What do you notice in your body?" (see [For review](#for-review)).

## 8. Fitting it on the wheel

- The labels get much shorter: the longest area label is "Shoulders / back" (16 characters, against "Breath and throat" and "Posture and urges" today), and the longest sensation is "Weight on shoulders" (19, against "Hollow feeling in your chest" at 28).
- There are more cells: 49 sensations and 131 feelings, against 40 and 105, so each outer cell is thinner.
- **Checked by the viewport sweep** (`tests/e2e/viewports.spec.ts`) and by looking at the body wheel on a phone, portrait and sideways. Label counts that change because of the new content are expected; update them.
- **If the outer ring doesn't fit,** trim in this order and stop when it fits:
  1. Drop a third feeling from sensations that have one, starting with the repeats (Overwhelmed, Anxious, Depressed, Stressed each appear four or more times).
  2. Drop the sensations most like another: No appetite, Short breath, Drained, Want to sleep.
  3. Fall back to 7 areas: Shoulders / back folds into Whole body as "Tense shoulders" and "Weight on shoulders", Standing tall moves to Chest, Chills to Whole body, and Hunched shoulders goes (Want to hide covers it).

  Each trim is listed in the changes file.

## 9. Everything else it touches

- **Data:** `src/data/wheels/body.json` (areas, sensations, feelings; `start` stays `whole-body`); `src/data/locales/en.json` (`areas` and `sensations` rewritten, old ids removed; `titles.areaDescription` per §7); `src/data/feelings.json` per §5.
- **Colors:** `src/styles/tokens.css` area tokens renamed in all three theme blocks.
- **Link previews:** run `node scripts/make-og-image.mjs` and commit `public/og/`. The old area images (`body-face.png`, `body-breath.png`, `body-posture.png`) go; `body-throat.png`, `body-shoulders.png` and `body-urges.png` arrive. `page.imageAlt` doesn't change, and `/body`'s own preview still shows Whole body, since it reads the wheel's `start`.
- **Credits:** the About page (`page.about`) credits the two new sources once the app uses them: Nummenmaa and others' bodily maps, and Frijda's action tendencies. The notes are already in [reference/](../../reference/README.md).
- **Known issues:** if shorter labels fix the [long label spilling past its cell](../../ROADMAP.md#layout-and-labels) or the tiny windows with no labels at rest, remove them from the roadmap and `ACCESSIBILITY.md`; if not, update their examples, which name old labels.
- **Tests:** the data test's area → sensations table, `AREA_HUES` in the colors test, the area regex in `tests/e2e/body.spec.ts`, the body palette in `wheel-render.test.ts`, and tests that use removed paths (`posture/shrinking/humiliated` in `card.test.ts`). Most body tests use `chest/racing-heart/scared` and `whole-body`, which stay.

## 10. The rules live with the data

This spec is frozen once approved, but its rules have to hold for every later edit to the wheels. So they move next to the wheel files, where whoever edits them, a person or an agent, finds them.

- **`src/data/wheels/README.md`**, the living rules for the wheels' content:
  - **Both wheels:** the content rules now in the roadmap's [Content rules](../../ROADMAP.md#content-rules) (overlap with other wheels is fine, nothing copied wholesale, plain short definitions, every source credited). They move here, and the roadmap section links here instead.
  - **The body wheel:** §1 and §2 of this spec, as rules rather than decisions: what an area is, the eyes-closed test for a sensation, what Urges hold and how they're worded, the label rules, the feelings rules, the area order, and that "You might notice" is drafted to agree with the body wheel without being enforced.
  - **The feelings wheel:** a placeholder saying its rules come with the [opinionated feelings wheel](../../ROADMAP.md#an-opinionated-feelings-wheel) idea.
  - **Which files it covers:** `src/data/wheels/*.json`, `src/data/feelings.json`, and the `feelings`, `areas`, and `sensations` in `src/data/locales/en.json`.
  - How to check a change: every feeling on the body wheel is a word on the feelings wheel, each sensation has 2 or 3 feelings, and each core feeling stays reachable from several areas.
- **`src/data/wheels/AGENTS.md`**, a few lines: read `README.md` before changing any file it covers, follow it, and update it in the same change when a rule changes.
- **The root `AGENTS.md`** gains a short "Wheel content" section pointing to both, since the wheel files aren't the only ones the rules cover.
- The README is the rule; specs record why a rule was chosen. When they disagree after this ships, the README wins.

## Research behind it

- **Bodily maps of emotions** (Nummenmaa, Glerean, Hari and Hietanen, *PNAS*, 2014; [note](../../reference/nummenmaa-bodily-maps.md)). About 700 people painted where they felt each emotion grow or fade. Most emotions showed up in the upper chest; anger and happiness in the arms; sadness drained the limbs; disgust sat in the throat and gut; happiness filled the whole body. The maps matched across Finnish, Swedish and Taiwanese groups. This backs having places at all, Whole body as one of them, and Throat / mouth for disgust.
- **Maps of subjective feelings** (Nummenmaa, Hari, Hietanen and Glerean, *PNAS*, 2018; same note). Across 100 feeling states, how a feeling feels in the body was one of the three things that best explained how people told feelings apart.
- **Action tendencies** (Nico Frijda, *The Emotions*, 1986; [note](../../reference/frijda-action-tendencies.md)). Emotions come with a readiness to act: to approach, avoid, fight, reject, be with, or attend. This backs Urges as a way into a feeling.
- **The same sensation, different feelings.** That a racing heart can be fear or excitement is well established (constructed-emotion and arousal research). The wheel already works this way; it's why §2 asks for opposite feelings where they're real. Not a new source.
- **[Lindsay Braman's Emotion-Sensation Wheel](../../reference/braman-emotion-sensation-wheel.md)** stays the model. Her outer ring also mixes sensations, posture and behavior; this change sorts them instead.

## Approaches

### The frame

- **A. A body map:** places only, with Whole body for what isn't in one spot; urges reworded as felt sensations or dropped. The cleanest rule.
- **B. Quality first:** the center ring is kinds of sensation (tight, heavy, hot, shaky), with places in the middle ring. How somatic therapists often ask, and good when you can't place a feeling, but it gives up the region as a way in, and labels like "Tight" are vague on their own. Kept only as a lens for wording.
- **C. A body map plus Urges (chosen).** A with one honest exception. Lucas identifies heavily with urges, and the research backs them.
- **D. Energy** (charged, drained, tense, settled): too abstract, and it repeats what the feelings wheel already sorts. Dropped.

### 7 or 8 areas

Urges takes a slot, so 7 areas would leave room for only six places. 8 keeps Shoulders / back, one of the commonest places to hold stress, and the existing 8 hues, which already pass the color tests. Lucas noted that fitting and color decide it, so 8 is the plan with 7 as the fallback in §8.

### How the content gets made

- **Words in the spec (chosen):** this spec lists every area, sensation and feeling, for Lucas to edit before approving; "You might notice" is redone during implementation and reviewed through `content-review.md`.
- **Rules in the spec, words during implementation:** faster to write, but Lucas would approve the spec without seeing the words, which are most of this change.
- **Words first on a review page:** easiest to compare, but an extra round before the spec.

### "You might notice"

- **Drafted to agree, not enforced (chosen).** Lucas likes the two relating to each other but doesn't see it as required.
- **Worked out from the body wheel:** nothing could drift, but only the feelings on the body wheel would get sensations, or the outer ring would need about 400 cells.
- **Independent, as today:** cheapest, but needlessly inconsistent while everything is being redone anyway.

## Not in this change

- Forwarding old addresses to new ones.
- Descriptions for areas or sensations.
- Links from "You might notice" into the body wheel.
- Changing the feelings wheel's words.

## Left to the builder

- The exact "You might notice" lists, following §5.
- Swapping hue assignments if neighbors look too alike (§6).
- Trims, in §8's order, if the wheel doesn't fit.
- Wording fixes inside the rules of §2, listed in the changes file.

## For review

What Lucas's review should settle. The first two change what gets built.

1. **Head and face are one area** to make room for Shoulders / back and Urges. Fine, or should face be its own place and something else merge?
2. **The words least sure to pass the "felt from inside" test:** Mind goes blank (more mental than bodily), Standing tall (posture, though you can feel it), Gagging (strong for mild disgust), and No appetite (slow, not in the moment).
3. **The wheel's name:** "Body sensations wheel" now holds urges too. Keep it, or call it the body wheel everywhere (the switch already says "Body")?
4. **"Want to …"** for every urge, or a mix ("Urge to hide", plain verbs)?
5. **The 131 feeling cells:** try them and trim only if they don't fit (planned), or trim to about today's 105 first?

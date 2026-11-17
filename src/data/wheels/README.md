# The wheels' content

The living rules for what the wheels say: their words, the body wheel's areas and sensations, and how feelings and sensations relate. Whoever edits the wheels, a person or an agent, follows these. When a rule changes, change it here in the same change.

The rules came out of specs, which record why they were chosen: the [body wheel rework](../../../docs/superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-design.md) and its [changes](../../../docs/superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-changes.md). Specs are frozen; when a spec and this file disagree, this file wins.

## Which files these rules cover

- `src/data/wheels/*.json`: the wheels' shapes.
- `src/data/feelings.json`: each feeling's "You might notice".
- In `src/data/locales/en.json`: `feelings`, `sensations`, `sensationPhrases`, `areas`, and `areaWheelLabels`.

## Both wheels

- There are only so many ways to describe a feeling or a body sensation, so overlap with existing wheels and word lists is unavoidable and fine.
- Don't copy any source verbatim, and don't reproduce a source's full layout or word list wholesale.
- Definitions are short, plain-language prose.
- Credit every source we draw on, with a note in [docs/reference/](../../../docs/reference/README.md) and on the app's About page, whether or not a license requires it.

## The feelings wheel

Its rules come with the [opinionated feelings wheel](../../../docs/ROADMAP.md#an-opinionated-feelings-wheel) idea. Until then, its words are the ones it has.

## The body wheel

### Who it's for

Someone asking "I have this sensation, or this urge: what could it be?" Use the plain words people say about their own body, and back each word with more than one person's experience.

### Areas

- An area is a place you could point to, in a body scan's order, head to toe: Head / face, Throat / mouth, Shoulders, Hands, Chest, Stomach, then Whole body. **Urges** comes last: the one area that isn't a place.
- An area's label is one word, or "A / B" for two neighboring places you'd point at together ("Head / face"). Not a place with a process ("Breath / throat").
- **Whole body** holds what you feel all over or can't place, and the parts of a body scan with no area of their own, such as the legs (weak knees) and the skin (chills). Every part of a body scan (head, face, throat, shoulders, chest, stomach, arms and hands, legs and feet, skin) is either an area or has its sensations under Whole body.
- An area can be named differently on the drawn wheel only (`areaWheelLabels`). Urges is "The urge to…" on the wheel, so the ring reads "The urge to… run". Everywhere else, including breadcrumbs, cards, titles, link previews, and the screen reader's tree, it's "Urges".

### What counts as a sensation

**You'd notice it with your eyes closed and nobody watching.** That's what research calls [interoception](../../../docs/reference/craig-interoception.md), sensing your body from inside, plus proprioception, sensing how your body is held.

- What others see (smiling, raised eyebrows, a scrunched-up face) isn't a sensation; use the felt version or leave it out.
- What you're pulled to do (turning away, shrinking) goes under Urges.
- A thought, such as your mind going blank, isn't a sensation.

### Urges

- Urges hold what you feel pulled to do. In the end, every urge is a pull to get away from something, whether or not you realize it: a threat, a person, a mistake, or the feeling itself ([experiential avoidance](../../../docs/reference/hayes-experiential-avoidance.md)). The area is there to help people catch those moments ([urge surfing](../../../docs/reference/marlatt-urge-surfing.md)).
- Each core feeling's typical urges are on the wheel, checked against [Frijda's](../../../docs/reference/frijda-action-tendencies.md) and [DBT's](../../../docs/reference/linehan-dbt-model-of-emotions.md) pairings of emotions with urges. Two are left out on purpose: Surprised's urge to look closer and Happy's urge to laugh.
- Urges are bare verbs on the wheel ("Hide", "Fix things"), since the area gives the context. Avoid labels that read as a noun ("Control things", not "Control").

### Labels: two strings per sensation

Every sensation has one id and two strings, one for each place it appears:

- **`sensations`:** the wheel's label. Short, and readable with its area: "Racing heart", "Queasy", "Hide". "A / B" works for two ways people describe the same sensation ("Numb / empty").
- **`sensationPhrases`:** how a feeling's card lists it after "You might notice": "A racing heart", "Feeling queasy", "Wanting to hide". The loader refuses any sensation a card lists without one.

Don't reuse one string where the grammar differs; give each context its own.

**Idioms** are fine when they name something you actually feel: butterflies, a lump in your throat, your heart in your throat, a weight on your shoulders. Idioms like these tend to grow out of what the body really does ([Kövecses](../../../docs/reference/kovecses-emotion-metaphors.md)). An idiom that only stands for a feeling doesn't come in: "cold feet" means hesitating, not cold feet.

### Feelings under a sensation

- **2 or 3 per sensation, each a word on the feelings wheel,** from whichever ring fits best: usually the middle ring, an outer word where it's more exact, a core word where it really is the best fit.
- **Every common path is on the wheel.** If a sensation commonly comes with a feeling, the wheel offers that path, so it can be found and followed. Feelings repeating across sensations is fine. Don't make room by cutting a path because its feeling appears elsewhere.
- **Offer the other reading where a sensation honestly splits.** The same body signal reads as different feelings in different contexts (a racing heart can be scared or excited).
- **Happy feelings come in only as the other reading of a sensation,** where the same signal could be a hard feeling. People rarely need help knowing they're happy, so a sensation whose only reading is happy doesn't earn a place on the wheel. It can still appear on cards (Feeling light, Feeling relaxed, Feeling tall, Warmth or fullness in your chest).
- **Obvious paths stay.** People follow the obvious ones first, and what's useful is often the less obvious feelings at their end, so an obvious urge or sensation can leave out its most obvious feeling (Cry leaves out Sad).
- **Feelings under one sensation must be different enough that someone would choose between them.** A word and its own parent or child on the feelings wheel often aren't (Stressed and Overwhelmed, Repelled and Horrified), so look at those pairs first. Keep both only when each says something the other doesn't, and never fill a sensation from one branch alone.
- **Two sensations in one area must feel different, or lead to different feelings.** If they don't, merge them (Want to get even became part of Lash out).
- **When room is short,** the unpleasant and hard-to-tell feelings come first.

### Every word says what backs it

Each sensation and urge rests on a source with a note in [docs/reference/](../../../docs/reference/README.md), on physiology (what the body measurably does), on an idiom that names something people actually feel, or on someone's own experience. Experience and common speech are fine, but say so. The current record of what backs each word is the rework spec's §3 **Backed by** column, with the changes file for words added or changed since.

### Ids

An id follows the wheel's label (`hollow-chest`, `hide`). A sensation that stays the same with only a shorter label keeps its old id (`warm-chest` for "Warm / full chest"). A renamed or merged sensation gets an id from its new label. Old addresses aren't forwarded.

### "You might notice"

- Each feeling lists 2 to 4 sensations (`feelings.json`), shown with their `sensationPhrases`.
- They're drafted to agree with the body wheel: where the wheel offers a sensation for a feeling, the feeling's card lists it, unless the cap of 4 forces a choice. Nothing enforces it, and cards may list sensations that aren't on the wheel.

## How to check a change

- Every feeling on the body wheel is a word on the feelings wheel, and each sensation has 2 or 3 feelings. The data tests check both.
- Each core feeling stays reachable from at least 2 areas, and the hard-to-tell ones from several. Happy has the fewest on purpose.
- Every new or changed word says what backs it.
- `docs/content-review.md` is rebuilt to match: each feeling's card line and the Body wheel section.

For reference, not a rule on what's on the wheel: it's worth listing the feelings wheel's middle-ring words that have no path on the body wheel, and asking whether a common sensation leads to any of them.

# Body wheel rework: places, urges, and short labels

Date: 2026-11-15. Status: **approved by Lucas, 2026-11-16.** Written from the brainstorm on 2026-11-15; revised on 2026-11-16 over four rounds of Lucas's notes and an independent fact-check of every source claim. The word lists in §3 are the version Lucas wants to see built before deciding more (§8). A project: new areas, sensations and feelings, new labels, and every feeling's "You might notice" redone.

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
| Areas | 8: Head / face, Throat / mouth, Shoulders, Hands, Chest, Stomach, Whole body, Urges. If they don't fit, Lucas decides what changes after seeing the wheel built (§8). |
| What's a sensation | Something you feel from the inside (interoception): you'd notice it with your eyes closed and nobody watching. Urges are what you feel pulled to do, about what's happening or about the feeling itself. §1 |
| Labels | Areas are one word, or "A / B" for neighboring places you'd point at together. Sensations are short and make sense on their own, because they also appear in "You might notice". Idioms that name a real sensation are fine. §2 |
| Feelings | 2 or 3 per sensation, all words on the feelings wheel, from whichever ring fits best, with opposite feelings where a sensation honestly splits. Hard-to-tell feelings get the room before happy ones. §2 |
| "You might notice" | Redone for all 126 feelings with the new sensations. Drafted to agree with the body wheel, but nothing enforces it. §5 |
| Old addresses | Not forwarded. A link to a removed sensation shows not found. |
| Colors | The 8 area hues stay; their tokens are renamed for the new areas. §6 |
| The research, in public | The repo's README gets a plain-language section on what the body wheel rests on and how it was decided (with AI, reviewed by Lucas, who has no formal training), and the About page a short paragraph linking to it; both invite issues from anyone who disagrees. §9 |
| Where the rules live | In a README next to the wheel files, with an `AGENTS.md` there pointing to it, so the rules stay with the data after this spec is frozen. §10 |

## 1. Two kinds of area

### Places

An area is a place you could point to. The places run head to toe, in a body scan's order, then Whole body:

1. Head / face
2. Throat / mouth
3. Shoulders
4. Hands
5. Chest
6. Stomach
7. Whole body

**Whole body** is a place on purpose: it holds what you feel all over or can't place, such as buzzing, heavy, numb, or restless, and the parts of a body scan that aren't an area of their own, such as the legs (weak knees) and the skin (chills).

Every part of a body scan (head, face, throat, shoulders, chest, stomach, arms and hands, legs and feet, skin) is either an area or has its sensations under Whole body.

A sensation under a place passes one test: **you'd notice it with your eyes closed and nobody watching.** What others see (smiling, raised eyebrows, wide eyes, a scrunched-up face) fails it and either becomes the felt version or goes. What you're pulled to do (turning away, shrinking) moves to Urges. A thought, such as your mind going blank, isn't a sensation either.

The test is our wording of what research calls **interoception**, the sense of the body's own condition (heartbeat, breathing, the gut, temperature, muscle tension; [Craig](../../reference/craig-interoception.md)), plus **proprioception**, the sense of how your body is held. It's also what the [bodily maps](../../reference/nummenmaa-bodily-maps.md) asked people for: where they felt activity, not what they looked like.

### Urges

**Urges** is the one area that isn't a place. It holds what you feel pulled to do. Many people notice the urge before they can name the feeling, and the research backs urges as a part of an emotion separate from its sensations ([Frijda's action tendencies](../../reference/frijda-action-tendencies.md), [DBT's model of emotions](../../reference/linehan-dbt-model-of-emotions.md)). Putting them in one named area keeps the places honest.

In the end, every urge is a pull to get away from something, whether or not you realize it: a threat, a person, a mistake, or the feeling itself. Research calls the pull away from a feeling experiential avoidance ([Hayes and others](../../reference/hayes-experiential-avoidance.md)); it often drives addictive behavior, such as numbing out. Urges is here to help people catch those moments, when they might not otherwise recognize what's going on for them. Noticing an urge instead of acting on it is a skill taught in recovery ([Marlatt's urge surfing](../../reference/marlatt-urge-surfing.md)).

Each core feeling's typical urges are on the wheel, checked against [Frijda's](../../reference/frijda-action-tendencies.md) and [DBT's](../../reference/linehan-dbt-model-of-emotions.md) pairings of emotions with urges, or the README says why not. Two are left out on purpose: Surprised's urge to look closer and Happy's urge to laugh, which Lucas didn't think the wheel needs.

Urge labels read **"Want to …"** ("Want to hide"), not "Urge to …", so they're short and read naturally in "You might notice".

## 2. Wording rules

- **Areas:** one word, or "A / B" only for two neighboring places you'd point at together. "Head / face" yes; "Breath / throat" no, since breath is something you do, not a place.
- **Who it's for:** someone asking "I have this sensation, or this urge: what could it be?" Use the plain words people say about their own body, and back each word with something more than one person's experience.
- **Sensations:** aim for one to three words, and readable on their own: "Tight chest", not "Tight". "A / B" works for two ways people describe the same sensation ("Numb / empty", "Warm / full chest").
- **Idioms** are fine when they name something you actually feel: butterflies, a lump in your throat, your heart in your throat, a weight on your shoulders. Idioms like these tend to grow out of what the body really does, so other languages often have their own ([Kövecses](../../reference/kovecses-emotion-metaphors.md)). An idiom that only stands for a feeling doesn't come in: "cold feet" means hesitating, not cold feet.
- **Feelings:** 2 or 3 per sensation, from the feelings wheel, from whichever ring is the honest fit. The middle ring is usually the most usable level; an outer word where it's more exact; a core word where it really is the best fit, or where the sensation goes with so many of a core feeling's words that picking a few would lose something. Where a sensation can mean opposite things, offer both (a racing heart can be scared or excited): the same body signal reads as different feelings in different contexts, which is why this ring exists.
- **Every common path is on the wheel.** If a sensation commonly comes with a feeling, the wheel offers that path, so it can be found and followed from the sensation to the feeling. Feelings repeating on the outer ring is fine: Scared under many sensations is many ways to find Scared. Room is never made by cutting a path because its feeling appears somewhere else.
- **Obvious paths stay.** People follow the obvious ones first. What's useful is often the less obvious feelings at their end, so an obvious urge or sensation can leave out its most obvious feeling (Want to cry leaves out Sad).
- **Every word says what backs it:** a source with a note in [reference/](../../reference/README.md), physiology, an idiom that names something people actually feel, or someone's experience (§3's **Backed by** column). Experience and speech are fine, but say so, so it's clear which words rest on research.
- **Two sensations in one area must feel different, or lead to different feelings.**
- **Where the wheel's room goes:** people mostly reach for the body wheel when they can't tell what they feel. Knowing you're happy is rarely the problem, so if room is short, the unpleasant and hard-to-tell feelings come first.
- **Ids** follow the label (`hollow-chest`, `want-to-hide`), except that a sensation that stays the same with only a shorter label keeps its id (§4's first row: `warm-chest` stays `warm-chest`). Renamed or merged sensations get ids from their new labels.

## 3. The wheel

Clockwise from 12 o'clock, in the order of §1. The wheel still starts on Whole body at 3 o'clock (wheel and card spec §1); the rotation that puts it there follows from the new order.

Counts: 8 areas, 51 sensations, 144 feeling cells (today: 8, 40, 105; the feelings wheel has 82 outer cells). Of the feeling cells, 73 are middle-ring words and 71 outer. Every core feeling is reachable from at least 3 areas: Fearful 8, Angry 7, Sad 7, Surprised 6, Bad 5, Disgusted 5, Happy 3. Happy has the fewest on purpose (§2).

### Head / face (`head`)

| Sensation | Id | Could be | Backed by |
|---|---|---|---|
| Headache | `headache` | Stressed, Frustrated, Overwhelmed | Physiology: stress is a common trigger of tension headaches |
| Foggy head | `foggy-head` | Confused, Tired, Depressed | [DSM-5][dsm]: trouble thinking or concentrating comes with depression |
| Lightheaded | `lightheaded` | Shocked, Overwhelmed, Nervous | [Panic symptoms][dsm] |
| Hot face | `hot-face` | Embarrassed, Ashamed, Humiliated | Physiology: blushing |
| Tight jaw | `tight-jaw` | Mad, Resentful, Stressed | Physiology: clenching with anger and stress |

### Throat / mouth (`throat`)

| Sensation | Id | Could be | Backed by |
|---|---|---|---|
| Lump in throat | `lump-in-throat` | Hurt, Grief, Guilty | Physiology: the throat tightens when holding back tears; [idiom][idioms] |
| Heart in throat | `heart-in-throat` | Scared, Nervous, Startled | Lucas; physiology: a pounding pulse is felt in the neck; [idiom][idioms] |
| Tight throat | `tight-throat` | Anxious, Frightened, Repelled | [Panic symptoms][dsm]; [bodily maps][maps]: disgust in the throat |
| Dry mouth | `dry-mouth` | Nervous, Scared | Physiology: fear cuts saliva |
| Gagging | `gagging` | Revolted, Repelled | [Disgust][disgust] |

### Shoulders (`shoulders`)

| Sensation | Id | Could be | Backed by |
|---|---|---|---|
| Tense shoulders | `tense-shoulders` | Stressed, Anxious, Frustrated | Physiology: neck and shoulder muscles tense under stress |
| Weight on shoulders | `weight-on-shoulders` | Pressured, Overwhelmed, Powerless | Lucas; [idiom][idioms] for a burden |

### Hands (`hands`)

| Sensation | Id | Could be | Backed by |
|---|---|---|---|
| Tight fists | `tight-fists` | Mad, Frustrated | [Bodily maps][maps]: anger in the arms and hands |
| Shaky hands | `shaky-hands` | Scared, Furious, Excited | [Panic symptoms][dsm]; physiology: adrenaline |
| Sweaty palms | `sweaty-palms` | Nervous, Excited | Physiology: palm sweat is the standard lab measure of arousal |
| Cold hands | `cold-hands` | Scared, Nervous | Physiology: fear pulls blood from the hands |

### Chest (`chest`)

| Sensation | Id | Could be | Backed by |
|---|---|---|---|
| Racing heart | `racing-heart` | Scared, Mad, Excited | [Panic symptoms][dsm]; one signal read as fear or excitement |
| Tight chest | `tight-chest` | Anxious, Overwhelmed, Resentful | [Panic symptoms][dsm]: chest discomfort; [bodily maps][maps]: most basic emotions, fear among them, in the upper chest |
| Short breath | `short-breath` | Anxious, Stressed | [Panic symptoms][dsm] |
| Hollow chest | `hollow-chest` | Lonely, Rejected, Empty | [Rejection hurts][rejection]: being left out registers like pain; its place in the chest is common speech ("heartache") |
| Heavy heart | `heavy-heart` | Guilty, Let Down, Depressed | [Idiom][idioms]. Weaker: no note places sadness in the chest. |
| Warm / full chest | `warm-chest` | Loving, Thankful, Proud | [Idiom][idioms] ("a full heart", "swell with pride"). Weaker: the [bodily maps][maps] put most *basic* emotions in the upper chest, and love and pride aren't basic. |

### Stomach (`stomach`)

| Sensation | Id | Could be | Backed by |
|---|---|---|---|
| Knot in stomach | `knot-in-stomach` | Anxious, Guilty, Betrayed | [Panic symptoms][dsm]: abdominal distress; physiology: stress upsets the gut |
| Sinking feeling | `sinking-feeling` | Disappointed, Dismayed, Worried | [Idiom][idioms] for a felt drop in the stomach |
| Butterflies | `butterflies` | Nervous, Excited | [Idiom][idioms] for gut sensations of arousal |
| Queasy | `queasy` | Repelled, Anxious | [Disgust][disgust]; [panic symptoms][dsm] |

### Whole body (`whole-body`)

| Sensation | Id | Could be | Backed by |
|---|---|---|---|
| Restless | `restless` | Anxious, Bored, Eager | [DSM-5][dsm]: restlessness is a symptom of anxiety; Bored and Eager from common speech |
| Buzzing | `buzzing` | Excited, Inspired, Anxious | [Idiom][idioms] for high arousal |
| Chills | `chills` | Frightened, Awe, Inspired | [Panic symptoms][dsm]; physiology: goosebumps with awe and being moved |
| Frozen | `frozen` | Scared, Shocked, Powerless | Physiology: the freeze response to threat |
| Skin crawling | `skin-crawling` | Repelled, Horrified, Violated | [Idiom][idioms] for a creeping feeling on the skin. Weaker. |
| Heaviness | `heaviness` | Depressed, Weak, Helpless | [Bodily maps][maps]: sadness drains the limbs |
| Drained | `drained` | Tired, Apathetic | [DSM-5][dsm]: fatigue or loss of energy comes with depression |
| Numb / empty | `numb-empty` | Numb, Empty, Shocked | Lucas; [DSM-5][dsm]: feeling empty is one of depression's recognized moods |
| Light body | `light-body` | Free, Joyful, Hopeful | [Bodily maps][maps]: happiness fills the whole body; lightness itself, and Hopeful, are common speech |
| Relaxed | `relaxed` | Peaceful, Trusting, Content | Physiology: muscle tension letting go |
| Feeling tall | `feeling-tall` | Powerful, Confident, Courageous | Lucas; [power and felt height][tall], an early finding; [idiom][idioms] ("walking tall") |
| Weak knees | `weak-knees` | Scared, Weak, Aroused | Physiology: the fainting reflex, a sudden drop in blood pressure with shock and some fears (most fear raises it); [idiom][idioms], which is all that backs Aroused. Moderate. |

### Urges (`urges`)

| Sensation | Id | Could be | Backed by |
|---|---|---|---|
| Want to run | `want-to-run` | Scared, Threatened, Overwhelmed | [Frijda][frijda]: fear's urge to avoid |
| Want to hide | `want-to-hide` | Ashamed, Exposed, Vulnerable | [DBT][dbt]: shame's urge |
| Want to lash out | `want-to-lash-out` | Furious, Hostile, Provoked | [Frijda][frijda]: anger's urge to fight; [DBT][dbt]: to attack |
| Want to back away | `want-to-back-away` | Repelled, Horrified, Hesitant | [Frijda][frijda]: disgust's urge to reject |
| Want to fix it | `want-to-fix-it` | Guilty, Worried, Loving | [DBT][dbt]: guilt's urge to repair; [compassion][compassion]: the urge to help |
| Want to be close | `want-to-be-close` | Loving, Lonely, Insecure | [Frijda][frijda]: being with someone; [attachment][attachment]: anxious attachment seeks closeness |
| Want to be alone | `want-to-be-alone` | Withdrawn, Fragile, Overwhelmed | [DBT][dbt]: sadness pulls back |
| Want to give up | `want-to-give-up` | Despair, Powerless, Inadequate | [Learned helplessness][helplessness]: giving up after what you can't control |
| Want to numb out | `want-to-numb-out` | Overwhelmed, Ashamed, Lonely | [Experiential avoidance][avoidance] |
| Want to sleep | `want-to-sleep` | Tired, Bored, Depressed | [DSM-5][dsm]: sleeping too much comes with depression; [experiential avoidance][avoidance] |
| Want to cry | `want-to-cry` | Frustrated, Overwhelmed, Thankful | [Why people cry][crying]: helplessness, frustration, and being moved, not only sadness; Thankful is the wheel's closest word for being moved |
| Want to get even | `want-to-get-even` | Bitter, Resentful, Betrayed | [Frijda][frijda]: the urge for vengeance |
| Want to control it | `want-to-control-it` | Out of Control, Anxious, Jealous | [DBT][dbt]: jealousy's urge to control |

These loosely follow [Frijda's](../../reference/frijda-action-tendencies.md) and [DBT's](../../reference/linehan-dbt-model-of-emotions.md) kinds of urge: avoiding (run, hide), fighting (lash out, get even), rejecting (back away), repairing and helping (fix it), being with (be close), pulling back (be alone, cry), giving up, holding on (control it), and getting away from the feeling itself (numb out, sleep). Wanting to binge is one way of numbing out, so it isn't its own urge. Want to cry leaves out Sad on purpose: the urge is obvious, and the less obvious feelings under it are what's useful to find.

**Backed by** names what each word rests on: a source (each has a note in [reference/](../../reference/README.md)), physiology (what the body measurably does), an idiom that names something people actually feel, or Lucas's own experience. A word that rests only on experience or speech is fine, but says so.

[maps]: ../../reference/nummenmaa-bodily-maps.md
[dsm]: ../../reference/dsm-5-symptoms.md
[disgust]: ../../reference/rozin-disgust.md
[idioms]: ../../reference/kovecses-emotion-metaphors.md
[rejection]: ../../reference/eisenberger-social-pain.md
[tall]: ../../reference/duguid-goncalo-power-height.md
[frijda]: ../../reference/frijda-action-tendencies.md
[dbt]: ../../reference/linehan-dbt-model-of-emotions.md
[compassion]: ../../reference/goetz-compassion.md
[attachment]: ../../reference/mikulincer-shaver-attachment.md
[avoidance]: ../../reference/hayes-experiential-avoidance.md
[crying]: ../../reference/vingerhoets-crying.md
[helplessness]: ../../reference/maier-seligman-learned-helplessness.md

## 4. Where the old sensations went

For "You might notice" (§5) and for review. Where an old sensation splits, the feeling decides which way it goes.

| Old sensation | Becomes |
|---|---|
| Headache, Foggy head, Racing heart, Tight chest, Knot in your stomach, Butterflies in your stomach, Tense shoulders, Sweaty palms, Cold hands, Restless, need to move, Frozen or very still, Buzzing energy, Warmth in your chest, Hollow feeling in your chest, Light, floaty body, Lump in your throat | The same sensation, with its shorter label where it has one |
| Hot or flushed face, Blushing | Hot face |
| Clenched jaw | Tight jaw |
| Tearful | Want to cry |
| Shallow breathing | Short breath |
| Sharp intake of breath | Heart in throat |
| Queasy stomach | Queasy |
| Clenched fists | Tight fists |
| Trembling or shaky | Shaky hands |
| Fidgety | Restless |
| Heavy arms and legs | Heaviness |
| Numbness | Numb / empty |
| Low energy, Tired eyes | Drained or Want to sleep |
| Relaxed muscles, Slow, deep breathing | Relaxed |
| Urge to shrink or hide | Want to hide |
| Slumped posture | Want to hide (ashamed), Want to give up (inadequate), or Heaviness (tired, depressed) |
| Open, upright posture | Feeling tall (confident, powerful), Warm / full chest (proud), or Relaxed (accepted, trusting) |
| Urge to turn away | Want to back away (disgust), Want to hide (shame), or Want to be alone (withdrawn) |
| Wide eyes | Heart in throat (startled) or Frozen (scared); amazed and interested have no sensation left |
| Raised eyebrows | Heart in throat (startled); curious and skeptical have no sensation left |
| Smiling | Warm / full chest (happy), Light body (joyful, playful), or Relaxed (content) |
| Scrunched-up face | Gagging or Want to back away (disgust), Tight jaw (annoyed) |

The new sensations with no old one (Lightheaded, Tight throat, Dry mouth, Weight on shoulders, Chills, Heavy heart, Sinking feeling, Skin crawling, Weak knees, and most urges) go into "You might notice" where they fit.

## 5. "You might notice"

- All 126 feelings in `src/data/feelings.json` get their sensations redone with the new ids: first by the mapping in §4, then by hand where a feeling ended up with fewer than 2, a duplicate, or a new sensation fits better. About 3 per feeling, as today.
- **Drafted to agree with the body wheel:** where the body wheel says a sensation can be a feeling, that feeling's "You might notice" lists the sensation. Nothing checks it, and the two may drift later on purpose. This replaces v2 §3.3's "the body wheel's links are its own", in spirit only: still no rule.
- **Reviewed through `docs/content-review.md`:** each feeling's italic sensations line is rewritten, so the change's diff of that file is the before and after for every feeling's "You might notice". Its Body wheel section is rewritten from §3.

## 6. Colors

- The 8 area hues keep their light and dark values; the tokens are renamed for the new area ids. Proposed, keeping each place's color where it has one: `head` keeps head's, `throat` takes breath's, `shoulders` takes face's, `hands` takes arms', `chest`, `stomach` and `whole-body` keep theirs, and `urges` takes posture's.
- The new order changes which hues sit next to each other. Whole body and Urges sit side by side, as Whole body and Posture do today. If two neighbors look too alike, the builder may swap assignments; the values don't change.
- The color tests (`tests/unit/colors.test.ts`) check contrast and distinctness for the new names.

## 7. Text that names an area

- **`titles.areaDescription`** ("{area}: what you might notice there, and the feelings it can come with.") reads wrong for Urges ("Urges: what you might notice there"). It becomes "{area}: what you might notice, and the feelings it can come with.", for every area.
- **Spoken paths** ("Scared. In Chest, Racing heart.") read "In Urges, Want to run." That's acceptable and stays.
- **The wheel's name** stays "Body sensations wheel", and its question stays "What do you notice in your body?" (see [For review](#for-review)).

## 8. Fitting it on the wheel

- The labels get much shorter: the longest area label is "Throat / mouth" (14 characters, against "Breath and throat" and "Posture and urges" today), and the longest sensation is "Weight on shoulders" (19, against "Hollow feeling in your chest" at 28).
- There are more cells: 51 sensations and 144 feelings, against 40 and 105, so each outer cell is about a quarter thinner. Today's body wheel already needs a radius of about 450 px to rest whole on an upright stage, against about 352 px for the feelings wheel ([known issue](../../ROADMAP.md#layout-and-labels)); 144 cells would need about 620 px.
- **Checked by the viewport sweep** (`tests/e2e/viewports.spec.ts`) and by looking at the body wheel on a phone, portrait and sideways. Label counts that change because of the new content are expected; update them.
- **If the outer ring doesn't fit,** the builder stops and shows Lucas the wheel built with everything in §3; he decides what changes. Nothing is trimmed ahead of time, and no path is cut only because its feeling repeats (§2). One option to weigh then is falling back to 7 areas, with Shoulders folded into Whole body. Whatever changes is listed in the changes file.

## 9. Everything else it touches

- **Data:** `src/data/wheels/body.json` (areas, sensations, feelings; `start` stays `whole-body`); `src/data/locales/en.json` (`areas` and `sensations` rewritten, old ids removed; `titles.areaDescription` per §7); `src/data/feelings.json` per §5.
- **Colors:** `src/styles/tokens.css` area tokens renamed in all three theme blocks.
- **Link previews:** run `node scripts/make-og-image.mjs` and commit `public/og/`. The old area images (`body-face.png`, `body-breath.png`, `body-arms.png`, `body-posture.png`) go; `body-throat.png`, `body-shoulders.png`, `body-hands.png` and `body-urges.png` arrive. `page.imageAlt` doesn't change, and `/body`'s own preview still shows Whole body, since it reads the wheel's `start`.
- **Credits:** the About page (`page.about`) credits the new sources once the app uses them: [Nummenmaa and others' bodily maps](../../reference/nummenmaa-bodily-maps.md), [Frijda's action tendencies](../../reference/frijda-action-tendencies.md), [Craig's interoception](../../reference/craig-interoception.md), [Linehan's DBT model of emotions](../../reference/linehan-dbt-model-of-emotions.md), [Hayes and others' experiential avoidance](../../reference/hayes-experiential-avoidance.md), [Marlatt's urge surfing](../../reference/marlatt-urge-surfing.md), [Rozin and Fallon on disgust](../../reference/rozin-disgust.md), [Kövecses on emotion metaphors](../../reference/kovecses-emotion-metaphors.md), [the DSM-5's symptoms of panic, anxiety and depression](../../reference/dsm-5-symptoms.md), [Maier and Seligman on learned helplessness](../../reference/maier-seligman-learned-helplessness.md), [Vingerhoets on crying](../../reference/vingerhoets-crying.md), [Eisenberger and others on rejection](../../reference/eisenberger-social-pain.md), [Duguid and Goncalo on power and felt height](../../reference/duguid-goncalo-power-height.md), [Goetz and others on compassion](../../reference/goetz-compassion.md), and [Mikulincer and Shaver on attachment](../../reference/mikulincer-shaver-attachment.md).
- **The research, in plain words.** The body wheel should be visibly grounded in research, not one person's guesswork, and open to correction: Lucas welcomes changes and issues from people who disagree.
  - **`README.md`** gets a section, "Research behind the body wheel", written for anyone, not researchers: why the areas are places plus Urges, what counts as a sensation, and what each source found, in a sentence or two each with a link to its note. It says plainly which words rest on common speech or Lucas's own experience rather than research, and ends by inviting anyone who thinks a word is wrong or missing to [open an issue](https://github.com/lpolito/feels-on-wheels/issues). Its Credits section mentions the research as well as the wheels.
  - **How it was decided,** in the same section, so people can judge how far to trust it:
    - Lucas set the frame and the rules: places plus Urges, the eyes-closed test, every common path on the wheel.
    - Claude (AI) found and summarized the research, and drafted the words and what backs each one. Lucas reviewed every word over several rounds, rewrote and cut freely, and made every call. AI suggestions that didn't hold up were dropped.
    - Every word lists what backs it, and words resting on common speech or one person's experience are marked as such.
    - A second, separate AI review checked each claim against its source. The notes say which sources were read in full and which only through abstracts or summaries.
    - Lucas isn't a clinician or a researcher and doesn't claim to be. The wheel is for finding words, not a diagnostic or clinical tool.
    - Corrections are welcome, especially from therapists and researchers, as issues.
    - The full record is in the repo: this spec, with Lucas's answers from each round, and the notes in [reference/](../../reference/README.md).
  - **The About page** (`page.about`) gets a short paragraph saying the same, linking to that section and to issues, next to the credits: what the body wheel draws on, that it was made with AI and reviewed by someone without formal training, that it isn't a clinical tool, and that corrections are welcome.
  - Both follow §3's **Backed by** column, so they can't claim more than the spec does.
- **Known issues:** if shorter labels fix the [long label spilling past its cell](../../ROADMAP.md#layout-and-labels) or the tiny windows with no labels at rest, remove them from the roadmap and `ACCESSIBILITY.md`; if not, update their examples, which name old labels.
- **Tests:** the data test's area → sensations table, `AREA_HUES` in the colors test, the area regex in `tests/e2e/body.spec.ts`, the body palette in `wheel-render.test.ts`, and tests that use removed paths (`posture/shrinking/humiliated` in `card.test.ts`). Most body tests use `chest/racing-heart/scared` and `whole-body`, which stay.

## 10. The rules live with the data

This spec is frozen once approved, but its rules have to hold for every later edit to the wheels. So they move next to the wheel files, where whoever edits them, a person or an agent, finds them.

- **`src/data/wheels/README.md`**, the living rules for the wheels' content:
  - **Both wheels:** the content rules now in the roadmap's [Content rules](../../ROADMAP.md#content-rules) (overlap with other wheels is fine, nothing copied wholesale, plain short definitions, every source credited). They move here, and the roadmap section links here instead.
  - **The body wheel:** §1 and §2 of this spec, as rules rather than decisions: what an area is, the eyes-closed test for a sensation, what Urges hold and how they're worded, the label rules, the feelings rules (including every common path, obvious paths, Backed by, and distinct sensations), the area order, body scan coverage, each core feeling's typical urges, and that "You might notice" is drafted to agree with the body wheel without being enforced.
  - **The feelings wheel:** a placeholder saying its rules come with the [opinionated feelings wheel](../../ROADMAP.md#an-opinionated-feelings-wheel) idea.
  - **Which files it covers:** `src/data/wheels/*.json`, `src/data/feelings.json`, and the `feelings`, `areas`, and `sensations` in `src/data/locales/en.json`.
  - How to check a change: every feeling on the body wheel is a word on the feelings wheel, each sensation has 2 or 3 feelings, each core feeling stays reachable from several areas, and every word says what backs it.
  - For reference only, not a rule on what's on the wheel: a list of the feelings wheel's words with no path on the body wheel, worth looking at when editing.
- **`src/data/wheels/AGENTS.md`**, a few lines: read `README.md` before changing any file it covers, follow it, and update it in the same change when a rule changes.
- **The root `AGENTS.md`** gains a short "Wheel content" section pointing to both, since the wheel files aren't the only ones the rules cover.
- The README is the rule; specs record why a rule was chosen. When they disagree after this ships, the README wins.

## Research behind it

- **Bodily maps of emotions** (Nummenmaa, Glerean, Hari and Hietanen, *PNAS*, 2014; [note](../../reference/nummenmaa-bodily-maps.md)). About 700 people painted where they felt each emotion grow or fade. Most basic emotions showed up in the upper chest; anger and happiness in the arms; sadness drained the limbs; disgust sat in the throat and gut; happiness filled the whole body. The maps matched across Finnish, Swedish and Taiwanese groups. This backs having places at all, Whole body as one of them, and Throat / mouth for disgust.
- **Maps of subjective feelings** (Nummenmaa, Hari, Hietanen and Glerean, *PNAS*, 2018; same note). Across 100 feeling states, how a feeling feels in the body was one of the three things that best explained how people told feelings apart.
- **Action tendencies** (Nico Frijda, *The Emotions*, 1986; [note](../../reference/frijda-action-tendencies.md)). Emotions come with a readiness to act: to approach, avoid, fight, reject, be with, or attend. This backs Urges as a way into a feeling.
- **Interoception** (A. D. Craig, *Nature Reviews Neuroscience*, 2002; [note](../../reference/craig-interoception.md)). The sense of the body's own condition, from heartbeat and breathing to the gut, temperature and muscle tension, which Craig argues underlies feelings. The "eyes closed, nobody watching" test (§1) is our plain wording of it, with proprioception for how you hold yourself.
- **DBT's model of emotions** (Marsha Linehan, *DBT Skills Training Handouts and Worksheets*, 2nd ed., 2015; [note](../../reference/linehan-dbt-model-of-emotions.md)). Body sensations and action urges are separate parts of an emotion, and each emotion has its own urges, such as making it right for guilt and pulling back for sadness. This backs Urges as their own area and fills in kinds of urge Frijda's list doesn't stress.
- **Experiential avoidance** (Hayes, Wilson, Gifford, Follette and Strosahl, 1996; [note](../../reference/hayes-experiential-avoidance.md)) and **urge surfing** (Alan Marlatt; [note](../../reference/marlatt-urge-surfing.md)). Many urges are to get away from a feeling itself, and noticing an urge without acting on it is a skill taught in recovery. This backs Urges as a way to catch what you're pulled to do, including numbing out.
- **Disgust as rejecting something from the mouth** (Paul Rozin and April Fallon, *Psychological Review*, 1987; [note](../../reference/rozin-disgust.md)). Disgust's body signs (nausea, gagging) are about the mouth, throat and stomach. This backs Gagging and Queasy.
- **Emotion idioms come from the body** (Zoltán Kövecses, *Metaphor and Emotion*, 2000; [note](../../reference/kovecses-emotion-metaphors.md)). Many idioms for feelings grow out of what the body really does and recur across languages. This backs §2's rule on idioms.
- **The body symptoms of panic, anxiety and depression** (American Psychiatric Association, *DSM-5*, 2013; [note](../../reference/dsm-5-symptoms.md)). The standard list of what intense fear feels like, most of it sensations felt from inside, plus anxiety's restlessness and depression's empty mood, fatigue, foggy thinking, and oversleeping. This backs most of fear's and anxiety's sensations, Numb / empty, Drained, Foggy head, and Want to sleep.
- **Learned helplessness** (Steven Maier and Martin Seligman, *Psychological Review*, 2016; [note](../../reference/maier-seligman-learned-helplessness.md)). After bad things you can't control, people and animals stop trying. This backs Want to give up.
- **Why people cry** (Ad Vingerhoets, *Why Only Humans Weep*, 2013; [note](../../reference/vingerhoets-crying.md)). Helplessness is at the core of crying, which comes with frustration, overwhelm, and being moved, not only sadness. This backs Want to cry and its feelings.
- **Rejection hurts** (Eisenberger, Lieberman and Williams, *Science*, 2003; [note](../../reference/eisenberger-social-pain.md)). Being left out registers like physical pain, though later work finds the brain keeps the two apart. This backs Rejected as something felt; putting it in the chest is common speech, not this study.
- **Feeling powerful makes you feel taller** (Duguid and Goncalo, *Psychological Science*, 2012; [note](../../reference/duguid-goncalo-power-height.md)). An early finding. This backs Feeling tall.
- **Compassion** (Goetz, Keltner and Simon-Thomas, *Psychological Bulletin*, 2010; [note](../../reference/goetz-compassion.md)). The desire to help is what sets compassion apart. This backs Want to fix it covering wanting to help someone you care about.
- **Adult attachment** (Mario Mikulincer and Phillip Shaver, *Attachment in Adulthood*, 2007; [note](../../reference/mikulincer-shaver-attachment.md)). One kind of insecurity, attachment anxiety, pulls people toward closeness and reassurance; the other, avoidance, pulls away. This backs Insecure under Want to be close.
- **The same sensation, different feelings.** That a racing heart can come with fear or excitement is ordinary experience, and how people read the same arousal differently is widely studied, though some of the classic experiments haven't replicated well. No one source backs it here. The wheel already works this way; it's why §2 asks for opposite feelings where they're real.
- **[Lindsay Braman's Emotion-Sensation Wheel](../../reference/braman-emotion-sensation-wheel.md)** stays the model. Her outer ring also mixes sensations, posture and behavior; this change sorts them instead.

## Approaches

### The frame

- **A. A body map:** places only, with Whole body for what isn't in one spot; urges reworded as felt sensations or dropped. The cleanest rule.
- **B. Quality first:** the center ring is kinds of sensation (tight, heavy, hot, shaky), with places in the middle ring. How somatic therapists often ask, and good when you can't place a feeling, but it gives up the region as a way in, and labels like "Tight" are vague on their own. Kept only as a lens for wording.
- **C. A body map plus Urges (chosen).** A with one honest exception. Lucas identifies heavily with urges, and the research backs them.
- **D. Energy** (charged, drained, tense, settled): too abstract, and it repeats what the feelings wheel already sorts. Dropped.

### 7 or 8 areas

Urges takes a slot, so 7 areas would leave room for only six places. 8 keeps Shoulders, one of the commonest places to hold stress, and the existing 8 hues, which already pass the color tests. Lucas noted that fitting and color decide it, so 8 is the plan, and 7 is one option if it doesn't fit (§8).

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
- Wording fixes inside the rules of §2, listed in the changes file.

## For review

What Lucas's review should settle. The first six change what gets built.

1. **Head and face are one area** to make room for Shoulders / back and Urges. Fine, or should face be its own place and something else merge?
   **Lucas, 2026-11-16:** fine as one area.
2. **Shoulders / back is down to two sensations** (Tense shoulders, Weight on shoulders) now that Chills is under Whole body and Standing tall is gone. Keep it, or fall back to 7 areas now (§8)?
   **Lucas, 2026-11-16:** keep it, with a third sensation for confidence (question 3).
3. **Standing tall** was posture more than a sensation. Lucas asked for a better sensation; the second draft gave Proud to Warm / full chest ("swell with pride") and dropped it, leaving Confident and Courageous with no sensation. Tight fists and Frozen stay as they are.
   **Lucas, 2026-11-16:** "I think having a word for the confidence that you feel in your shoulders is good." Not Steady. It becomes **Shoulders back** (Powerful, Confident, Courageous) under Shoulders / back, felt the way you feel how you're holding yourself, with your eyes closed.
   **Lucas, 2026-11-16, later:** Shoulders back was weird under Shoulders / back, and he still felt something was missing: "the feeling of walking and presenting yourself confidently." It became **Feeling tall** under Whole body, and the area became **Shoulders**, since nothing in it was about the back. That leaves Shoulders with two sensations, and it stays its own area.
4. **Numb / empty** reads "Numb / empty › Numb" and "Numb / empty › Empty" on the card. Keep it, give it feelings other than Numb and Empty, or go back to "Numbness"?
   **Lucas, 2026-11-16:** "I think this is fine and makes sense."
5. **Urges:** are the two kinds (about what's happening, about the feeling) what was missing? Should "Want to avoid it" be its own urge, and should "Want to sleep" come back?
   **Lucas, 2026-11-16:** "In the end, all urges are want to avoiding something, whether the person realizes it or now. We're just trying to help people identify those moments where they might not usually recognize what's going on for them." §1 now says so instead of splitting urges into two kinds, and Want to binge folds into Want to numb out ("Usually you binge to numb").
6. **The feeling cells:** try them and trim only if they don't fit (planned), or trim to about today's 105 first?
   **Lucas, 2026-11-16:** "I'd like to see it first to make a judgement call." Not trimmed to avoid repeats: "If there's a common body sensation then it should be followable on the wheel, and that's needs to be discoverable and traceable." §2 and §8 now say so, and three paths the second draft had cut only for room are back: Tight throat, Content under Relaxed, and Want to sleep.
7. **The wheel's name:** "Body sensations wheel" now holds urges too. Keep it, or call it the body wheel everywhere (the switch already says "Body")?
   **Lucas, 2026-11-16:** keep it.
8. **"Want to …"** for every urge, or a mix ("Urge to hide", plain verbs)?
   **Lucas, 2026-11-16:** no hard and fast rule; revisit once the list of urges settles. Every urge reads "Want to …" until then.

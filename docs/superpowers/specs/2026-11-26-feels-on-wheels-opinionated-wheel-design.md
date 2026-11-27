# An opinionated feelings wheel

Date: 2026-11-26. Status: **approved by Lucas, 2026-11-26.** A project. It records the feelings wheel worked out from 2026-11-19 to 2026-11-26 (the rules, the six cores, 162 words and their cards, the repaired body wheel, and the order around both wheels), and says how that work ships: the rules into `src/data/README.md`, the checks into tests and scripts, the sources into `docs/reference/`, and the icons redrawn. After it ships, `docs/opinionated-wheel/` is deleted in a follow-up pull request, so the folder is on `main` once and git history keeps it.

The roadmap idea is [An opinionated feelings wheel](../../ROADMAP.md#an-opinionated-feelings-wheel). It builds on the [body wheel rework](2026-11-15-feels-on-wheels-body-wheel-rework-design.md), whose rules for the body wheel still hold except where this spec changes them.

## Why

Lucas, 2026-11-15: the feelings wheel should be opinionated about its words, their definitions, and how feelings relate to sensations. Until now it mostly repeated [Roberts's seven-core wheel](../../reference/core-feelings-wheel.md), with words that sat oddly under their parent (Hesitant under Repelled, Embarrassed under Disapproving, Inferior under Depressed), cores taken from a list of facial expressions, and definitions nobody had checked against how people use the words.

**The north star is how people use the wheel** (Lucas, 2026-11-21). They start at the center, tap the core that matches what they feel, tap a middle word, find their word, and read its card to confirm. Every rule serves that, and anything decided earlier can be rechecked against it.

Success: every word is on the wheel for a written, checkable reason; each sits where someone feeling it would tap; siblings can be told apart by their labels alone; every card reads plainly after "I feel"; and the rules live beside the data, so later edits keep the wheel this way.

## Decisions

| Topic | Decision |
|---|---|
| The rules | Few and loose. Facts are checked strictly by a script; usage counts are flags, never verdicts; judgment follows five questions with no numbered order or thresholds. Lucas, 2026-11-21: "It feels silly for some reason to codify this so specific when language really doesn't work in this way." §2 |
| Cores | Six: Happy, Angry, Love, Sad, Bad, and Scared, clockwise from the start, arranged like a color wheel so opposites face each other (Happy and Sad, Love and Scared, Angry and Bad). §1 |
| Words | 6 cores, 45 middle words, 111 outer words: 162 positions. Betrayed, Empty, and Disgusted are each on the wheel twice, on purpose. §1 |
| Definitions | Rules for writing them, revised after Lucas reviewed every card twice (2026-11-25), including a plain-language rule. §2 |
| Order | Words side by side are related, at every level, and where two cores meet, the words lean toward each other. §1 |
| The body wheel | Repaired to the new words, not rebuilt: 35 of 46 sensations changed, 124 cells. Its own rules stay, plus a data test that no two feelings under a sensation come from the same line. §1 |
| Colors | Bad becomes teal, Love and Scared take the colors Fearful and Surprised had, the body wheel's Throat becomes a muted violet, and Urges takes the brown Disgusted had. §1 |
| Where the rules live | In `src/data/README.md`, which wins over this spec. §2 |
| Each word's reason | The reasons written while deciding (in `derived-wheel.md`) were working notes and don't move. This spec keeps the decisions and close calls; the notes stay in git history. From now on, each change to a word gives its reason in the change itself. §2 |
| Checks | Those that need only the wheel files become data tests in CI. Those that need the word datasets run in local scripts, moved to `scripts/wheel-words/`. The situations check is dropped. §3 |
| Icons | One script draws the app icon and the lucaspolito.dev icon from the wheel file and the color tokens, the way `make-og-image.mjs` draws the link previews. §4 |
| Sources | Every source the rules or a decision rests on gets a note in `docs/reference/` and a credit. NRC VAD is credited in the README, not on the About page. §5 |
| Translations | Out of scope entirely. |

## 1. What ships

The words, cards, colors, and both wheels' data are already on the branch `opinionated-wheel-rules`, written into `src/data/` by a temporary script, and shown on its preview. This change keeps them as they are. Nothing in this section is new work, except where it says so.

### The cores

Clockwise from where the wheel starts: **Happy, Angry, Love, Sad, Bad, Scared.**

- **Why these six.** People sort feeling words into the same few families: love, joy, anger, sadness, and fear, plus a small group for pleasant surprise ([Shaver et al. 1987](../../reference/shaver-emotion-prototypes.md)). Bad is the one catch-all door, for when you can't tell what you feel, and everything inside it is specific. No research list has a catch-all; it's a design choice.
- **What left.** Surprised is a middle word under Happy, renamed Amazed for good surprises; bad surprises are Shocked, under Scared. Physical disgust isn't anger ([research/9](../../opinionated-wheel/research/9-disgust.md)), so Disgusted is in two places: physical disgust under Bad, and moral disgust under Angry. Fearful became Scared: young children know it best, and most of Afraid's extra uses are hedges ("afraid that").
- **Labels children know.** Each core's label is a word that at least 75% of 4- to 6-year-olds knew ([Baron-Cohen et al. 2010](../../reference/baron-cohen-emotion-vocabulary.md)).
- **The order.** Lucas named the opposite pairs (Happy and Sad, Love and Scared, Angry and Bad, "I guess"). Each pair is a true color opposite, 160 to 175 degrees apart, since the cores' slices differ in size. Three orders were previewed. The first grouped neighbors by how they feel and put Sad, Scared, and Angry together, the cores people waver between most. A second needed four new colors, two of them reds side by side.

### Colors

| | Light | Dark | Was |
|---|---|---|---|
| Happy (`--hue-happy`) | unchanged | unchanged | Happy |
| Angry (`--hue-angry`) | unchanged | unchanged | Angry |
| Love (`--hue-love`) | #C2257F | #E0559E | Fearful's |
| Sad (`--hue-sad`) | unchanged | unchanged | Sad |
| Bad (`--hue-bad`) | #005A69 | #2B6D7C | purple, which was hard to tell from Sad's indigo, "especially on the body wheel" |
| Scared (`--hue-scared`) | #3E7B5E | #5FA383 | Surprised's |
| Throat / mouth (`--hue-throat`) | #89579E | #8F6792 | teal, which no longer cleared Bad's |
| Urges (`--hue-urges`) | #9A4E26 | #954E17 | Disgusted's brown, a little darker to stay clear of Happy |

Throat went violet rather than green because its feelings are mostly green already, and muted rather than vivid so it sits with the other area colors and is easier to tell from Whole body. Every color test passes.

### The words

The wheel is `src/data/wheels/core.json`, with each card's definition in `src/data/locales/en.json` and its "You might notice" in `src/data/feelings.json`. `docs/content-review.md` shows all of it. The decisions and close calls, with dates, are in §6.

**Words in two places.** A word goes in two places only when the evidence shows people would split between two cores:

- **Betrayed**, under Sad → Hurt and Angry → Resentful, with one definition: raters split 54% Angry and 32% Sad.
- **Empty**, under Sad → Grief and Bad → Numb, with one definition: raters put it 69% Sad, but it's also Numb's hollow kind of feeling.
- **Disgusted**, physical under Bad and moral under Angry, with two definitions and two ids (`physically-disgusted`, `disgusted`), "until something pushes against it" (Lucas, 2026-11-22).

**Words for what happened to you** are a tagged list on the outer ring: Safe, Reassured, Vindicated, Forgiven, Honored, Flattered, Cared for, Valued, Accepted, Understood, Abandoned, Misunderstood, Left out, Rejected, Unappreciated, Betrayed, Humiliated, Insulted, Provoked, Trapped, Violated, Used, Cheated, and Pressured. The tags move into the data (§3).

### Order

Words that sit side by side are related, so a near miss lands next to the word you meant (Lucas, 2026-11-26: "at least some semblance of conscious thought about order instead of it being random"):

- Within a core, similar middle words sit together.
- Where two cores meet, the words on each side lean toward each other: Shocked beside Amazed, Confident beside Offended, Jealous beside Attracted, Compassion beside Heartache, Ashamed beside Guilty, Overwhelmed beside Anxious.
- The outer ring reads as one chain, across middle words too: Stunned beside Awe, Sympathy beside Sorry for someone, Pressured beside Worried.

Not alphabetical: menu studies find alphabetical order helps only when you know the exact word you want, and here people are looking for one they don't know yet. On the body wheel, the feelings under each sensation are ordered so the outer ring doesn't repeat a feeling back to back or run one core's color for long, and sensations keep their head-to-toe order, except that Heart in throat now comes before Lump in throat.

### The body wheel

Repaired to the new words, changing only what they forced (Lucas asked for a repair, not a rebuild): 35 of 46 sensations changed, 124 cells. Two drafts written apart and a referee settled the close calls. Worth knowing:

- Scared, now a core, stays only where a sensation splits across families (Racing heart, Shaky hands, Chills, Weak knees), and gives way elsewhere to Terrified, Petrified, or Panicked.
- No word for not caring is left on the feelings wheel, so Nothing much offers Unmotivated in place of Apathetic.
- Love is reachable only through Be close, Fix things (as Compassion), and Weak knees (as Aroused).

"You might notice" was drafted for the 96 new words, cold-reviewed, and agrees with the body wheel's paths.

### Addresses

Every word's address follows its new place (`/happy/cheerful/playful`). Old addresses aren't forwarded and show "not found", as the URL redesign allows (Lucas, 2026-11-19: links to moved or removed words aren't a concern).

### Temporary preview code

Already removed on the branch: the hidden wheel switch and the start message without a link to the other wheel, both left over from when the body wheel was switched off for the preview.

## 2. The rules move into `src/data/README.md`

The README's "The feelings wheel" section, a placeholder today, gets the rules from `docs/opinionated-wheel/rules.md`, written as living rules for whoever edits the wheel next. They're the same rules; only the parts that served the brainstorm are left out.

**What goes in:**

- **Who it's for and the north star** (above).
- **The always rules:**
  - each word is on the wheel once, unless people would split (with the two kinds of repeat, as in §1);
  - each middle word has 2 or 3 outer words, 2 by default, and a third word needs an everyday situation where it's the word you'd reach for and neither its siblings nor its parent fits;
  - moving or removing a word means rechecking every body wheel path that uses it;
  - every new source gets a note and a credit;
  - familiarity with today's wheel or other wheels is never a reason for a word.
- **The five questions** each word answers: Can you be feeling it right now? Which core would you tap first? Which middle word would you tap? Is each word a real choice, told apart by its label alone? After "I feel", does it name your own feeling, in everyday words?
- **Design notes:** what a core is and how its label is chosen; the catch-all's rule; the cores' what-happened guides (for placing a word, not how people choose); words for what happened to you; mixed feelings; the order.
- **The definition rules,** in full, with their examples, including the plain-language rule.
- **The checks and flags** (§3), each saying whether CI or a local script runs it.
- **How to check a change, by people:** fix the cards a reader flags rather than rewriting the wheel (a cold rewrite of the whole wheel made 20 of 50 unflagged cards worse); have a checker who didn't write a change read it cold; and when the wheel changes a lot, run the user's-eyes check (below).

**What doesn't:** the research table and the considered-and-dropped list. They're the reasons behind the rules, so they go in this spec (Research behind it, and Approaches).

**Each word's reason.** The old rule said every word has a written reason and that reason is the record. The reasons in `derived-wheel.md` were written while deciding, cite rules that were later replaced, and Lucas doesn't review them (2026-11-25). So the rule becomes what the body wheel already does: every new or changed word says why, in the change that makes it (its spec or changes file, or its pull request). This spec's §6 is the record for the words as they ship, and `derived-wheel.md` stays in git history for anyone who wants the working notes.

**The user's-eyes check.** Everyday situations, written by one cold agent that never sees the wheel, are walked through the wheel by a second cold agent that didn't write them, using labels alone (core, middle word, outer word, then the card). It replaces the situations check (§3). Lucas did a high-level check himself on 2026-11-26 and saw nothing noteworthy, so it isn't run for this change.

`src/data/AGENTS.md`'s steps gain one line for the feelings wheel: check each word you add, move, or reword against the README's questions and definition rules, and run the checks in §3.

## 3. Checks

### Data tests (CI)

In `tests/unit/data.test.ts`, beside the body wheel's tests. Each failure names the word and the rule.

| Check | What it checks |
|---|---|
| Once | No two positions share a label, comparing base forms (Love and Loved are the same). A word may be in two places only when they're under different cores: the same id in both (one feeling people split on) or two ids with the same label (two meanings). |
| Layout | Every middle word has 2 or 3 outer words. |
| What happened | Every feeling tagged as what happened to you is on the outer ring. The tag is a new optional field in `feelings.json`, `"whatHappened": true`, which the loader accepts and the app ignores. |
| Definitions | No card uses its own label or a sibling's label, comparing base forms (the cores count as siblings). A label inside a longer word is fine (Energetic's "energy"). Ported from `definitions.py`, with one fix: its base forms don't treat Love and Loved as the same word, and the port does. |
| Body wheel | Already there: 2 or 3 feelings per sensation, each on the feelings wheel, none from the same line, and no sensation whose feelings are all pleasant (now Happy or Love). |

**Not ported:**

- **Translations** (no two positions in one language share a translation): there's only English, and translations are out of scope. The rule stays in the README for when a language comes.
- **Situations:** dropped. Many situations in `situations.json` were written to justify a word, and a list written one situation per word can't find a missing feeling. The user's-eyes check (§2) does that job.

### Local scripts

`check.py`, `lex.py`, `ngrams.py`, and `ngram-cache.json` move from `docs/opinionated-wheel/scripts/` to `scripts/wheel-words/`. They read the app's wheel and labels (`core.json` and `en.json`) instead of `derived-wheel.json`, and lose the situations check. `WHEEL_DATA` points at a folder of downloaded datasets, which never enter the repo. A short `scripts/wheel-words/README.md` says how to run them, where to download each dataset (the URLs in the handoff and research/3), and each dataset's terms. The README's checks table links to it.

What they keep: the pleasantness check and its recorded exceptions, the usage flags (rare, a more common synonym), and the core-label check. The recorded exceptions, the phrases that aren't feelings, and the synonym alternatives are already constants in `check.py`, so they move with it. Its references to reasons in `derived-wheel.md` change to say that a cleared flag's reason goes in the change that clears it.

`app-wheel.py`, `compare.py`, and `definitions.py` are deleted: the first two served only the preview, and the third becomes the Definitions test.

### `docs/content-review.md`

Rebuilt so far by `app-wheel.py`, which goes. A small script, `scripts/make-content-review.mjs`, rebuilds it from the data (same layout as today), so `src/data/AGENTS.md`'s step "rebuild `docs/content-review.md`" has something to run.

## 4. Icons

Both icons still show the seven old cores in their old colors:

- **The app icon,** `public/icons/icon.svg`: the favicon, and the source of the home-screen PNGs that `scripts/make-icons.mjs` renders.
- **The lucaspolito.dev icon kit,** `docs/website-icon/`: a silhouette SVG with seven spokes, and CSS whose conic gradient has seven colors, at angles typed in by hand.

Neither has a script that draws it. `scripts/make-icons.mjs` grows a first step that draws both from `core.json` (each core's share of the circle, by its number of outer words, starting where the wheel starts) and `tokens.css`, then renders the PNGs as it does today:

- `public/icons/icon.svg`: the same design (wedges, white spokes, the inner ring line), with the six cores in the light theme's colors.
- `docs/website-icon/feels-on-wheels.svg`: the same silhouette, with six spokes.
- `docs/website-icon/feels-on-wheels.css`: the gradient's stops at the six cores' angles, in the dark theme's colors, with the header comment's contrast ratios against the site's `#121214` recomputed. The script fails if a color falls under the site's 3:1 rule.
- `docs/website-icon/README.md`: "seven" becomes "six", and it says how to redraw.

The root `AGENTS.md` gains a rule like the one for link previews: when the cores, their order, or their colors change, run `node scripts/make-icons.mjs` and commit the icons in the same change.

## 5. Sources and credits

**Which sources get a note.** Every source the rules, this spec, or a recorded decision rests on, so a reader can check the claim. A study a research report only mentions in passing, or checked and set aside, doesn't. From `rules.md`, `learnings.md`, and the research reports, that's about these (the builder confirms the list against the reports and each note against its source):

- **Families and sorting:** Shaver et al. 1987 (with Parrott's restatement and the Indonesian, Basque, and Chinese replications); Russell and Fehr 1994; Cowen and Keltner 2017; Jackson et al. 2019.
- **What a feeling is:** Ortony, Clore, and Foss 1987; Lazarus 1991 and 1993; Danckert et al. 2018 (boredom); Tangney (shame, guilt, and embarrassment); Leach and Cidam 2015; Zickfeld et al. 2019 (being moved); Fontaine et al. 2007; Barrett et al. 2019.
- **Which core people tap:** Trampe et al. 2015 (feelings reported together, day to day); Zupan et al. 2022 (raters' core choices).
- **Placements:** Rozin et al. 1999 (moral disgust and violation); Algoe 2012 (gratitude); Goetz et al. 2010 (already has a note; extend it for compassion and pity); Nook et al. 2020 (how adults define feeling words); Lieberman et al. 2011 (naming a feeling).
- **Word data:** NRC VAD v2.1 (Mohammad 2025); Warriner, Kuperman, and Brysbaert 2013; Glasgow Norms (Scott et al. 2019); Baron-Cohen et al. 2010; Small World of Words; Google Books Ngram.

Each note follows `docs/reference/README.md` (what it is, author, date, link, terms, what we take from it, what's unverified) and never transcribes a word list. Each goes in that file's table and Credits, and in the root README's Credits.

**The datasets' terms.** None is in the repo. NRC VAD asks for an About-page credit "if you use the lexicon in a product or application". The app doesn't use it: it was one of two cross-checks while choosing words, in local scripts. So it's credited in the README and its note, not on the About page, and its note says why. Small World of Words (CC BY-NC-ND) and NRC (non-commercial research and education) fit because the app stays non-commercial (Lucas, 2026-11-21).

**The About page.** Its credits say the app "builds on feelings wheels by Gloria Willcox, Geoffrey Roberts, and Lindsay Braman". That's no longer true of the feelings wheel's words, and "builds on" overstates what the body wheel takes from Braman's: hers goes from emotions in the center to sensations on the edge, and ours goes the other way. The new wording, approved by Lucas on 2026-11-26:

> The feelings wheel's shape goes back to Gloria Willcox's, and its words come from research into how people group and use feeling words. The body sensations wheel takes the idea of pairing feelings with body sensations from Lindsay Braman's Emotion-Sensation Wheel, and turns it inside out, so you start from what you notice in your body. It draws on research into where people feel emotions and what feelings pull them to do. The interactive wheel was inspired by feelingswheel.com. Its definitions and sensations are written in its own words.

The Roberts note (`core-feelings-wheel.md`) and his Credits entry change to the past tense: the seven-core wheel the first version's words were based on.

**The root README** gets a "Research behind the feelings wheel" section, like the body wheel's, in plain language: how the wheel is built (six cores, tap from the center, what happened to you, words in two places), what the research found (with links to the notes), what isn't research (Bad as a catch-all, Lucas's calls), and how it was decided (Claude researched and drafted; cold agents checked; Lucas made the calls and reviewed every card twice). It ends with the Wheel content issue link, like the body wheel's.

## 6. The record: decisions and close calls

What the wheel rests on, from `learnings.md`, with dates. The spec carries these; the rest of `docs/opinionated-wheel/` stays in git history.

- **2026-11-19:** each word appears once, with repeats only as one of two kinds (revised 2026-11-21). No size limit beyond the layout: the wheel is as comprehensive as is reasonable. Kids' words belong to the [kids' wheels](../../ROADMAP.md#wheels-for-kids).
- **2026-11-20:** commonness decides a swap only between words that mean the same thing, at twice as often. Close calls: Resentful (not Bitter), Amazed (not Astonished), Furious (not Infuriated), Empowered (not Powerful, which joins as its own word), Hopeless (not Despair). Valued and Understood are different, and both stay. At most 3 outer words per middle word.
- **2026-11-21:** the numbered rules are replaced by the loose ones. The cores are settled. Amazed replaces Surprised under Happy. Question 2 is "which core would you tap first?" Humbled leaves ("I feel humbled" usually means honored). The app stays non-commercial.
- **2026-11-22:** Disgusted in two places. Embarrassed, Guilty, and their words move to Bad; Grateful moves to Happy; Insecure moves to Scared → Nervous, and Inadequate becomes Sad's middle word for worth. Betrayed and Empty are in two places; Hatred moves beside Contempt. Let down and Loved leave. Cringe stays, labeled Cringe. Suspicious and Uneasy move to Scared; Cared for to Love → Affection. Jealous stays a middle word with Envious and Possessive, though Lucas "just doesn't think it works very well" and would rather not have both Jealous and Envious: worth revisiting. Usage counts use the median year, since book counts spike in 2019 and 2020. The comb passes settled the rest without asking (Blissful, Stuck, Puzzled, Indifferent, and Frantic leave; Fascinated replaces Intrigued; Disconnected replaces Detached).
- **2026-11-23:** the definition rules are rethought: no template ending, no rule for how a definition starts, the first wheel's definitions reused where they fit.
- **2026-11-25:** Lucas reviewed every card, twice. The definition rules were revised after a cold test against his notes, and 48, then 56, cards were rewritten and cold-checked. Sorry for someone and Compassion both stay: sadness for someone and warmth toward them are different feelings. A plain-language rule joins the definition rules ("I want the wheel accessible"). Love, Affection, Tenderness, and Protective widen to "someone or something".
- **2026-11-26:** the body wheel is repaired; the cores are arranged like a color wheel; both wheels get an order.

**Still open, and why it's fine to ship:**

- **"I feel bad for them."** Nearly half of "feel bad" is guilt or sympathy. Guilty is under Bad, but Sorry for someone is under Sad → Heartache, and nothing under Bad leads there. Bad's card can't point to it without a tacked-on clause. The new order helps a little (Sympathy sits beside Sorry for someone, where Love meets Sad), but someone who taps Bad still has no path. The user's-eyes check is what would show whether people find it; if they don't, putting Sorry for someone in two places is the fix. It moves to the roadmap.
- **Jealous and Envious,** above. It moves to the roadmap.

## 7. Everything else it touches

- **`ACCESSIBILITY.md`:** with 111 outer words instead of 82, cells are smaller. Before anything is opened, the known limitation about outer words under 24 px now applies to the feelings wheel more often; the builder measures and words it. Once the outer ring is opened on a 375 × 667 phone, its cells come out about 38 px tall: still over the 24 px floor the page promises, since fitting the ring on screen wins over the 44 px target, as the known-issues spec decided.
- **The roadmap:** a Shipped row with this spec, its plan, and its changes file if it gets one. The idea's entry and its table row are deleted. Its open items move: "I feel bad for them" and Jealous to a new idea under The wheels' content; the narrower-feelings idea's example (Hesitant under Repelled) is replaced, since that nesting is gone. In Before launching, Lucas's review of the definitions is done; what's left is the "You might notice" phrases, which were cold-reviewed but not by him, so the item narrows to them.
- **Link previews** (`public/og/`) are redrawn once, at the end, since the wheels are done changing (Lucas, 2026-11-26).
- **`docs/opinionated-wheel/`** stays in this change and is deleted in a second, docs-only pull request right after it merges. Pull requests are squash-merged, so deleting it here would leave it on no commit of `main`. The second pull request repoints this spec's links to the folder at the last `main` commit that has it, through `github.com/lpolito/feels-on-wheels/tree/<commit>/docs/opinionated-wheel`. Its content is by then in this spec, `src/data/README.md`, `docs/reference/`, and `scripts/wheel-words/`.
- **Screenshots:** the change touches every screen, but the `screenshots` label is Lucas's call.

## Research behind it

What the research supports, and how solid it is. The notes in `docs/reference/` (§5) hold the details.

| Finding | How solid | What it means for the wheel |
|---|---|---|
| Pleasant or unpleasant is the first split in every sorting study and across languages. | Strong | Each core is all pleasant or all unpleasant. |
| People sort feeling words into the same few families: love, joy, anger, sadness, fear, and a small pleasant surprise group. | Strong in English; the families replicate in Indonesian and Basque | Evidence of which words seem alike. It informs which core someone would tap, but sorting cards isn't the same as looking for your own feeling. |
| Family membership is fuzzy, and categories shade into each other. | Strong | Ask whether a word fits its parent better than anywhere else. Cards can name a second home. |
| Some "feelings" name what happened (being abandoned isn't an emotion; feeling abandoned reports the cause). | Moderate | Words for what happened are a tagged list, on the outer ring, under the feeling they most often bring. |
| Body states aren't feelings, and stress is an umbrella. Boredom is an emotion. | Moderate | Body states belong on the body wheel. Words inside the catch-all are specific. |
| A catch-all core is a design choice; no research list has one. | None | Bad is a door for when you can't tell, as long as what's inside is specific. |
| Shame and guilt are different, and embarrassment is milder. Shame isn't always about hiding. | Moderate | They belong together. Ashamed's card doesn't say shame makes you hide. |
| States of mind (Confused, Curious, Bored) are used as feelings. | Moderate | They stay. |
| Naming a feeling eases it a little; telling hard feelings apart goes with slightly better coping. No study shows feelings wheels help. | Weak to moderate; none for wheels | No rule rests on "more precise words help". The wheel's case is that it helps people find a word. |
| Energy doesn't organize families; a sense of power separates anger from fear. | Contradicted | No energy rule. |
| The old cores came from facial expressions, not from how people sort words about themselves. | Moderate | Not a reason to keep them. |
| Pleasantness lists rate the word, not the feeling (Smug rates unpleasant; Blue rates pleasant because of the color). Book counts skew both ways. | Shown in the data | Both are flags, and a written reason can beat them. |

## Approaches

### The rules

- **Numbered rules with a precedence order and thresholds** (2026-11-19 and 20). Made judgment repeatable, but most of what the cold refuter attacked was exactly those orders and thresholds, and Lucas found them false to how language works.
- **Loose rules: strict facts, flags, questions, reasons** (chosen 2026-11-21). Two writers drafted them apart, and a fresh refuter ran both on the wheel and the datasets and merged them.

Considered and dropped along the way: a strict minimum of 4 middle words per core; matching a word's energy to its parent's; ordering words mild to strong; giving each core its own urge; a fixed size; a wheel shaped differently for each language; flagging the gap between the "feel" and "I was" counts (it flagged 40% of the wheel); "if rest or food would end it, it's a body state" (it would send Burned out to the body wheel).

### How the words were chosen

- **Edit today's wheel.** Rejected: an early brief said "don't be jarring", and that quietly biased the rules and three core picks toward the old wheel. Lucas caught it.
- **Derive a wheel from the rules alone,** by an agent that never saw today's wheel, then comb it (chosen). Two comb passes, a fresh one at Lucas's request, and Lucas's own reviews.

### The body wheel

- **Rebuild it from the new words.** More churn than the words forced.
- **Repair it** (chosen by Lucas): change only what the new words forced.

### Where the reasons live

- **Move `derived-wheel.md`'s reasons into the repo,** cleaned up. A lot of work for notes Lucas doesn't review, citing rules that were replaced.
- **Keep decisions and close calls in this spec, and reasons in each later change** (my call, §2): matches how the body wheel already works.

### The icons

- **Redraw the two SVGs by hand.** Quick, but the next color change means doing it again, angles and all.
- **A script, like the link previews'** (chosen, at Lucas's suggestion): the icons can't drift from the wheel.

## Not in this change

- Translations.
- The user's-eyes check (§2), and any word changes it would bring.
- Narrower feelings on the body wheel's card (its own idea).
- Kids' wheels.

## Left to the builder

- How the Once, What happened, and Definitions tests are written, as long as each failure names the word and the rule.
- The exact wording moved into `src/data/README.md`, keeping the rules' meaning and Lucas's words where they're quoted.
- How `make-icons.mjs` computes the wedges, as long as the app icon keeps its look.
- Which research reports' sources need a note, by the rule in §5.
- The `ACCESSIBILITY.md` measurement and wording (§7).

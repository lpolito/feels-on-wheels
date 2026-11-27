# The wheels' content

The living rules for what the wheels say: their words, the body wheel's areas and sensations, and how feelings and sensations relate. Whoever edits the wheels, a person or an agent, follows these. When a rule changes, change it here in the same change.

The rules came out of specs, which record why they were chosen: the [opinionated feelings wheel](../../docs/superpowers/specs/2026-11-26-feels-on-wheels-opinionated-wheel-design.md), and the [body wheel rework](../../docs/superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-design.md) with its [changes](../../docs/superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-changes.md). Specs are frozen; when a spec and this file disagree, this file wins. Anyone can question a word through a [Wheel content issue](https://github.com/lpolito/feels-on-wheels/issues/new?template=wheel-content.yml).

## Which files these rules cover

- `src/data/wheels/*.json`: the wheels' shapes.
- `src/data/feelings.json`: each feeling's "You might notice".
- In `src/data/locales/en.json`: `feelings`, `sensations`, `sensationPhrases`, `areas`, and `areaWheelLabels`.

## Both wheels

- There are only so many ways to describe a feeling or a body sensation, so overlap with existing wheels and word lists is unavoidable and fine.
- Don't copy any source verbatim, and don't reproduce a source's full layout or word list wholesale.
- Definitions are short, plain-language prose.
- Credit every source we draw on, with a note in [docs/reference/](../../docs/reference/README.md) and in the root README's [Credits](../../README.md#credits), whether or not a license requires it. The app's About page names only the main ones.

## The feelings wheel

### Who it's for

Someone who feels something and wants the word for it. **The north star is how people use the wheel** (Lucas, 2026-11-21): they start at the center, tap the core that matches what they feel, tap a middle word, find their word, and read its card to confirm. Every rule below serves that, and anything decided earlier can be rechecked against it.

The rules are few and loose on purpose. Lucas, 2026-11-21: "It feels silly for some reason to codify this so specific when language really doesn't work in this way." So facts are checked strictly by a script; usage counts are flags, never verdicts; and judgment follows five questions, with no numbered order and no exact thresholds. Why each rule is here, and the research behind it, is in the [opinionated wheel spec](../../docs/superpowers/specs/2026-11-26-feels-on-wheels-opinionated-wheel-design.md).

### Always

- **Each word is on the wheel once, unless people would split.** Two forms of one word (Love and Loved) count as the same word. A repeat is one of two kinds:
  - **One feeling that fits two families.** It goes under the core most people would tap, and its card can name the other. But a card only helps someone who found the word, so when the evidence shows people would split between two cores, the word goes in both, with one definition that fits both. That should be rare: Betrayed (Sad → Hurt and Angry → Resentful) and Empty (Sad → Grief and Bad → Numb).
  - **Two feelings that share a spelling.** Each gets its own id and definition. They keep the same label when each sits under the core its own users would tap, since people see only the core they tapped: Disgusted is physical disgust under Bad and moral disgust under Angry. Otherwise each gets its own label (Cringe, for wincing at an embarrassing moment).
- **Each middle word has 2 or 3 outer words,** and 2 is the default (Lucas, 2026-11-20: going by how the body wheel works, even 3 is pushing it). A third word needs an everyday situation where it's the word you'd reach for and neither its siblings nor its parent fits. If a fourth seems needed, split the middle word or move a word; never break the cap.
- **Moving or removing a word means rechecking every body wheel path that uses it.**
- **Familiarity is never a reason.** Not with today's wheel, and not with other wheels. Some familiarity comes anyway from using the words people use.
- **Every new or changed word says why,** in the change that makes it (its spec or changes file, or its pull request): why it's here and not nearby, the alternatives considered, and a line answering each flag it raised. The [opinionated wheel spec](../../docs/superpowers/specs/2026-11-26-feels-on-wheels-opinionated-wheel-design.md#6-the-record-decisions-and-close-calls) is the record for the words as they first shipped.
- **No size limit** beyond the layout: the wheel is as comprehensive as is reasonable, though a crowded core is slower to scan.

### The questions each word answers

1. **Can you be feeling it right now?** Emotions and states of mind count (Confused, Curious, Bored). A word with a trait meaning and a right-now meaning is judged by the right-now one (Shy, Anxious, Confident). It isn't:
   - the body itself (Tired, Sleepy, Hungry, Sore): those go on the body wheel. The mood a body state brings still counts (Irritable, Burned out);
   - a schedule or workload (Busy, Rushed);
   - a description of a thing ("that's cringe");
   - only a way of treating people (Critical, Judgmental).

   Words for what happened to you, or the situation you're in (Betrayed, Trapped, Safe), are feelings people reach for: they stay, as tagged outer words (below).
2. **If you felt this, which core would you tap first?** People use the wheel from the center out: nobody thinks "I feel repulsed, so I'll look in Angry" (Lucas, 2026-11-21). Evidence for the answer:
   - **what people say they feel at the same time** ([Trampe and others](../../docs/reference/trampe-daily-emotions.md)): if people who feel the word usually also say they feel the core, the core is the door;
   - **what happened,** using the cores' guides below;
   - **the sorting studies** ([Shaver and others](../../docs/reference/shaver-emotion-prototypes.md)), where they cover the word. They show which words people think are alike, which isn't the same as which door they'd tap, so they inform the answer rather than decide it;
   - **word associations** can flag a word that seems out of place, but other meanings skew them (mad also means crazy).
3. **If you felt this, which middle word would you tap?** The same test, one ring further in. People who feel the word usually also say they feel its parent, and the word reads as the parent plus something specific: a cause, a target, or a strength. Words for what happened to you follow this like any other word, not the feeling they're assumed to cause: someone who feels betrayed might tap Angry as easily as Sad.
4. **Is each word a real choice?** Siblings pass "I feel A but not B" both ways (Curious and Inquisitive fail). Siblings can be different strengths of their parent (Annoyed and Furious under Angry), but a stronger word that keeps one sibling's cause or target is that sibling's strong form, so it goes under that sibling or leaves (Lucas, 2026-11-20: Lust beside Desire was this trap). For a parent and its word, only one direction has to hold: you can feel scared without feeling terrified. And siblings are told apart by their labels alone, since people choose from labels and read the card only after the tap: two siblings whose labels look like the same thing at a glance (Puzzled beside Confused) fail, even if their definitions differ.
5. **After "I feel", does it name your own feeling, in everyday words?** Its usual meaning after "I feel" is the feeling (Down passes; Sensitive and Free don't), and it's something people say about themselves, not mostly about others (Persecuted). Everyday words beat medical ones (Down, not Depressed). Heavy words people really say stay (Hopeless, Worthless). Slang is in when people say it about themselves, which book counts barely see (Lucas, 2026-11-20: Cringe joined this way).

### Cores

A core is one of the families people sort feelings into (love, joy, anger, sadness, fear) or the one catch-all door. Each is all pleasant or all unpleasant. A core with fewer than 4 middle words needs a line saying why. Its label is a word young children know: prefer one that at least 75% of 4- to 6-year-olds knew ([Baron-Cohen and others](../../docs/reference/baron-cohen-emotion-vocabulary.md)), and let usage counts only break ties.

The catch-all, Bad, is a door for when you can't tell what you feel, and its words are specific feelings, not all from one other family. Nearly half of "feel bad" is "feel bad about" (guilt) or "feel bad for" (sympathy), so Guilty sits inside Bad, and "I feel bad for them" is Sorry for someone, under Sad.

Each core answers a question about what happened. These guide where a word goes, adapted from appraisal theory ([Lazarus](../../docs/reference/lazarus-appraisal.md)); they aren't evidence, and they aren't how people choose, since people tap by what they feel, not by what caused it.

| Core | What happened |
|---|---|
| Happy | Something good happened, things are going well, or something draws your interest. |
| Love | You want closeness or affection, or you're sharing it. |
| Angry | You or yours were wronged or blocked, or something wrong should go away. |
| Sad | You lost something or someone, fell short, did wrong, or were left out. |
| Scared | Something might hurt you, or something sudden just jolted you. |
| Bad | It's unpleasant, but it isn't loss, danger, or unfairness: too much, unsettled, out of sorts. |

### Words for what happened to you

Words like Betrayed, Abandoned, Cheated, Trapped, and Safe name what happened to you, or the situation you're in, more than a feeling. People reach for them anyway, so they stay ([Ortony, Clore and Foss](../../docs/reference/ortony-clore-foss-affective-lexicon.md)), as a tagged list: `"whatHappened": true` in `feelings.json`. Each goes on the outer ring, under the core and middle word people who feel it would tap (questions 2 and 3), and its card still reads as something you feel (Definitions). Hurt, Lonely, Threatened, and Guilty are feelings, not tagged. Intent sorts some of them (Lucas, 2026-11-20): shut out on purpose is Rejected, which hurts; left out, maybe by accident, is Left out, which is lonely. The labels carry that, and the cards leave the intent out.

### Mixed feelings

A word with a pleasant and an unpleasant side (Nostalgic, Awe) goes on the side most people feel more strongly, and its card names the other side.

### Order

Words that sit side by side are related, so a near miss lands next to the word you meant (Lucas, 2026-11-26: "at least some semblance of conscious thought about order instead of it being random"). It works the same at every level:

- The cores are arranged like a color wheel, with opposites facing each other: Happy, Angry, Love, Sad, Bad, Scared, clockwise from the start (Happy and Sad, Love and Scared, Angry and Bad).
- Within a core, similar middle words sit together.
- Where two cores meet, the words on each side lean toward each other, since that's where people waver between cores: Shocked beside Amazed, Confident beside Offended, Jealous beside Attracted, Compassion beside Heartache, Ashamed beside Guilty, Overwhelmed beside Anxious.
- The outer ring reads as one chain, across middle words too: Stunned beside Awe, Sympathy beside Sorry for someone, Pressured beside Worried.

Not alphabetical: alphabetical order helps only when you know the exact word you want, and here people are looking for one they don't know yet. It would also differ in every language. Not mild to strong either.

### Definitions

Every word's card has a short definition that describes the feeling itself, so someone can hold it up against what they feel. There's no rule for how a definition starts or what order it goes in (Lucas, 2026-11-23: definitions written to one pattern read as contrived), and no length rule, since one invites padding.

- **Describe the feeling:** how it feels or how strong it is. If it helps, add what usually causes it, what it's like, or what it makes you want to do. *Numb: Feeling very little, as if your emotions have been switched off.*
- **Say what sets it apart from the words near it:** its siblings, its parent, and other words in the core someone might mix it up with. Read the definition under each of their labels: if it fits one as well, it needs more. *"Hurt by how someone treated you" fits Betrayed, Rejected, and Unappreciated alike.* Set it apart by how the feeling differs, not by a clause whose only job is to rule a neighbor out, and leave out the other person's intent unless the word means it. What the whole core shares doesn't set a word apart.
- **Only say what's true for most people who feel it, and don't leave out what most people mean by it.** Think of the usual situations and targets people use the word for: the card shouldn't rule one out, unless the word's place on the wheel narrows it on purpose (a word in two places). Don't tell one person's story. *Pressured: Pushed by demands or expectations from others or yourself*, not "Others push you harder than you can go".
- **Match the word's strength and stage.** Describe the feeling once it's there, not on the way to it, and no milder or stronger than people mean it. When a word is mostly a stronger form of its parent, say what that strength does to you. A core's card covers everything under it, mild to strong.
- **Read it after "I feel".** The card fits how the label is used (an adjective label reads as an adjective, a noun label as a noun). Avoid words with a second everyday meaning or a euphemism. Don't lean on a near-synonym that names a different feeling. Keep it to the feeling: don't tack on clauses to cover more cases.
- **Write it so anyone gets it on the first read,** including someone learning English, someone who reads words literally, and someone too upset to puzzle over a sentence (Lucas, 2026-11-25: "I want the wheel accessible").
  - **Common words.** *Longing*, not *wistful*.
  - **No idioms whose meaning you can't work out from their words** (*pushing your buttons*, *out of sorts*, *ill at ease*). A comparison that says how the feeling feels is fine, as on the body wheel (Idioms, below): *heavy*, *hollow*, *stung*, *as if your emotions have been switched off*.
  - **One sentence, with no colons or semicolons.** When a second half could attach to the wrong word, repeat the small word that starts it (*about*, *that*, *whether*) or add a comma. Keep the parts of a list the same kind (*a wish to undo it*, not *wishing you could undo it* after a noun).
  - **Present tense** for the feeling, and contractions, as the other cards use.
- **Don't define a word by itself or by a sibling's label.** "Annoyed: Feeling annoyed" says nothing. Spelling out a word's parts is fine (a word like *Energetic* could say *full of energy*), and so are the parent and feelings from elsewhere on the wheel (*Remorse: Deep guilt over harm you caused, and a wish to undo it.*). The data tests check labels.
- **A word for what happened to you still reads as something you feel.** Name the feeling when one is usual. *Rejected: Hurt at being pushed away or not wanted by someone. Cheated: Angry that someone tricked you or didn't play fair.*
- **A word in two places gets two definitions when it means something different in each** (Disgusted), **and one when it's the same feeling in both** (Betrayed, Empty), which fits both places.
- **A feeling you have now, not a trait or a diagnosis.** *Irritable* is being easily annoyed right now, not a kind of person. When lasting is part of the meaning, say so (Resentful, Burned out).

### Checks

A failure blocks the change until it's fixed. Checks that need only the wheel files run in CI with the data tests (`tests/unit/data.test.ts`). Checks that need word datasets run locally, from the [feels-on-wheels-data](https://github.com/lpolito/feels-on-wheels-data) repo, since the datasets can't be committed here; run them whenever words are added, moved, or renamed.

| Check | Runs | What it checks | When a word fails |
|---|---|---|---|
| Once | CI | No two positions share a label, comparing base forms (Love and Loved), except a word in two places under different cores. | Rename one meaning, or remove one. |
| Layout | CI | Every middle word has 2 or 3 outer words. | Add, remove, split, or move. |
| What happened | CI | Every word tagged as what happened to you is on the outer ring. | Move it out. |
| Definitions | CI | No card uses its own label or a sibling's label, comparing base forms. A label inside a longer word is fine ("betrayal" on a card beside Betrayed). | Reword it. |
| Body wheel | CI | The body wheel's checks (below), including that no two feelings under a sensation come from the same line. | Pick the nearest feeling by question 2. |
| Pleasantness | Local | No word under a core is on the other side from it: a word fails when every list that scores it puts it there. | Move it to the family on its side that question 2 picks, or record why the lists misread it. |
| Translations | When a language comes | No two positions in one language share a translation, comparing base and gendered forms. | Another word or a short qualifier, or record a known limit. |

**Flags, never verdicts** (local). A flag means someone looks, then changes the word or writes one line of reason in the change:

- **pleasantness:** unscored in both lists ([NRC VAD](../../docs/reference/nrc-vad-lexicon.md) and [Warriner and others](../../docs/reference/warriner-affective-norms.md)), the lists disagree, or near neutral. The lists rate the word, not the feeling (Smug rates unpleasant though smugness feels good), so a written reason can beat them;
- **rare:** both usage counts ("feel / feeling / felt ___" and "I was ___", from [Google Books](../../docs/reference/google-books-ngram.md)) under 15 per billion. Books undercount words people say aloud, especially slang;
- **a more common synonym:** a word with the same meaning used at least twice as often. Commonness only decides between words that mean the same thing; it never removes a word that names something no other word does (Lucas, 2026-11-20: Understood stayed beside Valued);
- **core labels:** the share of young children who knew each label.

### Every language uses the English wheel's shape

Each position gets that language's most natural word or phrase for the position's meaning (*tengo miedo* is fine). Never re-sort a language, even where its own sorting differs. If two positions collide, use another word or a short qualifier; if that fails, record it as a known limit. A shape for each language is possible long term, given AI reliable enough at it, or a fluent speaker willing to scrutinize every word (Lucas, 2026-11-19).

## The body wheel

### Who it's for

Someone asking "I have this sensation, or this urge: what could it be?" Use the plain words people say about their own body, and back each word with more than one person's experience.

### Areas

- An area is a place you could point to, in a body scan's order, head to toe: Head / face, Throat / mouth, Shoulders, Hands, Chest, Stomach, then Whole body. **Urges** comes last: the one area that isn't a place.
- An area's label is one word, or "A / B" for two neighboring places you'd point at together ("Head / face"). Not a place with a process ("Breath / throat").
- **Whole body** holds what you feel all over or can't place, and the parts of a body scan with no area of their own, such as the legs (weak knees) and the skin (chills). Every part of a body scan (head, face, throat, shoulders, chest, stomach, arms and hands, legs and feet, skin) is either an area or has its sensations under Whole body.
- An area can be named differently on the drawn wheel only (`areaWheelLabels`). Urges is "The urge to…" on the wheel, so the ring reads "The urge to… run". Everywhere else, including breadcrumbs, cards, titles, link previews, and the screen reader's tree, it's "Urges".

### What counts as a sensation

**You'd notice it with your eyes closed and nobody watching.** That's what research calls [interoception](../../docs/reference/craig-interoception.md), sensing your body from inside, plus proprioception, sensing how your body is held.

- What others see (smiling, raised eyebrows, a scrunched-up face) isn't a sensation; use the felt version or leave it out.
- What you're pulled to do (turning away, shrinking) goes under Urges.
- A thought, such as your mind going blank, isn't a sensation.

### Urges

- Urges hold what you feel pulled to do. In the end, every urge is a pull to get away from something, whether or not you realize it: a threat, a person, a mistake, or the feeling itself ([experiential avoidance](../../docs/reference/hayes-experiential-avoidance.md)). The area is there to help people catch those moments ([urge surfing](../../docs/reference/marlatt-urge-surfing.md)).
- Each core feeling's typical urges are on the wheel, checked against [Frijda's](../../docs/reference/frijda-action-tendencies.md) and [DBT's](../../docs/reference/linehan-dbt-model-of-emotions.md) pairings of emotions with urges. Two are left out on purpose, both Happy's: the urge to laugh, and the urge to look closer that comes with interest and amazement.
- Urges are bare verbs on the wheel ("Hide", "Fix things"), since the area gives the context. Avoid labels that read as a noun ("Control things", not "Control").

### Labels: two strings per sensation

Every sensation has one id and two strings, one for each place it appears:

- **`sensations`:** the wheel's label. Short, and readable with its area: "Racing heart", "Queasy", "Hide". "A / B" works for two ways people describe the same sensation ("Numb / empty").
- **`sensationPhrases`:** how a feeling's card lists it after "You might notice": "A racing heart", "Feeling queasy", "Wanting to hide". The loader refuses any sensation a card lists without one.

Don't reuse one string where the grammar differs; give each context its own.

**Idioms** are fine when they name something you actually feel: butterflies, a lump in your throat, your heart in your throat, a weight on your shoulders. Idioms like these tend to grow out of what the body really does ([Kövecses](../../docs/reference/kovecses-emotion-metaphors.md)). An idiom that only stands for a feeling doesn't come in: "cold feet" means hesitating, not cold feet.

### Feelings under a sensation

- **2 or 3 per sensation, each a word on the feelings wheel,** from whichever ring fits best: usually the middle ring, an outer word where it's more exact, a core word where it really is the best fit.
- **Every common path is on the wheel.** If a sensation commonly comes with a feeling, the wheel offers that path, so it can be found and followed. Feelings repeating across sensations is fine. Don't make room by cutting a path because its feeling appears elsewhere.
- **Offer the other reading where a sensation honestly splits.** The same body signal reads as different feelings in different contexts (a racing heart can be scared or excited).
- **Pleasant feelings (under Happy or Love) come in only as the other reading of a sensation,** where the same signal could be a hard feeling. People rarely need help knowing they feel good, so a sensation whose only reading is pleasant doesn't earn a place on the wheel. It can still appear on cards (Feeling light, Feeling relaxed, Feeling tall, Warmth or fullness in your chest).
- **Obvious paths stay.** People follow the obvious ones first, and what's useful is often the less obvious feelings at their end, so an obvious urge or sensation can leave out its most obvious feeling (Cry leaves out Sad).
- **Feelings under one sensation must be different enough that someone would choose between them.** So no two come from the same line on the feelings wheel: a word with its parent, child, or grandparent (Overwhelmed and Pressured, Scared and Startled). A core word counts, so a core fits where a sensation splits across families (a racing heart: Scared, Angry, Excited), and a word that's on the feelings wheel twice is in both its lines. Feelings that all come from one core feeling are fine when each is a real choice (your heart in your throat: Terrified, Nervous, Startled).
- **Two sensations in one area must feel different, or lead to different feelings.** If they don't, merge them (Want to get even became part of Lash out).
- **When room is short,** the unpleasant and hard-to-tell feelings come first.

### Every word says what backs it

Each sensation and urge rests on a source with a note in [docs/reference/](../../docs/reference/README.md), on physiology (what the body measurably does), on an idiom that names something people actually feel, or on someone's own experience. Experience and common speech are fine, but say so. The current record of what backs each word is the rework spec's §3 **Backed by** column, with the changes file for words added or changed since.

### Ids

An id follows the wheel's label (`hollow-chest`, `hide`). A sensation that stays the same with only a shorter label keeps its old id (`warm-chest` for "Warm / full chest"). A renamed or merged sensation gets an id from its new label. Old addresses aren't forwarded.

### "You might notice"

- Each feeling lists 2 to 4 sensations (`feelings.json`), shown with their `sensationPhrases`.
- They're drafted to agree with the body wheel: where the wheel offers a sensation for a feeling, the feeling's card lists it, unless the cap of 4 forces a choice. Nothing enforces it, and cards may list sensations that aren't on the wheel.

## How to check a change

- Every feeling on the body wheel is a word on the feelings wheel, and each sensation has 2 or 3 feelings. The data tests check both.
- Each core feeling stays reachable from at least 2 areas, and the hard-to-tell ones from several. The pleasant ones, Happy and Love, have the fewest on purpose.
- Every new or changed word says what backs it.
- `docs/content-review.md` is rebuilt to match, with `node scripts/make-content-review.mjs`: each feeling's card and the Body wheel section.
- The data tests pass (`npx vitest run tests/unit/data.test.ts`), and when feelings wheel words are added, moved, or renamed, so does `check.py` in the [feels-on-wheels-data](https://github.com/lpolito/feels-on-wheels-data) repo, with every flag answered.

People catch what scripts can't:

- **Fix the cards a reader flags, rather than rewriting the wheel.** A cold rewrite of the whole wheel made 20 of 50 cards nobody had flagged worse.
- **Have a change read cold** by someone who didn't write it: a person, or an agent that hasn't seen the reasoning behind it.
- **After a large change, check the wheel through a user's eyes:** one agent that never sees the wheel writes everyday situations, and a second agent, which didn't write them, walks each one through the wheel by labels alone (core, middle word, outer word, then the card). Don't use situations written to justify a word.

For reference, not a rule on what's on the wheel: it's worth listing the feelings wheel's middle-ring words that have no path on the body wheel, and asking whether a common sensation leads to any of them.

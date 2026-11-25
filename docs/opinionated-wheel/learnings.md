# What we learned about choosing the wheel's words

From the brainstorm of 2026-11-19 and 2026-11-20. Choosing feeling words well turned out to be hard, and most of what's below was learned by getting it wrong first. Read this before working on [rules.md](rules.md) or [derived-wheel.md](derived-wheel.md).

## How Lucas wants to work

- **Research decides; Lucas decides taste.** Settle everything the rules and evidence can settle yourself: where a word goes, whether two words differ, how they nest. Ask Lucas only real taste calls, such as two words about equally common for the same spot. He said: "I want you to actually research where it should go instead of asking me."
- **"I'd like input" means he wants to weigh in,** not hear your picks. On 2026-11-20 he asked for input on the close calls and got recommendations for all 24 words instead.
- **Every question carries its context:**
  - the spot (core → middle word);
  - the words beside it and under it;
  - each option's definition;
  - each option's uses as a feeling, per billion.

  A bare "A or B?" can't be answered: whether Bitter or Resentful is the better word depends on what goes under it.
- **Push back on his rules.** "I don't want to dictate how the research and words work. You're the LLM." When a rule he proposes would misfire, say so and show the case. Both of the tests he added on 2026-11-20 were narrowed this way.
- **A question isn't pushback.** "If I have a question above, it doesn't mean I'm pushing back on the rule. It means it's a question." Answer it; don't treat it as a reason to change the rule.
- **Plain English.** He asked for the rules to be restated plainly once he couldn't follow them. Lead with the rule, give an example, and leave out jargon (no "valence"; say pleasant or unpleasant).
- **Consistency with today's wheel isn't a goal,** and neither is matching other wheels (rule 0). Some familiarity is nice, and it comes from rule 10's everyday words. Don't weigh new colors, link previews, URLs, or old links breaking when deciding words or cores.

## How to do it well

- **Separate the writer from the checkers, and keep the checkers cold.** What worked:
  1. One agent drafts.
  2. Fresh agents that haven't seen the draft's reasoning check each research claim against primary sources, and attack each rule against real words.
  3. A second writer drafts independently from the same evidence; where the two drafts disagree is where to look.
  4. A fresh refuter rules on every disagreement and re-runs the data checks.
- **To avoid anchoring, hide what shouldn't steer.** The wheel derived from the rules was built by an agent that never saw today's wheel. The first brief told every agent "not a complete rewrite; don't be jarring", and that quietly biased rule 0 and three core picks toward keeping today's wheel. Lucas caught it.
- **Don't make judgment mechanical.** The numbered rules grew precedence orders, thresholds, and absolute tests to make judgment repeatable, and those were most of what the refuter attacked. Lucas replaced them with questions and a written reason per word (2026-11-21). Keep strictness for facts a script can check.
- **Counts flood when the frame doesn't fit the word.** A flag for the gap between "feel ___" and "I was ___" tripped 40% of the wheel, because nouns have no "I was" form. Run a flag on the real wheel before adopting it.
- **Judge placement from the user's direction.** People start at the center and tap a core. Card-sorting groups words that seem alike, bottom-up, which isn't the same question; disgust under anger came from treating one as the other, and Lucas caught it (2026-11-21).
- **Test a rule on real words before adopting it.** Several rules looked right and misfired on the first example:
  - "I'm ___ means the same as I feel ___" would have demoted Hurt and Guilty.
  - "No sibling is stronger than another" would have split Annoyed from Furious.
  - "The parent has no flavor of its own" would have failed every parent.
- **A checker can misreport its sources too.** The builder said surprise "merges with fear in Basque"; the paper found a small, distinct, pleasant surprise group. Have important claims checked twice, by different agents.
- **Coverage must be checked against situations written apart from the wheel.** The first coverage test listed one situation per wheel word, written from the wheel, so it could never find a gap. The fix was a checker writing 40 situations of its own before looking. It found Burned out, Vindicated, Humbled, and Flattered missing.

## Traps in choosing words

- **The stronger-sibling trap.** Lust ("strong physical desire") sat beside Desire. If a word is a stronger form of one particular sibling, it goes under that sibling or leaves. Siblings may differ in strength only when each is a different strength of their parent (Annoyed and Furious under Angry). Check definitions too: none should lean on a sibling's word.
- **The parent's meaning has to hold for every child.** Bitter means a souring that lingers, which isn't true of Cheated or Used, so Resentful heads them. Applied honestly, the same test questions Hatred under Resentful: hate is about who someone is, not unfair treatment.
- **Commonness only chooses between words that mean the same thing.** The rebalancer dropped Understood for being used less than Valued, though they mean different things. Lucas: "I don't think valued and understood mean the same thing at all."
- **A definition rule can become a template.** Requiring the parent's feeling in every definition gave 71 of 162 the same ending, and they read as contrived. Telling writers to vary how definitions start was too leading as well (Lucas, 2026-11-23). A feeling-first rule was proposed from a count (none of the first wheel's 126 definitions opens with what happened) and dropped: the research leans the other way (adults define feeling words by their typical causes, Nook et al. 2020), and the real failure, one person's story told as everyone's, has its own rule.
- **Rules applied cold catch only part of what a reader sees, and a full rewrite breaks good cards.** Tested on 2026-11-25 against Lucas's review notes: a writer with five specific rules caught 22 of his notes but missed 10 its own rules covered, and 20 of its 50 other rewrites were worse than the cards they replaced; a writer with one broad line ("would someone who feels it say 'yes, that's it'?") caught 5. A test that crosses out the parent's label and checks what's left caused a third of the false flags and pushed rewrites toward one opening (a vivid verb, then the cause). So fix the cards a reader flags, under the rules, rather than rewriting the wheel.
- **Words that name what happened to you** (Betrayed, Rejected) belong on the outer ring, and each definition still reads as something you feel (2026-11-23; before that, each ended with the feeling it causes). Intent matters: being shut out on purpose is Rejected (hurt); being left out, maybe by accident, is Left out (lonely).
- **Near-synonyms aren't always synonyms.** Powerful (strong, in charge) isn't Empowered (able to act); Lucas caught it. Before choosing one word of a pair by commonness, check that they mean the same thing.
- **The layout allows at most 3 outer words per middle word,** and Lucas says even 3 is pushing it, so prefer 2. An earlier brief lifted the cap without asking; it was wrong.

## Traps in the data

- **Subtitle word counts are the research standard,** but they count every meaning of a word (Mad wins over Angry because it also means crazy), and the counts on hand miss most -ed words. The better measure for this job is Google Books phrase counts for "feel ___", "feeling ___", and "felt ___", which count a word only when it's used about a feeling.
- **Newer counts don't exist.** The main project tracking how people write online ([wordfreq](https://github.com/rspeer/wordfreq/blob/master/SUNSET.md)) stopped in 2024, because AI-generated text has polluted web text since 2021.
- **Book counts spike in 2019 and 2020.** Some phrases are 50 to 100 times higher those years. Use the median year, and look at the years before trusting a surprising count.
- **Missing data passes silently unless you stop it.** The first pleasantness check flagged a word only when both datasets disagreed with its core, so words only one dataset had (Shocked, Dismayed) slipped through. Also check hyphen and space spellings: Self-conscious looked unscored because NRC spells it "self conscious".
- **Energy ratings are noise for nesting.** The two datasets disagree on how energized a word is, and 47 of 110 parent-child pairs differ widely. Only pleasantness is usable.
- **Books undercount words people say aloud,** especially with "I'm" (I'm amazed, I'm fed up) and new slang (Cringe barely registers). Treat a low count as a flag, not a verdict.

## Lucas's decisions

| Date | Decision |
|---|---|
| 2026-11-19 | Rules settled ([rules.md](rules.md)). Rule 0 is "build from the rules, not from today's wheel". |
| 2026-11-19 | Every language uses the English wheel's shape and translates its words (rule 14). Per-language wheels are possible long term, given AI reliable enough at it, or a fluent speaker who scrutinizes every word the way he does. |
| 2026-11-19 | No size limit beyond the layout; the wheel is as comprehensive as is reasonable. No kids' rule in these rules: that's for the [kids' wheels](../ROADMAP.md#wheels-for-kids). |
| 2026-11-19 | Each word appears once (rule 9). A repeat is either one feeling fitting two families (it goes where most people look; the card names the other) or two feelings sharing a spelling (each gets its own label). |
| 2026-11-20 | The cores: he accepted a pleasant-surprise Surprised and the set of seven picks before the re-derivation, but hasn't yet ruled on the derived wheel's six cores (Happy, Love, Sad, Scared, Angry, Bad). |
| 2026-11-20 | Commonness decides a swap when one word is used at least twice as often as a feeling. |
| 2026-11-20 | Close calls: Resentful (not Bitter), Amazed (not Astonished), Furious (not Infuriated), Empowered (not Powerful, which joins as its own word), Hopeless (not Despair). |
| 2026-11-20 | Cringe joins under Embarrassed, for cringing at what someone else did. |
| 2026-11-20 | At most 3 outer words per middle word. |
| 2026-11-20 | Valued and Understood are different; Understood stays. |
| 2026-11-21 | The numbered rules are replaced, not patched ([rules.md](rules.md)): "It feels silly for some reason to codify this so specific when language really doesn't work in this way." Facts are strict script checks; usage counts are flags, never verdicts ("only loosely trustworthy, but still something to consider"); judgment is five questions with no numbered order or exact thresholds; every word's written reason is the record. Checked by two independent drafts and a refuter ([research/7](research/7-looser-rules-refuted.md)). |
| 2026-11-21 | The cores are settled: Happy, Love, Sad, Scared, Angry, and Bad. Surprised is a middle word under Happy and Disgusted under Angry (the sorting studies); Scared, not Fearful or Afraid, because children know it best and Afraid's extra uses are hedging ("afraid that"). Bad keeps its name over Off: it's what people say when they can't tell, and its card points to Guilty and Sorry for someone for "feel bad about". |
| 2026-11-21 | Surprised gives way to Amazed as Happy's middle word for good surprises, with Awe and Impressed under it; plain "surprised" is both pleasant and unpleasant, like Stressed an umbrella, and bad surprises are Shocked (Scared). Humbled leaves: "I feel humbled" usually means honored. The app stays non-commercial. |
| 2026-11-21 | Question 2 is "If you felt this, which core would you tap first?" People use the wheel from the center out: "No one is going to say 'I feel repelled, therefore I will look into anger.'" The sorting studies show which words seem alike; they inform the answer, not decide it. |
| 2026-11-21 | The north star is how people use the wheel, and anything decided earlier can be scrutinized against it. Applied to the rules: question 3 is "which middle word would you tap?"; words for what happened follow the same test; siblings must be told apart by label alone; the situations check includes the path; a word may appear under two cores when the evidence shows people would split (replacing "keep it once" from 2026-11-19); the cores' what-happened questions are for placing words, not how people choose. No limit on middle words per core, for now. |
| 2026-11-22 | Physical disgust isn't anger ([research/9](research/9-disgust.md)). Disgusted is on the wheel twice, "until something pushes against it": physical disgust under Bad (Repulsed, Squeamish) and moral disgust under Angry (Appalled, Contempt), each with its own definition. Disgusted over Disgust: 251 against 47 per billion, and its siblings are adjectives. |
| 2026-11-22 | Embarrassed (with Foolish, Mortified, and Cringe) moves from Sad to Bad: in daily reports it comes with guilt and fear, almost never sadness; raters offered no catch-all picked Scared; and it's unpleasant without being loss, danger, or unfairness, beside Uncomfortable and its Awkward ([research/10](research/10-which-core-people-tap.md)). |
| 2026-11-22 | Betrayed is under both Sad → Hurt and Angry → Resentful, with one definition ending "hurt, angry, or both": raters split 54% Angry, 32% Sad. Hatred moves from Resentful to the moral Disgusted, beside Contempt, since hate sits closer to disgust and contempt. |
| 2026-11-22 | Grateful (with Honored and Cared for) moves from Love to Happy by question 2: people feeling grateful would tap Happy (daily reports: joy .15, love .03). The 2026-11-20 reason, Algoe's "find, remind, and bind", is what gratitude does, not where people look. |
| 2026-11-22 | Guilty (with Remorse and Apologetic) moves from Sad to Bad: people say guilt as "I feel bad about it", so Bad is their door; raters offered no catch-all split about evenly between Scared and Sad. |
| 2026-11-22 | Insecure moves to Scared → Nervous: people link it to fear words about 5 times as strongly as to sad ones. Its outer words don't follow, since they're about worth and link to "not enough", not fear: Inadequate becomes Sad's middle word for worth, with Inferior and Insignificant. |
| 2026-11-22 | Let down leaves Disappointed. Lucas asked whether they're the same thing: not quite (what lets you down is someone you relied on), but close enough that someone let down is served by Disappointed, and Betrayed covers the stronger case. Discouraged, Regret, and Disillusioned stay. Loved left too, as the same word as Love. |
| 2026-11-22 | Scope: translations are out of this work entirely. The body wheel comes only after the words are settled, probably as a job for another agent. |
| 2026-11-22 | Settled by the comb pass ([research/8](research/8-comb-pass.md)) and the which-core test, without asking: Blissful, Stuck, Puzzled, Indifferent, and Frantic leave; Petrified joins Terrified; Horrified moves to Terrified, Violated to Furious, and Uneasy to Bad → Uncomfortable; Safe and Trapped are tagged as situations, Threatened isn't; definitions now end with their parent's feeling and don't lean on a sibling's or another family's word. |
| 2026-11-22 | A fresh comb pass over the current wheel, at Lucas's request ([research/11](research/11-fresh-comb-pass.md)). Settled from it, without asking: Fascinated replaces Intrigued (Curious's strong form); Disconnected replaces Detached (the same feeling, 2.3 times as common); Blessed moves to Grateful; definitions that leaned on another word were rewritten; situations that wouldn't reach their word were remapped. Insulted stays under Offended: raters put insulted 61% Angry, 27% Sad, and in daily reports offense comes with anger (.20) more than sadness (.10). |
| 2026-11-22 | Usage counts use the median year: Google Books spikes in 2019 and 2020 for many phrases ("feel heartache" 1.3, 62, 189, 2.5, 1.6 per billion), so means hid rare words, and "feel wronged" looked common only because of the spike. |
| 2026-11-22 | Heartbroken stays under Grief and Sorry for someone under Heartache, though the Heartache label may draw some heartbroken people. |
| 2026-11-22 | Suspicious moves from Angry → Jealous to Scared → Anxious: "suspicious doesn't belong under jealous period." |
| 2026-11-22 | Jealous stays a middle word, with Envious and Possessive, the two everyday kinds of jealousy. Lucas: "I just don't think it works very well." He'd rather not have both Jealous and Envious, but Jealous has nowhere to sit as an outer word except a stretched Resentful. Worth revisiting. |
| 2026-11-22 | Uneasy moves to Scared → Nervous, replacing Apprehensive (Dread covers it): raters put uneasy 76% Scared. |
| 2026-11-22 | Empty is under both Bad → Numb and Sad → Grief: raters put it 69% Sad, but it's also Numb's hollow kind of feeling. |
| 2026-11-22 | Cared for moves from Happy → Grateful to Love → Affection: with Loved gone, it's Love's word for being loved. |
| 2026-11-22 | Moved stays under Compassion, narrowed to suffering or courage; being moved by kindness or a gift maps to Connected and Grateful. |
| 2026-11-22 | Powerful stays under Confident, with its own situation. Settled without asking: Insecure stays under Scared only, since someone who taps Sad finds Inadequate, which covers the worth side, and associations favor Scared 5 to 1; Bittersweet stays off, since people say "it's bittersweet" about a moment (a description of a thing, question 1), and "I feel bittersweet" is rare (7 per billion). |
| 2026-11-22 | Settled without asking: every definition is a sentence to "you" (61 rewritten, then cold-checked for borrowed labels and siblings that read alike); `check.py` follows the rules' flags, with synonym candidates from associations only when the link runs both ways and both words are on the same side ([rules.md](rules.md)). |
| 2026-11-22 | Cringe stays, labeled Cringe: people say it about themselves, mostly as "I cringed" and "makes me cringe" ([research/12](research/12-cringe.md)). Its definition covers both other people's embarrassing moments and your own past ones, as people use the word; Embarrassed widens to "something silly happened in front of others" to hold it. |
| 2026-11-23 | Definitions are rethought ([rules.md](rules.md), Definitions). The 2026-11-22 rewrite made 71 of 162 end ", and you feel [parent]", and Lucas found them contrived; he liked the first wheel's definitions, so those are reused where they still fit. No rule says how a definition starts or in what order (Lucas: even suggesting starts is too leading). A word for what happened to you still reads as something felt, but needn't name one feeling. A word in two places gets two definitions when it means two things (Disgusted, Empty) and one when it's the same feeling (Betrayed). Lucas didn't remember the earlier "same definition" wording; it came in with the which-core change. Two cold checks shaped the rest: a refuter tested the draft on both wheels' definitions, and a writer drafted rules without seeing it. |
| 2026-11-25 | Definition rules revised after Lucas's review of every card ([rules.md](rules.md), Definitions). His notes fell into a few patterns: the reason for a word's spot written onto the card ("on purpose", "maybe by accident"), a word fenced to one cause or target, a strength or stage that's off ("close to giving up" for Discouraged), cards that lean on the parent or a near-synonym, words in one core that read alike, and cards that don't read naturally after "I feel". Two blind writers and a judge tested two wordings (see the cold-check learning above); the judge's combination replaces the siblings and most-people rules and adds two. Settled by research when Lucas asked: Sorry for someone and Compassion both stay, since sadness for someone and warmth toward them are different feelings. Pity rates unpleasant (NRC −.68) and links most to sad (.110); compassion rates pleasant (+.47) and links most to love (.157); sorters put compassion with love and pity with sadness, and the feelings load on different factors ([Goetz et al. 2010](../reference/goetz-compassion.md)). Compassion under Sad with a second definition would need people to use "compassion" for the sad feeling, and they say "sorry for" (2,897 per billion against 140). Settled by the rules, as Lucas asked: Cringe keeps both uses, reworded so it doesn't list whose moment it is ("wincing at an embarrassing moment, whether you're watching it or remembering it"), and Empty gets one definition in both places, since it's one feeling people split on. Lucas agreed: "intent matters" still sorts Rejected and Left out, but their cards drop "on purpose" and "maybe by accident", since the labels carry it; Jealous's card covers both everyday meanings plainly ("angry that someone has what you want, or could take someone you have"). Still open: whether Possessive is the right second word under Jealous. |
| 2026-11-21 | Wheel-file checks run in CI with the data tests; the pleasantness check and the flags run in the local scripts, since the datasets can't be committed. Core words may be on the body wheel where they're the best fit, as `src/data/README.md` already allows. |

Placements settled by research on 2026-11-20 are in [derived-wheel.md](derived-wheel.md), each with its reason and source:

- Powerful under Confident.
- Excluded out (it repeats Rejected).
- Desire and Aroused under Attracted; Lust out.
- Grateful under Love (Algoe 2012).
- Hatred under Resentful (questioned since).
- Joining: Violated under Offended (Rozin et al. 1999), Accepted, Insignificant, Provoked, and Disillusioned.
- Out: Weak, Skeptical, and Dismayed.

## Data

None of these datasets is in the repo. Their licenses limit redistribution, and NRC's says outright not to redistribute. Download them into one folder and set `WHEEL_DATA` for [scripts/](scripts/). [research/3-word-data.md](research/3-word-data.md) has URLs and terms; its scratchpad paths are gone.

| Dataset | Used for | Terms |
|---|---|---|
| NRC VAD Lexicon v2.1 (Mohammad 2025) | Pleasantness (rule 1) | Free for non-commercial research and education; asks for credit on the About page if used in a product (an open decision for Lucas) |
| Warriner, Kuperman, and Brysbaert 2013 | Pleasantness, second source | None found |
| Glasgow Norms (Scott et al. 2019) | Meanings split by sense | CC BY 4.0 |
| Baron-Cohen et al. 2010 | Which feeling words children know (the core labels in rule 5; the kids' wheels) | Open access |
| Google Books Ngram (`https://books.google.com/ngrams/json`) | Phrase counts for rule 10; `scripts/ngram-cache.json` caches them | Free endpoint, no key |
| Stadthagen-González et al. 2017 | Spanish pleasantness (rule 14) | None found |
| Small World of Words, SWOW-EN18 | How strongly people link two words (rule 7's flag) | CC BY-NC-ND; download needs a name and email. Lucas downloaded `SWOW-EN18.zip` on 2026-11-20; ask him for it, and never commit it. |
| USF Free Association Norms (1973–1998) | Older association data | Free at http://w3.usf.edu/FreeAssociation/ |

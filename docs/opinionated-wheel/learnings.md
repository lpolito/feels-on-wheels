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
- **Words that name what happened to you** (Betrayed, Rejected) belong on the outer ring, and each definition ends with the feeling it causes. Intent matters: being shut out on purpose is Rejected (hurt); being left out, maybe by accident, is Left out (lonely).
- **Near-synonyms aren't always synonyms.** Powerful (strong, in charge) isn't Empowered (able to act); Lucas caught it. Before choosing one word of a pair by commonness, check that they mean the same thing.
- **The layout allows at most 3 outer words per middle word,** and Lucas says even 3 is pushing it, so prefer 2. An earlier brief lifted the cap without asking; it was wrong.

## Traps in the data

- **Subtitle word counts are the research standard,** but they count every meaning of a word (Mad wins over Angry because it also means crazy), and the counts on hand miss most -ed words. The better measure for this job is Google Books phrase counts for "feel ___", "feeling ___", and "felt ___", which count a word only when it's used about a feeling.
- **Newer counts don't exist.** The main project tracking how people write online ([wordfreq](https://github.com/rspeer/wordfreq/blob/master/SUNSET.md)) stopped in 2024, because AI-generated text has polluted web text since 2021.
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

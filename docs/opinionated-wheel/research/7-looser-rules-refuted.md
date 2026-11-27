# Refutation of the looser rule drafts A and B

(Written on 2026-11-21 by a fresh agent, saved here by the main session because the agent couldn't write files. After report 6, Lucas decided to rethink the rules rather than patch them: fewer and looser, strict script checks only for facts, usage counts as flags, about five questions for judgment, and a written reason per word. Draft A was written by the main session; draft B independently, by an agent that hadn't seen A. The refuter had both drafts, Lucas's brief, reports 1 to 6, the candidate wheel's labels, today's wheels, and the datasets. The drafts aren't kept; the merged set in section 7 supersedes them.)

The refuter ran both drafts' checks on the candidate wheel (6 cores, 44 middle words, 116 outer words, 166 labels), ran the body wheel check on today's wheels and on today's body wheel against the candidate, and pulled Google Books counts (2018–2022, per billion) for all 166 labels and about 30 more words. Its scripts were in the session scratchpad and are gone.

## 1. Most important findings, ranked

1. **Draft A lets a written reason override every check,** including "each word once" and the body wheel, which contradicts its own "checked strictly". Only pleasantness is a judgment call. *Fix:* adopt B's split. *High.*
2. **The flag for a big gap between the "feel" and "I was" counts floods and tells you nothing.** At 10× it flags 66 of 166 labels (40%). Nouns have no "I was X" form, so every noun trips it (Dread 271×, Rage 149×, Hatred 408×). It doesn't separate what-happened words from feelings: feel-heavy words include Betrayed 19× and Cheated 12×, but also Guilty 42×, Safe 11×, Uneasy 25×, and Uncomfortable 27×; be-heavy words are ones people say with "was" (Surprised 24×, Startled 30×, Determined 43×). *Fix:* print the ratio, never flag it; no be count for nouns. *High.*
3. **Neither draft's be count works as written.**
   - Google Books returns nothing for "I'm sorry" or "I'm afraid", and "I am" pulls in set phrases: "I am afraid that/I" (762, the polite hedge), "I am sorry to/for/that" (1,241, apologies), "I am grateful to" (1,495, book acknowledgments).
   - B subtracts non-feeling phrases from the feel count only. "I was used to" (584) is all of "I was used" (568), so B scores Used at 568 instead of 72, and it passes silently.

   *Fix:* the be count is "I was X" only; subtract recorded non-feeling phrases from both counts; when a phrase is most of a count, drop that count for that word; print both. *High.*
4. **The choice of count decides the fear core's label.** Afraid against Scared is 0.98 on the feel count, 2.64 by B's method, and 3.52 by A's, so the synonym flag would rename Scared under both drafts. The difference is "afraid that/to/of": hedging and reluctance, not fear. Baron-Cohen 2010 (4–6-year-olds who knew it): Scared 93.3%, Afraid 75.0%. *Fix:* choose core labels by children's knowledge first; counts only break ties. *High.*
5. **B's "rating spread above 2.0" flag doesn't catch mixed feelings.** Warriner spreads: Bittersweet 1.51, Nostalgic 1.64, Awe 1.79, Homesick 1.17. It trips Proud 2.03, Ashamed 2.23, Elated 2.02, and Apologetic 2.35 (13% of the wheel's scored words). *Fix:* drop it. *High.*
6. **B's body-state test ("if rest or food would end it") sends Burned out and Drained to the body wheel,** though B also keeps Burned out. *Fix:* "it describes the body itself (Tired, Sleepy, Hungry, Sore); the mood a body state brings still counts." *Medium-high.*
7. **B claims one override and has four:** translations ("record it as a known limit"), situations ("write down why an existing word covers it"), and the body wheel ("remove the sensation with a note"). *Fix:* name them honestly: pleasantness and translations can be cleared by a reason; mapping a situation is judgment by nature; removing a sensation is a fix, not an override. *High.*
8. **Draft A has no rule or check for what-happened words, mixed feelings, surprise, or per-core questions.** Its sorting piles leave out surprise, so Surprised, Amazed, and Awe have no home. B covers all of these. *High.*
9. **Both drafts let near-duplicates and grandparents through.** "Each word once" compares exact labels, so the core Love and the outer word Loved both pass. On the body wheel, Heart in throat would hold Scared and its grandchild Startled, and Run would hold Scared and Threatened. Eight body paths would point at the core Scared on the candidate wheel, and neither draft says whether cores may appear there. *Fix:* compare base forms; ban two words from the same line of descent on a sensation; decide about cores. *Medium-high.*
10. **The published situation sets come with fixed label lists and non-commercial licenses.** EmpatheticDialogues workers picked one of 32 emotion labels and described a time they felt it (CC BY-NC 4.0). ISEAR has 7 labels; Geneva shares its materials for "non-commercial research", with no formal license found. Both are independent of the wheel, but they only surface feelings someone wrote about under those labels, so they won't reliably find a gap like Vindicated. And with datasets kept out of the repo (NRC: "Do not redistribute"), the pleasantness and situation checks can't block a pull request in CI unless CI downloads the data. *Medium-high.*

## 2. Disagreements, with rulings

| Issue | A | B | Ruling | Confidence |
|---|---|---|---|---|
| Which checks a reason can override | All | S1 only (in fact also S4, S5, S7) | **B, made honest:** pleasantness and translation collisions can be cleared by a recorded reason; the rest are facts | High |
| Minimum middle words per core | 4, strict | None | **B, plus a printed count.** A core under 4 needs a line in its reason. The case against a Surprise core is that the sorting group is tiny, not the number 4. | Medium |
| Be count | "I'm" + "I was" (can't be queried) | "I was" only; phrases subtracted from the feel count only | **Third way:** "I was X" only, phrases subtracted from both, no be count for nouns, both printed | High |
| What-happened words | A category with no membership rule | Tagged list plus check S6 | **B.** Counts can't do it (Guilty and Safe look just like Betrayed). | High |
| Flag numbers | None for rare or gap; 2× for synonyms | 15 per billion, 2×, 10×; band Warriner 4–6 or NRC ±0.2; spread above 2.0 | **B's 15, 2×, and band.** A's band misses Indifferent (4.28), Aroused (5.95), and Apprehensive (−0.188). **Drop the gap and spread flags.** | High |
| Alternatives for the synonym flag | "A word with the same meaning" | Listed in the word's record | **Third way:** the writer's list plus the word's top associations that are feeling words (SWOW: scared → frightened, afraid; thankful → grateful) | Medium |
| Mixed feelings | Nothing | Stronger side, record what's mixed, card names the other | **B,** plus: when the lists disagree (Awe, Nostalgic), the reason names the side and why | Medium |
| A third outer word | The only word for a situation on the list | The reason says what it names that the others don't | **Third way.** A's test is circular (whoever maps the situation decides, and without a list all 22 thirds fail); B's bar is one every word already meets. The reason names an everyday situation where the third word is what you'd reach for and neither sibling nor the parent fits. | Medium |
| English shape against local sorting | Merging or hiding is a last resort | English always wins; known limit | **B's precedence,** with A's last resort as a recorded known limit; never re-sort a language | High |
| Pleasantness in translations | Nothing | Strict | **A flag.** Stadthagen-González lacks aliviado, confundido, conmovido, emocionado, enojado, traicionado, nostálgico, and atrapado; orgulloso is 5.55, near neutral. | Medium-high |
| Core labels | Most common word small children know | Synonym flag plus a Baron-Cohen report | **Children's knowledge first** (at least 75% at ages 4–6, highest wins); counts break ties | High |
| Surprise and per-core questions | Silent | Pleasant surprise under joy, shock under fear, a question table | **B** | High |
| Slang | In when people use it | Must argue without counts | **Merge:** in when a reason shows people say it about themselves. Under the larger-count rule, "I was pissed" (174) and "I was gutted" (21) pass; Stoked (9), Freaked out (13), Hangry (0.7), and Cringe (0) don't. | Medium |
| Datasets outside the repo; NRC's About credit | Silent | Covered | **B,** plus the CI consequence | High |
| Length | About 6.7 KB | About 17 KB | Keep B's content but move rationale into notes | Medium |

## 3. Mechanical results

- **Pleasantness:** nothing fails either draft; Confused and Startled no longer flip.
  - A asks for 19 reasons: 12 unscored (Empowered, Accepted, Attracted, Cared for, Disillusioned, Sorry for someone, Cheated, Insulted, Repulsed, Pressured, Conflicted, Out of place) and 7 near neutral (Awe, Homesick, Nostalgic, Apologetic, Startled, Exposed, Puzzled).
  - B flags 35, 18 of them from the spread flag alone.
  - Neither tries the base form: cheat −.75/3.05, insult −.83/2.62, accept +.69/6.39, and pressure −.28 would give 10 of the 12 unscored words a hint. On today's ids, `let-down` misses as written, and B's no-hyphen fallback can land on the noun "letdown" (−.667).
- **Each label once:** no exact repeats; Love and Loved pass.
- **2–3 outer words:** fails Connected, Disappointed, and Embarrassed (4 each). 22 of 44 middles have three.
- **At least 4 middle words per core (A):** all pass. Happy has 12 middles and 31 outer words; Love 5 and 11. Neither draft checks a maximum or balance.
- **Body wheel:** today's body wheel against today's feelings wheel passes (46 sensations; seven pair siblings, which is allowed). Against the candidate wheel:
  - 20 feelings missing: apathetic, depressed, despair, disapproving, dismayed, eager, fragile, frightened, loving, mad, out-of-control, peaceful, powerless, repelled, revolted, stressed, thankful, tired, weak, withdrawn;
  - 14 sensations drop below 2, and Drained and Back away drop to zero;
  - 8 parent-child pairs: hot-face, heart-in-throat, dry-mouth, cold-hands, frozen, weight-on-shoulders, numb-empty, hide;
  - 2 grandparent pairs both drafts would pass: heart-in-throat (Scared, Startled) and run (Scared, Threatened).
- **Usage (B as stated):** 7 rare words (Blissful, Playful, Forgiven, Tenderness, Cringe, Provoked, Unmotivated), all sensible. The feel count alone would flag 12, including Startled, Fed up, Appalled, Intrigued, and Frantic; the larger-count rule rescues them. A's rare and gap flags have no number and can't be coded.
- **Where the methods differ:** Used 72 (A) vs 568 (B); Afraid 4,459 vs 2,906; Grateful 3,065 vs 653; Thankful 801 vs 275; Sorry 2,417 vs 1,703; Proud 958 vs 580. They agree within rounding on about 40 other words checked.

| Pair | A | B | Feel count only |
|---|---|---|---|
| Afraid / Scared | 3.52 | 2.64 | 0.98 |
| Worried / Anxious | 2.64 | 2.23 | 0.21 |
| Grateful / Thankful | 3.82 | 2.38 | 4.99 |

- **B's cited numbers:** Afraid vs Fearful is 6.9× on "feel X", as stated. "Was worried" vs "felt worried" is 120:1, but on B's own counts ("I was worried" against the feel total) it's 10.4:1. "I was sorry for" (81.7) mixes apology and sympathy, so pinning a sense fails in the be count.

## 4. Misfires per question

- **Is it a feeling?** Burned out (B's rest test excludes it); Aroused (neither test settles it); Cringe ("that's cringe" describes a thing, so both questions exclude it, though the candidate has it, with no recorded reason); Hostile ("only a way of treating people" splits readers; Ortony classes it as a feeling).
- **Where would people look?** Surprised, Amazed, and Awe have no home under A. Nostalgic fits both Joy's and Sad's questions; only B's mixed-feelings rule settles it. Protective (Love, Fear, or Anger) and Determined (Joy or Anger) split readers.
- **Does this parent fit?** Suspicious under Jealous fails both drafts: most people who feel suspicious don't feel jealous, and its top associations (criminal, suspect, shifty) don't include jealousy. Rage under Furious isn't narrower, just the noun. Hatred under Resentful is stronger and broader: B passes it as "plus a strength", and A, read literally, fails it. B's Resentful example states its conclusion.
- **Is each word a real choice?** The strength exception can't tell "a strength of the parent" from "a stronger form of a sibling" for Delighted, Elated, and Blissful; Stuck and Trapped; Heartbroken and Devastated; Panicked and Frantic. Trapped also fails "I feel trapped but not stuck". *Fix:* a stronger word that keeps a sibling's specific cause or target is that sibling's strong form; one that's just more of the parent is fine.
- **Do people say it about themselves?** Used, Exposed, and Lost pass, but their counts are polluted ("I was lost in" is 197). Sorry for someone can't be counted by sense. Depressed (389) against Down (271) is under 2×, so no flag.
- **Is it a core? (A)** Loved (371) outnumbers Love (215), and A doesn't exclude what-happened words from core labels. Bad's "isn't loss, danger, or unfairness" works.
- **What-happened words (A):** with no list, readers split on Vulnerable, Insecure, Pressured, Loved, and Lonely.

## 5. Contradictions and evidence mismatches

- **Draft A:** strict checks that can be overridden; a third-word clause resting on judgment; two flags with no number; an "I'm" frame that can't be queried; "narrower" contradicts its own definition template ("plus … a strength") and what-happened words; a 4-middle minimum the brief doesn't list.
- **Draft B:** four overrides, not one; the spread flag is refuted; the 120:1 figure comes from a different count than B uses; "book counts don't see slang" is half wrong under its own rule; the rest-or-food test conflicts with its Burned out line.
- **The brief:** "every situation has a word" is called a fact, but the mapping is judgment; the gap flag is useless; the "sturdier" published sets are label-elicited and non-commercial; strict checks need data the repo can't hold.
- **Holds:** both drafts' sorting placements match reports 4 and 5. B's claims about surprise, Indonesian moved and touched, Basque nostalgia, Lazarus, and Leach and Cidam match. NRC's Spanish is machine-translated, as B says.

## 6. Gaps

1. Base-form uniqueness (Love and Loved).
2. Grandparents and cores on the body wheel.
3. Nouns against adjectives: report 4's "an adjective after 'I feel'" was dropped by both drafts; the candidate has 15 nouns, and the frames break on them.
4. No maximum of middle words per core, and no balance between cores (Happy has 12).
5. Base-form hints for unscored words.
6. Spanish gender forms (avergonzado/avergonzada) in the collision and pleasantness lookups.
7. Where the checks run: CI can't run them on data kept out of the repo.
8. Where the rules live: `src/data/README.md` wins over a spec, so the merged rules must replace its content rules.
9. Order within a ring.

## 7. Recommended merged rule set

**Always**
1. **Build from the rules, not from today's wheel.** That includes the cores. Familiarity is never a reason.
2. **Every word has a written reason, and the reason is the record.** One or two sentences: why here and not nearby, what alternatives were considered, and a line answering each flag the word raised.
3. **Each word is on the wheel once.** Two forms of one word (Love and Loved) count as the same word. A feeling that fits two families goes where most people would look, and its card names the other family. Two feelings that share a spelling (embarrassed *about* yourself, embarrassed *for* someone) each get their own label, and each is counted with a phrase that pins its sense.
4. **Layout.** Each middle word has 2 or 3 outer words, and 2 is the default. A third word's reason names an everyday situation where it's the word you'd reach for and neither sibling nor the parent fits. If a fourth seems needed, split the middle word or move a word.
5. **Every language uses the English wheel's shape.** Each position gets that language's most natural word or phrase; never re-sort a language. If two positions collide, use another word or a short qualifier; if that fails, record it as a known limit.
6. **Fix the body wheel in the same change.**
7. **Credit every new source** with a note and a Credits entry. Datasets stay out of the repo, and CI downloads them from their source. NRC's About-page credit is the owner's call.

**Checks (a failure blocks the change)**
- **S1. Same side as its core, both ways.** A word fails when every list that scores it (Warriner 2013, NRC VAD v2.1) puts it on the other side. Lookups try the word as written, lowercase, the hyphen as a space, and the hyphen removed. A recorded reason can clear it, and the script prints the reason.
- **S2. Each label once,** comparing base forms.
- **S3. 2 or 3 outer words** per middle word.
- **S4. Body wheel.** Every sensation has 2–3 feelings, all on the feelings wheel, no two from the same line of descent (parent, child, or grandparent). A sensation that drops below 2 gets the nearest feeling or is removed with a note.
- **S5. Every situation's words are on the wheel.** Each situation records 1–3 feelings in its source's words and the wheel word each maps to; the mapping is judgment and is written down with it.
- **S6. Tagged what-happened words** are on the outer ring, have no children, and their definition ends by naming the feeling.
- **S7. No two positions in one language share a translation,** comparing base and gendered forms. A recorded known limit clears it.

**Flags (never verdicts)**
- **Pleasantness:** unscored (with the base form's score as a hint); the two lists disagree on the side; near neutral (Warriner 4–6 or NRC ±0.2); a translation on the other side in that language's norms, where they exist.
- **Usage** (Google Books, 2018–2022, per billion): the feel count is "feel/feeling/felt X"; the be count is "I was X", for adjectives and phrases only. The word's recorded non-feeling phrases are subtracted from both; if one is most of a count ("I was used to"), drop that count for that word. Print both. Flag when both are under 15 (rare), or when a same-meaning word is used at least 2× as often (alternatives: the reason's list plus the word's top associations that are feeling words). The ratio between the counts is printed, never flagged.
- **Core labels:** report the share of 4–6-year-olds who knew the word (Baron-Cohen 2010). Prefer a label that at least 75% knew; counts only break ties.

**Questions each reason answers**
1. **Can you be feeling it right now?** Emotions and states of mind count (Confused, Bored). A word with a trait and a state reading is judged by the state. Not the body itself (Tired, Sleepy, Hungry), though the mood a body state brings still counts (Irritable, Burned out); not a schedule or workload (Busy); not a description of a thing ("that's cringe"); not only a way of treating people.
2. **Where would most people look?** Follow the sorting studies where they cover a word: shame, guilt, embarrassment, insecurity, rejection, and loneliness with sadness; envy, jealousy, disgust, and contempt with anger; shock and alarm with fear; pleasant surprise with joy. Otherwise ask the core questions below. Word associations only raise a flag.
3. **Does this parent describe it better than any other?** Most people who feel the child would say they feel the parent, and the child is the parent plus a cause, a target, or a strength. What-happened words go under the feeling their definition names.
4. **Is each word a real choice?** Siblings pass "I feel A but not B" both ways. They may differ in strength as strengths of the parent, but a stronger word that keeps a sibling's specific cause or target goes under that sibling or leaves. For a parent and child, only "parent but not child" has to hold.
5. **After "I feel", does it name your own feeling in everyday words?** Down passes; Sensitive and Free fail; Persecuted is mostly said of others. Everyday over clinical, a moment not a condition, heavy words people really say stay. Slang is in when the reason shows people say it about themselves.

**Design notes**

*Cores.* The sorting families (love, joy, anger, sadness, fear) plus one catch-all, which is a design choice. Each is all pleasant or all unpleasant. A core with fewer than 4 middle words needs a line in its reason. The catch-all's words are specific and not all from one family, and its card points to Guilty and Sorry for someone for "I feel bad about it".

| Core | What happened |
|---|---|
| Love | You want closeness or affection, or you're sharing it. |
| Joy | Something good happened, things are going well, or something draws your interest. |
| Anger | You or yours were wronged or blocked, or something gross or wrong should go away. |
| Sadness | You lost something or someone, fell short, did wrong, or were left out. |
| Fear | Something might hurt you, or something sudden just jolted you. |
| Catch-all | It's unpleasant, but it isn't loss, threat, or unfairness: too much, unsettled, out of sorts. |

Adapted from appraisal theory, as guides, not evidence.

*What-happened words.* A tagged list starting from Ortony, Clore, and Foss's objective descriptions; each addition gets a reason. Hurt, Lonely, Threatened, and Guilty in its feeling sense are feelings, not tagged.

*Mixed feelings.* The stronger side. Where the lists disagree, the reason says which side and why, and the card names the other.

*Definitions.* One second-person sentence about a moment: the parent plus a cause, a target, or a strength. Never a sibling's word. A what-happened word's definition ends by naming the feeling. Don't say shame makes you hide.

*Situations.* Sources not written from the wheel: a blind-written list, plus published sets after a license check (EmpatheticDialogues is CC BY-NC 4.0; ISEAR is shared for non-commercial research). Both were elicited from fixed label lists, so use their situation text, not their labels.

## 8. URLs used

- https://books.google.com/ngrams/json
- https://github.com/facebookresearch/EmpatheticDialogues
- https://raw.githubusercontent.com/facebookresearch/EmpatheticDialogues/main/LICENSE
- https://arxiv.org/abs/1811.00207
- https://www.unige.ch/cisa/research/materials-and-online-research/research-material
- https://paperswithcode.com/dataset/isear
- https://arxiv.org/pdf/2205.03235

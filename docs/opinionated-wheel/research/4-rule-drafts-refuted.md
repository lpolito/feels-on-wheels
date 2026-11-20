# Refutation of drafts A and B

Scripts: `scripts-refute/` (read-only, run with `python3 -I`). The wheel is from `origin/main`: 7 cores, 41 middle words, 82 outer words, 123 unique ids.

## 1. Verified evidence

| Claim | Verdict | Source |
|---|---|---|
| Shaver et al. (1987) sorting: disgust and contempt under anger; envy and jealousy under anger; shame and guilt under sadness; embarrassment, humiliation, **insecurity**, rejection, and loneliness under sadness (neglect); **shock and alarm under fear**; a small surprise group | Holds. The drafts never mention two placements: insecurity under sadness, and shock under fear. | https://en.wikipedia.org/wiki/Emotion_classification (Parrott's table); Basque paper's Table 1 |
| Replications | Indonesian: the same five families. Surprise is missing only because "surprise" didn't make the word cut-off, which is an artifact and not a finding. Basque: a distinct small surprise group "clearly on the positive side", whose words also often sorted with fear. Disgust and contempt fall under anger in all three languages. **Report 3's claim that the Basque study "didn't find [surprise] at all" is wrong.** | https://adultattachment.faculty.ucdavis.edu/wp-content/uploads/sites/66/2015/09/Alonso-Arbiol_2006_Structure-of-the-Basque-emotion-lexicon.pdf ; https://zendy.io/title/10.1111/1467-839x.00086 |
| Clore, Ortony, and Foss: the feeling-versus-being test | Holds only **at the level of averages**. Raters judged how confident they were that "feeling X" and "being X" refer to an emotion. The feel–be difference was .18 for affective words and .37 for external conditions. Distributions overlap, and misclassification was common. It isn't a test of whether "I'm X" means the same as "I feel X". | users.cs.northwestern.edu/~ortony/Andrew_Ortony_files/1987%20-%20Affective%20lexicon-foundations.pdf |
| The Ortony taxonomy backs the drafts' cuts | **Selectively.** Ortony classes Confused, Curious, Interested, Bored, Surprised, Startled, Amazed, Hopeful, Confident, and Inspired as *cognitive* states. Bad, Awful, Inadequate, Inferior, Weak, and Hopeless are *subjective evaluations*. Guilty, Helpless, Isolated, and Persecuted are *objective descriptions*. But Hostile, Insecure, and Threatened are *affective*, and both drafts cut Hostile. | ...Affective%20lexicon-structure.pdf |
| Valence is the primary dimension | Holds. Valence is the strongest predictor in 13 of 19 language families and activation in the other 6, with large cultural variation. | https://ui.adsabs.harvard.edu/abs/2019Sci...366.1517J ; https://hraf.yale.edu/hypotheses/4308 |
| Frijda's and DBT's urges as a test for a core | **Doesn't discriminate.** DBT's handouts give shame, guilt, jealousy, envy, and love their own urges (the project's own note says so), and DBT has no surprise. | docs/reference/linehan-dbt-model-of-emotions.md ; frijda-action-tendencies.md (both from secondary sources) |
| Baron-Cohen et al. (2010), 75% cutoff | Holds, but the cutoff was chosen as above chance (binomial p < .001 with three response options), not as "knows it well". Under age 12 it's parent or teacher report, n = 377, Cambridgeshire. Some bands are tiny (values in steps of 6.25 imply about 16 raters), and values aren't monotonic (Overwhelmed 75.4 → 71.3; Embarrassed 89.5 → 76.9). **70 of the 130 wheel slots aren't on its list**, including Fearful, Disgusted, Mad, and Bad. | data/paper-fulltext/baron-cohen-2010.xml (PMC2996255) |
| Leach and Cidam (2015) | Holds: 90 samples. Shame goes with constructive approach when the failure is reparable (g = .47) and with withdrawal when it isn't (g = −.34). | https://pubmed.ncbi.nlm.nih.gov/26641074/ |
| Russell and Fehr (1994) | Holds: subcategories of anger, jealousy among them, belong to anger only by degree. | https://bvbvf1.bib-bvb.de/vufind/PrimoRecord/cdi_proquest_miscellaneous_76753274 |
| Kashdan et al. (2015) | Holds: the phrase is "a general feeling of unpleasantness", from an illustrative vignette. The paper also says that people low in differentiation use *specific* words (angry, sad, afraid) loosely, which is weak support for a "Bad" core. | https://www.affective-science.org/pubs/2015/kashdan-et-all-unpacking-emotion-differentiation-2015.pdf |

## 2. Mechanical re-runs

- **Valence against the core:** only Confused and Startled flip in both datasets. Both drafts got this right. **But the test as written has a hole.** Warriner lacks 38 of the 123 words, among them Shocked (NRC −0.42), Dismayed (−0.67), and Perplexed (−0.38), all unpleasant outer words under Surprised. Disillusioned is in neither dataset. Under "fail only when both disagree", all four pass. Draft B checked parent-child pairs, not the word against its core as its own rule says, so its "five one-dataset flips, all near neutral" hides these words. The near-neutral band of 13 words is confirmed.
- **NRC arousal:** B's figures hold (47 of 110 pairs differ by more than 0.4; centroid misfits 67 of 121 by my method).
- **Frequency:** 21 wheel words are missing from the concreteness file's SUBTLEX counts: 20 *-ed* forms (Betrayed, Shocked, Stressed, Infuriated, Nauseated, Victimized, and others) plus Out of Control. **Both thresholds pass them silently.** The under-50 list is as both drafts give it (14 with Let Down, whose 0 is a counting artifact). B's test needs the full SUBTLEX-US, which failed to download, so B's own list of 13 came from the file B says not to use. A cutoff of 200 would also flag Joyful, Annoyed, and the Fearful and Disgusted cores.
- **Frequency counts all senses.** Mad (5,784) beats Angry (3,008), Upset (3,800) beats Sad (3,232), Good (133,117) beats Happy, and Sick (8,437) and Gross (779) beat Disgusted. **Draft B's test 1(b), "the commonest everyday adjective", therefore fails Angry, Sad, Happy, and Disgusted, though B reports that they pass.**
- **Percent known:** at least 93% for every word (A is right). **Baron-Cohen:** Startled reaches 75% only at 15–16 (B is right).

## 3. Per-rule findings

### Draft A

1. **Names a feeling: fix.** Question 1 ("Does 'I'm ___' mean the same as 'I feel ___'?") tests whether the word has more than one sense, not what it refers to. "I'm guilty", "I'm hurt", "I'm weak", "I'm threatened", and "I'm bad" all fail, so Guilty, Hurt, Weak, and Threatened would become cause words that can only be outer words. Those four middle words carry 9 body-wheel paths. Question 2 (could you feel it sitting alone and still?) passes Withdrawn and Hostile, which A lists as failing. Question 3 (would rest fix it?) passes Energetic, which A lists as a body state. Rewording is in R2 below.
2. **Cause words, outer only: keep, with the test fixed.** The rule is right. The test inherits question 1's bug. Use a tagged list (as B does).
3. **Umbrella words: fix.** It allows umbrellas anywhere, so it's untestable in practice. Limit it to one catch-all core, and keep A's good check that the children don't all come from one other family.
4. **Body states and behaviors go to the body wheel: keep, and widen.** Its body-wheel cost covers only Tired. Cutting Tired *and* flagging Apathetic (18) leaves the Drained sensation with no feelings at all (its two are Tired and Apathetic).
5. **Valence: fix the test** (the missing-data hole). "The rule settles almost nothing below the cores" is wrong: it catches Shocked, Dismayed, and Perplexed once the hole is closed.
6. **Sorting decides the family: keep.** But A doesn't follow its own consequences. It moves Insecure and Rejected out of Fearful, and Shocked (and probably Startled) into Fearful. "Disgusted and Surprised are cores because of faces" is half wrong: the sorting does produce a small, positive surprise group. The association check is unrun and is biased by polysemy (mad means crazy). Make it advisory.
7. **Kind of its parent: fix.** The absolute frame rejects about half the outer ring: "nervous but not threatened at all", "annoyed but not frustrated", "helpless but not scared", "thankful but not peaceful", and "skeptical but not critical" all sound fine. With fuzzy membership, use a relative test.
8. **One home, and the card names the second: keep.**
9. **A core is the first word: fix.** It sets no threshold.
10. **What the rings mean: keep** as description. A labels its own evidence weak.
11. **Plain words: fix.** The hole for missing words and the problem of counts covering all senses (section 2).
12. **Distinct both ways: fix. It contradicts rule 7.** A parent-child pair can't both make "I feel child but not parent" odd (rule 7) and make it fine (rule 12). For parent and child, use one direction only.
13. **Mild to strong order: drop.** Cowen and Keltner's gradients run between categories, not intensities. There's no evidence it helps people look a word up.
14. **Coverage: keep.** B's data file with a test is better.
15. **Unpleasant at least as many words as pleasant: drop.** It's vacuous: about 90 unpleasant words against 27 under Happy already.
16. **Heavy words: keep.**
17. **Spanish: keep.**
18. **"I feel ___" adjectives: keep.**

### Draft B

- **0, change only what fails: keep.** It's the best guard for the brief's familiarity constraint, and mechanical.
- **1, what makes a core: fix.** Test (b) is broken (section 2). Test (c) doesn't discriminate: DBT gives guilt, shame, and jealousy their own urges, so (c) argues for ten cores, and Surprised has no DBT urge at all. "Disgusted has the clearest urge and body pattern of any core (Rozin)" overstates a note that exists but makes no comparison. Keep (a) and (d).
- **2, valence: keep the near-neutral band and fix the missing-data hole.**
- **3, names a feeling: fix.** "When unsure, use Ortony's classes" would cut Confused, Curious, Interested, Bored, Hopeful, Confident, Surprised, and Amazed, and would *keep* Hostile, which B cuts. Its trait question would flag Anxious, Insecure, Confident, and Optimistic, all of which have trait readings. Ortony takes the state reading, so ask whether the word has a state reading.
- **4, cause words: keep.** It's the most mechanical version. Add that "guilty" in its feeling sense isn't a cause word.
- **5, kind of its parent: fix** (same as A's rule 7).
- **6, where people look: keep.** The appraisal questions are a usable fallback, but they're judgment, not evidence.
- **7, appears once: keep.**
- **8, real choices: fix.** It conflicts with rule 5 for parent-child pairs (same as A).
- **9, plain, one sense, "I feel ___": keep the one-sense check and the kids' band; fix the frequency check.** The choice of "at peace" for accepting your situation is a content decision, not a rule. Move it out.
- **10, everyday over clinical: keep.**
- **11, size: keep the mechanical counts, but the numbers are the owner's.** "Happy fails at 9" is a decision the draft made for him.
- **12, coverage: keep.** It's the most testable form.
- **13, Spanish: keep the valence check.** "Fix it in Spanish first" is the owner's call (A's decision 6).
- **Conflicts:** sound, and "the body wheel follows" is important. A lacks it.

## 4. Agreement and disagreement

**Shared and solid:** valence first, no arousal rule, outer-only cause words, one home per word, sorting placements, Tired as a body state, heavy words stay.

**Shared mistakes:**
1. The valence test passes words that one dataset lacks.
2. The frequency test passes 21 words it can't score, and counts every sense of a word.
3. The distinctness test contradicts the kind-of test for parent-child pairs.
4. Both claim Ortony as grounding but apply it selectively, and both cut Hostile, which Ortony counts as affective.
5. The sitting-still question fails on Withdrawn and Hostile.
6. Both treat a test of group averages as a decision procedure for single words.
7. Neither says that the new sources (Shaver, Ortony, Warriner, NRC, SUBTLEX, Baron-Cohen, Jackson, Stadthagen) each need a `docs/reference/` note and a Credits entry, which project rules require.
8. Neither applies the sorting placement of shock under fear or of insecurity under sadness.

**Disagreements, with rulings:**

| Issue | A | B | Ruling |
|---|---|---|---|
| Surprised | A core only because of faces; dissolve or keep as an exception | Adds a pleasant-surprise core option | **B.** The sorting finds a small, positive surprise group in English and Basque, and shock under fear. |
| Umbrella words | Anywhere | One catch-all core | **B**, plus A's check against a single family. |
| Core test | Frequency, no threshold | Four-part test | **Neither as written.** Merge (R5). |
| Near-neutral band | None | Yes | **B.** |
| Sibling order | Mild to strong | Rejected | **B.** |
| Size | Budget, unpleasant at least as many | Hard caps | **B's mechanics with numbers the owner sets.** Drop A's balance rule. |
| Change only what fails | None | Rule 0 | **B.** |
| Cause-word test | Judgment frame | Tagged list plus data test | **B.** |
| One sense | None | Explicit | **B.** |
| Spanish-first | Owner's call | Decided | **A.** |
| Fallback placement | Word associations (unrun) | Appraisal questions | **B** as the rule, A's check as an advisory flag. |

## 5. The decisions lists

**Research can largely settle:**
- **The Fearful label (A5, B4).** Afraid (12,631) and Scared (6,803) against Fearful (110), and Afraid and Scared reach 75% at ages 4–6. Only the cost of the URLs is the owner's, and B notes that the id can stay.
- **The shame family (A3).** The evidence default is a cluster inside Sad, in English, Indonesian, and Basque; it's its own family only in Chinese. The owner decides only whether to pay for a new core.
- **Surprised (A1, B1).** The evidence favors a small pleasant-surprise core, with Startled and Shocked moved to Fearful. Keeping it as it is remains the option for familiarity. The list should say which one the evidence favors.
- **Love (A4, B3).** It's a family in every sorting study except Chinese. Cost is the only open question.

**Correctly the owner's:** Disgusted, languages, crisis links, NRC's terms, the size budget, and Bad's name.

**Decided by the drafts that should be the owner's:**
- B's ring caps and "Happy fails".
- B's Spanish-first policy.
- B's "at peace".
- The size of the rewrite that A's rule 6 sets off: Insecure, Rejected, Humiliated, and Embarrassed would leave Fearful, Angry, and Disgusted. This is evidence-backed, but its scale is a familiarity trade the owner should see as one list.

## 6. The brief's constraints

- **Body wheel.** A's question 1 would demote Hurt, Guilty, Weak, and Threatened (9 body-wheel paths). Cutting Tired and Apathetic empties Drained. Moving Startled and Shocked under Scared would put a parent and its child in Heart in throat (scared and startled) and in Frozen (scared and shocked). Seat them in their own middle word or under Threatened instead.
- **Familiarity.** Only B protects it (rule 0).
- **Mechanical.** Both overstate how mechanical their rules are, because of the holes above.
- **No studies.** Every judgment test is one person's intuition, so prefer relative tests (which parent fits better) to absolute "sounds odd" frames.

## 7. Recommended rule list

The conflict order follows the numbering, except that R0 applies throughout and R17 and R18 always apply.

- **R0. Change only what fails a rule.** Each changed word cites the rule it failed. *Confidence: high (the brief).*
- **R1. A family has one valence.** Flag a word when every dataset that scores it (Warriner, NRC) puts it on the other side from its core. A word that no dataset scores, or that sits within 1.0 of Warriner's midpoint or 0.2 of NRC's, needs a written reason. *Evidence: strong. Test: mechanical.*
- **R2. A word names a state you can be in right now: an emotion or a state of mind** (Confused, Curious, and Bored count). It isn't a body state (it describes the body, or rest or food would end it: Tired, Sleepy, Nauseated, Energetic). It isn't a situation or a schedule (Busy, Rushed). It isn't a description of a thing (Detestable). It isn't only a way of treating others with no inner reading (Critical, Judgmental, Dismissive). Words with both a trait and a state reading are judged by the state reading. *Evidence: moderate (Ortony, Clore). Test: judgment.*
- **R3. Words for what happened** (Betrayed, Rejected, Abandoned, Excluded) are a tagged list: outer ring only, no children, and a definition that names the parent's feeling. *Evidence: moderate. Test: mechanical once tagged.*
- **R4. One catch-all core at most** for unclear or mixed unpleasant feelings. Its children pass R2 and don't all come from one other family. *Evidence: reasoning.*
- **R5. A core is a sorting family** (love, joy, anger, sadness, fear, plus the small positive surprise group) **or the catch-all.** It has one valence and at least 4 middle words. Its label is known by 75% of 4–6-year-olds where Baron-Cohen lists it, and no synonym in the same sense is more than about ten times as common. *Evidence: moderate to strong. Test: mostly mechanical.*
- **R6. Placement follows the published sorting** (shame, guilt, embarrassment, humiliation, insecurity, rejection, and loneliness under sadness; envy and jealousy under anger; shock and alarm under fear). Where it's silent, use B's appraisal questions. Word associations only raise a flag. *Evidence: strong for the listed placements, reasoning for the rest.*
- **R7. A child fits its parent better than any other middle word or core.** "I feel [child] but not [parent] at all" sounding odd supports this but doesn't decide it. *Evidence: moderate. Test: judgment.*
- **R8. Real choices.** Siblings and words in different families pass "I feel A but not B" both ways. Parent and child pass only "I feel [parent] but not [child]". *Evidence: reasoning about usability.*
- **R9. Each word appears once;** a second home goes on the card. *Test: mechanical.*
- **R10. Plain.** At least about 50 raw counts in the full SUBTLEX-US list (about 1 per million). A word with no count is flagged, never passed. A rarer word stays when R8 needs it. *Evidence: a calibration.*
- **R11. One usual sense matching the definition, said about oneself, an adjective after "I feel".** *Evidence: moderate. Test: judgment, with Glasgow's senses.*
- **R12. Kids' bands: 75% of the band in Baron-Cohen.** Words off the list, or within 10 points of 75%, get an age-of-acquisition check by judgment. *Evidence: moderate (one UK sample).*
- **R13. Everyday words over clinical ones, define moments, and heavy words stay.** *Evidence: moderate.*
- **R14. Coverage:** a data file of situations and a test that each one's word is on the wheel. *Evidence: moderate; the mechanics are high.*
- **R15. Ring counts are checked mechanically; the owner sets the numbers.** *Evidence: reasoning.*
- **R16. Spanish:** each word keeps its valence sign in Stadthagen-González, and siblings stay distinct (judgment). *Evidence: moderate.*
- **R17. The body wheel follows.** Every move or removal re-runs its rules in the same change: 2 or 3 feelings per sensation, and no word with its parent or child. *Confidence: high (a project constraint).*
- **R18. Every new source gets a `docs/reference/` note and a Credits entry.** *Confidence: high (a project rule).*

**Rejected:** arousal matching, sibling order, urges as a test for a core, the pleasant-versus-unpleasant balance, faces as a reason for cores, a single knowledge-emotion family, and Ortony's classes as a tie-breaker.

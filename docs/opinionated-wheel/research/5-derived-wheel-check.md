# Adversarial check of the derived feelings wheel

(Written by a fresh checker; saved here by the main session because the checker couldn't write files. Scripts and outputs are beside this file.)

## 1. The cores, checked against the primary source

Source: Alonso-Arbiol, Shaver, Fraley, et al. (2006), *Cognition and Emotion* 20(6), 836–865, read in full. Its Table 1 restates the English tree (Shaver et al. 1987) and Table 2 the Indonesian one (Shaver et al. 2001).

**Surprise: the builder's wording is wrong, but the decision stands.**
- Basque: surprise formed "a distinct group" on the positive side, "near the positive-negative divide but clearly on the positive side". 2 terms, 2% of the total. Its words "were also often sorted into categories with fear-related words". It did **not** merge with fear.
- Indonesian: "There was no surprise category, because the word surprise did not make the cut-off." The word was never in the sort.
- English: "a very small surprise category" (surprise, amazement, astonishment in Parrott's restatement).
- The authors: "there are both positive and negative surprises".
- **Ruling:** dropping Surprised as a core is supported: tiny in every sort that included it (fails rule 5's "big"; couldn't fill 4 middle words), and mixed valence (rule 1). Delete "doesn't replicate in Indonesian" and "merges with fear in Basque"; give these reasons instead. Surprised under Happy matches English and Basque.

**Disgust under anger: confirmed** in English (disgust, revulsion, contempt under anger), Indonesian (*muak* under hatred/loathing, inside anger), and Basque (*nazka*, *higuina*, *desprezioa* under hatred/aversion, inside anger). China unchecked.

**Love as a family: confirmed.** English 16 terms (12%), Indonesian 26 (21%), Basque 15 (12%). China had none.

**Shame not a family in English: confirmed, with one omission.** Under sadness in English and Indonesian; own family in Chinese; in Basque "shame falls within the realm of fear and anxiety". Doesn't change the English wheel.

**Calm inside joy: supported, with a caveat.** English: contentment, relief, pride under happiness. Indonesian: calmness/security, satisfaction, confidence under happiness. Basque: tranquility its own small group (5 terms, 4%), and courage too. Too small for rule 5.

**Unused evidence in the same tables:** English sadness includes insecurity, insult, pity, and sympathy. English fear includes mortification. Indonesian puts moved/touched and pity/compassion under sadness, bored/fed up under anger, confused with anxiety under fear.

## 2. Mechanical results

- Counts match (6 / 43 / 109 / 158). No repeats. Every core has 4+ middle words; every middle word 2–3 outer words.
- **Rule 1: one failure the builder's script missed: Self-conscious.** NRC lists it only as "self conscious" (+0.166); check.py looked up the hyphenated form and recorded it unscored. Also outside the builder's own ±0.15 band. Lists disagree on Awe, Nostalgic, Lust (allowed). Glasgow agrees with every word it has.
- 13 unscored words; base-word scores match the builder's notes.
- Rule 10 cache: 11 of 11 phrases match the live endpoint exactly. None under 5.
- "check.py passes every word" is wrong: its report flags Pleased 5.4× Delighted, Strong 5.0× Capable, Tender 5.2× Tenderness. The notes handle each, but the summary hides the flags.
- **Thresholds:** "barely used" under 5 per billion is lenient (median 104); 11 words fall between 5 and 15 (Tenderness, Appalled, Fed up, Startled, Frazzled, Forgiven, Unmotivated, Intrigued, Blissful, Playful, Lust). The "feel ___" frame undercounts words said with "I'm" or "I was". Recommend flagging under 15 with a one-line reason. The multi-word caveat is overcautious: 2- and 3-gram totals are nearly equal.

## 3. Failures by word, most severe first

### Settled by the rules or evidence

1. **Insecure, Inadequate, Inferior** (rule 6): Shaver sorted insecurity under sadness with shame, rejection, embarrassment, humiliation. Move Insecure with its outer words to Sad.
2. **Self-conscious** (rule 1, rule 11): drop it. Embarrassed, Awkward, Insecure cover being watched.
3. **Stressed** (rule 4): an umbrella inside Bad, which rule 4 forbids. Make **Overwhelmed** the middle word, with Pressured, Frazzled, and Burned out under it. If Lucas wants Stressed, record it as an exception.
4. **Capable** (rule 8): same as Confident; drop.
5. **Valued** (rules 6, 3): move to Love > Connected: "Others show you matter, and you feel appreciated."
6. **Regret** (rules 7, 8): not a kind of guilt; move to Sad > Disappointed: "disappointed in a choice you made".
7. **Horrified** (rule 7): move under Shocked: "shocked and sickened by something awful".
8. **Insulted** (rules 6, 3): English sorted insult under sadness; move to Sad > Hurt, or record why anger.
9. **Belittled** (rule 8): near Humiliated; drop.
10. **Rule 3 definitions that don't name the feeling:** Understood, Accepted, Threatened, Pressured, Reassured, Helpless, Exposed. End each with the feeling.

### Judgment failures (rules 7, 8, 2, 11)

11. **Empathy**: not a kind of Compassion, more a capacity; drop or move to Connected.
12. **Eager**: duplicates Motivated, near neutral; drop or nest under Motivated.
13. **Discouraged and Defeated**: the same feeling; redefine Defeated ("you lost, and feel beaten") or drop one.
14. **Uneasy, Uncomfortable, and Bad** share a definition; tie Uneasy to threat, Uncomfortable to place or company.
15. **Nostalgic**: about a time, not a person; not a kind of Affection. Basque sorts it with sadness. Put it next to Homesick, or card says often comes with sadness.
16. **Possessive**: mostly said of others; drop.
17. **Restless**: also anxious; "keyed up and unable to settle", card notes anxiety.
18. **Impressed**: redefine "struck by someone's skill or effort".
19. **Mortified**: English sorted mortification with fear (older sense); keep, record the conflict.
20. **Sympathy, Compassion, Moved**: sorts put them under sadness, but rule 1 outranks; stand, record the conflict; see coverage.
21. **Exposed**: usual meaning physical; keep with definition.

### Definitions

- Ashamed: "you feel bad about yourself, not just about what you did".
- Hatred: "strong, lasting anger at someone" (drop "or hurt").
- Humiliated: "you were made to look small in front of others…".
- Irritable: "everything is getting on your nerves right now".
- Stressed: unclear (see 3).
- Accomplished, Triumphant: add "and you feel proud".
- Contempt: "feeling someone is beneath you".
- Jealous: "someone you love" reads better than "what's yours".
- Proud: "someone close to you" instead of "your people".

## 4. Coverage (rule 13)

**The builder's test is circular:** situations.json was written from the wheel, one per word, so it can't find a missing feeling.

The checker's 40 situations (check2/my-situations.json): 35 found, 5 missing:

| Situation | Word | Phrase count | Note |
|---|---|---|---|
| Months of long hours, nothing left | Burned out | 20 (+ burnt out ~29) | ICD-11 classes burnout as an occupational phenomenon, not medical. Add under Overwhelmed. |
| Doubted, then proven right | Vindicated | 62 | Never considered. |
| Wrong in an argument you pushed | Humbled | 40 | Never considered. |
| Someone flirts with you | Flattered | 76 | About attention; part pleased, part embarrassed. |
| A friend confides in you | Trusted | 11 | Valued covers it; not a real gap. |

Placement gaps: seeing someone suffer has only pleasant words (Sympathy, Compassion under Love); add a Sad word for heartache over someone else's pain. Non-moral regret (item 6); anxious restlessness (item 17). Partial: Useless (103), Shaken (33).

## 5. The builder's "left for the owner" list

1. Content: settled, Content.
2. Foolish or Stupid: settled, Foolish.
3. Self-conscious: settled, drop.
4. Grateful under Love or Happy: taste; but Blessed contradicts the reason for Love. Move Blessed to Happy, or drop it.
5. Hatred under Furious: rule 8 rules out Furious; Resentful versus its own middle word is taste.
6. Insecure: settled, Sad.
7. Disgusted under Angry: settled, Angry.
8. Embarrassed for someone else: "embarrassed for" counts ~36 per billion; rule 9 gives it its own label if it earns a place; Lucas picks the label.
9. Thresholds: acceptable; add the under-15 flag.
10. Not done: rule 7's association check is optional; rules 14, 15, and 16 are required before the wheel is finished.

## 6. Bottom line

The cores hold up: Happy, Love, Sad, Scared, Angry, and Bad. Folding Surprised into Happy and Disgusted into Angry is what rules 1, 5, and 6 require, but the stated reasons for dropping Surprised need rewriting. The wheel mostly holds up, with the fixes above; none change the cores.

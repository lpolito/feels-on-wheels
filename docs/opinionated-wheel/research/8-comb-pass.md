# Comb pass on the candidate wheel

(Written on 2026-11-21 by a fresh agent, saved here by the main session because the agent couldn't write files. It had the new [rules.md](../rules.md), [derived-wheel.md](../derived-wheel.md) and its JSON, reports 1 to 7, and the datasets, including Small World of Words (SWOW). The cores were settled and not reopened. Its scripts were in the session scratchpad and are gone.)

**Notation.** SWOW strengths are **fwd/bwd**: fwd is the word as cue with its parent as response, bwd the parent as cue with the word as response, each the maximum over base forms (Scared: scared, fear, afraid, frightened; Angry: angry, anger, mad; Relieved: relief; Hopeful: hope; Surprised: surprise; Lonely: also alone). Counts are Google Books 2018–2022 per billion, **feel/I was**, where "feel" is feel + feeling + felt. Non-feeling phrases weren't subtracted for new queries, so Stuck, Trapped, Lost, and Impressed are inflated.

## 1. Most important findings, ranked

1. **Love and Loved fail the Once check** (the rules' own example). Fix: drop Loved, which also brings Connected from 4 outer words to 3. *High.*
2. **The what-happened tags weren't redone for the new rules.**
   - Threatened is tagged, but the rules say it's a feeling; its definition is also just Scared's. Untag it and redefine it with a target: "you sense someone could harm you or take your place".
   - Safe and Trapped are untagged, though the rules name both. Safe's definition should end with the feeling: "Nothing can hurt you here, and you feel calm."
   - Helpless, Stuck, Exposed, Lost, and Out of place each need a tag decision with a reason (Helpless is among Ortony's objective descriptions).
   - Eight tagged definitions don't end with their parent's feeling: Loved, Understood ("close"), Valued ("appreciated"), and Accepted ("you belong") under Connected; Misunderstood and Abandoned ("alone") under Lonely; Threatened ("scared") under Vulnerable; Violated ("angry") under Offended. Helpless also ends "scared". That "and you feel offended" reads wrong for Violated is itself evidence about its placement (close call E).

   *High.*
3. **Anxious → Uneasy fails question 4 and Always 4.** Anxious is defined with its child's word ("uneasy about what might go wrong"), so the parent is the narrower one. The third-word reason names no situation. SWOW: uneasy → uncomfortable .116/.054 and nervous .077, against anxious .039/.007. Apprehensive's definition also leans on Uneasy. Close call A. *High that it fails; medium on the fix.*
4. **Frustrated: Stuck and Trapped fail question 4.** "I feel trapped but not stuck" fails; trapped ↔ stuck .083/.054. Stuck is barely narrower than Frustrated. Close call B. *Medium-high.*
5. **Jealous's group breaks question 3 both ways.** Most people who feel suspicious don't feel jealous: its SWOW neighbors are criminal, suspect, shifty, fishy (.140), and it links to Scared (.019) more than Jealous (.011). Jealous's definition covers only a romantic rival, so Envious doesn't read as Jealous plus a cause, though everyday "jealous" covers envy (jealous ↔ envious .238/.046). Fix: widen Jealous to "someone has, or might take, something or someone you want, and you feel angry about it". Close call C. *Medium-high.*
6. **Numb → Indifferent fails question 3 and Always 4.** Indifference about something isn't numbness; its neighbors are apathetic .074, uncaring .070, bored .035, Numb 0/0. No situation; 20/13; Warriner 4.28 is near neutral. Drop it. *Medium-high.*
7. **Moved under Compassion fails question 3 for its own situations** (a thoughtful gift, kindness brings tears, touched): none involves suffering. Narrowing it to the pain sense would make it Sympathy's strong form. Close call K. *Medium.*
8. **The Offended group leans toward Hurt.** Insulted's definition says "meant to hurt". Shaver's sort (Parrott) puts insult under sadness, and question 2 says to follow the sorting where it covers a word. SWOW: offended → hurt .107 against angry .033; insulted → hurt .064 against offended .037. Violated's definition names Angry. Close calls D and E. *High on the definitions; close call on placement.*
9. **Helpless: its definition and situations name different feelings.** The definition is fear; its situations (a far disaster, can't help a loved one) are powerless sadness. SWOW: sad .029, lonely .022, Vulnerable .018/.014; helpless ← powerless .091. Fix: "you can't stop something bad that's happening to you, and you feel vulnerable", and remap those situations to Sorry for someone or Sad. *Medium.*
10. **Aroused's definition repeats the Lust trap.** "Your body responds to someone you want" keeps Desire's target, so "aroused but not desire" fails by definition, and "your body responds" reads as a body state. Fix: "you feel sexually stirred by someone". *Medium.*
11. **Restless under Bored fails question 3.** "Keyed up and unable to settle" is anxious, as is its situation, a pending offer. SWOW: anxious .058, nervous .044, tired .055, Bored .007/.011. Fix: "bored and unable to sit still", and remap the offer to Anxious or Nervous. *Medium.*
12. **Impressed and Awe don't read as Surprised plus anything.** Neither definition contains surprise, and a night sky you've seen often still brings awe (awe ↔ shocked .072/.093 is "shock and awe"). Fixes: Impressed as "someone did better than you expected, and you feel pleasantly surprised"; Awe redefined as surprise at something vast, or a looser fit recorded in its reason. *Medium.*
13. **Sorry for someone fails question 3 against Heartache's definition** ("an aching sadness for someone or something out of reach"): a person in pain isn't out of reach, and mild pity isn't heartache. Fix: widen Heartache to "an ache of sadness for someone or something, missed, out of reach, or in pain", or record it as the least-bad home in Sad. *Medium.*
14. **Words the old rule dropped as under 5 per billion now pass the two-count rule:** Fascinated 3.3/216, Petrified 4.6/63, Livid 1.1/41, Smitten 1.3/35, Infatuated 1.3/17. The "Considered and left out" list needs re-running. *High on the data.*
15. **Provoked's reason is false by the data:** "usually said as 'I was provoked'" doesn't hold (10.1/9.6). The reason has to answer the flag honestly.
16. **Definitions that make words in different families near-duplicates:** Appalled and Horrified; Worthless and Insignificant; Uneasy and Threatened; Indignant opens with Resentful's cause; Sympathy and Sorry for someone are told apart only by "want to comfort", Compassion's own clause. Each needs one sharper clause. *Low-medium.*
17. **Embarrassed's definition ends with "uncomfortable",** Bad's middle word. Reword: "something awkward you did was seen by others, and you wish it hadn't been."

## 2. Every core and middle word, in wheel order

**Happy** holds (12 middle words, all pleasant; its definition doesn't stretch to Interested, but the Joy question covers interest).
- **Joy:** Delighted and Elated hold (Delighted ends "very happy", the core; "you feel joy" would name its parent). Blissful is rare on both counts (10.5/1.1), overlaps Content and At peace, and names no situation: drop it (medium-low).
- **Cheerful:** holds. Amused is a loose fit for a mood word; Playful is rare (11.7/0.9) and needs its reason.
- **Excited:** holds; drop "about what's coming", which contradicts Exhilarated's "in the moment".
- **Proud:** Accomplished and Triumphant hold. Flattered passes Always 4 only because Proud ("something you … did") doesn't cover praise from others: widen Proud ("…or how others see you") or record the stretch.
- **Confident:** holds. Brave is a loose fit (you can be brave without being sure); Powerful's reason needs a situation.
- **Satisfied:** holds. Blessed needs a situation (its neighbors are lucky .093 and God .085); Fulfilled's definition describes a condition.
- **Calm:** holds; Safe must be tagged and redefined.
- **Relieved:** holds. Reassured → Calm .080; Forgiven is rare (9.0/14.4), passive, and fits Grateful (close call F); Vindicated against Proud (close call G).
- **Hopeful, Motivated:** hold.
- **Interested:** holds. Intrigued's "puzzling" echoes Puzzled; "mysterious" avoids it. Fascinated (3.3/216) is now countable.
- **Surprised:** surprise ↔ shock .092/.140 beats → Happy .056, answered by the rules and pleasantness. Amazed holds; Impressed and Awe have problems (finding 12).

**Love** holds (5 middle words).
- **Affection:** holds (Protective splits readers but holds).
- **Compassion:** Sympathy holds (Sympathy → Sad .053 is the recorded sorting conflict); Moved fails (finding 7).
- **Connected:** open item. Loved fails the Once check, and all four definitions fail "ends with the parent".
- **Attracted:** holds; Aroused needs redefining.
- **Grateful:** settled by Lucas (grateful → happy .072, answered by the Algoe reason). Honored → Proud .063/.015 needs one line of reason. Cared for → Love .107 is polysemy.

**Sad** holds (10 middle words).
- **Lonely:** holds once Misunderstood and Abandoned end with "lonely".
- **Hurt:** holds. "A forgotten birthday" is being forgotten, not unnoticed effort: map it to Hurt.
- **Disappointed:** open item. New data for the pick:

  | Word | SWOW to Disappointed | Pulls elsewhere |
  |---|---|---|
  | Let down | .078/.061 (strongest) | — |
  | Disillusioned | 0/.011 | — |
  | Discouraged | .008/.004 | — |
  | Regret | .007/.011 | Ashamed .025/.027, Guilty .018/.021 |

  Shaver/Parrott puts regret with guilt and remorse. Both sources point to Regret and Discouraged as the weakest fits.
- **Grief:** holds. Devastated's "overwhelmed by grief" borrows Bad's Overwhelmed; "flattened by grief" avoids it. Heartbroken's home is close call H.
- **Heartache:** heartache → Love .097 is its target. Homesick → Lonely .068 beats Heartache .004, and Parrott puts homesickness with loneliness: one line of reason. Sorry for someone fails (finding 13).
- **Down:** holds; Miserable is really a strength of Sad, but no Sad parent fits better.
- **Ashamed:** holds; Worthless needs separating from Insignificant.
- **Guilty:** holds.
- **Embarrassed:** open item. Mortified ↔ Embarrassed .187 (strong); Humbled 0/0, its only neighbors proud and grateful (.011 each), the pleasant sense; Cringe as a cue goes first to fear .047, wince, and disgust .023, above Embarrassed .027/.015. The parent's definition ends with "uncomfortable" (finding 17).
- **Insecure:** insecurity → Scared .063, answered by the sorting. Insignificant names no situation and overlaps Worthless: a situation and a sharper definition ("you feel you don't matter to the people around you"), or it goes.

**Scared** holds (5 middle words; its definition leaves out the sudden jolt, minor).
- **Anxious:** fails (finding 3); Worried and Dread hold.
- **Nervous:** loose; its definition doesn't cover Apprehensive or On edge. Widen to "jittery about something ahead" (low).
- **Terrified:** Panicked holds. Frantic's neighbors are crazy, busy, hectic, and its usual sense isn't fear (close call I).
- **Shocked:** holds. Startled doesn't need anything bad, while Shocked says "sudden and bad" (low). Horrified → Terrified .061/.083 beats Shocked .054/.024, and Parrott puts horror with terror (close call I).
- **Vulnerable:** Threatened untagged and redefined; Helpless fixed (finding 9). Exposed holds.

**Angry** holds (7 middle words).
- **Annoyed:** holds; Provoked needs a situation and its true counts.
- **Frustrated:** fails on Stuck and Trapped; Fed up holds.
- **Furious:** holds; Rage passes on strength; leaving off Livid (a synonym) is right.
- **Resentful:** holds (resentment → hate .088 supports Hatred).
- **Offended:** see finding 8. Indignant: "Someone questioned your honesty or dignity, such as blaming you for what you didn't do, and you feel offended."
- **Jealous:** fails (finding 5).
- **Disgusted:** holds; Appalled → Shocked .032 reflects the Horrified overlap.

**Bad** holds as the catch-all (its middle words come from different families, and "bad" has no associations with any of them, as expected).
- **Bored:** Restless fails; Unmotivated is rare (9.0/0.5) and needs its reason.
- **Overwhelmed:** holds; Burned out's link (acute, "at once") is loose (low).
- **Confused:** Conflicted and Lost hold; Puzzled fails Always 4 (puzzled → confused .221, no situation).
- **Numb:** Indifferent fails; Empty → Lonely .032/.025 needs one line.
- **Uncomfortable:** holds; it's Uneasy's SWOW home (close call A).

## 3. Association flags (0.02 or more)

| Word (parent) | Own parent | Stronger link | Reading |
|---|---|---|---|
| Surprised (Happy) | .056/0 | Shocked .092/.140 | Real, answered by pleasantness |
| Grateful (Love) | .011/0 | Happy .072/.003 | Settled by Lucas |
| Hopeful (Happy) | .045/.003 | Love .061/.007 | Faith, hope, love; dismiss |
| Heartache (Sad) | .066/0 | Love .097/0 | Target, not a home |
| Insecure (Sad) | .015/0 | Scared .063/.004 | Answered by the sorting |
| Offended (Angry) | .033/0 | Hurt .107/.003 | **Real** |
| Insulted (Offended) | .007/.037 | Hurt .064/.003 | **Real** |
| Uneasy (Anxious) | .039/.007 | Uncomfortable .116/.054; Nervous .077/.010 | **Real** |
| Restless (Bored) | .007/.011 | Anxious .058; Nervous .044 | **Real** |
| Indifferent (Numb) | 0/0 | Bored .035/.004 | **Real** |
| Suspicious (Jealous) | .011/0 | Scared .019; Guilty .015 | Real |
| Helpless (Vulnerable) | .018/.014 | Sad .029; Lonely .022/.007 | Real |
| Trapped (Frustrated) | 0/.004 | Scared .021 | Real |
| Homesick (Heartache) | .004/0 | Lonely .068/.004 | One line of reason |
| Horrified (Shocked) | .054/.024 | Terrified .061/.083 | Close call I |
| Startled (Shocked) | .090/.014 | Surprised .158/.026 | Answered by pleasantness |
| Honored (Grateful) | 0/.004 | Proud .063/.015 | One line of reason |
| Forgiven (Relieved) | .004/0 | Love .049; Compassion .030/.007 | The forgiver's sense; close call F |
| Reassured (Relieved) | 0/0 | Calm .080/.004 | The definition answers it |
| Awe (Surprised) | .018/.007 | Shocked .072/.093 | "Shock and awe" |
| Sympathy (Compassion) | .028/.035 | Sad .053/0 | Recorded sorting conflict |
| Regret (Disappointed) | .007/.011 | Ashamed .025/.027; Guilty .018/.021 | Open item |
| Cringe (Embarrassed) | .027/.015 | Scared .047; Disgusted .023/.004 | The flinch sense |
| Empty (Numb) | 0/.007 | Lonely .032/.025 | One line of reason |

Dismissed as polysemy, antonym, or idiom: Misunderstood, Abandoned, Brave, Hatred, Cheated, Used, Conflicted, Inadequate, Inferior, Discouraged, Repulsed, Threatened, Desire, Aroused, Cared for, Accepted, Loved, Elated, Impatient, Panicked, Encouraged. Not SWOW cues (checked only as responses): Exhilarated, Vindicated, Moved, Left out, Unappreciated, Disillusioned, Fed up, Appalled, Unmotivated, Burned out, Detached, Out of place.

## 4. Third outer words

- **Pass:** Safe (Calm), Vindicated (Relieved), Left out (Lonely), Unappreciated (Hurt), Miserable and Defeated (Down), Horrified (Shocked), Threatened (Vulnerable), Fed up (Frustrated), Hatred (Resentful), Contempt (Disgusted).
- **Pass only because the parent doesn't fit (a question 3 problem):** Flattered (Proud), Sorry for someone (Heartache), Impressed (Surprised).
- **No situation written yet, can pass once one is:** Powerful (after leading a meeting that went your way), Blessed, Provoked (a sibling needling you on purpose), Violated (someone went through your phone, which also shows Offended doesn't fit).
- **Fail on substance:** Blissful (Joy), Awe (Surprised; Amazed fits a night sky), Insignificant (Insecure), Uneasy (Anxious), Puzzled (Confused), Indifferent (Numb).

## 5. Close calls

- **A. Uneasy** (757/30). (1) Keep under Anxious and redefine both: Anxious "tense inside about what might go wrong"; Uneasy "a faint sense that something here isn't right, though nothing has happened" (a quiet street at night feels off); Apprehensive "nervous as something approaches". (2) Move to Uncomfortable as its third word, following SWOW, at the risk that Uncomfortable itself fits.
- **B. Stuck (213/361) or Trapped (424/203).** (1) Drop Stuck; "months of routine" maps to Frustrated or Bored. (2) Drop Trapped; Stuck takes "a job you can't leave", but Trapped is a rules example and far more used.
- **C. Jealous's second word.** Widen Jealous first. (1) Keep Suspicious (62/47) in the jealous sense ("you suspect the person you love is hiding something, and you feel jealous"), though its usual meaning is broader. (2) Possessive (21/1.7): "you want to keep someone you love to yourself, and you feel jealous of anyone near them" (jealous ← possessive .073).
- **D. Insulted** (89/12). (1) Keep under Offended: "Someone said something to put you down, and you feel offended." (2) Move to Hurt, following the sort and SWOW; Hurt would hold 4. Question 2 leans to (2), the layout to (1).
- **E. Violated** (60/3.5). (1) Keep under Offended, ending "…and you feel offended". (2) Move to Furious as its third word: "Someone crossed a line with you they had no right to cross, and you feel furious" (someone read your private messages).
- **F. Forgiven** (9.0/14.4). (1) Stay under Relieved. (2) Move to Grateful: "Someone let go of your mistake, and you feel grateful."
- **G. Vindicated** (61.6/2.5). (1) Relieved. (2) Proud, which has 3. Keep (1) unless vindication reads as pride.
- **H. Heartbroken** (34/68). (1) Grief. (2) Heartache, which fits a breakup better, only if Sorry for someone leaves.
- **I. Terrified's group.** (1) As is, with Frantic redefined to fear only. (2) Swap Frantic for Petrified (4.6/63): "so scared you can't move". (3) Move Horrified to Terrified ("…and you feel terrified") and drop Frantic; Shocked keeps Startled and Stunned.
- **J. Loved** (371/53). (1) Drop it; "I love you" maps to Connected. (2) Rename it Cherished (38/1.7): "Someone holds you dear, and you feel connected."
- **K. Moved** (105). (1) Keep under Compassion as "someone's suffering or courage stirred you, maybe to tears", remapping the kindness situations to Grateful. (2) Move to Grateful as its third word: "someone's kindness stirred you, maybe to tears, and you feel grateful"; Compassion would then need a second word.

## 6. Method notes and limits

- Body wheel paths, translations, `situations.json`, cards, and the scripts weren't among the inputs. Pleasantness figures were taken from derived-wheel.md, not re-run.
- Parrott's subgroups (regret with guilt; homesickness, insult, and insecurity in "neglect"; horror with terror and panic; anxiety, uneasiness, and apprehension together) come from the agent's knowledge of his widely reproduced table.
- Many definitions are fragments without "you" (Joy, Awe, Terrified, Vulnerable, Lost); not counted as failures.
- Hopeful and Hopeless, Motivated and Unmotivated, and Down and Let down aren't repeats, but a crude stemmer would flag them, so the Once check should lemmatize.

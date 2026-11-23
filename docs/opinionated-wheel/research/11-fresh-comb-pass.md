# Fresh comb pass on the current wheel

(Written on 2026-11-22 by a fresh agent, saved here by the main session because the agent couldn't write files. Lucas asked for it because [research/8](8-comb-pass.md) judged an older wheel with older tests. It had the current [rules.md](../rules.md), [derived-wheel.md](../derived-wheel.md) and its JSON, `situations.json`, reports 1 to 10, and the datasets, including the Zupan et al. 2022 ratings and Trampe et al. 2015 daily reports. It judged the 161-word wheel: 6 cores, 45 middle words, 110 outer words. Its scripts and a count for every label were in the session scratchpad.)

Counts are Google Books 2018–22 per billion, **feel / I was** ("feel" is feel + feeling + felt). Zupan figures are Study 1: the share of raters whose top pick was each category. SWOW figures are association strengths, fwd/bwd.

## Settled fixes, ranked

1. **The book counts spike in 2019 and 2020, which hides flags.** Count with the median across years. "feel heartache" by year: 2.5, 104, 331, 4.9, 3.3 (mean 89, median 5). "feel wronged": 25, 478, 1456, 36, 32, so the 408 cited for it was the spike; in normal years it's below Offended and Insulted. Disgusted is 251 by mean, 89 by median; Indignant 66 → 36; Suspicious 62 → 32; Hatred 41 → 28; Heartbroken 34 → 24. With the median, three more words are rare (both counts under 15) and need a reason: Heartache (5 / –), Disillusioned (14.4 / 5.5), Apologetic (13.2 / 1.2). Control phrases rise only about 2x in 2020 ("feel sad" 411 → 911), so comparisons on the mean are mostly safe; rare flags aren't. *(The main session confirmed the spike with its own query: "feel heartache" 1.3, 62, 189, 2.5, 1.6.)*
2. **Heartbroken can't stay under Grief beside a middle word labeled Heartache.** People choose by label: someone heartbroken scanning Sad sees "Heartache", taps it, and finds Homesick, Nostalgic, and Sorry for someone. SWOW: heartache → broken .021, breakup .017. The fix is close call E.
3. **Situations that wouldn't reach their word:** "someone praises your work" → Valued (people tap Proud; map it to Proud); "you win an award at work" → Honored via Grateful (Proud; SWOW honor → pride .063). Give Honored a situation where gratitude leads, such as being asked to be godparent to a friend's child.
4. **Intrigued fails question 4 beside Curious** (intrigued → curious .176, interested .180): being intrigued is having your curiosity piqued. Replace it with **Fascinated**, "something holds your attention so fully you can't look away" (3.3 / 216). "Fascinated but not curious" (watching a fire) and the reverse both pass.
5. **Suspicious, as defined, fails questions 2 and 3 under Jealous:** Zupan Fearful 53%, Angry 18% (distrusting: Fearful 57%); its associations are criminal, suspect, shifty, sneaky, with Jealous at .003. Close call I.
6. **Blessed belongs under Grateful,** now that Grateful is in Happy: its definition is gratitude with no one to thank (blessed → grateful .011/.004, satisfied 0/0), and as Satisfied's third word it names no situation. Make it Grateful's third word: "You have good things in your life that no one in particular gave you, and you feel grateful" (looking around the table at a holiday dinner).
7. **Empty points to Sad, not Bad:** Zupan Sad 69%, Neutral 10% (mean Sad 7.48), while the numb-sounding words score Neutral (blank 75%, emotionless 53%); SWOW empty → lonely .032/.025, numb 0/.007. Close call D.
8. **Third words with no situation:** Cringe (a friend's wedding toast goes badly), Provoked (a sibling pokes at you to get a rise), Powerful (close call B).
9. **Definitions that lean on another word or restate their parent:**
   - Ashamed uses the Bad core's label and Guilty's wording: "you feel low about who you are, not just about something you did."
   - Embarrassed and Cringe use "awkward", the label of Awkward under the sibling Uncomfortable.
   - Appalled is its parent's definition with "saw" added: "you can't believe how cruel or wrong something was, and you feel disgusted."
   - Repulsed is physical Disgusted's definition without the example: "so disgusted you have to get away from it."
   - Desire restates the core Love: "you want someone, romantically or physically."
   - Threatened restates the core Scared: give it a cause and end with its parent's feeling.
   - Exposed ends with "unsafe": end it with "vulnerable".
   - Overwhelmed's "at once" rules out its own child, Burned out ("months of strain"): "too much is coming at you, and you feel you can't cope."
10. **"Someone hurts you so badly you want them to suffer" → Hatred** is revenge, and no one wanting revenge would tap Disgusted. Rewrite it to fit Hatred's definition ("who someone is"). Hatred's own question 3 is weak (resentment → hate .088, disgust → hate .022), but Resentful is full.
11. **"You lose a contest you worked hard for" → Defeated** would land on Disappointed. Remap it, or rewrite it for Defeated ("after months of fighting it, you give up").
12. **More-common synonyms with no line of reason:** Detached (49 / 5) against Disconnected (114 / 6), 2.3x; Insignificant (37 / 2) against "feel small" (304 / 118); Foolish against stupid ("I was" 200 against 69, much of it self-judgment); Conflicted (109 / 24) against Torn (102 / 111), whose recorded reason ("usually means ripped") is false in these frames.
13. **Cringe's reason needs evidence that people say it about themselves:** question 1 itself lists "that's cringe" as not a feeling ("I'm cringing", "secondhand embarrassment").
14. **43 definitions are fragments with no "you"** (rules: "one sentence, to 'you'"): Happy, Love, Sad, Bad; Joy, Cheerful, Playful, Excited, Exhilarated, Empowered, Powerful, Calm, Determined; Affection, Tenderness, Compassion, Connected, Attracted, Desire; Heartache, Homesick, Nostalgic, Sorry for someone, Down, Miserable, Inferior; Anxious, Dread, Nervous, Apprehensive, On edge, Terrified, Vulnerable; Furious, Envious; Restless, Unmotivated, Confused, Conflicted, Lost, Empty, Awkward, Apologetic. Fulfilled describes a condition.
15. **Holds:** pleasantness re-run has no failures (lists disagree on Awe, Nostalgic, Apologetic; near neutral: Aroused, Homesick, Apprehensive, Startled, Exposed; 15 unscored). Every word tagged as what happened ends with its parent's feeling. Offended and Insulted under Angry now have direct evidence: Zupan offended Angry 71%, Sad 18%; insulted Angry 61%, Sad 27%; daily reports, offense with anger .20, sadness .10. That answers research 8's leaning toward Hurt.

## Close calls

- **A. Anxious and Nervous (Scared).** Each is the other's top association (anxious → nervous .219, nervous → anxious .137), stronger than the rules' failing example, Puzzled → Confused; Zupan scores them alike (Fearful 71%, 72%). But "nervous but not anxious" (jitters before a date) and the reverse (a week of background worry) both pass, and Nervous is tied to an event ("I was nervous" 426). Counts: Anxious 642 / 271, Nervous 486 / 426. (1) Keep both, with that usage line as the reason. (2) Merge into Anxious, holding Worried, Dread, and On edge; Apprehensive goes, Insecure goes to Sad → Inadequate.
- **B. Empowered and Powerful (Happy → Confident).** Empowered "able to act and make things change" (281 / 6.6); Powerful "strong and in charge" (187 / 9.3). The labels share "power" at a glance, Powerful has no situation, and "feel powerful" often means status; but SWOW doesn't link them (0/.004; powerful → strong .208). (1) Keep both and write Powerful's situation (leading a meeting where everyone follows your call). (2) Drop Powerful.
- **C. Uneasy: Bad → Uncomfortable, or Scared → Anxious** (757 / 30, median 590). For Scared: Zupan Fearful 76% (mean 7.70), more than Anxious or Nervous; fear-family associations total about .21; its cause is sensing danger. For Bad: its strongest single association is uncomfortable (.116/.054), but Uncomfortable itself is Fearful 63%, so the ratings can't separate Bad from Scared for unsettled words. Under Scared it would be Anxious's third word. The checker leans to Scared.
- **D. Empty (Bad → Numb, beside Detached).** "Hollow, as if something is missing" (406 / 29); Zupan Sad 69%; SWOW lonely .032. (1) Keep it under Numb, with that as its reason. (2) A split: the same definition under Numb and in Sad, under Grief if Heartbroken leaves it ("I feel empty since she died").
- **E. Heartache and Heartbroken (Sad).** Heartache: Homesick, Nostalgic, Sorry for someone; Heartache is rare by median (5). Grief: Heartbroken (34 / 68; Zupan Sad 79%, mean 8.66) and Devastated. Homesick links to Lonely (.068) more than to Heartache (.004). (1) Keep the structure and answer the rare flag ("heartache" is a noun people use, not a word said after "I feel"). (2) Swap Heartbroken and Sorry for someone: Heartache holds Heartbroken, Homesick, and Nostalgic (a lost love, home, the past), and Grief holds Devastated and Sorry for someone ("sorry for your loss"). Against it: Sorry for someone also covers pity with no loss.
- **F. Insecure: Scared only, or split.** Now under Scared → Nervous. Zupan ties (Fearful 46%, Sad 37% by share; by mean Sad 6.76, Fearful 6.72); SWOW favors Scared; the sorting put insecurity with sadness. (1) Scared only, Lucas's call of 2026-11-22. (2) Both, its split home Sad → Inadequate.
- **G. Cared for: Happy → Grateful, or Love → Affection.** Under Love: "someone looks after you with care, and you feel their affection" (a partner brings you soup when you're sick). For Love: caring → love .084, loving .073, and with Loved barred, Love has no word for being loved apart from Connected's children. For Happy: Zupan "caring" Happy 87% (no Love option, and it's the giver's word), and its situation is about gratitude.
- **H. Moved (Love → Compassion), and Sympathy.** Moved's situations (a kind act or a reunion; a thoughtful gift) involve no suffering, so they fail question 3. (1) Keep it, narrowed to "someone's suffering or courage stirred you, maybe to tears", remapping those situations. (2) Move it to Grateful ("someone's kindness stirred you, maybe to tears, and you feel grateful"), which conflicts with Blessed for the third slot, and Compassion would need a second word. Related: Sympathy is barely different from its parent or from Sorry for someone (sympathy → sorry/pity .043/.059; Zupan sympathetic Happy 33%, Sad 33%); if both stay, Sympathy is with someone, Sorry for someone is from a distance.
- **I. Suspicious under Jealous.** (1) Narrow it to the jealous sense: "you suspect the person you love is hiding something, and you feel jealous" (62 / 47; median 32); people in the general sense still go to Scared and find nothing. (2) Replace it with Possessive: "you want to keep someone you love to yourself, and you feel jealous of anyone near them" (21 / 1.7; possessive → jealous .073).

## Which core people would tap, for all 45 middle words

| Core now | Middle word | Core people would tap | Strength | Basis |
|---|---|---|---|---|
| Happy | Joy | Happy | Strong | Zupan Happy 95% |
| Happy | Cheerful | Happy | Strong | Happy 95% |
| Happy | Excited | Happy | Strong | Happy 89% |
| Happy | Proud | Happy | Strong | Happy 95%; pride with satisfaction .24 |
| Happy | Confident | Happy | Strong | Happy 90% |
| Happy | Satisfied | Happy | Strong | Happy 65%, Neutral 30% |
| Happy | Calm | Happy | Moderate | Neutral 54%, Happy 36% |
| Happy | Relieved | Happy | Strong | Happy 79% |
| Happy | Hopeful | Happy | Strong | Happy 82% |
| Happy | Motivated | Happy | Moderate | Inspired Happy 90%, determined 59% |
| Happy | Interested | Happy | Weak | Happy 49%, Neutral 42% |
| Happy | Amazed | Happy | Strong | Happy 77% |
| Happy | Grateful | Happy | Strong | Happy 91%; with joy .15, love .03 |
| Love | Affection | Love | Strong | SWOW love .281 |
| Love | Compassion | Love, Sad second | Moderate | SWOW love .157; sorting with sadness |
| Love | Connected | Love | Moderate | SWOW love .033 |
| Love | Attracted | Love | Moderate–strong | SWOW love .080 |
| Sad | Lonely | Sad | Strong | Sad 75% |
| Sad | Hurt | Sad, Angry second | Strong | Sad 63%, Angry 23% |
| Sad | Disappointed | Sad | Strong | Sad 64%, Angry 26% |
| Sad | Grief | Sad | Strong | Sad 84% |
| Sad | Heartache | Sad | Moderate | SWOW sad .077, love .133 (its target) |
| Sad | Down | Sad | Strong | Sad 68%; nearly the core's synonym, so its reason should say "little energy" narrows it |
| Sad | Ashamed | Sad | Moderate | "Shameful" Sad 58% |
| Sad | Inadequate | Sad (or Bad) | Weak | SWOW bad .032, sad .004 |
| Scared | Anxious | Scared | Strong | Fearful 71% |
| Scared | Nervous | Scared | Strong | Fearful 72% |
| Scared | Terrified | Scared | Strong | Fearful 65% |
| Scared | Shocked | Scared | Weak | Three-way split; the sorting and the Fear core's question carry it |
| Scared | Vulnerable | Scared | Moderate | Fearful 56%, Sad 21% |
| Angry | Annoyed | Angry | Strong | Angry 79% |
| Angry | Frustrated | Angry | Strong | Angry 85% |
| Angry | Furious | Angry | Strong | Angry 82% |
| Angry | Resentful | Angry | Strong | Angry 74% |
| Angry | Offended | Angry | Moderate–strong | Angry 71%; offense with anger .20 |
| Angry | Jealous | Angry, Scared second | Moderate | Angry 49%, Fearful 21% |
| Angry | Disgusted (moral) | Angry | Moderate | Angry 67%; Nabi 74% |
| Bad | Bored | Bad | Strong | Neutral 76% |
| Bad | Overwhelmed | Bad, leaning Scared | Weak | Sad 35%, Fearful 31%, Neutral 19% |
| Bad | Confused | Bad | Moderate | Four-way split |
| Bad | Numb | Bad | Moderate | Emotionless Neutral 53%, blank 75% |
| Bad | Uncomfortable | Bad, Scared second | Weak | Fearful 63%; no catch-all offered |
| Bad | Embarrassed | Bad | Weak–moderate | Fearful 46%, Sad 29%; daily reports with sadness about 0 |
| Bad | Guilty | Bad | Weak–moderate | Fearful 45%, Sad 36%; "feel bad about" 742, "feel guilty about" 730 |
| Bad | Disgusted (physical) | Bad | Moderate | Nabi: "grossed out" 92% disgust |

Outer words whose likely core differs from their middle word's: clear for Suspicious (Scared), Empty (Sad), Uneasy (Scared), and Remorse (Sad 70%, though it stays with Guilty by question 3: remorse → guilt .088); ties for Helpless (Sad 42%, Fearful 39%), Insecure, and Lost (Fearful 38%, Sad 31%).

## Situations that don't reach their word

- **Fail:** praise for your work → Valued; an award → Honored; a breakup → Heartbroken via Grief; a lost contest → Defeated; wanting them to suffer → Hatred; a kind act or a gift → Moved; going through the motions → Empty via Bad; a quiet street feels off → Uneasy via Bad.
- **Weak:** a loved one in trouble → Helpless (more likely Anxious → Worried); mocked → Humiliated via Ashamed (humiliation → shame .147, embarrassment .112); Remorse via Bad; flirted with → Flattered via Proud; proven right → Vindicated via Relieved (Proud); unnoticed housework → Unappreciated via Hurt (Resentful as likely); can't settle → Restless via Bored; private messages read → Violated via Furious (Offended as likely).
- **Door risks by design:** Embarrassed and Guilty via Bad, Overwhelmed via Bad, Shocked, Nostalgic, Compassion and Sympathy, Protective.

## Missing words

- **Wronged** (median 36 / 4): covered by Offended ("wronged you") and Resentful; the 408 was the spike.
- **Bittersweet** (6.9 / 0, rare): missing. The rules' mixed-feelings note now allows it on one side with a reason; nothing covers a present ending (your youngest leaves home). Its home would be Sad → Heartache, which needs a free slot (close call E).
- **Stressed** (205 / 48): covered by Overwhelmed (658); Overwhelmed's card could name "stressed".
- **Fascinated** (3.3 / 216): passes now; in place of Intrigued.
- **Livid** (1.1 / 41): covered by Furious ("I was furious" 214).
- **Smitten** (1.3 / 35), **Infatuated** (1.3 / 17): covered by Attracted.
- **Loved** (371 / 53): blocked by the Once check; covered only by Connected's children unless Cared for moves into Love (close call G).
- Also covered: Disconnected (fix 12), Small, Unsafe, Drained, Invisible, Unloved, Excluded, Torn, Emotional (an umbrella), Paranoid.

## Method notes

- Zupan offered no Love or Bad. Neutral stands in for Bad only for low-energy states; for unpleasant words it shows which of Sad, Angry, and Fearful is closest, so a clear win (65% or more) suggests people would tap that core rather than the catch-all, and a spread supports Bad. That's the checker's reading, not the study's.
- Trampe covers 18 emotions; its Anxiety row is odd (negative with nearly every other negative emotion), so it wasn't used.
- Many wheel words aren't SWOW cues (Exhilarated, Moved, Startled, Violated, Cringe); for those only responses pointing to them were used.
- All 159 labels and about 100 candidates were re-fetched with both counts; non-feeling phrases weren't subtracted.
- Not checked: body wheel paths, translations, cards, ISEAR and EmpatheticDialogues, Shaver's and Parrott's original tables.

# A feelings wheel derived from the rules

The candidate wheel, built from [rules.md](rules.md), the research in [research/](research/), the word data, and Lazarus (1991), not from the app's current wheel. Scripts are in [scripts/](scripts/) (`check.py`'s output is `check-report.txt`). Open items are in [handoff.md](handoff.md).

**Rule numbers below are the old numbered rules** (in `rules.md` at commit 0107189), replaced on 2026-11-21 by the looser set in [rules.md](rules.md). In the new set: 1 is the pleasantness check; 2 is question 1; 3 is the what-happened words; 4 and 5 are the cores; 6 is question 2; 7 is question 3; 8 is question 4; 9 is Always 3; 10 is the usage flags; 11 and 12 are question 5; 13 is the situations; 14, 15, and 16 are Always 5, 6, and 7. The placements here haven't been rechecked against the new set yet.

**6 cores, 45 middle words, 111 outer words: 162 words, with Disgusted, Betrayed, and Empty twice on purpose.** (2026-11-22: Lucas's calls and the comb pass; see [learnings.md](learnings.md#lucass-decisions) and [research/8](research/8-comb-pass.md).) **Before that: 6 cores, 44 middle words, 116 outer words.** Three spots hold 4 outer words, one more than the layout allows: Connected (Understood came back), Disappointed, and Embarrassed. See [handoff.md](handoff.md). (Before Lucas's decisions of 2026-11-20: 6/44/112, 162. First draft 6/43/109, 158.)

**Moved in the revision before:** Insecure (with its outer words) to Sad; Valued to Connected; Regret to Disappointed; Horrified to Shocked; Homesick and Nostalgic to Heartache; Abandoned to Lonely; Unappreciated to Hurt; Hatred to Resentful; Eager to Motivated; Moved to Compassion; Blessed to Satisfied; Overwhelmed to a middle word.

## Lucas's decisions of 2026-11-20, and the layout limit

The record of Lucas's decisions, with reasons, is in [learnings.md](learnings.md#lucass-decisions).

- **Kept:** Resentful, Amazed, Furious, Empowered, Hopeless, Left out. Grateful stays under Love; Hatred stays under Resentful.
- **Added:** Powerful (Confident), Accepted (Connected), Insignificant (Insecure), Provoked (Annoyed), Violated (Offended), Disillusioned (Disappointed), Cringe (Embarrassed), Aroused (Attracted).
- **Out:** Lust (replaced by Aroused). Excluded, Weak, Skeptical, and Dismayed stay off the wheel.
- **Definitions:** Left out and Rejected as Lucas worded them, and Hatred as "lasting anger at who someone is, not just what they did". Every word whose definition names what happened to you now ends with the feeling it causes (37 definitions rewritten, Left out and Rejected among them).

**The layout limit:** a middle word has 2 or 3 outer words, never 4, and a third word has to earn its place: it passes the rules and names something no other word on the wheel does (rules 8 and 13). `check.py` now fails any middle word with more than 3, or fewer than 2.

The additions left four middle words with 4 outer words. Each was resolved in this order: move a word to the spot it fits next best (rule 7); split the middle word, if both halves pass the rules and each keeps 2 outer words; drop the weakest word by rule 8 (overlap) or rule 10 (use as a feeling). Where it came down to words within twice each other's use (Lucas's line), the choice is his.

1. **Love → Connected** (Loved, Understood, Valued, Accepted). **Understood went (rule 10), and came back.** *Lucas, 2026-11-20: Valued and Understood don't mean the same thing at all.* Rule 10 only decides between words that mean the same, so dropping Understood for being less used was a misreading. Connected is back to 4 and still needs a move or a split. The reasoning below is the rebalancer's, kept for the record.
   - Move: none fits elsewhere. "Valued is a kind of Grateful" doesn't read true (rule 7), and Grateful's Honored already names being recognized.
   - Split: the definition does have two halves, close to someone (Loved, Understood) and part of something (Valued, Accepted), but no label for the second half passes. Included, Welcome, Respected, and Appreciated name what others did, so they're outer words only (rule 3). Belonging doesn't read after "I feel" (rule 11) and is rare (8 per billion). At home has another meaning (rule 11).
   - Rule 8: no two overlap. Lucas ruled Accepted apart from Loved and Understood, and people often feel loved but not valued.
   - Rule 10: Understood (76 per billion) is the least used. Valued (197) is used 2.6 times as often, and Loved (373) about 5 times. Accepted is Lucas's addition, so it isn't on the table.
   - No situation names Understood. Misunderstood (Sad → Lonely) still covers not being understood.
2. **Angry → Offended** (Insulted, Disrespected, Indignant, Violated). **Disrespected goes (rule 8).**
   - Move: Indignant's next best is Furious, but Outraged, its stronger form, is there (rule 8). Insulted's next best is Sad → Hurt (English sorts insult with sadness), which would then hold 4.
   - Rule 8: Disrespected is the general case of its siblings. An insult is disrespect in words, and a violation is disrespect that crosses a line. It's also barely more specific than Offended itself ("wronged by someone's words or actions"), and the further-out word has to be more specific. It's the least used of the four, too (39; Violated 60, Indignant 66, Insulted 89).
   - Offended's definition now says "disrespected or wronged", and the situation "Someone talks down to you or ignores your boundaries" maps to Offended.
3. **Sad → Disappointed** (Let down, Discouraged, Regret, Disillusioned). **Lucas decides** (see What the rules couldn't decide).
4. **Sad → Embarrassed** (Foolish, Mortified, Humbled, Cringe). **Lucas decides** (see What the rules couldn't decide). The record names Connected, Disappointed, and Offended; Cringe gives Embarrassed a fourth word too.

**Checking every other middle word:** none has more than 3. Two third words don't earn their place:
- **Motivated → Eager goes (rule 8).** "Keen to start right now" is its parent, Motivated ("you want to get going"), and Excited covers the energy. No situation names it. The checker's report found this before ("duplicates Motivated"). Motivated keeps Inspired and Determined.
- **Overwhelmed → Frazzled goes (rule 8).** "Worn ragged by too many demands" is its parent, Overwhelmed ("too much at once"). Burned out names the long-term version and Pressured the cause. No situation names it, and it's used 9 times per billion. Overwhelmed keeps Pressured and Burned out.

**Moved:** nothing. No move passed rule 7 without breaking rule 8 or overfilling the next spot.

**Middle words that keep 3**, and what the third word names that nothing else on the wheel does:
- Joy: Blissful is the only calm joy (Delighted is joy at news, Elated is the high).
- Proud: Flattered is the only pride from someone's praise or interest (being flirted with).
- Confident: Powerful (Lucas, 2026-11-20).
- Satisfied: Blessed is the only gratitude with no one to thank (Lucas kept it under Happy).
- Calm: Safe is the only calm that comes from nothing being able to hurt you (a safe place).
- Relieved: Reassured, Forgiven, and Vindicated are three different causes, each with a situation (a clear result, forgiveness, being proven right).
- Connected: Valued is the only word for mattering to others (praise, a confidence shared).
- Lonely: Left out (Lucas); Misunderstood and Abandoned each have a situation.
- Hurt: Unappreciated is the only word for unnoticed effort (a forgotten birthday, unnoticed housework).
- Heartache: Sorry for someone is the only Sad word for someone else's pain.
- Down: Hopeless (Lucas); Miserable (weeks of pain) and Defeated (a lost contest) each have a situation.
- Insecure: Insignificant (Lucas).
- Anxious: Uneasy is the only fear not tied to one worry or one coming event, and it's used 759 times per billion.
- Shocked: Startled (a jolt), Stunned (frozen), and Horrified (sickened) are three different reactions.
- Vulnerable: Helpless, Exposed, and Threatened each have a situation.
- Annoyed: Provoked (Lucas).
- Frustrated: Stuck (no way forward), Trapped (a job you can't leave), and Fed up (the same problem) each have a situation.
- Resentful: Hatred (Lucas).
- Offended: Violated (Lucas); Insulted (an insult) and Indignant (wrongly blamed) each have a situation.
- Confused: Puzzled (Lucas settled Puzzled over Perplexed); Conflicted and Lost each have a situation.
- Numb: Detached is the only word for being cut off from yourself, and Indifferent the only one for not caring either way.

## The cores and why

**Settled by Lucas, 2026-11-21:** these six, with Bad keeping its name over Off.

**Order and colors, Lucas, 2026-11-26:** clockwise from the start, Happy, Angry, Love, Sad, Bad, Scared, so that opposites face each other (Happy and Sad, Love and Scared, Angry and Bad) and the colors run around like a color wheel: orange, red, pink, indigo, teal, green. Bad changed from purple to teal, which also ends its closeness to Sad's indigo, and the body wheel's Throat moved from teal to a muted violet to make room. The reasons are in [learnings.md](learnings.md#lucass-decisions).

Rule 5: a core is a family people sort feelings into, or the Bad door. Evidence: card sorts in English (Shaver et al. 1987), Indonesian (2001) and Basque (Alonso-Arbiol et al. 2006, which restates all three trees).

| Core | Decided by | Label check (rules 5 and 10) |
|---|---|---|
| **Happy** | Joy family in all three; holds contentment, relief, pride. | happy 1,030 per billion (glad 118, joyful 30); 97% of children aged 4–6 know it. |
| **Love** | A family in all three (12–21% of terms), not Chinese; all pleasant. | love 216 (loving 10); "Loved" is outer (rule 3); 97%. |
| **Sad** | Sadness; English adds shame, guilt, embarrassment, loneliness, rejection, insecurity, insult, pity. | sad 1,128 (down 272, unhappy 102); 100%. |
| **Scared** | Fear, with shock and horror. | scared 290, afraid 284, fear 409, fearful 49 (rule 10 flags it); children know Scared best (93%; afraid 75%, fear 50%). |
| **Angry** | Anger, holding disgust, contempt, envy, jealousy in all three. | angry 551 (mad 28); 88%. |
| **Bad** | Rule 4's door; 5 specific unpleasant middle words. | bad 3,103; not in Baron-Cohen. |

**Rejected:**
- **Surprised** fails rule 5 (too small) and rule 1 (surprises come pleasant and unpleasant, as the Basque authors note). English found "a very small surprise category" of three words. Basque found a small, distinct, pleasant surprise group (2 terms, 2%) near the pleasant–unpleasant line, whose words also often sorted with fear. Indonesian had none only because the word missed the cut-off. So pleasant surprise is a middle word under Happy (+.57/6.57), as in English and Basque, and unpleasant surprise is Shocked under Scared (rule 6).
- **Disgusted:** inside anger in all three sorts; a middle word under Angry.
- **Shame:** a family only in Chinese; under sadness in English and Indonesian, near fear in Basque.
- **Calm:** inside joy in English and Indonesian; Basque's tranquility group is small (4%).
- **Knowledge feelings** (surprise, interest, confusion, awe): no sorting family, and mixed valence.

**Rule 6's questions for these cores:**
- **Happy:** something good happened, or things are going well.
- **Love:** someone matters to you, or you matter to someone.
- **Sad:** you lost something or someone, someone hurt you, you let yourself or others down, or you doubt you're enough.
- **Scared:** something might hurt you, or something sudden happened that might be bad.
- **Angry:** something's unfair or in your way, or something's gross or wrong and you want it away.
- **Bad:** something's off and no other question fits.

## The wheel, with definitions and data

**Definitions** (2026-11-23), by the rethought rules ([rules.md](rules.md), Definitions): each describes the feeling itself, and the first wheel's definition is reused where it still fits. A writer drafted all 162 (50 reused as written, 23 adapted, 89 new), a cold checker tested them against the rules and each word's reason, and 34 were fixed from that check: mostly parents that swallowed a child's meaning (Shocked used Stunned, Interested was Curious's meaning, Furious was Rage's), and meaning decisions the draft had dropped (Helpless covers someone you love; Violated is a line crossed, not something taken). Empty now has two definitions, one in each place. The 2026-11-22 sentences are in git history.

Brackets: NRC valence (−1 to 1) / Warriner valence (1–9, 5 neutral) / Google Books "feel, feeling, felt ___" per billion, 2018–2022; a dash is unscored. These are the older mean-year counts; `scripts/check-report.txt` has the median-year counts and "I was ___" for every word. R3: what someone did to you (rule 3), outer only, defined by the feeling it causes.

**`check.py` (2026-11-22, by [rules.md](rules.md)'s checks and flags; output in `scripts/check-report.txt`):** no failures. 42 flags, each answered by a line in its word's entry: 9 rare (both counts under 15: Playful, Forgiven, Tenderness, Disillusioned, Heartache, Provoked, Unmotivated, Apologetic, Squeamish), 10 more common words to compare (each a different meaning or strength), 22 on pleasantness (unscored, the lists disagree, or near neutral), and Bad missing from Baron-Cohen. Cringe is exempt from the counts.

- **Happy**: light and good, with a sense of pleasure or well-being. (+.98/8.47/1030)
  - **Amazed**: surprised in a good way by something you didn't expect or think possible. (+.59/7.55/16; "I was amazed" 506) Lucas, 2026-11-22: replaces Surprised, which is both pleasant and unpleasant ("I was surprised" mostly means only "I didn't expect it"), an umbrella like Stressed. Its card points to Shocked (Scared) for a bad surprise. Lucas, 2026-11-20: kept over Astonished.
    - **Awe**: wonder at something vast, beautiful, or powerful, sometimes with a touch of fear. (−.06/6.85/21) Lists disagree; stays.
    - **Impressed**: full of admiration for how good or skilled someone or something is. (+.61/6.66/18) The loosest fit in the group: milder than its parent.
  - **Interested**: drawn in by something, and wanting to keep paying attention to it. (+.50/6.83/27)
    - **Fascinated**: held so fully by something that you can't look away. (+.62/–/3.1; "I was fascinated" 216) Replaces Intrigued, which is Curious's strong form (intrigued → curious .176): you can't feel intrigued without feeling curious. "Fascinated but not curious" (watching a fire) and the reverse both pass. The old rule cut it as rare in the "feel" frame alone (2026-11-22, fresh comb pass, [research/11](research/11-fresh-comb-pass.md)).
    - **Curious**: drawn to explore something new or unknown. (+.27/6.58/53)
  - **Excited**: eager and full of energy about something. (+.82/8.11/256) Definition: "about what's coming" contradicted Exhilarated's "in the moment" (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Thrilled**: very excited and pleased, often about news or something ahead. (+.80/–/20)
    - **Exhilarated**: feeling a rush of excitement in the moment, often from something fast or daring. (+.78/6.90/47)
  - **Joy**: great happiness that fills you, bright and strong. (+.96/8.21/154) Rule 10: 5.1x as common as "joyful".
    - **Elated**: so happy you feel lifted off the ground. (+.58/6.56/92)
    - **Delighted**: very happy about something good that just happened, like news or a nice surprise. (+.94/7.74/28) Flag: "pleased" (148) is milder, so it's not the same feeling.
  - **Cheerful**: in a light, upbeat mood. (+.99/8.00/21)
    - **Amused**: finding something funny, maybe enough to laugh. (+.88/7.05/20)
    - **Playful**: in the mood to joke around and have fun. (+.78/7.63/12) Under 15: said with "I'm".
  - **Satisfied**: pleased that you got what you wanted or needed. (+.92/7.16/308)
    - **Fulfilled**: deeply satisfied that your life or work feels meaningful. (+.79/–/82)
    - **Content**: satisfied with how things are right now. (+.53/6.70/104) 6x contented; rule 10 outranks 11.
  - **Calm**: settled and steady inside, with nothing bothering you. (+.75/6.89/253)
    - **Relaxed**: loose and unhurried, with no stress or tension. (+.73/7.25/319)
    - **At peace**: calm and settled, without inner conflict. (+.48/–/172) 2.4x as common as "peaceful".
    - **Safe**: R3. calm and sure that nothing here can harm you. (+.80/7.70/2923) Tagged as the situation you're in (rules.md names it) (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
  - **Relieved**: lighter because a worry or danger has passed. (+.79/–/801)
    - **Reassured**: R3. less worried because someone or something eased your doubts. (+.71/–/139)
    - **Vindicated**: R3. relieved to be proven right after others doubted you. (+.23/–/62) New (coverage gap); relief at doubt lifting.
    - **Forgiven**: R3. lighter because someone has let go of a wrong you did. (+.50/–/9) Under 15: said as "they forgave me".
  - **Grateful**: glad and thankful for something good you received or have. (+.92/7.50/339) Lucas, 2026-11-22: moved from Love by question 2. In daily reports gratitude comes with joy five times as strongly as with love (.15 against .03), recalled gratitude is most often called "happiness" (42%), and people link grateful to happy about six times as strongly as to love ([research/10](research/10-which-core-people-tap.md)). Algoe's "find, remind, and bind" is what gratitude does, not which core people tap.
    - **Blessed**: thankful for the good in your life, and lucky to have it. (+.82/7.50/156) Moved from Satisfied: it's gratitude with no one to thank (blessed → grateful .011/.004, satisfied 0/0). Its third-word situation: looking around the table at a holiday dinner (2026-11-22, fresh comb pass, [research/11](research/11-fresh-comb-pass.md)).
    - **Honored**: R3. proud and grateful that someone chose or recognized you. (+.88/–/126)
  - **Hopeful**: believing that something good can happen. (+.89/7.44/124)
    - **Encouraged**: ready to keep going, because a good sign or someone's support gave you hope. (+.91/–/92)
    - **Optimistic**: expecting that things will turn out well. (+.96/7.45/66)
  - **Motivated**: driven to act or to work toward something. (+.67/–/93)
    - **Inspired**: eager to create or do something, because someone or something showed you what's possible. (+.93/6.89/141)
    - **Determined**: firmly decided to do something, however hard it gets. (+.47/–/18)
  - **Proud**: pleased with yourself or someone close to you, and standing a little taller for it. (+.81/7.00/581) Widened so Flattered reads as Proud plus a cause (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Accomplished**: proud that you finished something that took real effort. (+.74/–/34)
    - **Flattered**: R3. pleased and a little proud that someone praised you or showed interest in you. (+.73/6.32/76) New (coverage gap).
    - **Triumphant**: proud and victorious after beating a rival or a hard challenge. (+.90/7.45/36)
  - **Confident**: sure of yourself and your abilities. (+.53/7.56/1149)
    - **Brave**: ready to face fear or difficulty and act anyway. (+.67/7.38/103)
    - **Empowered**: able to act for yourself and make a difference. (–/–/282) Unscored; empowerment +1.00. Lucas, 2026-11-20: kept over Powerful, which means something else.
    - **Powerful**: feeling strong and in charge of what happens. (+.57/6.46/188) New. Lucas, 2026-11-20. Indonesian sorts power with confidence under happiness; "Powerful is a kind of Confident" reads truer than "a kind of Proud" (rule 7). Lucas, 2026-11-22: kept. Its third-word situation: you lead a meeting and everyone follows your call. People don't link it to Empowered (0/.004), so they're different feelings despite the shared "power" ([research/11](research/11-fresh-comb-pass.md)).
- **Love**: warmth toward someone or something, a wish to be close, or the comfort of knowing someone cares about you. (+1.00/8.00/216) Lucas, 2026-11-25: widened from people to "someone or something", since people feel love for a pet, a home, a city, or a team; loving a moment is enjoyment and stays under Happy ([research/15](research/15-second-card-review.md)).
  - **Attracted**: drawn to someone's looks, personality, or both. (–/–/74) Unscored; attraction +.81/7.00.
    - **Desire**: wanting someone, romantically or sexually. (+.79/7.05/58) Not "wanting to be close", which restated the core Love (2026-11-22, fresh comb pass, [research/11](research/11-fresh-comb-pass.md)).
    - **Aroused**: feeling sexual excitement. (+.42/5.95/35) Lucas, 2026-11-20: replaces Lust, a stronger Desire. Redefined without "someone you want", Desire's target, and without "your body responds", which read as a body state (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)). Near neutral (+.42/5.95): the lists rate the word; feeling stirred by someone you're drawn to is pleasant.
  - **Affection**: a warm fondness you feel for someone or something, or that someone shows you. (+.80/7.89/38) 8x as common as "affectionate". "Warmth" (94) is used more, but mostly for a fire, the sun, or a place; "feel warmth toward" or "for" is under 1. Its card covers warmth shown to you as well as felt, so Cared for fits under it, and "or something" lets it hold a pet or a place (2026-11-25, [research/15](research/15-second-card-review.md)).
    - **Tenderness**: a gentle feeling that makes you want to be soft and careful with someone or something. (+.90/6.89/8) Flag, under 15: "tender" (40) mostly means sore; with "toward" it's 2.5x (7.4 vs 3.0), so rule 11 keeps the noun. Widened to "or something" with Love (2026-11-25, [research/15](research/15-second-card-review.md)).
    - **Protective**: wanting to shield someone or something you care about from anything that could hurt them. (+.69/6.53/94) Widened to "or something": pets, a home, a cause (2026-11-25, [research/15](research/15-second-card-review.md)).
    - **Cared for**: R3. warm and looked after, knowing someone is tending to you. (–/–/58) Unscored; care +.46/7.64. Lucas, 2026-11-22: moved from Happy → Grateful. With Loved gone, Love had no word for being loved outside Connected's group, and people link caring to love (.084) and loving (.073) ([research/11](research/11-fresh-comb-pass.md)). Its third-word situation: your partner brings you soup when you're sick.
  - **Connected**: close to someone, or part of something bigger. (+.63/–/405) 2026-11-22: Loved left, since it's the same word as the core Love (the Once check compares base forms; research/8); "I love you" maps to Connected.
    - **Valued**: R3. feeling that others see your worth and appreciate you. (+1.00/–/197) Lucas, 2026-11-20: kept over Respected (63). Ends with its parent (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Accepted**: R3. feeling welcomed and included as you are. (–/–/104) New. Unscored; acceptance +.67/6.84. Lucas, 2026-11-20: being welcomed as you are isn't being understood or loved (rule 8), and it's an everyday situation (rule 13).
    - **Understood**: R3. close to someone who knows what you mean, or who you really are. (+.56/–/76) Back, 2026-11-20 (see above). Ends with its parent (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
  - **Compassion**: feeling for someone who's suffering, with a wish to help. (+.47/7.90/140) Lazarus's theme.
    - **Moved**: deeply affected, maybe to tears, by someone's suffering or their courage through it. (+.52/–/105) Lucas, 2026-11-22: narrowed. Being moved by a kind act or a gift isn't compassion, so those situations map to Grateful and Connected ([research/11](research/11-fresh-comb-pass.md)). Its situation: a story of someone facing an illness bravely. Its card ties the courage to suffering ("their courage through it") so it sits under Compassion (2026-11-25, [research/15](research/15-second-card-review.md)).
    - **Sympathy**: concern for someone who's having a hard time, and a wish to comfort them. (+.65/6.57/167) Sharpened against Sorry for someone (Sad), which is from a distance ([research/11](research/11-fresh-comb-pass.md)).
- **Sad**: heavy with loss, disappointment, or hurt. (−.55/2.10/1128)
  - **Heartache**: an ache for someone or something you can't reach or can't make better. (−.82/3.23/90) Missing or caring, not a finished loss. Widened so Sorry for someone fits (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)). Rare after "feel" (5): it's a noun people use about their own feeling, "the heartache" (196), "my heartache" (29). "Sorrow" (61) is more common but means deep sadness at a loss, which is Grief's (its definition says "deep sorrow").
    - **Sorry for someone**: sad about someone else's pain or bad luck. (−.19/4.81/2897; data for "sorry") New (coverage gap). Rule 10 picks it over pity (290) and sad for (122); rule 9 gives this "sorry" its own label. Near neutral (−.19/4.81) because the lists score "sorry", which also means apologizing; feeling someone else's pain is unpleasant.
    - **Homesick**: missing home and the people there. (−.13/3.00/52) Near neutral in NRC (−.13), but Warriner puts it at 3.00, and missing home is unpleasant.
    - **Nostalgic**: longing for the past, with warmth mixed into the sadness. (−.08/6.68/60) Lists disagree; Basque sorts it with sadness.
  - **Grief**: deep sorrow after losing someone or something you love. (−.86/2.33/49)
    - **Heartbroken**: deep pain over losing a love or close bond, or something you had high hopes for. (−.84/1.95/34) Lucas, 2026-11-22: stays under Grief, though someone heartbroken may tap Heartache first (heartache → broken .021, breakup .017; [research/11](research/11-fresh-comb-pass.md)). Lucas, 2026-11-25: heartbreak isn't only about people; it's also "disappointment in anything you had high hopes for", so the card says so. Most heartbreak is still a love lost, which is who taps Grief ([research/15](research/15-second-card-review.md)).
    - **Devastated**: overcome with pain, as if everything has fallen apart. (−.76/–/34) Not "overwhelmed by grief", which borrowed Bad's Overwhelmed (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Empty**: hollow inside, as if something that should be there is missing. (−.62/3.78/406) The same word as under Bad → Numb (Lucas, 2026-11-22), with one definition for both since 2026-11-25: it's one feeling people split on, so by the two-places rule it gets one definition, not tied to a loss. Its third-word situation: you've felt empty since someone died.
  - **Lonely**: wanting closeness with others, and not having it. (−.50/2.67/565)
    - **Abandoned**: R3. on your own, after someone you counted on left you. (−.91/–/207)
    - **Misunderstood**: R3. lonely because others get the wrong idea about you, or about what you mean. (−.65/–/41)
    - **Left out**: R3. lonely because others are included and you aren't. (−.70/–/240) Lucas, 2026-11-20: kept over Excluded; deliberately shut out is Rejected. Lucas, 2026-11-25: the card no longer says "maybe by accident"; the labels carry the difference. Hurt from exclusion comes from feeling others don't value you (Leary et al. 1998), and how people explain it changes how they recover (Williams 2007).
  - **Hurt**: pained by something someone said or did. (−.88/2.45/265)
    - **Rejected**: R3. hurt at being pushed away or not wanted by someone. (−.80/2.40/134) Lucas, 2026-11-25: the card no longer says "on purpose"; being turned away is in the word.
    - **Unappreciated**: R3. hurt that others don't notice what you do for them, or how much you matter. (−.54/2.65/23) Often comes with resentment.
    - **Betrayed**: R3. hurt and angry because someone you trusted broke that trust. (−.76/–/337) Lucas, 2026-11-22: also under Angry → Resentful, since people split: raters picked Angry 54%, Sad 32% ([research/10](research/10-which-core-people-tap.md)).
  - **Disappointed**: sad that things didn't go the way you hoped, or that someone failed you. (−.86/2.65/228) Lucas, 2026-11-22: Let down left. It's the "someone didn't come through" case (people are let down by the system, the government, his, her), but people treat the two as near-synonyms (each is near the top of the other's associations), so someone let down is served by Disappointed itself, and Betrayed covers the stronger case. Its situation maps here.
    - **Disillusioned**: let down after learning the truth about someone or something you believed in. (–/–/15) New. Unscored; disillusionment −.90, disillusion −.67. Lucas, 2026-11-20: losing a belief isn't being let down by someone (rule 8). Rare in both counts (14.7 / 5.5): people say "became disillusioned" (59). Kept as the only word for losing a belief.
    - **Regret**: wishing you had done something differently. (−.54/3.41/126) Shame (274) and guilt (205) are more common but name other feelings: regret is wishing you'd chosen differently, even when no one was hurt and it says nothing about who you are.
    - **Discouraged**: less hopeful after a setback, and tempted to give up. (−.56/3.18/107)
  - **Down**: low and drained, with little energy for anything. (−.58/–/272) Narrower than Sad by its "little energy": the one Sad word for the flat, low kind.
    - **Hopeless**: sure that nothing will get better. (−.81/2.20/163) Lucas, 2026-11-20: kept over Despair.
    - **Miserable**: so unhappy that everything feels awful, and nothing seems to help. (−.88/2.60/150)
    - **Defeated**: beaten down by a loss or failure, with no strength left to try again. (−.79/2.59/147)
  - **Inadequate**: feeling that you're not good enough, or can't do what's needed. (−.76/2.57/196) Lucas, 2026-11-22: a middle word for worth, replacing Insecure, which moved to Scared → Nervous. People link inadequate, inferior, and insignificant to "not enough", "less", and "worthless", and to fear words almost not at all.
    - **Insignificant**: feeling small and unimportant, as if no one notices you. (−.83/3.64/37) Lucas, 2026-11-20: not feeling less than others (Inferior) or not up to a task (Inadequate). Sharpened against Worthless ("no value") (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)). "Feel small" (304) is more common but has other meanings (small next to someone, physically small).
    - **Inferior**: feeling that you're not as good as other people. (−.48/3.43/199)
  - **Ashamed**: feeling that something is wrong with who you are, not just with what you did. (−.69/2.52/937) Not "you feel bad about yourself", which used the Bad core's label and Guilty's wording (2026-11-22, fresh comb pass, [research/11](research/11-fresh-comb-pass.md)). Don't say shame makes you hide: it often goes with trying to fix things, but only when the failure can be fixed (Leach and Cidam 2015, 90 samples).
    - **Worthless**: feeling that you have no value as a person. (−.83/1.89/90)
    - **Humiliated**: R3. ashamed after being mocked or put down, often in front of others. (−.79/–/156)
- **Scared**: afraid or shaken, as if harm could come to you or to someone or something you care about. (−.71/2.80/290)
  - **Anxious**: tense and troubled about what might happen, often without knowing exactly what. (−.44/3.80/644) Was defined with its own child's word, Uneasy (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Worried**: afraid that something might go wrong, and thinking about it a lot. (−.81/3.27/137)
    - **Dread**: a heavy fear of something that's coming. (−.69/3.00/27)
    - **Suspicious**: distrustful, sensing that someone or something isn't what it seems. (−.69/3.48/32; "I was suspicious" 46) Lucas, 2026-11-22: "suspicious doesn't belong under jealous period." Raters put it 53% Scared, 18% Angry, and people link it to criminal, suspect, and shifty, not jealous ([research/11](research/11-fresh-comb-pass.md)). Its third-word situation: you think your partner is lying to you.
  - **Nervous**: jittery and unsure how things will go, or how you'll do. (−.58/3.56/487) Widened: "something you're about to do" didn't cover Apprehensive or On edge (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Uneasy**: slightly unsettled, with a sense that something isn't right. (−.77/2.86/590; "I was uneasy" 30) Lucas, 2026-11-22: moved from Bad → Uncomfortable, replacing Apprehensive, which Dread covers. Raters put uneasy 76% Scared, more than Anxious or Nervous themselves, and its definition is sensing danger ([research/11](research/11-fresh-comb-pass.md)); people link it to nervous (.077). Its third-word situation: a quiet street at night feels off.
    - **On edge**: tense and jumpy, always on alert. (−.31/–/43)
    - **Insecure**: unsure whether you're good enough, or whether people like you. (−.77/2.30/252) Lucas, 2026-11-22: moved from Sad by question 2. Raters' first picks went 46% Scared, 37% Sad; people link insecure to fear words about 5 times as strongly as to sad ones (.23 against .05; [research/10](research/10-which-core-people-tap.md) and a check of Small World of Words). Its third-word situation: unsure whether people like you, which Apprehensive and On edge don't cover.
  - **Vulnerable**: unprotected, as if you could easily get hurt. (−.60/3.57/334)
    - **Exposed**: feeling seen in a way you didn't choose, with nowhere to hide. (−.06/–/190) Near neutral (physical sense); the definition fixes it.
    - **Helpless**: unable to stop something bad from happening, no matter what you do. (−.79/2.24/717) Ended with the core, Scared; a far-away disaster now maps to Sorry for someone (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Threatened**: feeling at risk from someone or something that could harm you or what you care about. (−.90/–/640) A feeling, not tagged. Its definition no longer restates the core Scared (2026-11-22, fresh comb pass, [research/11](research/11-fresh-comb-pass.md)).
  - **Terrified**: extremely afraid, as though something terrible could happen any second. (−.82/2.51/79) "Afraid" (275 / 2,481, less "I was afraid that") is the core's synonym, not this word's: Terrified is its strong form.
    - **Panicked**: so scared that your mind races and you can't think clearly. (−.80/–/35)
    - **Petrified**: frozen with fear. (−.56/3.37/4.6; "I was petrified" 63) Replaces Frantic, whose usual meaning isn't fear (a frantic rush, frantic with worry). The old rule's 5 per billion cut it; it passes the two-count rule (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Horrified**: frightened and sickened by something awful you saw, heard, or learned. (−.92/–/17) Moved from Shocked: people link it to terrified (.061/.083) more than to shocked (.054/.024), and Parrott puts horror with terror. Its third-word situation: violence. Also no longer near Appalled ("cruel or wrong") (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
  - **Shocked**: shaken by something sudden and upsetting. (−.42/–/80)
    - **Startled**: briefly jolted by something sudden. (−.33/4.53/9) Near neutral. Under 15: said as "it startled me".
    - **Stunned**: so shocked that your mind goes blank, and you can't react or take it in. (−.39/–/39)
- **Angry**: heated and wanting to push back at someone or something that bothers you, wrongs you, or gets in your way. (−.76/2.53/551)
  - **Offended**: angry or upset at words or actions that feel disrespectful. (−.62/–/89)
    - **Indignant**: angry at being wronged or disrespected, and sure you're in the right. (−.48/3.32/66) No longer opens with Resentful's cause (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Insulted**: R3. stung that someone seems to have a low opinion of you or of what you care about. (–/–/89) Unscored; insult −.83/2.62. English sorted insult under sadness; kept in anger because it's the plainest case of Lazarus's anger theme, a demeaning offense. Lucas, 2026-11-25: you can be insulted for many reasons, not only a put-down; what a lowball offer, being doubted, and a put-down share is a low opinion of you ([research/15](research/15-second-card-review.md)).
  - **Annoyed**: mildly irritated by something that bothers you. (−.79/2.80/171)
    - **Provoked**: R3. annoyed by someone who's trying to get a reaction out of you. (−.46/–/10) New. Lucas, 2026-11-20: a cause word (rule 3); Irritable is a mood, not a cause. Under 15 in both counts (10 "feel", 10 "I was"); kept because no other word names being needled on purpose (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)). Its third-word situation: a sibling keeps poking at you to get a rise out of you.
    - **Irritable**: short-tempered, as if every little thing bothers you. (−.78/2.85/25)
    - **Impatient**: wanting something to hurry up, and annoyed at the wait. (−.50/3.53/45)
  - **Frustrated**: upset because something keeps getting in your way. (−.84/2.55/305)
    - **Fed up**: out of patience with the same thing happening over and over. (−.50/–/8) Under 15: said with "I'm"; plainer than exasperated (20).
    - **Trapped**: R3. frustrated and stuck, like there's no way out. (−.73/–/427) Tagged as the situation you're in. Stuck left: you can't feel trapped without feeling stuck, so Trapped was Stuck's strong form, and Stuck ("nothing moves forward") was barely narrower than Frustrated (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
  - **Furious**: extremely angry, and hard to calm down. (−.88/2.57/27) Lucas, 2026-11-20: kept over Infuriated.
    - **Rage**: anger so strong that it takes over. (−.84/2.50/43)
    - **Violated**: R3. furious that someone invaded something that's yours alone, like your body, privacy, or home. (−1.00/–/60) Lucas, 2026-11-20. Anger is the emotion of rights being violated (Rozin et al. 1999). Moved from Offended: "and you feel offended" understates it. Its third-word situation: someone reads your private messages (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Outraged**: furious at something wrong or unjust. (−.69/3.21/19)
  - **Disgusted**: sickened by something cruel or morally wrong. (−.90/2.68/251; "I was disgusted" 56) Moral disgust. Lucas, 2026-11-22: the same label as physical disgust under Bad, since most people who say "disgusted" mean this one and tap Angry ([research/9](research/9-disgust.md): 74% of recalled "disgusted" stories were about anger, 8% of "grossed out" ones).
    - **Appalled**: shocked and in disbelief that anyone could do something so wrong. (−.61/3.62/7) Under 15: said as "I was appalled".
    - **Contempt**: cold disgust for someone or something you have no respect for. (−.59/3.22/26)
    - **Hatred**: intense, lasting hostility toward someone or something, for who they are or what they stand for. (−.93/2.38/41) Lucas, 2026-11-22: moved from Resentful to make room for Betrayed. Hate is conceptually closer to disgust and contempt than to anger (Martínez et al. 2022), and the Basque sort mixed the disgust words with hate ([research/9](research/9-disgust.md), [10](research/10-which-core-people-tap.md)); raters still put "hateful" 87% under Angry, which this keeps. Hate targets who someone is (Fischer et al. 2018). Its third-word situation: someone who badly hurt you.
  - **Resentful**: holding on to anger about being treated unfairly. (−.76/3.00/76) Lucas, 2026-11-20: kept over Bitter.
    - **Betrayed**: R3. hurt and angry because someone you trusted broke that trust. (−.76/–/337) The same word as under Sad → Hurt (Lucas, 2026-11-22).
    - **Used**: R3. resentful that someone took advantage of you to get what they wanted. (−.29/–/72)
    - **Cheated**: R3. angry that someone tricked you or didn't play fair. (–/–/129) Unscored; cheat −.75/3.05.
  - **Jealous**: angry that someone has what you want, or could take away someone or something you care about. (−.65/2.38/204) Lucas, 2026-11-25: the old card's "might take… something you want" mixed the two meanings, since you can only lose what you have. Then, the same day: you can't "have" a person, so the card says "take away someone or something you care about" ([research/15](research/15-second-card-review.md)). Widened: everyday "jealous" covers envy too (jealous ↔ envious .238/.046) (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Envious**: wanting what someone else has, and bothered that it's theirs. (−.78/3.52/67)
    - **Possessive**: wanting to keep someone or something to yourself, and wary of anyone who comes near them. (–/–/21; "I was possessive" 1.6) Replaces Suspicious, which moved to Anxious. Jealous covers both everyday kinds: Envious (someone has what you want) and Possessive (you're afraid of losing someone or something); possessive → jealous .073. Lucas, 2026-11-22: kept this way, though "I just don't think it works very well"; an outer word under Resentful was the alternative. Rechecked 2026-11-25, when Lucas asked again: it stays. People say it of themselves about as often as of others ("I feel/felt/was possessive" 3.8 per billion against "he/she was possessive" 5.1), while even jealous is said of others ten times as often (21 against 209), so "mostly said of others" doesn't hold. Lucas, 2026-11-25: people are possessive of things too (their stuff, their space, their work), so the card covers both ([research/15](research/15-second-card-review.md)). It's judged by its right-now meaning (question 1), which is the urge to keep someone; its associations lean to the trait (mine, ownership, controlling). Every alternative fails: Replaced (3.6 / 5.7), Territorial (4.9 / 0.3) and Second best (4.7 / 1.0) are rare, and Threatened, Insecure, and Suspicious, the fear in jealousy, are already under Scared, where people feeling them would tap.
- **Bad**: not okay in some way, whether or not you know why. (−.75/3.24/3103) Baron-Cohen et al. don't list "bad", which isn't a named emotion; Lucas kept the name, 2026-11-21.
  - **Guilty**: troubled by the sense that you did something wrong. (−.73/3.09/3496) Lucas, 2026-11-22: moved from Sad. People say guilt as "I feel bad about it" ("feel bad about" 742 per billion, and "bad" is the word most linked to guilty), so Bad is the door they'd tap; raters offered no catch-all split between Scared (45%) and Sad (36%) ([research/10](research/10-which-core-people-tap.md)). "I was sorry" (417, less "sorry for"; "feel sorry" is mostly "sorry for", so that count is dropped) is more common but wider: apologizing and regret too ("I was sorry to" 125). Guilty names having done wrong.
    - **Remorse**: deep guilt over harm you caused, and a wish to undo it. (−.79/3.63/101) "Guilt" (205) is its parent's own noun; Remorse is its deep form.
    - **Apologetic**: guilty, and wanting to say sorry and make things right. (−.04/6.65/21) New. Lists disagree. Flag: "sorry" (2,918) is mostly sorry-for; the apologetic sense (sorry about 27, sorry that 36) is 3x, and "Sorry" alone reads both ways.
  - **Embarrassed**: flustered and self-conscious over a silly or revealing moment. (−.63/3.51/828) Covers your own moments and someone else's (Cringe); widened from "something you did" on 2026-11-22 so Cringe fits. Lucas, 2026-11-22: moved from Sad. In daily reports embarrassment comes with guilt and fear, almost never sadness, and it isn't loss, danger, or unfairness ([research/10](research/10-which-core-people-tap.md)). Its old definition ended "uncomfortable", now a sibling's word.
    - **Foolish**: silly after a mistake you think you should have avoided. (−.37/3.00/255) "Stupid" is more common after "I was" (200 against 69), but much of that is judging yourself, not a feeling.
    - **Mortified**: embarrassed so deeply you wish you could vanish. (−.67/–/26) English sorted mortification with fear (older sense); conflict recorded. Keeps "want to vanish": the rule against hiding is about shame, and wanting to vanish is what sets this apart from plain embarrassment.
    - **Cringe**: wincing at an embarrassing moment, whether you're watching it or remembering it. (−.51/3.24/0.02; "I cringed" 293, "makes me cringe" 34) New. Lucas, 2026-11-20: chosen over "Embarrassed for them". People say it about themselves, mostly as a verb, and it covers both other people's moments ("cringed at her" 17) and your own past ("still cringe" 7, "cringe when I think" 5); "that's cringe" is rarer in books (cringey 12), though common online. Lucas, 2026-11-22: covers both. Reworded 2026-11-25 so it covers both without listing whose moment it is, after Lucas found it read like Mortified: Mortified is your own embarrassment at full strength, wishing you could vanish; Cringe is the wince, at a moment you watch or remember, and narrowing it to other people's moments would rule out a common use ("still cringe", "cringe when I think"). The old definition, embarrassed for them, was the kind version people call "embarrassed for her"; cringe carries more judgment ([research/12](research/12-cringe.md)). Books barely count it after "feel", so `check.py` exempts it. Not "awkward", a sibling family's label. Its third-word situation: a friend's wedding toast goes badly.
  - **Uncomfortable**: tense and unable to relax where you are, or around the people you're with. (−.62/2.70/1888)
    - **Awkward**: unsure how to act or what to say around others. (−.41/2.95/727)
    - **Out of place**: feeling that you don't fit in where you are. (–/–/225) Unscored; not belonging is unpleasant.
  - **Disgusted**: grossed out by something, like a smell, a taste, or a touch. (−.90/2.68/251) Physical disgust. Lucas, 2026-11-22: physical disgust isn't anger, so its door is Bad; the same label as moral disgust under Angry ([research/9](research/9-disgust.md)).
    - **Squeamish**: queasy and shrinking back at things like blood, wounds, or bugs. (−.65/–/9; "I was squeamish" 1.5) New. Under 15 in both counts: said as "I'm squeamish".
    - **Repulsed**: strongly repelled, with an urge to get away. (–/–/16; "I was repulsed" 9) Unscored; repulsive −.71/1.95. Moved from Angry.
  - **Bored**: uninterested and wanting something to happen. (−.69/2.95/177) "Tired" (641 / 783) is linked to bored both ways, but it's a body state (question 1), not a synonym.
    - **Restless**: fidgety and unable to settle, with energy that has nowhere to go. (−.56/3.63/150) Its old definition was anxious; waiting on a job offer now maps to Anxious (2026-11-22, comb pass, [research/8](research/8-comb-pass.md)).
    - **Unmotivated**: lacking the drive to start or do anything. (−.67/–/9) Under 15; listless 11, apathetic 5.
  - **Numb**: feeling very little, as if your emotions have been switched off. (−.78/3.79/358)
    - **Empty**: hollow inside, as if something that should be there is missing. (−.62/3.78/406) One definition with Sad → Grief since 2026-11-25. Lucas, 2026-11-22: also under Sad → Grief, since people split: raters put empty 69% Sad, and people link it to lonely, not numb ([research/11](research/11-fresh-comb-pass.md)).
    - **Disconnected**: cut off from yourself or the world around you. (−.42/–/111; "I was disconnected" 6) Replaces Detached, the same feeling, used less than half as often (49) (2026-11-22, fresh comb pass, [research/11](research/11-fresh-comb-pass.md)).
  - **Confused**: unable to make sense of something. (−.56/3.11/259)
    - **Lost**: without direction, unsure where to go from here. (−.64/2.53/451)
    - **Conflicted**: pulled two ways at once, unsure which to choose. (–/–/109) Unscored; conflict −.33/3.05. Torn is about as common (102 "feel", 111 "I was"); Conflicted stays as the word that doesn't also mean ripped. Its old reason, that Torn "usually means ripped", is false in these frames.
  - **Overwhelmed**: feeling like there is too much to handle, more than you have room for. (−.32/2.80/662) Replaces Stressed, an umbrella (rule 4). "At once" ruled out its own child, Burned out. Its card names "stressed", which it covers (2026-11-22, fresh comb pass, [research/11](research/11-fresh-comb-pass.md)).
    - **Burned out**: worn down by long strain, with nothing left to give. (−.73/–/20, plus "burnt out" 9) New. ICD-11: occupational, not medical (rule 12).
    - **Pressured**: R3. pushed by demands or expectations from others or yourself. (–/–/261) Unscored; pressure −.28/3.56.

Sorting conflicts recorded: English and Indonesian put sympathy, compassion and being moved under sadness, but rule 1 outranks rule 6. Indonesian puts bored with anger and confused with fear; English doesn't cover them.

## Situations (rule 13)

There are 181 in `scripts/situations.json`, all grounded in Lazarus's (1991) themes and cross-checked, without copying, against ISEAR, EmpatheticDialogues (from memory) and Holmes and Rahe:
- 101 are from my first draft. They were written from the wheel, which the checker rightly called circular.
- 40 are the checker's.
- 40 are new ones of mine from everyday life, written before I looked at the wheel again.

**Fixes for the gaps the new sets found:**
- Added: Burned out, Vindicated, Humbled, Flattered, Sorry for someone, Indignant, Suspicious and Honored.
- Named by a word already on the wheel: Overjoyed (Elated), Irritated (Annoyed), Ignored (Left out), Touched (Moved), Torn (Conflicted), Giddy (Thrilled), Longing (Heartache), Upset (Sad), Uncertain (Worried), Trusted (Valued), Self-conscious (Embarrassed or Insecure).
- Bittersweet is the one gap left. It's mixed (−.06/5.09), and rule 1 needs one side.
- 2026-11-20: "Someone or something you believed in turns out not to deserve it" and "Being welcomed into a group as you are" now have their own words, Disillusioned and Accepted. "Someone talks down to you or ignores your boundaries" maps to Offended, since Disrespected left. No situation named Understood, Eager, Frazzled, or Lust.

**First draft (101):**
- **Loss:** a death (Grief); a breakup (Heartbroken); losing your livelihood (Devastated); missing home (Homesick); weekends alone (Lonely); not invited (Left out); no one gets you (Misunderstood); a secret shared (Betrayed); turned down (Rejected); someone walks out (Abandoned); a missed hope (Disappointed); a no-show (Disappointed); repeated failure (Discouraged); a hero falls (Disillusioned); a lost contest (Defeated); weeks low (Hopeless).
- **Self:** tripping in public (Embarrassed); being watched (Embarrassed); a gaffe (Mortified); an obvious mistake (Foolish); mocked (Humiliated); lying to a friend (Guilty); hurting someone (Remorse); a choice to undo (Regret); failing, and it's you (Ashamed); nothing to offer (Worthless); comparing yourself (Inferior); a task beyond you (Inadequate).
- **Threat:** a near miss (Terrified); racing heart (Panicked); test results (Worried); a coming confrontation (Dread); an interview (Nervous); a bang (Startled); terrible news (Shocked); violence (Horrified); followed at night (Threatened); can't help a loved one (Helpless); after opening up (Exposed); unsure you're liked (Insecure).
- **Obstacle:** hassles (Annoyed); hungry or sleepless (Irritable); a long wait (Impatient); repeated failure of a thing (Frustrated); no way forward (Stuck); a job you can't leave (Trapped); the same problem (Fed up).
- **Unfair:** credit taken (Cheated); kindness with a motive (Used); unnoticed housework (Unappreciated); an insult (Insulted); talked down to (Offended); an injustice (Outraged); badly hurt (Hatred); a flirting partner (Jealous); a friend's luck (Envious); rotten food (Repulsed); cruelty (Appalled); looking down on someone (Contempt).
- **Good:** good news (Delighted); a wedding (Elated); a joke (Amused); a trip ahead (Excited); hard work done (Accomplished); winning (Triumphant); praise (Valued); a manageable challenge (Confident); life as hoped (Fulfilled); a quiet evening (Content); a day off (Relaxed); a safe place (Safe); a clear result (Relieved); forgiveness (Forgiven); things may work out (Hopeful); progress (Encouraged); an example (Inspired); a pull to learn (Curious); a surprise party (Delighted); a night sky (Awe); skill (Impressed).
- **Close:** a baby (Affection); old photos (Nostalgic); suffering (Compassion); a loved one in danger (Protective); a long talk (Connected); "I love you" (Connected); welcomed in (Accepted); falling for someone (Attracted); help (Grateful); kindness brings tears (Moved).
- **Off:** nothing to do (Bored); can't settle (Restless); deadlines (Overwhelmed); expectations (Pressured); two pulls (Conflicted); no direction (Lost); senseless instructions (Confused); after a shock (Numb); going through motions (Empty); strangers (Out of place); silences (Awkward).

**The checker's 40:** praise (Proud); a promotion lost to someone else (Resentful); presenting (Nervous); laid off (Shocked); long hours (Burned out); dull tasks (Bored); rent (Worried); a friend's house (Envious); a refund (Relieved); a biopsy (Anxious); a diagnosis (Devastated); recovery (Grateful); photos of yourself (Insecure); dementia (Heartbroken); first steps (Delighted); a relative's criticism (Annoyed); a caregiver's wish (Guilty); a great date (Attracted); a forgotten birthday (Unappreciated); flirted with (Flattered); an ex moves on (Jealous); a dog dies (Grief); a friend moves (Lonely); an anniversary (Nostalgic); a party without you (Left out); a confidence shared (Valued); cut off in traffic (Furious); a cruel word (Remorse); mocked at work (Humiliated); a marathon (Accomplished); proven right (Vindicated); a failed exam (Discouraged); wrong in an argument (Foolish); a pending offer (Restless); move or stay (Conflicted); a rainy Sunday (Bored); a waiter berated (Appalled); a far disaster (Helpless); someone suffering (Sympathy); a regretted purchase (Regret).

**My new 40:**
- **Work:** criticized (Embarrassed); talked over (Annoyed); a first day (Nervous); a launch (Proud); Sunday night (Dread); an award (Honored).
- **Money:** a surprise bill (Anxious); can't afford your child's needs (Inadequate); the last debt payment (Relieved); scammed (Foolish); an unpaid loan (Used).
- **Health:** a lump (Scared); weeks of pain (Miserable); a hospital rush (Worried); unclear results (Worried).
- **Family:** "I hate you" (Hurt); the holiday argument (Frustrated); a favored sibling (Jealous); the youngest leaves (Bittersweet: the gap).
- **Love:** a first kiss (Thrilled); a forgotten anniversary (Hurt); a lying partner (Suspicious); a proposal (Elated); far apart (Heartache).
- **Loss:** a death anniversary (Grief); a lost heirloom (Sad).
- **Friendship:** unanswered messages (Left out); a thoughtful gift (Moved); making up (Relieved).
- **Conflict:** wrongly blamed (Indignant); 2 a.m. music (Annoyed).
- **Achievement:** passing against the odds (Amazed).
- **Failure:** a failed driving test (Disappointed); a mistake that costs the team (Guilty).
- **Uncertainty:** two offers (Conflicted); waiting to get in (Anxious).
- **Boredom:** a pointless meeting (Bored); months of routine (Stuck).
- **Moral:** silent at bullying (Ashamed); keeping extra change (Guilty).

## Considered and left out

- **Dropped on 2026-11-20:** Lust (a stronger Desire, rules 7 and 8; Lucas); Disrespected (the general case of Insulted and Violated, rule 8); Eager (the same as Motivated, rule 8); Frazzled (the same as Overwhelmed, rule 8).
- **Kept off by Lucas, 2026-11-20:** Excluded (would repeat Rejected, rule 8); Weak (mostly physical, rule 11; Helpless and Inadequate cover it); Skeptical (an attitude toward a claim, and rare at 9 per billion); Dismayed (Shocked and Disappointed together, rule 8, and rare at 10).
- **Dropped in the revision before:** Stressed (an umbrella, rule 4); Capable (same as Confident); Self-conscious (rule 1 at +.17, and rule 11); Belittled (same as Humiliated); Empathy (a capacity); Possessive (said of others); Alarmed (overlaps Startled and Worried). Accepted and Disillusioned were dropped then too; Lucas brought both back.
- **Rule 2:** Tired, Sick, Gross, Busy, Prepared, Faithful, Hostile.
- **Rule 10:**
  - Under 5 per billion: Fascinated, Fondness, Adoration, Devotion, Devoted, Infatuated, Smitten, Caring, Trusting, Grossed out, Revolted, Livid, Loathing, Vengeful, Spiteful, Apathetic, Inquisitive, Self-doubt, Petrified, Appreciative, Distrustful, Heartsick.
  - A plainer word is used far more: Joyful, Affectionate, Compassionate, Remorseful, Regretful, Fearful, Mad, Grieving, Pity, Sad for.
- **Rule 11:** Strong, Warm, Close, Tender, Alive, Giddy, Blue, Crushed, Touched, Torn, Flat, Silly, Lucky, Passion, Paralyzed, At home, Special.
- **Rule 12:** Depressed.
- **Rule 8** (same as a wheel word): Glad, Pleased, Irritated, Thankful, Secure, Peaceful, Serene, At ease, Ignored, Isolated, Powerless, Unsafe, Despair, Gloomy, Bitter, Enraged, Exasperated, Astonished, Enthusiastic, Unsure, Uncertain, Tense, Jittery, Unsettled, Appreciated, Respected, Supported, Included, Unloved, Unwanted, Neglected, Sentimental, Stupid, Overjoyed, Sorrow, Upset, Off, Wary, Desperate, Shaken (Stunned), Useless (Worthless, Inadequate).
- **Rule 1:** Longing (+.21, can't go in Sad); Bittersweet (mixed); Indebted (−.72/3.21, can't go under Grateful).
- **Rule 3 extras:** Taken for granted, Desired, Wanted, Trusted, Cherished.

## What the rules couldn't decide

Each of these is one word too many for the layout. In both, the rules allow 3 (each candidate passes them and names something the others don't), no move or split works, and the candidates are used within twice as often as each other.

1. **Sad → Disappointed: which of Let down, Discouraged, and Regret goes?**
   - Disappointed: things didn't turn out as you hoped, and you feel deflated. (228 per billion)
   - Its siblings under Sad: Lonely, Hurt, Grief, Heartache, Down, Ashamed, Guilty, Embarrassed, Insecure.
   - Under it: Disillusioned (Lucas's addition): someone or something you believed in turned out not to deserve it, and you feel disappointed. (15)
   - **Let down:** someone didn't come through, and you feel disappointed. (70) Situation: someone promised to show up and didn't. Without it, that maps to Disappointed.
   - **Discouraged:** setbacks have worn you down, and you feel like giving up. (107) Situations: you keep trying and keep falling short; you fail an exam you studied hard for. Without it, these map to Defeated (Down).
   - **Regret:** disappointed in a choice you made. (126) Situations: a choice you wish you'd made differently; an expensive purchase you wish you hadn't made. Without it, nothing on the wheel names regret over a choice that hurt no one: Remorse (Guilty) is about harm done.
   - Why no move: Regret under Guilty would sit beside Remorse, its stronger form (rule 8). The English sort does put regret with guilt and remorse. Discouraged under Down would sit beside Defeated and Hopeless, its stronger forms. Let down's next best is Hurt, which would then hold 4, beside Betrayed, its stronger form.
   - Why no split: Discouraged as a middle word of its own needs a second outer word. Disheartened (36) means the same (rule 8), Demoralized is rare (9), and Hopeless is Lucas's choice for Down.
2. **Sad → Embarrassed: Mortified or Humbled?**
   - Embarrassed: something awkward happened in front of others, and you feel uncomfortable. (828)
   - Its siblings under Sad: as above.
   - Under it: Foolish: you made a silly mistake, and you feel embarrassed. (255) Cringe (Lucas's addition): someone else did something awkward, and you feel embarrassed for them. (books barely use it)
   - **Mortified:** so embarrassed you want to vanish. (26) Situation: something you said in public was very embarrassing. Without it, that maps to Embarrassed. English once sorted mortification with fear (an older sense).
   - **Humbled:** you were shown to be wrong or less than you thought, and you feel embarrassed. (40) Situation: you find out you were wrong in an argument you pushed hard. Without it, that maps to Foolish. "Humbled" also has a pleasant sense ("humbled and honored"); the counts can't say how much of the 40 is which.
   - Why no move: "Mortified is a kind of Ashamed" doesn't read true by this wheel's Ashamed (bad about yourself, not just what you did), and "Humbled is a kind of Insecure" doesn't either. Insecure is full anyway.
   - Why no split: your own awkward moments versus someone else's is a real difference, but Cringe would be alone, and Lucas chose Cringe over "Embarrassed for them".
   - The layout also allows keeping just 2 (Foolish and Cringe).

**Settled on 2026-11-20 (Lucas):** Grateful under Love (Algoe 2012); Hatred under Resentful, defined by who someone is (Fischer et al. 2018); embarrassment for someone else as Cringe.

**Settled in the revision before:** Content, Foolish, Insecure under Sad, Disgusted under Angry, Self-conscious dropped, Blessed to Happy.

**Worth a look:** Suspicious under Jealous (suspicion can also be fear); Frantic is near Panicked; Stressed could return as a recorded exception to rule 4. "Feel wronged" counts 408 per billion, more than any word under Offended, and isn't on the wheel or in the left-out lists.

**Still to do:**
Rules 14 (translation), 15 (body-wheel paths for every word added or dropped on 2026-11-20 too) and 16 (credits for Lazarus, Shaver and Alonso-Arbiol, NRC, Warriner, Baron-Cohen, Google Books Ngram, ISEAR, EmpatheticDialogues, Holmes and Rahe, ICD-11, and, from Lucas's decisions, Leary et al. 1998, Williams 2007, Rozin et al. 1999, Algoe 2012, and Fischer et al. 2018). Rule 7's optional association check wasn't run.


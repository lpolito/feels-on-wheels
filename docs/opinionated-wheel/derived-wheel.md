# A feelings wheel derived from the rules

The candidate wheel, built from [rules.md](rules.md), the research in [research/](research/), the word data, and Lazarus (1991), not from the app's current wheel. Scripts are in [scripts/](scripts/) (`check.py`'s output is `check-report.txt`). Open items are in [handoff.md](handoff.md).

**Rule numbers below are the old numbered rules** (in `rules.md` at commit 0107189), replaced on 2026-11-21 by the looser set in [rules.md](rules.md). In the new set: 1 is the pleasantness check; 2 is question 1; 3 is the what-happened words; 4 and 5 are the cores; 6 is question 2; 7 is question 3; 8 is question 4; 9 is Always 3; 10 is the usage flags; 11 and 12 are question 5; 13 is the situations; 14, 15, and 16 are Always 5, 6, and 7. The placements here haven't been rechecked against the new set yet.

**6 cores, 45 middle words, 115 outer words: 166 words, with Disgusted twice on purpose.** (Lucas, 2026-11-22: Amazed replaced Surprised; Humbled left; Disgusted split into physical, under Bad, and moral, under Angry.) **Before that: 6 cores, 44 middle words, 116 outer words.** Three spots hold 4 outer words, one more than the layout allows: Connected (Understood came back), Disappointed, and Embarrassed. See [handoff.md](handoff.md). (Before Lucas's decisions of 2026-11-20: 6/44/112, 162. First draft 6/43/109, 158.)

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

Brackets: NRC valence (−1 to 1) / Warriner valence (1–9, 5 neutral) / Google Books "feel, feeling, felt ___" per billion, 2018–2022; a dash is unscored. R3: what someone did to you (rule 3), outer only, defined by the feeling it causes.

**`check.py` passes:** no word on the wrong side in every list that scores it (rule 1); none under 5 per billion (rule 10), except Cringe, which it exempts with Lucas's reason; no repeats (rule 9); 4+ middle words per core (rule 5); every situation on the wheel or named by another word, except one (rule 13).

**It fails 2 things, both waiting on Lucas:** Disappointed and Embarrassed have 4 outer words each.

**It flags 16 things, all kept with a reason in the entry:** 11 words under 15 per billion (the "feel ___" frame undercounts what people say with "I'm"); 4 more common relatives (Pleased, Tender, Sorry, Desperate); Bad missing from Baron-Cohen. It also lists the 23 middle words with 3 outer words; each third word's reason is above.

- **Happy**: things are good right now. (+.98/8.47/1030)
  - **Joy**: strong, bright happiness. (+.96/8.21/154) Rule 10: 5.1x as common as "joyful".
    - **Delighted**: something good just happened, and you feel very happy. (+.94/7.74/28) Flag: "pleased" (148) is milder, so it's not the same feeling.
    - **Elated**: joy so big you feel lifted up. (+.58/6.56/92)
    - **Blissful**: deep, peaceful joy, with nothing missing. (+.77/7.67/11) Under 15: said as "bliss".
  - **Cheerful**: a light, upbeat mood. (+.99/8.00/21)
    - **Amused**: something strikes you as funny. (+.88/7.05/20)
    - **Playful**: in the mood to joke and have fun. (+.78/7.63/12) Under 15: said with "I'm".
  - **Excited**: happy and full of energy about what's coming. (+.82/8.11/256)
    - **Thrilled**: great news came, or something great is ahead, and you feel excited. (+.80/–/20)
    - **Exhilarated**: a rush of excitement in the moment. (+.78/6.90/47)
  - **Proud**: happy about something you or someone close to you did. (+.81/7.00/581)
    - **Accomplished**: you finished something hard, and you feel proud. (+.74/–/34)
    - **Triumphant**: you won or beat what stood in your way, and you feel proud. (+.90/7.45/36)
    - **Flattered**: R3. Someone's praise or interest pleases you, and you feel a little proud. (+.73/6.32/76) New (coverage gap).
  - **Confident**: sure you can handle what's in front of you. (+.53/7.56/1149)
    - **Brave**: ready to face something that scares you. (+.67/7.38/103)
    - **Empowered**: able to act and make things change. (–/–/282) Unscored; empowerment +1.00. Lucas, 2026-11-20: kept over Powerful, which means something else.
    - **Powerful**: strong and in charge. (+.57/6.46/188) New. Lucas, 2026-11-20. Indonesian sorts power with confidence under happiness; "Powerful is a kind of Confident" reads truer than "a kind of Proud" (rule 7).
  - **Satisfied**: what you wanted or needed has been met. (+.92/7.16/308)
    - **Fulfilled**: your life or work feels meaningful. (+.79/–/82)
    - **Content**: at ease with what you have, wanting nothing more. (+.53/6.70/104) 6x contented; rule 10 outranks 11.
    - **Blessed**: you feel lucky to have the good things in your life. (+.82/7.50/156) Moved from Grateful.
  - **Calm**: settled and steady inside. (+.75/6.89/253)
    - **Relaxed**: loose and unhurried, with your guard down. (+.73/7.25/319)
    - **At peace**: nothing troubles you deep down. (+.48/–/172) 2.4x as common as "peaceful".
    - **Safe**: calm because nothing can hurt you here. (+.80/7.70/2923)
  - **Relieved**: a worry or danger passed, and you feel lighter. (+.79/–/801)
    - **Reassured**: R3. Someone or something eased your worry, and you feel relieved. (+.71/–/139)
    - **Forgiven**: R3. Someone let go of your mistake, and you feel relieved. (+.50/–/9) Under 15: said as "they forgave me".
    - **Vindicated**: R3. You were doubted and proven right, and you feel relieved. (+.23/–/62) New (coverage gap); relief at doubt lifting.
  - **Hopeful**: you believe something good may happen. (+.89/7.44/124)
    - **Optimistic**: you expect things to turn out well. (+.96/7.45/66)
    - **Encouraged**: a good sign came along, and you feel hopeful about going on. (+.91/–/92)
  - **Motivated**: you want to get going. (+.67/–/93)
    - **Inspired**: someone or something showed you what's possible, and you feel motivated. (+.93/6.89/141)
    - **Determined**: set on doing it, whatever it takes. (+.47/–/18)
  - **Interested**: something has your attention. (+.50/6.83/27)
    - **Curious**: you want to know more. (+.27/6.58/53)
    - **Intrigued**: something puzzling draws you in. (+.54/–/10) Under 15; fascinated is 3.
  - **Amazed**: something you didn't expect or think possible happened, and it delights you. (+.59/7.55/16; "I was amazed" 506) Lucas, 2026-11-22: replaces Surprised, which is both pleasant and unpleasant ("I was surprised" mostly means only "I didn't expect it"), an umbrella like Stressed. Its card points to Shocked (Scared) for a bad surprise. Lucas, 2026-11-20: kept over Astonished.
    - **Awe**: something vast or beautiful leaves you amazed. (−.06/6.85/21) Lists disagree; stays.
    - **Impressed**: someone did better than you expected, and you feel amazed. (+.61/6.66/18) The loosest fit in the group: milder than its parent.
  - **Grateful**: someone did or gave you something good, and you feel thankful. (+.92/7.50/339) Lucas, 2026-11-22: moved from Love by question 2. In daily reports gratitude comes with joy five times as strongly as with love (.15 against .03), recalled gratitude is most often called "happiness" (42%), and people link grateful to happy about six times as strongly as to love ([research/10](research/10-which-core-people-tap.md)). Algoe's "find, remind, and bind" is what gratitude does, not which core people tap.
    - **Honored**: R3. Someone chose or recognized you, and you feel grateful. (+.88/–/126)
    - **Cared for**: R3. Someone looks after you, and you feel grateful. (–/–/58) Unscored; care +.46/7.64.
- **Love**: warm feeling toward someone, and wanting closeness. (+1.00/8.00/216)
  - **Affection**: fondness for someone. (+.80/7.89/38) 8x as common as "affectionate".
    - **Tenderness**: gentle, caring affection. (+.90/6.89/8) Flag, under 15: "tender" (40) mostly means sore; with "toward" it's 2.5x (7.4 vs 3.0), so rule 11 keeps the noun.
    - **Protective**: wanting to keep someone you love safe. (+.69/6.53/94)
  - **Compassion**: feeling for someone who suffers, and wanting to help. (+.47/7.90/140) Lazarus's theme.
    - **Sympathy**: you share in someone's pain and want to comfort them. (+.65/6.57/167)
    - **Moved**: someone's pain or kindness stirred you, maybe to tears, and you feel for them. (+.52/–/105)
  - **Connected**: close to someone, part of something. (+.63/–/405) 2026-11-22: Loved left, since it's the same word as the core Love (the Once check compares base forms; research/8); "I love you" maps to Connected.
    - **Understood**: R3. Someone really gets you, and you feel close. (+.56/–/76) Back, 2026-11-20 (see above).
    - **Valued**: R3. Others show you matter, and you feel appreciated. (+1.00/–/197) Lucas, 2026-11-20: kept over Respected (63).
    - **Accepted**: R3. Others welcomed you as you are, and you feel you belong. (–/–/104) New. Unscored; acceptance +.67/6.84. Lucas, 2026-11-20: being welcomed as you are isn't being understood or loved (rule 8), and it's an everyday situation (rule 13).
  - **Attracted**: drawn to someone. (–/–/74) Unscored; attraction +.81/7.00.
    - **Desire**: wanting someone, and wanting to be close to them. (+.79/7.05/58) The wanting; Aroused is the body's side.
    - **Aroused**: your body responds to someone you want. (+.42/5.95/35) New. Lucas, 2026-11-20: replaces Lust, a stronger Desire (rules 7 and 8). Rule 11's example list no longer names Aroused (fixed 2026-11-20).
- **Sad**: low and heavy, often after a loss. (−.55/2.10/1128)
  - **Lonely**: wanting company or closeness you don't have. (−.50/2.67/565)
    - **Left out**: R3. You weren't included, maybe by accident, and you feel lonely. (−.70/–/240) Lucas, 2026-11-20: kept over Excluded; deliberately shut out is Rejected. Hurt from exclusion comes from feeling others don't value you (Leary et al. 1998), and how people explain it changes how they recover (Williams 2007).
    - **Misunderstood**: R3. Others don't get you, and you feel alone. (−.65/–/41)
    - **Abandoned**: R3. Someone you counted on left, and you feel alone. (−.91/–/207)
  - **Hurt**: someone's words or actions wounded you, and you feel pain. (−.88/2.45/265)
    - **Betrayed**: R3. Someone you trusted broke that trust, and you feel hurt, angry, or both. (−.76/–/337) Lucas, 2026-11-22: also under Angry → Resentful, since people split: raters picked Angry 54%, Sad 32% ([research/10](research/10-which-core-people-tap.md)).
    - **Rejected**: R3. Someone turned you away or shut you out on purpose, and you feel hurt. (−.80/2.40/134)
    - **Unappreciated**: R3. What you do goes unnoticed, and you feel hurt. (−.54/2.65/23) Often comes with resentment.
  - **Disappointed**: things didn't turn out as you hoped, and you feel deflated. (−.86/2.65/228) Lucas, 2026-11-22: Let down left. It's the "someone didn't come through" case (people are let down by the system, the government, his, her), but people treat the two as near-synonyms (each is near the top of the other's associations), so someone let down is served by Disappointed itself, and Betrayed covers the stronger case. Its situation maps here.
    - **Discouraged**: setbacks have worn you down, and you feel like giving up. (−.56/3.18/107)
    - **Regret**: disappointed in a choice you made. (−.54/3.41/126)
    - **Disillusioned**: someone or something you believed in turned out not to deserve it, and you feel disappointed. (–/–/15) New. Unscored; disillusionment −.90, disillusion −.67. Lucas, 2026-11-20: losing a belief isn't being let down by someone (rule 8).
  - **Grief**: you lost someone or something, and you feel deep sorrow. (−.86/2.33/49)
    - **Heartbroken**: a love or a close bond ended, and you feel deep grief. (−.84/1.95/34)
    - **Devastated**: a huge loss knocked you flat, and you feel overwhelmed by grief. (−.76/–/34)
  - **Heartache**: an aching sadness for someone or something out of reach. (−.82/3.23/90) New: missing or caring, not a finished loss.
    - **Homesick**: heartache for home and the people there. (−.13/3.00/52)
    - **Nostalgic**: a wistful ache for times gone by, often with warmth. (−.08/6.68/60) Lists disagree; Basque sorts it with sadness.
    - **Sorry for someone**: heartache over someone else's pain. (−.19/4.81/2897; data for "sorry") New (coverage gap). Rule 10 picks it over pity (290) and sad for (122); rule 9 gives this "sorry" its own label.
  - **Down**: low, with little energy or joy. (−.58/–/272)
    - **Hopeless**: you can't see things getting better. (−.81/2.20/163) Lucas, 2026-11-20: kept over Despair.
    - **Miserable**: deeply unhappy right now. (−.88/2.60/150)
    - **Defeated**: you lost or failed, and you feel beaten. (−.79/2.59/147)
  - **Ashamed**: you feel bad about yourself, not just about what you did. (−.69/2.52/937)
    - **Humiliated**: R3. You were made to look small in front of others, and you feel ashamed. (−.79/–/156)
    - **Worthless**: you feel you have no value. (−.83/1.89/90)
  - **Inadequate**: you feel you're not good enough. (−.76/2.57/196) Lucas, 2026-11-22: a middle word for worth, replacing Insecure, which moved to Scared → Nervous. People link inadequate, inferior, and insignificant to "not enough", "less", and "worthless", and to fear words almost not at all.
    - **Inferior**: less than other people. (−.48/3.43/199)
    - **Insignificant**: you feel you don't matter. (−.83/3.64/37) Lucas, 2026-11-20: not feeling less than others (Inferior) or not up to a task (Inadequate).
- **Scared**: afraid something might hurt you. (−.71/2.80/290)
  - **Anxious**: uneasy about what might go wrong. (−.44/3.80/644)
    - **Worried**: your mind keeps returning to one thing that might go wrong. (−.81/3.27/137)
    - **Uneasy**: a sense that something threatening is near. (−.77/2.86/759)
    - **Dread**: heavy fear of something coming. (−.69/3.00/27)
  - **Nervous**: jittery about something you're about to do. (−.58/3.56/487)
    - **Apprehensive**: uneasy as something approaches. (−.19/3.32/74)
    - **On edge**: jumpy, braced for something to go wrong. (−.31/–/43)
    - **Insecure**: unsure you're good enough or liked, and you feel nervous. (−.77/2.30/252) Lucas, 2026-11-22: moved from Sad by question 2. Raters' first picks went 46% Scared, 37% Sad; people link insecure to fear words about 5 times as strongly as to sad ones (.23 against .05; [research/10](research/10-which-core-people-tap.md) and a check of Small World of Words). Its third-word situation: unsure whether people like you, which Apprehensive and On edge don't cover.
  - **Terrified**: extremely scared. (−.82/2.51/79)
    - **Panicked**: so scared you can't think. (−.80/–/35)
    - **Frantic**: so scared you rush about, unable to stop. (−.58/3.79/14) New. Under 15; flag against desperate (106), a different feeling; petrified is 4.6.
  - **Shocked**: something sudden and bad happened, and you feel shaken. (−.42/–/80)
    - **Startled**: something sudden made you jump, and you feel a quick jolt. (−.33/4.53/9) Near neutral. Under 15: said as "it startled me".
    - **Stunned**: so shocked you can't react. (−.39/–/39)
    - **Horrified**: you saw or heard something awful, and you feel shocked and sickened. (−.92/–/17)
  - **Vulnerable**: open to being hurt. (−.60/3.57/334)
    - **Helpless**: you can't stop what's happening, and you feel scared. (−.79/2.24/717)
    - **Exposed**: others can see more of you than you want, and you feel unsafe. (−.06/–/190) Near neutral (physical sense); the definition fixes it.
    - **Threatened**: R3. Someone or something might harm you, and you feel scared. (−.90/–/640)
- **Angry**: something's unfair or in your way. (−.76/2.53/551)
  - **Annoyed**: something bothered you, and you feel mildly angry. (−.79/2.80/171)
    - **Irritable**: everything is getting on your nerves right now. (−.78/2.85/25)
    - **Impatient**: you're kept waiting, and you feel annoyed. (−.50/3.53/45)
    - **Provoked**: R3. Someone deliberately pushed your buttons, and you feel annoyed. (−.46/–/10) New. Lucas, 2026-11-20: a cause word (rule 3); Irritable is a mood, not a cause. Under 15: usually said as "I was provoked".
  - **Frustrated**: something keeps blocking you, and you feel angry. (−.84/2.55/305)
    - **Stuck**: nothing moves forward, and you feel frustrated. (−.69/–/214)
    - **Trapped**: you can't get out, and you feel frustrated. (−.73/–/427)
    - **Fed up**: the same problem keeps coming back, and you feel you've had enough. (−.50/–/8) Under 15: said with "I'm"; plainer than exasperated (20).
  - **Furious**: very angry. (−.88/2.57/27) Lucas, 2026-11-20: kept over Infuriated.
    - **Outraged**: something wrong or unjust happened, and you feel furious. (−.69/3.21/19)
    - **Rage**: anger so strong you might lose control. (−.84/2.50/43)
  - **Resentful**: you were treated unfairly, and you feel anger that lingers. (−.76/3.00/76) Lucas, 2026-11-20: kept over Bitter.
    - **Cheated**: R3. Someone took what was fairly yours, and you feel resentful. (–/–/129) Unscored; cheat −.75/3.05.
    - **Used**: R3. Someone took advantage of you, and you feel resentful. (−.29/–/72)
    - **Betrayed**: R3. Someone you trusted broke that trust, and you feel hurt, angry, or both. (−.76/–/337) The same word as under Sad → Hurt (Lucas, 2026-11-22).
  - **Offended**: someone's words or actions disrespected or wronged you, and you feel angry. (−.62/–/89)
    - **Insulted**: R3. Someone said something meant to hurt, and you feel offended. (–/–/89) Unscored; insult −.83/2.62. English sorted insult under sadness; kept in anger because it's the plainest case of Lazarus's anger theme, a demeaning offense.
    - **Indignant**: you were treated unfairly, such as blamed for what you didn't do, and you feel offended. (−.48/3.32/66) New (situation gap).
    - **Violated**: R3. Someone crossed a line with you they had no right to cross, and you feel angry. (−1.00/–/60) New. Lucas, 2026-11-20. Anger is the emotion of rights being violated (Rozin et al. 1999). Often comes with fear and shame.
  - **Jealous**: afraid someone will take a person you love, and angry about it. (−.65/2.38/204)
    - **Envious**: wanting what someone else has. (−.78/3.52/67)
    - **Suspicious**: you sense someone close is hiding something. (−.69/3.48/63) New (situation gap); often comes with fear.
  - **Disgusted**: someone did something cruel or wrong, and you can't stand it. (−.90/2.68/251; "I was disgusted" 56) Moral disgust. Lucas, 2026-11-22: the same label as physical disgust under Bad, since most people who say "disgusted" mean this one and tap Angry ([research/9](research/9-disgust.md): 74% of recalled "disgusted" stories were about anger, 8% of "grossed out" ones).
    - **Appalled**: you saw something cruel or wrong, and you feel disgusted. (−.61/3.62/7) Under 15: said as "I was appalled".
    - **Contempt**: feeling someone is beneath you. (−.59/3.22/26)
    - **Hatred**: you can't stand who someone is, not just what they did, and it lasts. (−.93/2.38/41) Lucas, 2026-11-22: moved from Resentful to make room for Betrayed. Hate is conceptually closer to disgust and contempt than to anger (Martínez et al. 2022), and the Basque sort mixed the disgust words with hate ([research/9](research/9-disgust.md), [10](research/10-which-core-people-tap.md)); raters still put "hateful" 87% under Angry, which this keeps. Hate targets who someone is (Fischer et al. 2018). Its third-word situation: someone who badly hurt you.
- **Bad**: something's off, and it's hard to say what. (−.75/3.24/3103)
  - **Bored**: nothing holds your interest. (−.69/2.95/177)
    - **Restless**: keyed up and unable to settle. (−.56/3.63/150) Often comes with anxiety.
    - **Unmotivated**: no drive to start anything. (−.67/–/9) Under 15; listless 11, apathetic 5.
  - **Overwhelmed**: too much came at you at once, and you feel you can't cope. (−.32/2.80/662) Replaces Stressed, an umbrella (rule 4).
    - **Pressured**: R3. Others push you harder than you can go, and you feel overwhelmed. (–/–/261) Unscored; pressure −.28/3.56.
    - **Burned out**: months of strain have worn you down, and you feel you have nothing left to give. (−.73/–/20, plus "burnt out" 9) New. ICD-11: occupational, not medical (rule 12).
  - **Confused**: things don't make sense. (−.56/3.11/259)
    - **Conflicted**: pulled two ways at once. (–/–/109) Unscored; conflict −.33/3.05.
    - **Lost**: no sense of direction. (−.64/2.53/451)
    - **Puzzled**: something doesn't add up. (−.59/4.60/47)
  - **Numb**: you can't feel much of anything. (−.78/3.79/358)
    - **Empty**: hollow, as if something is missing. (−.62/3.78/408)
    - **Detached**: cut off from yourself or what's around you. (−.44/3.65/49)
    - **Indifferent**: you don't care either way. (−.21/4.28/20)
  - **Uncomfortable**: ill at ease with a place or the people around you. (−.62/2.70/1888)
    - **Awkward**: unsure how to act around others. (−.41/2.95/727)
    - **Out of place**: you don't fit in here. (–/–/225) Unscored; not belonging is unpleasant.
  - **Embarrassed**: something awkward happened in front of others, and you wish no one had seen it. (−.63/3.51/828) Covers your own awkward moments and someone else's (Cringe). Lucas, 2026-11-22: moved from Sad. In daily reports embarrassment comes with guilt and fear, almost never sadness, and it isn't loss, danger, or unfairness ([research/10](research/10-which-core-people-tap.md)). Its old definition ended "uncomfortable", now a sibling's word.
    - **Foolish**: you made a silly mistake, and you feel embarrassed. (−.37/3.00/255)
    - **Mortified**: so embarrassed you want to vanish. (−.67/–/26) English sorted mortification with fear (older sense); conflict recorded.
    - **Cringe**: someone else did something awkward, and you feel embarrassed for them. (−.51/3.24/0.02) New. Lucas, 2026-11-20: chosen over "Embarrassed for them" (36). Books barely use it, so rule 10's counts can't measure it; `check.py` exempts it with that reason.
  - **Guilty**: you feel bad about something you did. (−.73/3.09/3496) Lucas, 2026-11-22: moved from Sad. People say guilt as "I feel bad about it" ("feel bad about" 742 per billion, and "bad" is the word most linked to guilty), so Bad is the door they'd tap; raters offered no catch-all split between Scared (45%) and Sad (36%) ([research/10](research/10-which-core-people-tap.md)).
    - **Remorse**: deep guilt, wishing you hadn't caused harm. (−.79/3.63/101)
    - **Apologetic**: guilty and wanting to make amends. (−.04/6.65/21) New. Lists disagree. Flag: "sorry" (2,918) is mostly sorry-for; the apologetic sense (sorry about 27, sorry that 36) is 3x, and "Sorry" alone reads both ways.
  - **Disgusted**: something gross, like a smell or something slimy, makes you want to pull away. (−.90/2.68/251) Physical disgust. Lucas, 2026-11-22: physical disgust isn't anger, so its door is Bad; the same label as moral disgust under Angry ([research/9](research/9-disgust.md)).
    - **Repulsed**: something makes you want to get away from it. (–/–/16; "I was repulsed" 9) Unscored; repulsive −.71/1.95. Moved from Angry.
    - **Squeamish**: blood, injury, or bugs make your stomach turn. (−.65/–/9; "I was squeamish" 1.5) New. Under 15 in both counts: said as "I'm squeamish".

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


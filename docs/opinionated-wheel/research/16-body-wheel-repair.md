# The body wheel repair, and "You might notice" for the new words

2026-11-26. Part 1 of the [handoff](../handoff.md): the body wheel (`src/data/wheels/body.json`) pointed at the old feelings wheel, and 21 of its 60 feelings were gone. Lucas asked for a repair, not a rebuild: change only what the new words force, by the research and rules the body wheel was built with ([rework spec](../../superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-design.md), its [changes](../../superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-changes.md), and `src/data/README.md`). Areas and sensations are unchanged; only the feelings under 35 of the 46 sensations changed.

## How it was done

1. **Two drafts, written apart.** I drafted the repair. A second agent drafted it again from the same rules, research, and both wheels, without seeing mine. They agreed on 33 of the 46 sensations.
2. **A referee for the 13 disagreements.** A third agent, who wrote neither draft, ruled on each against the rules, the spec's "Backed by" column, and the research notes, and checked each side's claims. It sided with my draft on 9 and the other on 4, and caught four factual slips in the drafts' reasons (below). Every ruling was taken.
3. **A cold review of the new cards.** A fourth agent judged each new card's "You might notice" by one question: would most people who feel this say "yes, I notice that"? 89 of 96 passed. Of the 7 flagged, 5 changed, and 2 followed the body wheel instead (see "You might notice" below).
4. **Checked by script and in the app.** A new data test checks the line rule below. The repaired wheel opens and reads correctly in the app.

## The rules it had to meet

- Every sensation has 2 or 3 feelings, each a word on the new wheel.
- **No two from the same line** (parent, child, or grandparent), as `rules.md`'s body wheel check says. A core word counts, and a word on the wheel twice (Empty, Betrayed) is in both its lines. `src/data/README.md` said this loosely before ("keep both only when each says something the other doesn't"); it now says it the way `rules.md` and the handoff do, and a data test enforces it.
- 140 feeling cells or fewer. It's now **124** (126 before).

## What the new words forced, and the general calls

- **Scared is a core now.** Before, Scared was a middle word ("a sudden feeling that you are in danger") beside Nervous, Startled, and Threatened. As the core, it's in the same line as every fear word. So it stays only where the sensation splits across families and no other fear word sits beside it (Racing heart, Shaky hands, Chills, Weak knees). That's where a core is the best fit: the sensation says "fear, or anger, or excitement", not which kind of fear. Elsewhere it gives way to the fear word for sudden, real danger, which is what it meant: Terrified, or Petrified on Frozen ("frozen with fear"), or Panicked on Tight throat (a choking feeling is a panic symptom, [DSM-5](../../reference/dsm-5-symptoms.md)).
- **When a word and its parent now share a sensation, the parent usually stays.** A body-wheel card jumps to its word on the feelings wheel, where the children are, so the parent is the better door. The rework did the same each time it hit a parent-child pair. The exception is a child that's the exact reading (Pressured for a weight on your shoulders, Exposed for wanting to hide).
- **Plain successors,** used the same way everywhere: Stressed → Overwhelmed (which replaced it), Depressed → Down ("Down, not Depressed"), Mad → Angry, Despair → Hopeless, Powerless → Helpless, Let down → Disappointed, Dismayed → Shocked, Peaceful → At peace (same definition), Revolted → Repulsed (same definition), Repelled → physical Disgusted, Fragile → Vulnerable, Thankful → Grateful.
- **Body states leave the feeling ring.** Tired becomes Burned out, the mood that tiredness brings, where a worn-out reading is the point (Foggy head, Drained, Sleep). Weak leaves with nothing in its place where Helpless already covers it (Heaviness).

## Every sensation that changed

| Sensation | Before | Now | Why |
|---|---|---|---|
| Headache | Stressed, Frustrated | Overwhelmed, Frustrated | Stressed → Overwhelmed. |
| Foggy head | Confused, Tired, Depressed | Confused, Down, Burned out | Depressed → Down keeps DSM-5's "trouble thinking" with low mood; Tired → Burned out. |
| Hot face | Embarrassed, Ashamed, Humiliated | Embarrassed, Ashamed | Humiliated is now under Ashamed. The parent stays: two different kinds (a social slip, judging yourself), and Humiliated is one tap away. |
| Heart in throat | Scared, Nervous, Startled | Terrified, Nervous, Startled | Scared is the core over both others. |
| Tight throat | Anxious, Frightened, Repelled | Anxious, Panicked, Disgusted (physical) | A choking feeling is a panic symptom (DSM-5); disgust sits in the throat ([bodily maps](../../reference/nummenmaa-bodily-maps.md)). |
| Dry mouth | Nervous, Scared | Nervous, Terrified | Fear cuts saliva; the old Scared was acute fear, and Anxious would be nearly the same choice as Nervous. |
| Clenched teeth | Mad, Resentful, Stressed | Frustrated, Resentful, Overwhelmed | Angry would block Resentful, the less obvious reading; gritted teeth usually hold frustration. |
| Tense shoulders | Stressed, Anxious, Frustrated | Overwhelmed, Anxious, Frustrated | Stressed → Overwhelmed. |
| Weight on shoulders | Pressured, Overwhelmed, Powerless | Pressured, Helpless | Pressured is now under Overwhelmed. It stays as the exact meaning of the idiom (the weight of demands); Powerless → Helpless. |
| Tight fists | Mad, Frustrated | Furious, Frustrated | Angry would block Frustrated; anger shows in the arms and hands (bodily maps). |
| Cold hands | Scared, Nervous | Terrified, Nervous | As Dry mouth. |
| Racing heart | Scared, Mad, Excited | Scared, Angry, Excited | Mad → Angry. Two cores fit a signal read as fear, anger, or excitement. |
| Short breath | Anxious, Stressed | Anxious, Overwhelmed | Stressed → Overwhelmed. |
| Heavy heart | Guilty, Let down, Depressed | Guilty, Disappointed, Down | Lucas's call on Let down (2026-11-22); Depressed → Down. |
| Sinking feeling | Disappointed, Dismayed, Worried | Disappointed, Shocked, Worried | Dismayed was Shocked and Disappointed together, and Disappointed is already here. |
| Queasy | Repelled, Anxious | Disgusted (physical), Anxious | Nausea is disgust's own sensation ([Rozin](../../reference/rozin-disgust.md)). |
| Restless | Anxious, Bored, Eager | Anxious, Bored, Excited | Eager left as "keen to start right now", which the wheel's reason says Motivated covers, while "Excited covers the energy"; a restless body is the energy. |
| Chills | Frightened, Awe, Inspired | Scared, Awe, Inspired | No other fear word here, so the core fits (chills are a panic symptom). |
| Frozen | Scared, Shocked, Powerless | Petrified, Shocked, Helpless | Petrified is "frozen with fear", the freeze response itself. |
| Skin crawling | Repelled, Violated | Disgusted (physical), Violated | The rework split Repelled (here) from Revolted (Back away) on purpose, and that split carries over. |
| Heaviness | Depressed, Weak, Helpless | Down, Helpless | Sadness drains the limbs (bodily maps); Weak is a body state, and Helpless covers it. |
| Drained | Tired, Apathetic | Down, Burned out, Unmotivated | Down's own card says "low and drained", and the backing is DSM-5's fatigue with depression. |
| Numb / empty | Numb, Empty, Shocked | Numb, Down, Shocked | Empty is now under Numb, and Numb stays since the label names it (Empty keeps its path from Hollow chest). The backing is DSM-5's "empty" low mood, and Empty sat under Depressed before. |
| Nothing much | Content, Peaceful, Apathetic | Content, At peace, Unmotivated | The new wheel has no word for not caring; Unmotivated is the closest, and Disconnected would bring back the overlap with Numb / empty that the rework removed. |
| Weak knees | Scared, Weak, Aroused | Scared, Squeamish, Aroused | The backing is the fainting reflex with "some fears", which is the blood-and-wounds faint Squeamish names. |
| Run | Scared, Threatened, Overwhelmed | Terrified, Threatened, Overwhelmed | Scared is Threatened's grandparent; fear's urge to escape ([Frijda](../../reference/frijda-action-tendencies.md)). |
| Hide | Ashamed, Exposed, Vulnerable | Ashamed, Exposed, Mortified | Exposed is now under Vulnerable, and "nowhere to hide" is the exact word. Mortified, "embarrassed so deeply you wish you could vanish", takes the open slot: wanting to vanish is the urge itself. |
| Back away | Revolted, Disapproving | Repulsed, Contempt | Moral Disgusted would show as plain "Disgusted" beside Repulsed and read as the same thing; Contempt is the moral, rejecting side of the old Disgusted family. |
| Fix things | Guilty, Worried, Loving | Guilty, Worried, Compassion | Loving was there for compassion's urge to help ([Goetz](../../reference/goetz-compassion.md)), and Compassion is on the wheel now. |
| Be close | Loving, Lonely, Insecure | Love, Lonely, Insecure | Love's card is "a wish to be close"; no other Love word sits here. |
| Be alone | Withdrawn, Fragile, Overwhelmed | Down, Vulnerable, Overwhelmed | Sadness pulls back ([DBT](../../reference/linehan-dbt-model-of-emotions.md)); Fragile → Vulnerable, its old parent. |
| Give up | Despair, Inadequate, Helpless | Hopeless, Inadequate, Helpless | Lucas kept Hopeless over Despair (2026-11-20). |
| Sleep | Tired, Bored, Depressed | Burned out, Bored, Down | Sleeping too much comes with depression (DSM-5). |
| Cry | Frustrated, Overwhelmed, Thankful | Frustrated, Overwhelmed, Grateful | Lucas sent being moved by kindness or a gift to Grateful when he narrowed Moved to suffering or courage (2026-11-22). |
| Control things | Out of control, Anxious, Jealous | Overwhelmed, Anxious, Jealous | Out of control was "faster than you can manage", Overwhelmed's sibling; Helpless ("no matter what you do") contradicts an urge to take control. |

**Unchanged (11):** Lightheaded, Lump in throat, Shaky hands, Sweaty palms, Tight chest, Hollow chest, Knot in stomach, Butterflies, Buzzing, Lash out, Numb out.

### What the referee caught

- Cry: the wheel's left-out list never names Grateful for Thankful; it only says Thankful is "the same as a wheel word". Grateful still wins, on Lucas's Moved decision.
- Back away: no reference note backs contempt's urge to distance, and the Frijda note doesn't speak of "both kinds" of disgust. Contempt still wins, on the labels.
- Dry mouth: the spec's backing is "fear cuts saliva"; extending it to anxiety was a drafter's own step.
- Nothing much: calling Apathetic a rarer label for Unmotivated is an inference from a usage count.

### Readings lost

These were readings on the old wheel that no word on the new one carries. They're worth knowing; none is a reason to change the feelings wheel by itself.

- **Not caring** (Nothing much, Drained). The new wheel has no word for it; Unmotivated is about drive. If a later pass adds one, Nothing much is where it goes.
- **Weak**, as lacking the strength to cope (Weak knees, Heaviness).
- **Disapproving's mildness** (Back away): Contempt is stronger.
- **Out of control**, as itself (Control things).

## The urges, rechecked

The cores changed: Love is new, and Surprised, Fearful, and Disgusted aren't cores now. Each core's typical urges ([Frijda](../../reference/frijda-action-tendencies.md), [DBT](../../reference/linehan-dbt-model-of-emotions.md)) are still on the wheel:

- **Scared:** escaping (Run: Terrified, Threatened), hiding (Hide: Exposed).
- **Angry:** attacking (Lash out: Furious, Provoked), controlling from jealousy (Control things: Jealous), rejecting what's wrong (Back away: Contempt).
- **Sad:** pulling back (Be alone: Down), giving up (Give up: Hopeless, Inadequate), shame's hiding (Hide: Ashamed). Cry still leaves out Sad on purpose.
- **Bad:** guilt's making it right (Fix things: Guilty), physical disgust's getting it away (Back away: Repulsed), embarrassment's wanting to vanish (Hide: Mortified).
- **Love:** being with (Be close: Love), helping (Fix things: Compassion).
- **Happy:** Frijda's "being with someone" with enjoyment is now Love's, in Be close. What's left are the two the README already left out, and both are Happy's now: the urge to laugh, and the urge to look closer, which was Surprised's and now comes with Interested and Amazed. The README says so.

## Reach

Each core is reachable from at least 2 areas: Scared and Angry 8, Bad 7, Sad 6, Happy 5, Love 2. Happy had the fewest before; it gained Excited from the old Surprised. The README now says the pleasant cores, Happy and Love, have the fewest on purpose. Its rule on pleasant feelings ("only as the other reading") now covers Love's words too.

For reference, not a rule: the unpleasant middle words with no body path are Heartache, Annoyed, Offended, moral Disgusted, and Uncomfortable.

## The Urges color

Lucas asked for Disgusted's brown (#A4532A light, #C77A4F dark) in place of Urges' mauve, checked against Shoulders. As an area color, it has to pass a check it never faced as a feeling color: after it's darkened for white labels, it must stay a set distance from every other color. It didn't, but not because of Shoulders. Darkened for white labels, it sits too close to Happy's orange (0.044 light and 0.029 dark, against a floor of 0.055). In dark mode, Happy's orange itself renders as a brownish orange.

So the brown is darkened slightly: **#9A4E26** light (same hue, a little deeper) and **#954E17** dark. Both pass every color test. Against Shoulders the distance is 0.124 in light mode and 0.065 in dark mode, the same as Shoulders and Chest, the closest pair that already ships, and the two aren't neighbors on the wheel. The feeling token `--hue-disgusted` is gone, since no core uses it. The link previews are redrawn, and all 8 body areas have theirs back.

## "You might notice"

- **96 new cards drafted.** Each lists 2 to 4 sensations. Wherever the body wheel offers a sensation for a feeling, the card lists it, unless the cap of 4 forces a choice. Words that replaced a gone word started from its old card (At peace from Peaceful, Grateful from Thankful, Down from Depressed, Repulsed from Revolted, physical Disgusted from Repelled). The rest are drafted from the [bodily maps](../../reference/nummenmaa-bodily-maps.md), the DSM-5's symptom lists, the urges research, and common experience.
- **The cold review's changes.** Uneasy: Butterflies in place of skin crawling, which reads as disgust and is too strong for a slight unease. Fed up gains Wanting to give up, which sets it apart from plain annoyance. Mortified gains Feeling frozen, so it no longer matches Foolish. Disconnected: a foggy head in place of not feeling much, which nearly repeats feeling numb or empty. Contempt: Feeling tall in place of clenched teeth, a hot-anger sign, for looking down on someone. The reviewer's other flag, dropping Wanting to cry from Grateful, was overruled, since the body wheel's Cry now offers Grateful.
- **Six kept cards changed to agree with the wheel.**
  - Vulnerable gains Wanting to be alone, Helpless gains A weight on your shoulders, and Squeamish lists Weak knees.
  - Scared, Overwhelmed, and Shocked each swap a sensation whose wheel path moved elsewhere for one the wheel now offers them.
  - Capped cards, where the wheel offers more than 4: Excited, Down, Scared, Anxious, Nervous, Shocked, Frustrated, and Overwhelmed.

All 160 cards and the body wheel's sections are in [content-review.md](../../content-review.md), rebuilt from the data.

## The order around the ring

Added after the repair, when Lucas saw the same feeling twice in a row across two sensations, and long runs of one core's color. The outer ring is one circle of 124 cells, so the last feeling of one sensation sits next to the first of the next, across areas too.

- **Before:** 3 feelings sat right next to themselves (Clenched teeth into Tense shoulders: Overwhelmed; Queasy into Restless: Anxious; Restless into Buzzing: Excited), 4 more had just one cell between them, and 8 runs of 3 or more cells shared a color, the longest 5 cells of Scared in Throat / mouth.
- **After:** no feeling sits next to itself, and only Anxious has just one cell between its two places (Queasy into Restless, across Stomach and Whole body). The only runs of 3 left are sensations whose 3 feelings all come from one core (Heart in throat, Hollow chest, Frozen), which reordering can't change.
- **How:** a search over the order of the feelings under each sensation, scoring repeats close together and same-colored neighbors, and preferring the order they had. 21 sensations changed order; which feelings each one leads to didn't change.
- **Sensations stay in their order,** because that order helps people find them: areas run head to toe, and within an area, places run the same way (Throat before mouth, head before face) and Whole body runs roughly from wound up (Restless, Buzzing) to shut down (Numb / empty, Nothing much). One swap: Heart in throat now comes before Lump in throat, two throat idioms with no order between them, which ends the run of 5 Scared cells.
- **A pleasant feeling isn't listed first** where the sensation has a hard reading too, since the sensation's card lists them in this order under "Could be", and the README lets pleasant feelings in only as the other reading. Be close and Nothing much are the exceptions, since their pleasant readings are their main ones; Be close now ends with Love, after Insecure and Lonely, and Nothing much lists Unmotivated between Content and At peace.

Why not alphabetical: studies of menus find alphabetical order fastest only when people know the exact word they want, and here people are looking for a word they don't know yet. Positions that stay put matter more once people come back to the wheel, and an alphabetical order would also differ in every language. Under a sensation, with only 2 or 3 words, people read them all, so that order is free to spread the colors.

## Tests

Body wheel tests run again, since the body wheel is back in the app. A new data test checks the line rule. Tests that restate the body wheel's content were updated: cell count, tree count, Racing heart, Cry, Nothing much, the urge path, and one zoom value that follows area widths (Shoulders lost a cell). Tests that name the old feelings wheel's words, cores, or colors still fail, as before this change. Part 3 replaces them.

# Body wheel rework: what changed from the spec

What shipped differs from the [spec](2026-11-15-feels-on-wheels-body-wheel-rework-design.md) in these ways.

## The About page keeps AI off it

Lucas, 2026-11-16, while the plan was written: the About paragraph doesn't say the body wheel was made with AI, overriding §9. The [About page rework](2026-11-14-feels-on-wheels-about-rework-design.md) left AI off the page on purpose ("That's in the README"), and a test keeps it that way. The About paragraph says what the body wheel draws on, that it was put together by someone without formal training, that it isn't a clinical tool, and that corrections are welcome. It links to the README section, which says how AI was used.

## "You might notice" is capped at 4

The content tests allow 2 to 4 sensations per feeling, so a feeling the body wheel offers under more than 4 sensations lists the 4 most typical, not all of them. After the hand pass, the wheel offers these that their cards leave out: Overwhelmed (Lightheaded, Run, Be alone, Cry), Nervous (Lightheaded, Cold hands), Scared (Dry mouth, Shaky hands, Cold hands, Weak knees), Anxious (Tight throat, Tense shoulders, Short breath, Queasy, Buzzing), Repelled (Tight throat), and Excited (Sweaty palms).

Five feelings had only one sensation left after the old ones were mapped (§4), so each got a second by hand:

| Feeling | Added |
|---|---|
| Trusting | Warm / full chest |
| Proud | Feeling tall |
| Content | Light body |
| Amazed | Chills |
| Surprised | Racing heart |

## No core feeling is on the body wheel

Want to cry leaves out Sad (§3), so no core feeling is left on the body wheel. The card test for "a core feeling gets no core sentence" no longer has a body wheel case.

## The longest breadcrumb fits at 320 px

The longest sensation is now "Weight on shoulders", which fits beside its area at 320 px, so no breadcrumb shortens on the body wheel any more. The end-to-end test checks that the crumbs fit, sit on one line, and stay focusable links.

## After seeing it built: fewer cells, and no word beside its own parent

Lucas, 2026-11-16, after seeing the wheel built with 144 cells: "This is too tight." On a phone with an area opened, the outer ring showed no feeling words, and the body wheel needed a radius of about 618 px to rest whole. He agreed these changes:

- **No sensation offers a word with its own parent or child here.** Each of these pairs added nothing, so each sensation keeps the one that fits.

  | Sensation | Spec | Now |
  |---|---|---|
  | Want to back away | Repelled, Horrified, Hesitant | Repelled, Disapproving |
  | Skin crawling | Repelled, Horrified, Violated | Repelled, Violated |
  | Headache | Stressed, Frustrated, Overwhelmed | Stressed, Frustrated |
  | Tight chest | Anxious, Overwhelmed, Resentful | Anxious, Resentful |
  | Want to give up | Despair, Powerless, Inadequate | Despair, Inadequate |

- **Want to get even merges into Want to lash out.** Lucas found them "way too similar", which breaks §2's rule that two sensations in one area must feel different or lead to different feelings. Want to lash out becomes Furious, Provoked, Hurt. Hurt is there because anger often covers hurt ([emotion-focused therapy](../../reference/greenberg-emotion-focused-therapy.md)). Hostile goes, since it shares a parent with Provoked. In "You might notice", Bitter, Resentful, and Betrayed list Want to lash out instead.

That leaves 50 sensations and 136 cells. With 140 cells or fewer, the phone shows the outer ring's words again.

## Happy feelings come in as the other reading of a sensation

Lucas, 2026-11-16: happy feelings are "a lot of what people don't need help with". He agreed a rule for the body wheel. Happy feelings come in as the other reading of a sensation, where the same body signal could be a hard feeling (a racing heart could be scared or excited). A sensation whose only reading is happy doesn't earn a place.

- **Off the body wheel:** Light body, Relaxed, Feeling tall, and Warm / full chest.
- **Still in "You might notice":** all four stay as sensations, with their labels, so Joyful, Proud, Peaceful, and the other happy feelings still have a real answer to what they feel like. The two lists don't have to match ("There's no reason to make this a hard and fast rule"). They don't link into the body wheel, as the spec already says.
- **A test** checks that no sensation on the body wheel has only happy feelings.
- **Happy is now reachable from 2 areas, not 3:** Whole body (Flat, Chills, Weak knees) and Urges (Fix things, Be close, Cry). Warm / full chest was its only path from Chest. The other core feelings are unchanged: Fearful 8, Angry 7, Sad 7, Surprised 6, Bad 5, Disgusted 5.

## Flat

Lucas, 2026-11-16: "sometimes I'm not sure if I feel numb, or if I just don't have a strong emotional response to something." He finds himself torn between numb and content or accepting, where accepting means "not wanting to fight reality, and going with the flow."

**Flat** goes under Whole body, after Numb / empty: Content, Peaceful, Numb. Backed by:

- [Russell's circumplex model](../../reference/russell-circumplex.md): a low-energy feeling can be pleasant or unpleasant, and the body alone doesn't say which.
- [Desbordes and others](../../reference/desbordes-equanimity.md): equanimity is easily confused with indifference or numbness; whether you still care is the tell.
- Accepting your situation, as [DBT's radical acceptance](../../reference/linehan-dbt-model-of-emotions.md) and [acceptance in ACT](../../reference/hayes-experiential-avoidance.md) describe it.
- Lucas's own experience.

The feelings wheel has no word for that kind of acceptance. Its Accepted means being welcomed by others. So Flat uses the two closest words, Content ("satisfied with how things are right now") and Peaceful ("calm and settled, without inner conflict"). The missing word is noted under the opinionated feelings wheel idea in the roadmap.

That leaves 47 sensations on the body wheel (51 in the vocabulary, counting the four kept for cards) and 127 cells.

## Distinct feelings: a rule to read, not a test

Lucas, 2026-11-16: the feelings wheel's nesting doesn't always fit ("Some of the narrow words on the feelings wheel just don't quite fit being nested under their parent"), so a strict rule built on it would carry its oddities into the body wheel. He chose a rule judged on meaning, written for whoever edits the wheel, with no test or script ("writing scripts for things that aren't checked constantly feels silly"). For the wheels' README:

> **Feelings under one sensation must be different enough that someone would choose between them.** A word and its own parent or child on the feelings wheel often aren't (Stressed and Overwhelmed, Repelled and Horrified), so look at those pairs first. Keep both only when each says something the other doesn't, and never fill a sensation with one word and the words nested under it (Repelled with Horrified and Hesitant). Feelings that all come from one core feeling are fine when each is a real choice (a lump in your throat: Hurt, Grief, Guilty).


## Two strings per sensation: one for the wheel, one for cards

Lucas, 2026-11-16: "Want to" read oddly on the wheel, and "You might notice: frozen" or "queasy" "makes zero sense." One string was doing two grammatical jobs. The fix is one id with two strings, so each context gets its own string to translate:

- **`sensations`:** the wheel's label, short and bare. Urges lose "Want to" ("Hide", "Fix things", "Control things"), since the area gives the context ("Urges › Hide").
- **`sensationPhrases`:** how a feeling's card lists the sensation under "You might notice" ("Wanting to hide", "Feeling queasy", "A racing heart"). The loader requires one for every sensation a card lists.

This replaces §1's and §2's "Want to …" labels; spec For review question 8 left the form open until now. Urge ids follow the new labels: `run`, `hide`, `lash-out`, `back-away`, `fix-things`, `be-close`, `be-alone`, `give-up`, `numb-out`, `sleep`, `cry`, `control-things`. Lucas chose shared ids over separate card text because they keep each string written once, and keep it possible to see whether cards and the wheel agree.

Page titles and link previews still use the wheel's label ("Hide · Feels on Wheels").

## The wheel says "The urge to…"

Lucas, 2026-11-16: the drawn wheel names the Urges area "The urge to…" (with a real ellipsis character, which takes less room), so the ring reads "The urge to… run, hide, cry". It fits the area's cell on a phone and on desktop. Everywhere else keeps "Urges": breadcrumbs, cards, page titles, link previews, and the tree a screen reader reads. The locale's `areaWheelLabels` holds the wheel-only label; most areas have none.

## The outer ring is lighter, like the feelings wheel's

Lucas, 2026-11-16, after seeing three versions side by side: the body wheel's feeling cells take their own ring's shade, the lightest, instead of their core feeling's darkest shade (spec v2.1 §7.1). The darkest shade felt "way too bold". Each feeling's color as it sits on the feelings wheel varied by where a word happened to sit, so some areas looked heavy and nothing was consistent. Now both wheels go from darker in the center to lighter at the edge. The color tests already keep every area color distinct from every feeling color at every shade, so nothing else changes. The layout's `shadeRing` field, which only existed for the old rule, is gone.

## Link previews: the rings line up

Lucas, 2026-11-16: on the body wheel's link previews, the outer ring's cells never lined up with the middle ring's. The [share and preview spec](2026-11-15-feels-on-wheels-share-and-preview-design.md) §5 splits each ring into roughly equal cells, one ring at a time, so the boundaries fell in different places. Now every middle cell splits into exactly two outer cells, so the lines run straight through on both wheels, and the preview stays as chunky as before.

## The rules live in `src/data/`, not `src/data/wheels/`

Lucas, 2026-11-17: spec §10 put the README and its `AGENTS.md` in `src/data/wheels/`, but the rules also cover `src/data/feelings.json` and `src/data/locales/*.json`. In Claude Code, a folder's `AGENTS.md` loads when a file under that folder is read, so the old place missed two of the three. Both files moved up to `src/data/`. The `AGENTS.md` now imports the README with `@README.md`, so Claude Code loads it automatically, and lists concrete steps for a content change instead of "read it, follow it".

## Brief credits on the About page

Lucas, 2026-11-17: the About page's credits, with 18 research citations added, were "incredibly verbose", and the app's credits should be brief in general. He changed the rule in the root `AGENTS.md`: every source is credited in the root README's Credits (and in `docs/reference/README.md`), and the About page names only the main ones and links there. This replaces §9's "the About page credits the new sources".

The About page's Credits section is now four short paragraphs, with no list:

- **Who it builds on:** Willcox, Roberts, Braman, feelingswheel.com, and research for the body wheel.
- **Who put it together:** someone without formal training, and it isn't a clinical tool.
- **"Read the full credits and the research behind the body wheel"**, which links to the README's Credits.
- **"Think a word or definition is wrong? Tell us"**, which opens the Wheel content issue form. It doesn't mention GitHub.

Lucas chose both links' wording, since "Every source, with links" and "Question a word" didn't say where they went or what you'd do there. The first visit's download goes back down to about 39 KB gzipped.


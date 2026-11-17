# Body wheel rework: what changed from the spec

What shipped differs from the [spec](2026-11-15-feels-on-wheels-body-wheel-rework-design.md) in these ways.

## The About page keeps AI off it

Lucas, 2026-11-16, while the plan was written: the About paragraph doesn't say the body wheel was made with AI, overriding §9. The [About page rework](2026-11-14-feels-on-wheels-about-rework-design.md) left AI off the page on purpose ("That's in the README"), and a test keeps it that way. The About paragraph says what the body wheel draws on, that it was put together by someone without formal training, that it isn't a clinical tool, and that corrections are welcome. It links to the README section, which says how AI was used.

## "You might notice" is capped at 4

The content tests allow 2 to 4 sensations per feeling, so a feeling the body wheel offers under more than 4 sensations lists the 4 most typical, not all of them: Anxious, Scared, Overwhelmed, Nervous, Excited, and Repelled.

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

- **No sensation offers a word with its own parent or child.** Offering a word next to its own broader or narrower word adds nothing, so each keeps the one that fits. A data test now checks it.

  | Sensation | Spec | Now |
  |---|---|---|
  | Want to back away | Repelled, Horrified, Hesitant | Repelled, Disapproving |
  | Skin crawling | Repelled, Horrified, Violated | Repelled, Violated |
  | Headache | Stressed, Frustrated, Overwhelmed | Stressed, Frustrated |
  | Tight chest | Anxious, Overwhelmed, Resentful | Anxious, Resentful |
  | Want to give up | Despair, Powerless, Inadequate | Despair, Inadequate |

- **Want to get even merges into Want to lash out.** Lucas found them "way too similar", which breaks §2's rule that two sensations in one area must feel different or lead to different feelings. Want to lash out becomes Furious, Provoked, Hurt. Hurt is there because anger often covers hurt ([emotion-focused therapy](../../reference/greenberg-emotion-focused-therapy.md)). Hostile goes, since it shares a parent with Provoked. In "You might notice", Bitter, Resentful, and Betrayed list Want to lash out instead.

That leaves 50 sensations and 136 cells. With 140 cells or fewer, the phone shows the outer ring's words again.

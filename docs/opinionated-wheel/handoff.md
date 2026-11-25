# Handoff: the body wheel, then the rest

The prompt for the next session on the [opinionated feelings wheel](../ROADMAP.md#an-opinionated-feelings-wheel). Paste everything below the line. The previous handoff (scrutinize the rules, rule on the cores, comb the words) is done; it's in git history before this change.

---

We're continuing the opinionated feelings wheel for Feels on Wheels. The rules, the cores, and the words are settled for now: a 162-word wheel, every check passing. I'll do my own pass over the words at some point. This session fixes the body wheel to match the new words, then tidies the loose ends in the words, then turns the work into something the app can ship.

Start by reading, in this order:

1. `docs/opinionated-wheel/learnings.md`: how I work, what went wrong before, and every decision I've made, with dates. Follow it.
2. `docs/opinionated-wheel/rules.md`: the rules. Their north star is how people use the wheel: they start at the center, tap the core that matches what they feel, tap a middle word, find their word, and read its card. Anything I decided earlier can be rechecked against that.
3. `docs/opinionated-wheel/derived-wheel.md` (and `.json`): the wheel, with each word's definition, data, and reason. Its older entries cite old rule numbers; the note at the top maps them.
4. `docs/opinionated-wheel/research/`: reports 1 to 11. The newest (9 to 11) matter most: disgust, which core people tap, and the fresh comb pass.
5. `src/data/README.md` and `src/data/AGENTS.md`: the project's rules for wheel content, including the body wheel's, and the steps for changing wheel files.

Continue on the branch `opinionated-wheel-rules`, or branch from the latest `main` if it has merged. Use the brainstorming skill.

**How I want to work** (it's in the learnings too, but it matters most):
- One decision per message, short, with only the context it needs: the spot, its neighbors, definitions, counts. Never a long list of findings and questions at once. Keep a "decided so far" line I can check.
- Research and the rules decide placement; ask me only real coin flips. When the evidence and "which core / word would you tap first?" agree, make the call and tell me in a line.
- Push back when a rule or one of my calls looks wrong, with the case.
- Plain English: pleasant or unpleasant, not "valence".
- Separate writers from checkers, and keep checkers cold. Have important research checked by a second agent before it reaches me.

**Scope:** translations are out of this work entirely.

**Done on 2026-11-22:** `check.py` follows the rules' flags; Cringe is settled ([research/12](research/12-cringe.md)); every definition is a sentence to "you". **Done on 2026-11-23:** the definition rules were rethought and every definition rewritten by them ([learnings](learnings.md#lucass-decisions)). **Done on 2026-11-25:** Lucas reviewed every card, and the definition rules were revised after a cold test against his notes ([research/13](research/13-definitions-review.md)). The flagged cards were then fixed by those rules and cold-checked ([research/14](research/14-card-fixes.md)), and the open decisions settled ([learnings](learnings.md#lucass-decisions)). The branch's preview deploy (https://opinionated-wheel-rules-feels-on-wheels.politolu.workers.dev/) shows the derived wheel, with the body wheel off: after changing `derived-wheel.json` or a definition in `derived-wheel.md`, run `python3 -I docs/opinionated-wheel/scripts/app-wheel.py` and push. Tests that name today's words fail until Part 3.

**Order** (Lucas, 2026-11-22): the body wheel comes only after the feelings wheel and its definitions are 100% decided. So: `check.py` (Part 2), Cringe, the definitions, then Lucas's own pass over words and definitions together; then the body wheel (Part 1); then "You might notice", which `src/data/README.md` drafts to agree with the body wheel's paths; then Part 3.

## Part 1: the body wheel

The body wheel (`src/data/wheels/body.json`) maps each body sensation to 2 or 3 feelings by name, and today it points at today's feelings wheel. 21 of its 60 feelings aren't on the new wheel: `python3 -I docs/opinionated-wheel/scripts/compare.py` lists them (apathetic, depressed, despair, disapproving, dismayed, eager, fragile, frightened, let-down, loving, mad, out-of-control, peaceful, powerless, repelled, revolted, stressed, thankful, tired, weak, withdrawn). A cold check found that against the new wheel, 14 sensations drop below 2 feelings (Drained and Back away to none), 8 hold a feeling with its own parent or child, and 2 hold a feeling with its grandparent ([research/7](research/7-looser-rules-refuted.md), section 3).

- Map every sensation to 2 or 3 feelings on the new wheel. The rules (`rules.md`'s body wheel check and `src/data/README.md`): every feeling is on the feelings wheel, no two from the same line (parent, child, or grandparent), and a core word can be one where it's the best fit.
- Judge it the same way as the feelings wheel: someone notices a sensation and looks for what they feel. Body states like Tired go on the body wheel's side, not the feelings wheel; Tired, Weak, and Withdrawn need thought.
- Draft the whole mapping, have a cold agent check it, then bring me only the real choices, one at a time.

## Part 2: loose ends in the words

- **Definitions.** Rethought on 2026-11-23: new rules in `rules.md` (Definitions), and all 162 rewritten by them, reusing the first wheel's where they fit, then cold-checked; `scripts/definitions.py` checks labels. Lucas reviewed them on 2026-11-25 and the rules were revised ([research/13](research/13-definitions-review.md)); the flagged cards were fixed the same day ([research/14](research/14-card-fixes.md)). Change only cards someone flags: a cold rewrite of the whole wheel made 20 of 50 unflagged cards worse. Still to do: "You might notice" for the new words, drawing on the [bodily maps research](../reference/nummenmaa-bodily-maps.md).
- **Cringe** needs evidence that people say it about themselves ("I'm cringing", "secondhand embarrassment"), since "that's cringe" describes a thing.
- **`check.py`** still counts only "feel ___", not "I was ___", and flags by the old thresholds, so its rare-word flags overstate (Fascinated and Petrified look rare; "I was fascinated" is 216). Bring it in line with `rules.md`'s flags: both counts, median year, rare only when both are under 15.
- **Jealous** (with Envious and Possessive): I said it doesn't work very well. If my pass or new evidence changes that, revisit it; otherwise leave it.

## Part 3: make it real

- Move the rules into `src/data/README.md`'s content rules (it wins over a spec). The CI-side checks (each word once, layout, body wheel, what-happened tags, situations) become data tests; the pleasantness check and usage flags stay in the local scripts, since the datasets can't be committed.
- Every source the rules and wheel lean on gets a note in `docs/reference/` and a credit in `docs/reference/README.md` and the root `README.md` (root `AGENTS.md`, "Sources and credits"). The research reports list them; there are many now. One open question for me: whether NRC's request for an About-page credit covers using it only as a design-time check.
- Write the spec in `docs/superpowers/specs/` and update the roadmap. Once their content is in the spec, `src/data/README.md`, and `docs/reference/`, the files in `docs/opinionated-wheel/` can go.

## Data

None of the datasets is in the repo; their licenses limit redistribution. Download them into one folder outside the repo and set `WHEEL_DATA` for `docs/opinionated-wheel/scripts/`. The table in `learnings.md` ("Data") and [research/3](research/3-word-data.md) list them. Known-good sources:
- NRC VAD v2.1: https://saifmohammad.com/WebDocs/Lexicons/NRC-VAD-Lexicon-v2.1.zip, unzipped to `nrc-vad/extracted/`.
- Warriner 2013: the Springer supplement zip in research/3, unzipped to `warriner2013/springer/`.
- Baron-Cohen 2010: the full text from NCBI, `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=2996255`, saved as `paper-fulltext/baron-cohen-2010.xml` (Europe PMC's `fullTextXML` returned errors on 2026-11-22).
- Glasgow Norms: `https://static-content.springer.com/esm/art%3A10.3758%2Fs13428-018-1099-3/MediaObjects/13428_2018_1099_MOESM2_ESM.csv` (MOESM1 is refused), saved as `glasgow/glasgow_norms.csv`.
- Small World of Words: `SWOW-EN18.zip` is in the repo root of my checkout, excluded from git there; never commit it. Unzip it to `swow/`; `check.py` reads `strength.SWOW-EN.R123.20180827.csv`.
- Zupan et al. 2022 ratings and Trampe et al. 2015 table S1: the URLs are in [research/10](research/10-which-core-people-tap.md).
- Book counts come from the Google Books Ngram endpoint, cached in `scripts/ngram-cache.json` by median year (2019 and 2020 spike for many phrases).

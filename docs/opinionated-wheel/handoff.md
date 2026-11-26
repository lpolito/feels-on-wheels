# Handoff: the body wheel, then the rest

The prompt for the next session on the [opinionated feelings wheel](../ROADMAP.md#an-opinionated-feelings-wheel). Paste everything below the line. The previous handoff (scrutinize the rules, rule on the cores, comb the words) is done; it's in git history before this change.

---

We're continuing the opinionated feelings wheel for Feels on Wheels. The rules, the cores, the words, and their definitions are settled for now: a 162-word wheel, every check passing. I reviewed every card on 2026-11-25, and the cards I flagged were rewritten and cold-checked. The body wheel was repaired to match the new words on 2026-11-26, and "You might notice" was written for them ([research/16](research/16-body-wheel-repair.md)). This session turns the work into something the app can ship.

Start by reading, in this order:

1. `docs/opinionated-wheel/learnings.md`: what went wrong before, and every decision I've made, with dates. It's background, not a checklist.
2. `docs/opinionated-wheel/rules.md`: the rules. Their north star is how people use the wheel: they start at the center, tap the core that matches what they feel, tap a middle word, find their word, and read its card. Anything I decided earlier can be rechecked against that.
3. `docs/opinionated-wheel/derived-wheel.md` (and `.json`): the wheel, with each word's definition, data, and reason. Its older entries cite old rule numbers; the note at the top maps them.
4. `docs/opinionated-wheel/research/`: reports 1 to 15. The newest matter most: which core people tap (10), the fresh comb pass (11), my review of the definitions and the rules it produced (13), the card fixes (14), and my second review with the plain-language rule (15).
5. `src/data/README.md` and `src/data/AGENTS.md`: the project's rules for wheel content, including the body wheel's, and the steps for changing wheel files.

Continue on the branch `opinionated-wheel-rules`, or branch from the latest `main` if it has merged.

**How I want to work:** lean on research and the rules for the calls; I'm not trained in this, so make them and tell me what you decided and why. Push back when something I decided looks wrong. Talk to me in plain English. Use your judgment on everything else, including how to check your work and how to show it to me.

**Scope:** translations are out of this work entirely.

**Done on 2026-11-22:** `check.py` follows the rules' flags; Cringe is settled ([research/12](research/12-cringe.md)); every definition is a sentence to "you". **Done on 2026-11-23:** the definition rules were rethought and every definition rewritten by them ([learnings](learnings.md#lucass-decisions)). **Done on 2026-11-25:** Lucas reviewed every card, and the definition rules were revised after a cold test against his notes ([research/13](research/13-definitions-review.md)). The flagged cards were then fixed by those rules and cold-checked ([research/14](research/14-card-fixes.md)), and the open decisions settled ([learnings](learnings.md#lucass-decisions)). Later that day I reviewed the cards again, and 56 changed, with a new plain-language rule ([research/15](research/15-second-card-review.md)). **Done on 2026-11-26:** the body wheel repaired, Urges' brown, and "You might notice" for the new words ([research/16](research/16-body-wheel-repair.md)). The branch's preview deploy (https://opinionated-wheel-rules-feels-on-wheels.politolu.workers.dev/) shows the derived wheel and the body wheel: after changing `derived-wheel.json` or a definition in `derived-wheel.md`, run `python3 -I docs/opinionated-wheel/scripts/app-wheel.py` and push. Tests that name today's words fail until Part 3.

**Order** (Lucas, 2026-11-22): the body wheel comes only after the feelings wheel and its definitions are 100% decided. So: `check.py`, Cringe, the definitions, then my own pass over words and definitions (all done by 2026-11-25); then the body wheel (Part 1); then "You might notice", which `src/data/README.md` drafts to agree with the body wheel's paths (both done 2026-11-26); then Part 3.

## Part 1: the body wheel (done)

Done on 2026-11-26, as a repair: only what the new words forced changed ([research/16](research/16-body-wheel-repair.md), with every change and its reason). 35 of 46 sensations changed, 124 cells. A data test now checks that no two feelings under a sensation share a line. Urges has Disgusted's brown, a little darker so it stays clear of Happy, and `public/og/` is redrawn. Worth Lucas's eye, if he wants to look:

- Scared, now a core, stays only on Racing heart, Shaky hands, Chills, and Weak knees, and gives way elsewhere to Terrified, Petrified, or Panicked.
- No word for not caring is left on the feelings wheel, so Nothing much offers Unmotivated in place of Apathetic ("Readings lost" in the report).
- Love is reachable from only 2 areas (Be close, Fix things, Weak knees).

## Part 2: what's left in the words

- **"You might notice"** is done for all 160 feelings (2026-11-26, [research/16](research/16-body-wheel-repair.md)), cold-reviewed, and agrees with the body wheel's paths. Change only cards someone flags.
- **Definitions** are done: rules in `rules.md` (Definitions), my review and the cold test of the rules ([research/13](research/13-definitions-review.md)), and the card fixes ([research/14](research/14-card-fixes.md)); `scripts/definitions.py` checks labels. Change only cards someone flags: a cold rewrite of the whole wheel made 20 of 50 unflagged cards worse.
- **"I feel bad for them"** (Lucas, 2026-11-25): nearly half of "feel bad" is guilt or sympathy. Guilty sits under Bad, but Sorry for someone is under Sad → Heartache, and nothing under Bad leads there. Bad's card can't point to it without a tacked-on clause, so the user's-eyes check below should test whether someone who feels bad for a friend finds it, and placement (the two-places rule) is the fix if not.
- **A check of the whole wheel through a user's eyes,** whenever I ask for it: everyday situations from one cold agent that never sees the wheel, walked through by labels alone (core, middle word, outer word, then the card) by a second cold agent that didn't write them. A first try on 2026-11-25 had one agent do both, and I threw it out. Don't use `scripts/situations.json` for this: many of its situations were written to justify a word.

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

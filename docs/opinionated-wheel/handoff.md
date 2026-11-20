# Handoff: scrutinize the rules, then the words

The prompt for the next session on the [opinionated feelings wheel](../ROADMAP.md#an-opinionated-feelings-wheel). Paste everything below the line.

---

We're continuing the opinionated feelings wheel for Feels on Wheels. Last session (2026-11-19 and 2026-11-20) settled a set of rules for which words the feelings wheel has and where they go, and built a candidate wheel from those rules alone. This session scrutinizes both: the rules first, then the words. What survives long term is the rules, the words, and the research behind them, so that's where the effort goes.

Start by reading, in this order:

1. `docs/opinionated-wheel/learnings.md`: how I want to work, what went wrong last time, and every decision I've made. Follow it. In short: research decides where words go, and I decide only real taste calls, asked with full context (the spot, its neighbors, definitions, and usage counts).
2. `docs/opinionated-wheel/rules.md`: the rules and the research that backs them.
3. `docs/opinionated-wheel/derived-wheel.md` (and `.json`): the candidate wheel, with each word's definition, data, and reasons.
4. `docs/opinionated-wheel/research/`: the verified research reports, the refutation of the first rule drafts, and the check of the derived wheel.

Use the brainstorming skill. Fetch and branch from the latest `main`, or continue on `opinionated-wheel-rules` if it hasn't merged.

## Part 1: the rules

Several rules changed late, after the refuter had checked them, so the set has never been checked whole. These were rules 0, 7, 8, 9, 10, 11, and 14, plus the cap of 3 outer words.

- Send a fresh agent to refute the final rule set. Give it only `rules.md` and the research reports, not the learnings or the wheel.
  - Look for rules that contradict each other or the evidence.
  - Look for rules that misfire on real words (test each on examples).
  - Look for tests someone who isn't an expert can't apply.
  - Look for gaps: what a careful designer would want that isn't there.
- Bring me what it finds in plain English, with your view on each. Push back where you think a rule is wrong; I want that.
- When the rules are settled, they move into `src/data/README.md`'s feelings wheel section (the project's home for content rules). Every source they cite then needs a note in `docs/reference/` and a credit (rule 16, and the root `AGENTS.md`). The sources are listed in the research reports.

## Part 2: the cores

I haven't ruled on the derived wheel's six cores: Happy, Love, Sad, Scared, Angry, and Bad.

- Surprised becomes a middle word under Happy.
- Disgusted becomes a middle word under Angry.
- Fearful is renamed Scared.

Show me the evidence for each change briefly. Ask me only where it's taste.

## Part 3: the words

1. **Comb pass.** A fresh agent checks every sibling group and every parent with the two tests in rules 7 and 8:
   - the parent's meaning holds for each child;
   - no sibling is a stronger form of another particular sibling, and no definition leans on a sibling's word.

   It should use the Small World of Words association data (ask me for `SWOW-EN18.zip`; never commit it) to flag words more linked to another parent. Last session started this pass but ended before it reported.
2. **Open items:**
   - **Three middle words hold 4 outer words; the layout allows 3, and 2 is better.**
     - Connected: Loved, Understood, Valued, and Accepted. It needs a move or a split, not a drop, since all four mean different things.
     - Disappointed: Let down, Discouraged, Regret, and Disillusioned.
     - Embarrassed: Foolish, Cringe, Mortified, and Humbled.
   - **Hatred under Resentful.** Hate is about who someone is, not unfair treatment (Fischer et al. 2018). English sorting puts hate with rage; Indonesian and Basque put it with disgust and contempt.
   - **"Feel wronged"** is used 408 times per billion and isn't on the wheel. Look for other common feeling words that are missing, from usage data, not from memory.
   - **Words dropped in the last rebalancing:** Disrespected, Eager, and Frazzled. Confirm each really means the same as a word still there; if not, it comes back (rule 10).
   - **Bittersweet** has no place, since rule 1 can't put a mixed feeling under one core. Is that acceptable?
   - **Worth a look:** Suspicious under Jealous, Frantic beside Panicked, and Stressed as a recorded exception to rule 4.
3. **Then the rest of the rules that the wheel has to pass:**
   - **Rule 15, the body wheel.** 20 of its 60 feelings aren't on the derived wheel; `python3 -I docs/opinionated-wheel/scripts/compare.py` lists them. Map each to its replacement and recheck its rules: 2 or 3 feelings per sensation, never a word with its own parent or child. Tired, Weak, and Violated need thought.
   - **Rule 14, translations.** Check where neighboring words translate to the same Spanish word.
   - **Definitions and "You might notice"** for the new words.

When the rules and words are settled, write the spec (`docs/superpowers/specs/`) and update the roadmap. The files in `docs/opinionated-wheel/` are working files: once their content is in the spec, `src/data/README.md`, and `docs/reference/`, they can go. The scripts in `docs/opinionated-wheel/scripts/` re-run every mechanical check; set `WHEEL_DATA` to a folder with the datasets listed in `learnings.md`.

# Wheel content

@README.md

[README.md](README.md) holds the rules for what the wheels say. In Claude Code, the line above loads it for you; with any other agent, read it before you start.

## When these steps apply

When you add, remove, rename, or reword anything in:

- `wheels/*.json`: a wheel's areas, sensations, and the feelings under them;
- `feelings.json`: a feeling's "You might notice";
- `locales/*.json`, in `feelings`, `sensations`, `sensationPhrases`, `areas`, or `areaWheelLabels`.

Changing the loader's code (`load.ts`, `types.ts`, `node.ts`), or the app's other text in `locales/*.json` (`ui`, `titles`, `page`, `wheels`), doesn't need them.

## The steps

1. **Check each word you add or change against the README's rules**, one by one. On the feelings wheel:
   - the five questions each word answers;
   - once, unless people would split, and 2 or 3 outer words per middle word;
   - words for what happened to you tagged and on the outer ring;
   - the definition rules, read card by card;
   - its place in the order, beside related words.

   On the body wheel:
   - what counts as a sensation;
   - the label rules;
   - 2 or 3 feelings per sensation, each on the feelings wheel;
   - feelings different enough to choose between;
   - happy feelings only as the other reading;
   - every common path stays.

   If a word breaks a rule, change the word, not the rule.
2. **Say what backs each new or changed word, and why it's there,** in the change itself: a source, physiology, an idiom for something people feel, or someone's experience; for a feelings wheel word, its answers to the five questions and to any flag it raised. A new source gets a note in `docs/reference/` and a credit, as the root `AGENTS.md` says.
3. **Keep the two strings in step.** A new sensation needs both its wheel label (`sensations`) and its card phrase (`sensationPhrases`).
4. **Run the checks** under "How to check a change" in the README (the data tests, and `check.py` in the [feels-on-wheels-data](https://github.com/lpolito/feels-on-wheels-data) repo when feelings wheel words change), and rebuild `docs/content-review.md` with `node scripts/make-content-review.mjs` so it matches the data.
5. **If a change needs a rule to bend, or a new rule,** ask Lucas before making it. Then change the README in the same change, so the rule and the data never disagree.

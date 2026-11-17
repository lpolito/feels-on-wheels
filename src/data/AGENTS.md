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

1. **Check each word you add or change against the README's rules**, one by one:
   - what counts as a sensation;
   - the label rules;
   - 2 or 3 feelings per sensation, each on the feelings wheel;
   - feelings different enough to choose between;
   - happy feelings only as the other reading;
   - every common path stays.

   If a word breaks a rule, change the word, not the rule.
2. **Say what backs each new or changed word:** a source, physiology, an idiom for something people feel, or someone's experience. A new source gets a note in `docs/reference/` and a credit, as the root `AGENTS.md` says.
3. **Keep the two strings in step.** A new sensation needs both its wheel label (`sensations`) and its card phrase (`sensationPhrases`).
4. **Run the checks** under "How to check a change" in the README, and rebuild `docs/content-review.md` so it matches the data.
5. **If a change needs a rule to bend, or a new rule,** ask Lucas before making it. Then change the README in the same change, so the rule and the data never disagree.

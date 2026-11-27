# An opinionated feelings wheel: what changed from the spec

The [spec](2026-11-26-feels-on-wheels-opinionated-wheel-design.md) is frozen; these are the differences in what shipped.

## The dataset checks live in their own repo (§3)

The spec moved `check.py`, `lex.py`, `ngrams.py`, and `ngram-cache.json` to `scripts/wheel-words/`. Lucas moved them instead into their own repo, [feels-on-wheels-data](https://github.com/lpolito/feels-on-wheels-data) (2026-11-27), together with their README and a `.gitignore` for the datasets. It's public: with the datasets kept out, nothing in it needs hiding, and anyone who downloads the datasets can rerun the checks.

- **Why:** the checks can run only with datasets that can't be in this repo, so they only ever ran on his computer anyway. Moving them drops about 2,000 lines (the scripts and the 1,573-line usage-count cache) from this repo.
- **What stays here:** the rules in `src/data/README.md`, which link to where the dataset checks live, and the CI data tests, which need only the wheel files. The icon and link-preview scripts stay too, since they need only this repo's data and tests check their output.
- **The datasets are never committed,** not even to that repo: NRC's terms forbid redistribution, and Small World of Words is CC BY-NC-ND with a download that asks for a name and email. They stay plain local files beside the scripts, listed in its `.gitignore`, and its README keeps the download links.
- **Paths:** the scripts find this repo through `FEELS_ON_WHEELS` (by default `../feels-on-wheels`), and the datasets through `WHEEL_DATA` (by default the scripts' own folder). Either one missing makes them say which and stop.

## Where the working notes are kept (§7)

The spec says the follow-up pull request links the working notes at the last `main` commit that has `docs/opinionated-wheel/`. The two pull requests went up together as a GitHub stack, before that commit existed, so the spec's link into the folder points at the first pull request's last commit (`c186c0b`) instead. GitHub keeps a pull request's commits after its branch is deleted, and the notes there are the same.

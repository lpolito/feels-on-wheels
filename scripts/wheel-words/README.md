# Checks for the feelings wheel's words

The feelings wheel's rules (`src/data/README.md`) have checks of two kinds:

- **Checks that need only the wheel files** run in CI with the data tests (`tests/unit/data.test.ts`): each word on the wheel once, 2 or 3 outer words per middle word, words for what happened to you on the outer ring, no card using its own or a sibling's label, and the body wheel's checks.
- **Checks that need word datasets** run here, on your computer, whenever words are added, moved, or renamed. The datasets can't be committed, since their terms don't allow it.

## What `check.py` does

It reads the app's wheel (`src/data/wheels/core.json`, with labels from `src/data/locales/en.json`) and prints a table of every word, then what's noted, flagged, and failed.

- **Fails** (exit status 1):
  - a word that every list that scores it puts on the other side from its core (pleasant under an unpleasant core, or the reverse), unless `PLEASANTNESS_REASONS` records why the lists misread it;
  - each word once, and the layout, as in CI.
- **Flags**, never verdicts. Each one is answered by a line of reason in the change that keeps the word, or by changing the word:
  - pleasantness: unscored in both lists, the lists disagree, or near neutral;
  - rare: both usage counts under 15 per billion;
  - a more common synonym: a word with the same meaning used at least twice as often;
  - core labels: fewer than 4 middle words, or a label under 75% of 4- to 6-year-olds knew.

Usage counts come from Google Books (`ngrams.py`), cached in `ngram-cache.json` by the median of 2018 to 2022, since many phrases spike in 2019 and 2020. A phrase missing from the cache is fetched once and added; commit the cache when it changes.

`lex.py WORD …` looks up single words in the datasets.

## Running it

From the repo root:

```bash
WHEEL_DATA=/path/to/datasets python3 -I scripts/wheel-words/check.py
```

Without `WHEEL_DATA`, the scripts look in a `wheel-data` folder beside the repo. If a dataset is missing, they say which file and stop.

## The datasets

Download each into the `WHEEL_DATA` folder, at the path shown. Never commit them, or anything transcribed from them.

| Dataset | Path under `WHEEL_DATA` | Where to get it | Terms |
|---|---|---|---|
| [NRC VAD Lexicon v2.1](../../docs/reference/nrc-vad-lexicon.md) | `nrc-vad/extracted/NRC-VAD-Lexicon-v2.1/NRC-VAD-Lexicon-v2.1.txt` | <https://saifmohammad.com/WebDocs/Lexicons/NRC-VAD-Lexicon-v2.1.zip>, unzipped to `nrc-vad/extracted/` | Free for non-commercial research and education; don't redistribute |
| [Warriner, Kuperman, and Brysbaert 2013](../../docs/reference/warriner-affective-norms.md) | `warriner2013/springer/BRM-emot-submit.csv` | <https://static-content.springer.com/esm/art%3A10.3758%2Fs13428-012-0314-x/MediaObjects/13428_2012_314_MOESM1_ESM.zip>, unzipped to `warriner2013/springer/` | None found |
| [Baron-Cohen et al. 2010](../../docs/reference/baron-cohen-emotion-vocabulary.md) | `paper-fulltext/baron-cohen-2010.xml` | <https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=2996255>, saved under that name | Open access, with credit |
| [Small World of Words](../../docs/reference/small-world-of-words.md) | `swow/strength.SWOW-EN.R123.20180827.csv` | `SWOW-EN18.zip` from <https://smallworldofwords.org/en/project/research> (asks for a name and email), unzipped to `swow/` | CC BY-NC-ND |

[Google Books Ngram](../../docs/reference/google-books-ngram.md) counts need no download: `ngrams.py` fetches them from `https://books.google.com/ngrams/json`.

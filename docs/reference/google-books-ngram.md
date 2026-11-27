# Google Books Ngram: how often people write a phrase

The usage counts in the [opinionated feelings wheel](../superpowers/specs/2026-11-26-feels-on-wheels-opinionated-wheel-design.md)'s flags (`ngrams.py` in Lucas's private `feels-on-wheels-data` repo).

## What it is

- Google Books Ngram Viewer, [books.google.com/ngrams](https://books.google.com/ngrams), queried through its JSON endpoint; described in Jean-Baptiste Michel and others, "Quantitative analysis of culture using millions of digitized books", *Science* 331(6014), 176–182, 2011. [doi:10.1126/science.1199644](https://doi.org/10.1126/science.1199644).
- **What we count:** "feel / feeling / felt ___" and "I was ___", per billion, the median of 2018 to 2022, cached in that repo's `ngram-cache.json`.
- Queried directly. Many phrases spike in 2019 and 2020 ("feel heartache" from about 2 to 189 per billion), which is why the median year is used.

## Usage terms

A free endpoint with no key. Only counts are kept.

## Takeaways for this project

1. **Counts are flags, never verdicts:** books count phrases that aren't feelings ("feel free to") and miss how people talk ("I'm ___", slang).
2. **Commonness only decides between words that mean the same thing,** at twice as often.

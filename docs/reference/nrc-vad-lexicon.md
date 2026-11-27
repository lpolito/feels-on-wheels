# NRC VAD Lexicon: how pleasant a word is

One of the two lists the [opinionated feelings wheel](../superpowers/specs/2026-11-26-feels-on-wheels-opinionated-wheel-design.md)'s pleasantness check uses (`scripts/wheel-words/`).

## What it is

- Saif M. Mohammad, NRC Valence, Arousal, and Dominance (VAD) Lexicon, version 2.1, National Research Council Canada, 2025. [saifmohammad.com/WebPages/nrc-vad.html](https://saifmohammad.com/WebPages/nrc-vad.html).
- **What it is:** about 55,000 English words and phrases, each scored by crowd raters from −1 to 1 for how pleasant it is, how much energy it carries, and how in control it feels.
- **Weaknesses:** one score per word, not per meaning; energy is noisier than pleasantness; its Spanish version is machine-translated.
- Downloaded and used directly during the opinionated wheel's work (2026-11-19 onward).

## Usage terms

Free for non-commercial research and education; don't redistribute the data; "If you use the lexicon in a product or application, then acknowledge this in the 'About' page." The app doesn't use it: it was one of two cross-checks, run in local scripts while choosing words, and isn't shipped or read by the app. So it's credited here and in the README's Credits, not on the About page (opinionated wheel spec §5). The data stays out of the repo.

## Takeaways for this project

1. **A word fails the pleasantness check** only when every list that scores it puts it on the other side from its core; disagreements and near-neutral scores are flags.
2. **It rates the word, not the feeling:** Smug rates unpleasant, though smugness feels good to the person feeling it.

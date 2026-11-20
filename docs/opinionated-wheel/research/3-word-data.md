# Report 4: published word data for checking rules

(Written by a fresh agent asked to find datasets and norms that could mechanically check rules for a feelings wheel's words, with their licenses.)

**Correction:** the 2013 valence-arousal-dominance norms are by **Warriner**, Kuperman, and Brysbaert, not "Warren".

## Downloaded (nothing executed)

All under the session scratchpad's `data/` folder:
- Warriner 2013: `data/warriner2013/springer/BRM-emot-submit.csv` (official Springer supplement)
- NRC VAD v2.1: `data/nrc-vad/extracted/NRC-VAD-Lexicon-v2.1/NRC-VAD-Lexicon-v2.1.txt`
- Glasgow Norms: `data/glasgow/glasgow_norms.csv`
- Brysbaert concreteness 2014 (also has SUBTLEX counts): `data/concreteness-brysbaert2014/13428_2013_403_MOESM1_ESM.xlsx`
- Stadthagen-González 2017 Spanish: `data/spanish-stadthagen2017/13428_2015_700_MOESM1_ESM.csv` (Latin-1)
- Full text of Baron-Cohen 2010 and Glasgow papers: `data/paper-fulltext/`

Failed: Kuperman 2012 AoA (old pages 404) and SUBTLEX-US (server 502).

## Datasets

1. **NRC VAD Lexicon v2.1 (Mohammad, March 2025).** Valence, arousal, dominance, −1 to 1. About 55,000 terms; all spot-check words present. Download: https://saifmohammad.com/WebDocs/Lexicons/NRC-VAD-Lexicon-v2.1.zip. Terms (README): "can be used freely for non-commercial research and educational purposes"; "If you use the lexicon in a product or application, then acknowledge this in the 'About' page"; "Do not redistribute the data." Probably usable for a free app checking its own words, but "research or educational" is a gray area, and the About-page credit pulls against the project's brief-About rule. Weaknesses: crowd raters; one score per word, no senses; arousal noisier than valence. Its Spanish version is Google Translate output.
2. **NRC Emotion Lexicon (EmoLex) v0.92.** 0/1 links to 8 emotions plus positive/negative; 14,182 words. Same terms. Too coarse for nesting rules.
3. **Warriner, Kuperman, Brysbaert (2013).** Valence, arousal, dominance 1–9, US MTurk raters; mean and SD per word plus demographic splits. 13,915 lemmas. Download: https://static-content.springer.com/esm/art%3A10.3758%2Fs13428-012-0314-x/MediaObjects/13428_2012_314_MOESM1_ESM.zip. Terms: none found. Checking words in your own scripts without shipping the file looks low-risk. Weaknesses: about 20 raters per word; arousal SDs large (2.3–2.9 for these words); no senses.
4. **Glasgow Norms (Scott et al. 2019).** Nine scales from the same raters (arousal, valence, dominance, concreteness, imageability, familiarity, AoA, size, gender); splits 379 ambiguous words by sense (e.g. "content (happy)"). 5,553 entries. CC BY 4.0, the cleanest license. Small and UK-based; has "annoy", "surprise", "embarrass" but not the -ed forms.
5. **Kuperman, Stadthagen-González, Brysbaert (2012) AoA.** Adult estimates of age learned, about 30,000 words. Original hosting gone; Green et al. (2025) extend it on OSF (CC BY 4.0): https://osf.io/ch48r/?view_only=ca45900ffc264645a32394d256101e7d. Rough proxy for what children know.
6. **SUBTLEX-US (Brysbaert and New 2009).** Frequency in 51 million words of film subtitles; 74,000 words. Server down; the concreteness file includes raw SUBTLEX counts.
7. **Brysbaert concreteness (2014).** 40,000 words; every emotion word scores about 1.7–2.9, so useless for telling them apart.
8. **Baron-Cohen et al. (2010).** For 336 emotion words, the percentage of children who knew each word in six age bands (4–6 to 15–16); under 12 parent/teacher report. Uses "at least 75% understood" as cut-off. 377 children, Cambridgeshire UK. Open access, unrestricted use with credit. Fixed list ("joyful" isn't on it).
9. **Widen and Russell.** Findings, not a dataset: children learn "happy" first, then "angry" and "sad", then "scared", "surprised", and "disgusted".
10. **Small World of Words (SWOW-EN18; SWOW-RP for Rioplatense Spanish).** Free word associations, 12,000+ English cues from 90,000+ people. CC BY-NC-ND 3.0. Best public source on how related two words are; can't say one word is a kind of another.
11. **GRID (Fontaine, Scherer, Soriano 2013).** 24 terms on ~142 features in 23 languages; data on request only. Too few terms.
12. **Cowen and Keltner (2017).** Rates videos, not words; no data license. Poor fit.
13. **Spanish norms.** Stadthagen-González et al. (2017): valence and arousal for 14,031 Spanish words, terms none found. Stadthagen-González et al. (2018): 5 discrete emotions for 10,491 words. Redondo et al. (2007): superseded. SANDchild (Sabater et al. 2020): valence and arousal for 1,406 words rated by children aged 7–13 (not downloaded).
14. **SCOPE metabase (Gao et al. 2022).** 245 variables from many norms; no license; cite each source.

## Spot checks (valence / arousal)

| Word | Warriner (1–9) | NRC VAD v2.1 (−1 to 1) | Glasgow (1–9) |
|---|---|---|---|
| Annoyed | 2.80 / 5.29 | −.79 / .57 | "annoy": 2.65 / 4.62 |
| Frustrated | 2.55 / 5.40 | −.84 / .30 | 2.58 / 4.56 |
| Content | 6.70 / 3.17 | .53 / −.41 | "content (happy)": 8.16 / 6.55 |
| Joyful | 8.21 / 5.53 | .99 / .24 | 7.97 / 6.33 |
| Excited | 8.11 / 6.43 | .82 / .86 | 8.14 / 7.88 |
| Surprised | 6.57 / 5.95 | .57 / .71 | "surprise": 7.09 / 7.35 |
| Embarrassed | 3.51 / 5.38 | −.63 / .12 | "embarrass": 2.35 / 4.56 |
| Ashamed | 2.52 / 5.65 | −.69 / .18 | 1.84 / 4.18 |
| Guilty | 3.09 / 4.65 | −.73 / .54 | 2.29 / 5.56 |

- **Sources agree on valence and disagree on arousal.** An energy rule needs a wide tolerance, or agreement across sources.
- **"Content" depends on sense.**
- **Spanish:** "contento" 8.5 / 6.1, so not a calm word; "satisfecho" 7.9 / 4.05 is closer to English "content". molesto 2.45 / 6.95; frustrado 2.25 / 6.65; avergonzado 2.58 / 6.95; culpable 2.85 / 7.25; sorprendido 6.55 / 7.15; alegre 8.5 / 5.68. Spanish arousal runs higher overall, so compare by rank.
- **Frequency (raw SUBTLEX counts):** joyful 76, annoyed 175, frustrated 255, content 389 (all senses), embarrassed 1,093, ashamed 1,396, excited 2,479, surprised 2,808, guilty 3,177.
- **Baron-Cohen, % who knew the word at 4–6 / 7–8 / 9–10 / 11–12:** Surprised 80/94/92/92; Excited 75/100/94/82; Annoyed 62.5/89.5/100/98; Embarrassed 50/89.5/89/77; Ashamed 31/32/83/95; Guilty 23/61/96/91.5; Content 12.5/22/44/93; Frustrated 6/53/56/89.5; Joy 60/79/92/97.

## Recommendations

None of these licenses forbids checking your own word choices without shipping the data. Keep datasets out of the repo; note sources in `docs/reference/`.

1. **NRC VAD v2.1, main pleasantness and energy check:** child's valence has the same sign as its parent's; arousal within roughly 0.4 of the parent's; flag dominance jumps. License most needs confirming (About-page credit).
2. **Warriner 2013, second human-rated source:** fail a word only when both Warriner and NRC disagree with its placement; skip arousal checks where raters disagreed (SD above ~2.5). For Spanish, run the same on Stadthagen-González and check each translation keeps its sign and its rank among siblings.
3. **Glasgow Norms, for common words and senses:** familiarity (e.g. 5+ on 1–7) and AoA; sense-tagged entries catch ambiguous words. Fill frequency gaps from SUBTLEX counts; flag words under ~200 occurrences.
4. **Baron-Cohen 2010, for the kids' wheel:** allow a word for an age band only if at least 75% of that band knew it. SANDchild for Spanish kids; Widen and Russell order for core words.
5. **SWOW-EN (and SWOW-RP), for sibling and parent rules:** siblings shouldn't be near-duplicates (flag association similarity above the ring's typical level); a child should be more closely associated with its own parent than with any other core. No public dataset measures "is a kind of"; this is the nearest mechanical substitute.

Sources: https://saifmohammad.com/WebPages/nrc-vad.html ; https://saifmohammad.com/WebPages/NRC-Emotion-Lexicon.htm ; https://doi.org/10.3758/s13428-012-0314-x ; https://pmc.ncbi.nlm.nih.gov/articles/PMC6538586/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC2996255/ ; https://doi.org/10.3758/s13428-015-0700-2 ; https://doi.org/10.3758/s13428-020-01377-5 ; https://smallworldofwords.org/en/project/research ; https://www.unige.ch/cisa/GRID ; https://pmc.ncbi.nlm.nih.gov/articles/PMC5617253 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC12500800/ ; https://www.ugent.be/pp/experimentele-psychologie/en/research/documents ; https://sc.edu/study/colleges_schools/artsandsciences/psychology/research_clinical_facilities/scope/

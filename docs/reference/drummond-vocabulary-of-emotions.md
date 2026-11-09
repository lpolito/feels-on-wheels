# Tom Drummond: Vocabulary of Emotions

The source for the **Strength** idea in the [roadmap](../ROADMAP.md#strength) (briefly v2; shelved on 2026-11-08).

## What it is

- A one-page chart of feeling words, sorted by **category** (10 columns) and **strength** (3 rows: Strong, Medium, Light).
- By Tom Drummond. The photocopy Lucas has is credited "Tom Drummond, North Seattle Community College" and titled "Vocabulary of Emotions".
- A newer version is published on his site as "Vocabulary of Emotions/Feelings": <https://tomdrummond.com/wp-content/uploads/2019/11/Emotion-Feelings.pdf> (PDF dated November 2019). It has the same 10 categories and 3 strengths, a slightly shorter word list, and the fourth category named "Inadequate" instead of "Inadequateness". See [Differences](#differences-between-the-photocopy-and-the-published-pdf).
- Neither version states usage terms. It's widely reproduced on mental-health and design sites, always credited to Drummond.
- Source used here: Lucas's photo of the photocopy (shared in the first brainstorming session, 2026-11-06; not saved in the repo), checked against the published PDF.

## Structure

| | Happiness | Caring | Depression | Inadequateness | Fear | Confusion | Hurt | Anger | Loneliness | Remorse |
|---|---|---|---|---|---|---|---|---|---|---|
| Strong | 15 | 14 | 18 | 19 | 14 | 19 | 19 | 19 | 14 | 15 |
| Medium | 14 | 15 | 20 | 20 | 17 | 18 | 19 | 20 | 14 | 15 |
| Light | 12 | 12 | 12 | 11 | 12 | 6 | 9 | 11 | 9 | 12 |

444 entries, 398 distinct words: 41 words appear in more than one cell.

## Takeaways for this project

1. **Strength belongs to a word in a category, not to the word alone.** 41 words appear in more than one cell, and 22 of them at different strengths. *Resentful* is Hurt medium, Anger medium and Anger light. *Worried* is Depression strong but Fear light. The planned `Feeling.strength` field, one value per word, can't hold this. Strength needs to live per (category, word) pair or per wheel position.
2. **The 10 categories don't match the wheel's 7 core feelings.** The closest fits:
   | Drummond | Core wheel |
   |---|---|
   | Happiness | Happy |
   | Caring | No core of its own; nearest is Happy (Loving, Trusting) |
   | Depression, Hurt, Loneliness, Remorse | Sad (Depressed, Hurt, Lonely, Guilty) |
   | Inadequateness | Split between Fearful (Inferior, Worthless, Helpless) and Sad (Powerless) |
   | Fear | Fearful |
   | Confusion | Surprised (Confused, Startled, Perplexed), the closest of a loose fit |
   | Anger | Angry |
   | *(none)* | Disgusted, Bad |
3. **About 44% overlap with the wheel.** 55 of the wheel's 126 distinct words appear somewhere in the chart (examples below). Most of the rest come from Happy (Optimistic, Peaceful, Powerful), Disgusted and Bad (Tired, Stressed, Busy, Bored), which the chart barely covers.
4. **Not every entry is a feeling.** Some describe what someone else did (*Mocked*), some are phrases (*Fond of*), some are dated slang, and a few need care in a public app.
5. **Uneven cells.** Confusion light has 6 words; Depression medium and Anger medium have 20.

### Where the wheel's words sit in the chart (examples)

| Wheel word (ring) | Drummond cell(s) |
|---|---|
| Happy (core) | Happiness medium |
| Excited (middle) | Happiness strong |
| Lonely (middle) | Loneliness medium |
| Empty (outer) | Depression strong, Loneliness strong |

## Differences between the photocopy and the published PDF

- The PDF names the fourth category "Inadequate"; the photocopy says "Inadequateness".
- The photocopy has 8 words the PDF doesn't, and the PDF adds 1 (listed with the Confusion words).
- If strength uses this chart, decide which version is canonical. The PDF is the one with a public, citable URL.

## Word lists

The chart's full word lists, and the table of words that appear in more than one cell, were transcribed here during research and removed on 2026-11-09, before the repository went public. Notes describe a source; they don't reproduce it. If strength is revived, work from the published PDF linked above.
